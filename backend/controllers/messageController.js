// backend/controllers/messageController.js
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Notification from "../models/Notification.js";

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, internshipId } = req.body;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, receiverId] },
      internship: internshipId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, receiverId],
        internship: internshipId,
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      receiver: receiverId,
      content,
    });

    // Update conversation last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Create notification for receiver
    await Notification.create({
      recipient: receiverId,
      sender: req.user.id,
      type: "message",
      title: "New Message",
      message: `You have a new message from ${req.user.fullName || req.user.email}`,
      relatedInternship: internshipId,
    });

    // Populate sender info
    await message.populate("sender", "fullName email");

    res.status(201).json({
      message: "Message sent successfully",
      message: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "fullName email role")
      .populate("internship", "title")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "fullName email role")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: error.message });
  }
};