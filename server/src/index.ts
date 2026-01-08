import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { sessions, inviteTokens, roomInterviewers } from "./session.js";
import { authenticateSession } from "./middleware/authenticateSession.js";
import { executeHandler } from "./handlers/executeHandler/executeHandler.js";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  process.env.NGROK_URL,
].filter((url): url is string => !!url); // Remove undefined if NGROK_URL is missing

const app = express();
const PORT = 3000;

// This is required for express-rate-limit to work correctly behind a proxy
app.set("trust proxy", 1);

export const executeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5, // max 5 requests per minute per session
  standardHeaders: true,
  legacyHeaders: false,
  // Completely disable validation and trust proxy checks
  validate: {
    xForwardedForHeader: false,
    trustProxy: false,
    ip: false,
  },
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) return token;
    }
    return "no-auth";
  },
  skip: (req) => !req.headers.authorization,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests, please try again later.",
    });
  },
});

// Enable CORS for frontend
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

app.use(express.json());

// Serve static files from the client dist directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDistPath = path.join(__dirname, "../../client/dist");

app.use(express.static(clientDistPath));

app.post("/invite", authenticateSession, (req, res) => {
  const session = req.session;
  if (!session || session.role !== "interviewer") {
    return res.status(403).json({ error: "Only interviewers can invite" });
  }

  const { roomId, role } = req.body;
  
  // Basic validation that they can only invite to their own room
  if (session.id !== roomId) {
      return res.status(403).json({ error: "Cannot invite to another room" });
  }

  if (role !== "interviewer") {
      return res.status(400).json({ error: "Currently only interviewer invites are supported" });
  }

  const inviteToken = crypto.randomUUID();
  inviteTokens.set(inviteToken, { roomId, role });

  res.json({ inviteToken });
});

app.post("/session", (req, res) => {
  const { roomId, username, inviteToken, browserId, requestedRole } = req.body;
  if (!roomId || !username) {
    return res.status(400).json({ error: "roomId and username are required" });
  }

  let role: "interviewer" | "candidate" = "candidate";
  
  // Initialize room interviewers set if not exists
  if (!roomInterviewers.has(roomId)) {
      roomInterviewers.set(roomId, new Set());
  }
  const interviewers = roomInterviewers.get(roomId)!;
  const roomSessions = Array.from(sessions.values()).filter(s => s.id === roomId);

  console.log(`[Session] User: ${username}, Browser: ${browserId}, ReqRole: ${requestedRole}, Token: ${inviteToken}`);

  // 1. Explicit Role Request via Token (Highest Priority for new joins)
  // If user *asks* to be an interviewer, they MUST provide a valid token.
  if (requestedRole === 'interviewer' && inviteToken) {
      if (inviteTokens.has(inviteToken)) {
          const invite = inviteTokens.get(inviteToken)!;
          if (invite.roomId === roomId && invite.role === 'interviewer') {
              console.log(`[Session] Token valid. Granting Interviewer to ${username}`);
              role = 'interviewer';
              if (browserId) interviewers.add(browserId);
          } else {
              console.log(`[Session] Token invalid for room/role. Falling back to candidate.`);
          }
      } else {
           console.log(`[Session] Token not found. Falling back to candidate.`);
      }
  } 
  // 2. Check for Existing Permission (Persistence)
  else if (browserId && interviewers.has(browserId)) {
      console.log(`[Session] Persistence: Recognized Interviewer ${username}`);
      role = 'interviewer';
  }
  // 3. First User (Implicit Owner)
  // Only if room is completely empty (no sessions, no interviewers data)
  else if (interviewers.size === 0 && roomSessions.length === 0) {
      console.log(`[Session] Granting Implicit Owner to ${username} (New Room)`);
      role = "interviewer";
      if (browserId) interviewers.add(browserId);
  }
  else {
      console.log(`[Session] Defaulting to candidate`);
  }

  const token = crypto.randomUUID();
  sessions.set(token, {
    id: roomId,
    role,
    createdAt: Date.now(),
    browserId,
  });

  res.json({ token, role });
});

app.post("/execute", executeLimiter, authenticateSession, executeHandler);

app.get("/health", (req, res) => {
  res.send("working!");
});

// Handle React routing, return all requests to React app
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
