// backend/controllers/notificationController.js - UPDATED
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Company from "../models/Company.js";

export const getMyNotifications = async (req, res) => {
  try {
    console.log("Fetching notifications for user:", req.user.id);
    
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "fullName email companyName")
      .populate("relatedApplication")
      .populate("relatedInternship")
      .populate("relatedConversation")
      .sort({ createdAt: -1 });

    console.log(`Found ${notifications.length} notifications`);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ 
      message: "Failed to fetch notifications",
      error: error.message 
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
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
};

export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    console.log(`Marked ${result.modifiedCount} notifications as read`);
    res.status(200).json({ 
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    console.log(`Unread notifications count: ${count}`);
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to create notifications - ENHANCED
export const createNotification = async (notificationData, io) => {
  try {
    const notification = await Notification.create(notificationData);

    // Populate notification data for socket emission
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "fullName email companyName")
      .populate("relatedApplication")
      .populate("relatedInternship")
      .populate("relatedConversation");

    // Emit real-time notification to the recipient's room
    if (io) {
      io.to(`notifications_${notificationData.recipient}`).emit('new_notification', populatedNotification);
      console.log(`Emitted new notification to user ${notificationData.recipient}`);
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

// NEW: Create notification for admin about new company registration
export const notifyAdminNewCompany = async (companyId, io) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "admin", active: true });

    const company = await Company.findById(companyId);
    if (!company) return;

    const notifications = await Promise.all(
      admins.map(admin =>
        createNotification({
          recipient: admin._id,
          type: "new_company_registration",
          title: "New Company Registration",
          message: `New company "${company.name}" has registered and is waiting for approval.`,
          relatedApplication: null,
          relatedInternship: null
        }, io)
      )
    );

    console.log(`Sent new company notifications to ${admins.length} admins`);
    return notifications;
  } catch (error) {
    console.error("Notify admin new company error:", error);
  }
};

// NEW: Create notification for admin about new student registration
export const notifyAdminNewStudent = async (studentId, io) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "admin", active: true });

    const student = await User.findById(studentId);
    if (!student) return;

    const notifications = await Promise.all(
      admins.map(admin =>
        createNotification({
          recipient: admin._id,
          type: "new_student_registration",
          title: "New Student Registration",
          message: `New student "${student.fullName}" (${student.email}) has registered.`,
          relatedApplication: null,
          relatedInternship: null
        }, io)
      )
    );

    console.log(`Sent new student notifications to ${admins.length} admins`);
    return notifications;
  } catch (error) {
    console.error("Notify admin new student error:", error);
  }
};

// NEW: Create notification for new message
export const notifyNewMessage = async (messageData) => {
  try {
    const notification = await createNotification({
      recipient: messageData.receiver,
      sender: messageData.sender,
      type: "message",
      title: "New Message",
      message: `You have a new message from ${messageData.senderName}`,
      relatedConversation: messageData.conversationId
    });

    return notification;
  } catch (error) {
    console.error("Notify new message error:", error);
  }
};