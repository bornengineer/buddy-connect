import express from "express";
import { authRouter } from "./auth.routes.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { usersRouter } from "./users.routes.js";
import { friendRequestRouter } from "./friend-requests.routes.js";
import { chatRouter } from "./chat.routes.js";

export const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", requireAuth, usersRouter);
apiRouter.use("/friend-requests", requireAuth, friendRequestRouter);
apiRouter.use("/chat", requireAuth, chatRouter);
