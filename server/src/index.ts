import "dotenv/config";
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
const URL = process.env.NGROK_URL || "http://localhost:5173";
const app = express();
const PORT = 3000;

// Enable CORS for frontend
app.use(
  cors({
    origin: URL,
    credentials: true,
  })
);

app.use(express.json());

// Serve static files from the client dist directory
import path from "path";
import { fileURLToPath } from "url";

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
