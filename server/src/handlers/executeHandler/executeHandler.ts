// server/src/handlers/executeHandler.ts
import type { Request, Response } from "express";
import { executeCode } from "../../execute.js";

export async function executeHandler(req: Request, res: Response) {
  try {
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
}
