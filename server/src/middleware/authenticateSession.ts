// server/src/middleware/authenticateSession.ts
import type { Request, Response, NextFunction } from "express";
import { sessions } from "../session.js";

declare global {
  namespace Express {
    interface Request {
      session?: {
        token: string;
        id: string;
        role: "interviewer" | "candidate";
        createdAt: number;
      };
    }
  }
}

export function authenticateSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  const session = sessions.get(token); // your sessions map

  if (!session) {
    return res.status(401).json({ error: "Invalid session token" });
  }

  req.session = { ...session, token }; // attach to req for downstream
  next();
}
