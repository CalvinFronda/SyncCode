import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { sessions } from "./session.js";
import { authenticateSession } from "./middleware/authenticateSession.js";
import { executeHandler } from "./handlers/executeHandler/executeHandler.js";

const URL = process.env.NGROK_URL || "http://localhost:5173";
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
    origin: URL,
    credentials: true,
  })
);

app.use(express.json());

// Serve static files from the client dist directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDistPath = path.join(__dirname, "../../client/dist");

app.use(express.static(clientDistPath));

app.post("/session", (req, res) => {
  const { roomId, username } = req.body;
  if (!roomId || !username) {
    return res.status(400).json({ error: "roomId and username are required" });
  }

  const isFirst = !Array.from(sessions.values()).some((s) => s.id === roomId);
  const role = isFirst ? "interviewer" : "interviewee";

  const token = crypto.randomUUID();
  sessions.set(token, {
    id: roomId,
    role,
    createdAt: Date.now(),
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
