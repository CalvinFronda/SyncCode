import express from "express";
import cors from "cors";
import { executeCode } from "./execute.js";

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

app.post("/execute", async (req, res) => {
  try {
    const { code, language } = req.body;

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
