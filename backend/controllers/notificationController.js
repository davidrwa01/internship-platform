// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "fullName email")
      .populate("relatedApplication")
      .populate("relatedInternship")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to create notifications
export const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
  }
};