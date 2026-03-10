import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { signToken } from "../services/auth.service.js";
import { ensureCometChatUser } from "../services/cometchat.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const authRouter = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { name, email, password } = parse.data;
    const uid = `user_${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const inserted = await pool.query(
        `INSERT INTO users (uid, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, uid, name, email`,
        [uid, name, email, passwordHash],
      );

      const user = inserted.rows[0] as {
        id: number;
        uid: string;
        name: string;
        email: string;
      };
      await ensureCometChatUser({ uid: user.uid, name: user.name });

      const token = signToken({ userId: user.id, uid: user.uid });
      return res.status(201).json({ token, user });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("duplicate key value")) {
        return res.status(409).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Registration failed" });
    }
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { email, password } = parse.data;
    const found = await pool.query(
      "SELECT id, uid, name, email, password_hash FROM users WHERE email = $1",
      [email],
    );

    if (found.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = found.rows[0] as {
      id: number;
      uid: string;
      name: string;
      email: string;
      password_hash: string;
    };

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await ensureCometChatUser({ uid: user.uid, name: user.name });

    const token = signToken({ userId: user.id, uid: user.uid });
    return res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
      },
    });
  }),
);
