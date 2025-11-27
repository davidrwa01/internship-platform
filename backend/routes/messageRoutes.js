// backend/routes/messageRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendMessage,
  getConversations,
  getMessages,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/conversations", protect, getConversations);
router.get("/conversation/:conversationId", protect, getMessages);

export default router;