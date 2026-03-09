import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/auth.service.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  const queryToken =
    typeof req.query.token === "string" ? req.query.token : null;

  if (!header?.startsWith("Bearer ") && !queryToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header?.startsWith("Bearer ") ? header.slice(7) : queryToken!;
  try {
    req.auth = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
