import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// Get all notifications for user
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("sender", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get unread notification count
router.get("/unread-count", async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      read: false
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", async (req, res) => {
  try {
    await Notification.updateMany(
      { read: false },
      { read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create notification
router.post("/", async (req, res) => {
  try {
    const { recipient, title, message, type } = req.body;
    
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type
    });

    // Emit real-time notification
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`notifications_${recipient}`).emit("new_notification", notification);
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;