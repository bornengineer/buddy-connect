import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { addFriendsBidirectional } from "../services/cometchat.service.js";
import {
  pushToUser,
  registerSseClient,
} from "../services/realtime.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const friendRequestRouter = express.Router();

const sendRequestSchema = z.object({
  receiverId: z.number().int().positive(),
});

const respondSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

friendRequestRouter.get("/stream", (req, res) => {
  const currentUserId = req.auth!.userId;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const unregister = registerSseClient(currentUserId, res);
  req.on("close", unregister);
});

friendRequestRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parse = sendRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const senderId = req.auth!.userId;
    const { receiverId } = parse.data;

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ error: "Cannot send request to yourself" });
    }

    const receiver = await pool.query("SELECT id FROM users WHERE id = $1", [
      receiverId,
    ]);
    if (receiver.rows.length === 0) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const friendship = await pool.query(
      "SELECT 1 FROM friendships WHERE user_id = $1 AND friend_id = $2",
      [senderId, receiverId],
    );
    if (friendship.rows.length > 0) {
      return res.status(409).json({ error: "Already friends" });
    }

    const existingPending = await pool.query(
      `SELECT 1 FROM friend_requests
      WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
      AND status = 'pending'`,
      [senderId, receiverId],
    );

    if (existingPending.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "A pending request already exists" });
    }

    await pool.query(
      `INSERT INTO friend_requests (sender_id, receiver_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (sender_id, receiver_id)
     DO UPDATE SET status = 'pending'`,
      [senderId, receiverId],
    );

    pushToUser(receiverId, "friend_request_received", { senderId });
    return res.status(201).json({ ok: true });
  }),
);

friendRequestRouter.get(
  "/incoming",
  asyncHandler(async (req, res) => {
    const currentUserId = req.auth!.userId;
    const result = await pool.query(
      `SELECT
      fr.id,
      fr.created_at,
      sender.id as sender_id,
      sender.uid as sender_uid,
      sender.name as sender_name,
      sender.email as sender_email
    FROM friend_requests fr
    JOIN users sender ON sender.id = fr.sender_id
    WHERE fr.receiver_id = $1 AND fr.status = 'pending'
    ORDER BY fr.created_at DESC`,
      [currentUserId],
    );

    return res.json(result.rows);
  }),
);

friendRequestRouter.patch(
  "/:requestId",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.requestId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid request id" });
    }

    const parse = respondSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const receiverId = req.auth!.userId;
    const requestResult = await pool.query(
      `SELECT fr.id, fr.sender_id, fr.receiver_id, fr.status,
            sender.uid as sender_uid,
            receiver.uid as receiver_uid
     FROM friend_requests fr
     JOIN users sender ON sender.id = fr.sender_id
     JOIN users receiver ON receiver.id = fr.receiver_id
     WHERE fr.id = $1`,
      [id],
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = requestResult.rows[0] as {
      id: number;
      sender_id: number;
      receiver_id: number;
      status: "pending" | "accepted" | "rejected";
      sender_uid: string;
      receiver_uid: string;
    };

    if (request.receiver_id !== receiverId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (request.status !== "pending") {
      return res.status(409).json({ error: "Request already resolved" });
    }

    if (parse.data.action === "reject") {
      await pool.query(
        `UPDATE friend_requests
       SET status = 'rejected'
       WHERE id = $1`,
        [id],
      );
      pushToUser(request.sender_id, "friend_request_rejected", {
        requestId: id,
      });
      return res.json({ ok: true });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE friend_requests SET status = 'accepted' WHERE id = $1`,
        [id],
      );
      await client.query(
        `INSERT INTO friendships (user_id, friend_id)
       VALUES ($1, $2), ($2, $1)
       ON CONFLICT DO NOTHING`,
        [request.sender_id, request.receiver_id],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    await addFriendsBidirectional(request.sender_uid, request.receiver_uid);
    pushToUser(request.sender_id, "friend_request_accepted", {
      requestId: id,
      friendId: request.receiver_id,
    });
    pushToUser(request.receiver_id, "friendship_updated", {
      requestId: id,
      friendId: request.sender_id,
    });
    return res.json({ ok: true });
  }),
);
