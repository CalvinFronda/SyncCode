import express from "express";
import cors from "cors";
import crypto from "crypto";
import { executeCode } from "./execute.js";

type Session = {
  id: string;
  role: "interviewer" | "interviewee";
  createdAt: number;
};

const sessions = new Map<string, Session>();

const app = express();
const PORT = 3000;

// Enable CORS for frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Vite's default port
    credentials: true,
  })
);

app.use(express.json());

// Serve static files from the client dist directory
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we are pointing to the correct dist folder relative to the server bundle
// If we run from server/dist/index.js, client is at ../../client/dist
// If we run from server/src/index.ts (dev), client is at ../../client/dist
// Safest is to resolve from the project root if we know the structure
const clientDistPath = path.join(__dirname, "../../client/dist");

app.use(express.static(clientDistPath));

// API Routes above...
// Catch-all route for client-side routing (must be last)

app.post("/session", (req, res) => {
  const { roomId, username } = req.body;
  if (!roomId || !username) {
    return res.status(400).json({ error: "roomId and username are required" });
  }

  // Simple logic: First user in a room is 'interviewer'?
  // For now, we just assign 'interviewer' to everyone or random?
  // Let's just default to 'interviewer' as per plan assumption for simplicity,
  // or maybe check if anyone else is in the room (requires iterating map).
  // Iterating map is fine for small scale.
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

app.post("/execute", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const session = sessions.get(token);

    if (!session) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    const { code, language = "python" } = req.body;

    if (!code || typeof code !== "string") {
      return res
        .status(400)
        .json({ error: "Code is required and must be a string" });
    }

    const result = await executeCode(language, code);

    res.json(result);
  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
      stdout: "",
      stderr: "",
    });
  }
});

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
