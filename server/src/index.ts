import express from "express";
import { executePython } from "./execute.js";

const app = express();
app.use(express.json());

app.post("/execute", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const output = await executePython(code);
    res.json({ output });
  } catch (e) {
    res.status(500).json({ error: "Execution failed" });
  }
});

app.listen(3000, () => {
  console.log("Runner API listening on :3000");
});
