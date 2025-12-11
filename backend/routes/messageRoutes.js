import express from "express";
import { protect } from "../middleware/protect.js";
import {
  sendMessage,
  getConversations,
  getMessages,
  getOrCreateConversation,
  getUnreadMessageCount,
  markConversationAsRead,
  deleteConversation,
  searchConversations,
  getConversationById,
  getRecentConversations
} from "../controllers/messageController.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Message operations
router.post("/", sendMessage);
router.get("/unread-count", getUnreadMessageCount);

// Conversation operations
router.get("/conversations", getConversations);
router.get("/conversations/search", searchConversations);
router.get("/conversations/recent", getRecentConversations);
router.get("/conversations/:conversationId", getConversationById);
router.delete("/conversations/:conversationId", deleteConversation);

// User-specific message operations
router.get("/user/:userId", getMessages);
router.get("/start/:userId", getOrCreateConversation);
router.put("/read/:userId", markConversationAsRead);

export default router;

