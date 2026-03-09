import express from "express";
import { createCometChatAuthToken } from "../services/cometchat.service.js";
import { pool } from "../db/pool.js";

export const chatRouter = express.Router();

chatRouter.get("/token", async (req, res) => {
  const uid = req.auth!.uid;
  const token = await createCometChatAuthToken(uid);
  return res.json({ authToken: token, uid });
});

chatRouter.get("/can-message/:targetUserId", async (req, res) => {
  const targetUserId = Number(req.params.targetUserId);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ error: "Invalid target user id" });
  }

  const currentUserId = req.auth!.userId;
  const relationship = await pool.query(
    "SELECT 1 FROM friendships WHERE user_id = $1 AND friend_id = $2",
    [currentUserId, targetUserId],
  );

  return res.json({ allowed: relationship.rows.length > 0 });
});
