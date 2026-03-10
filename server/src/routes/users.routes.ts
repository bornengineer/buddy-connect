import express from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const usersRouter = express.Router();

usersRouter.get(
  "/",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const currentUserId = req.auth!.userId;
    const result = await pool.query(
      `SELECT
      u.id,
      u.uid,
      u.name,
      u.email,
      EXISTS (
        SELECT 1 FROM friendships f WHERE f.user_id = $1 AND f.friend_id = u.id
      ) as is_friend,
      EXISTS (
        SELECT 1 FROM friend_requests fr
        WHERE fr.sender_id = $1 AND fr.receiver_id = u.id AND fr.status = 'pending'
      ) as request_sent,
      EXISTS (
        SELECT 1 FROM friend_requests fr
        WHERE fr.sender_id = u.id AND fr.receiver_id = $1 AND fr.status = 'pending'
      ) as request_received
    FROM users u
    WHERE u.id <> $1
    ORDER BY u.created_at DESC`,
      [currentUserId],
    );

    return res.json(result.rows);
  }),
);

usersRouter.get(
  "/friends",
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const currentUserId = req.auth!.userId;
    const result = await pool.query(
      `SELECT u.id, u.uid, u.name, u.email
     FROM friendships f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = $1
     ORDER BY u.name ASC`,
      [currentUserId],
    );

    return res.json(result.rows);
  }),
);
