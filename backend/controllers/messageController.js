// backend/controllers/messageController.js - FULLY UPDATED
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;   
    console.log("Sending message:", { 
      sender: req.user.id, 
      recipientId, 
      subject,
      content,
      senderName: req.user.fullName 
    })
    // Validation
    if (!recipientId || !content || !subject) {
      return res.status(400).json({ 
        success: false,
        message: "Recipient ID, subject and content are required" 
      });
    }
    if (recipientId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot send message to yourself"
      });
    }
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: "Recipient not found" 
      });
    }
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] }
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
      });
      console.log("Created new conversation:", conversation._id);
    }
    // Create message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      recipient: recipientId,
      subject: subject,
      content,
    });

    // Update conversation last message and timestamp
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Create notification for receiver - ENHANCED
    const { createNotification } = await import("./notificationController.js");
    const notification = await createNotification({
      recipient: recipientId,
      sender: req.user.id,
      type: "message",
      title: "New Message",
      message: `You have a new message from ${req.user.fullName || req.user.email}`,
      relatedConversation: conversation._id
    }, req.app.get("io"));

    // Populate message with sender info
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "fullName email role companyName")
      .populate("recipient", "fullName email role");

    // Populate notification for real-time emission
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "fullName email");

    // Emit real-time message and notification
    try {
      const io = req.app.get("io");
      if (io) {
        // Emit message to recipient
        io.to(recipientId).emit("new_message", populatedMessage);
        io.to(conversation._id.toString()).emit("message_sent", populatedMessage);
        
        // Emit notification to recipient
        io.to(`notifications_${recipientId}`).emit("new_notification", populatedNotification);
        
        // Also emit notification update for unread count
        io.to(`notifications_${recipientId}`).emit("notification_update", {
          type: "new_message",
          unreadCount: await Notification.countDocuments({
            recipient: recipientId,
            read: false
          })
        });

        console.log(`Real-time events emitted for message to ${recipientId}`);
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to send message: " + error.message 
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "fullName email role companyName phone")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "fullName"
        }
      })
      .sort({ updatedAt: -1 });

    // Add unread count and other participant info
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: req.user.id,
          read: false
        });
        
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== req.user._id.toString()
        );
        
        return {
          _id: conv._id,
          participants: conv.participants,
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
          unreadCount,
          otherParticipant: otherParticipant ? {
            _id: otherParticipant._id,
            fullName: otherParticipant.fullName,
            email: otherParticipant.email,
            role: otherParticipant.role,
            companyName: otherParticipant.companyName,
            phone: otherParticipant.phone
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: conversationsWithDetails
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find conversation between current user and target user
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] }
    });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", "fullName email role companyName")
      .populate("receiver", "fullName email role")
      .sort({ createdAt: 1 });

    // Mark messages as read for current user
    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: req.user.id,
        read: false
      },
      { read: true }
    );

    // Emit read receipt if socket is available
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(userId).emit("messages_read", {
          conversationId: conversation._id,
          readerId: req.user.id
        });
      }
    } catch (socketError) {
      console.error("Socket read receipt error:", socketError);
    }

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId],
      });
      console.log("Created new conversation with user:", userId);
    }

    await conversation.populate("participants", "fullName email role companyName phone");

    // Emit conversation created event
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(req.user.id).emit("conversation_joined", conversation);
        io.to(userId).emit("conversation_joined", conversation);
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get unread message count
export const getUnreadMessageCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark conversation messages as read
export const markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // Mark all messages as read
    const result = await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: req.user.id,
        read: false
      },
      { read: true }
    );

    // Emit read receipt
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(userId).emit("messages_read", {
          conversationId: conversation._id,
          readerId: req.user.id
        });
      }
    } catch (socketError) {
      console.error("Socket read receipt error:", socketError);
    }

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error("Mark conversation as read error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this conversation"
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversationId });
    
    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    // Emit deletion event
    try {
      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach(participantId => {
          io.to(participantId.toString()).emit("conversation_deleted", {
            conversationId: conversationId
          });
        });
      }
    } catch (socketError) {
      console.error("Socket deletion event error:", socketError);
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search conversations by user name or email
export const searchConversations = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    // Find users matching the search query
    const matchingUsers = await User.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { companyName: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id } // Exclude current user
    }).select("_id fullName email role companyName");

    // Find conversations with these users
    const conversations = await Conversation.find({
      participants: { $all: [req.user.id, { $in: matchingUsers.map(u => u._id) }] }
    })
      .populate("participants", "fullName email role companyName phone")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "fullName"
        }
      })
      .sort({ updatedAt: -1 });

    // Add unread count and other participant info
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: req.user.id,
          read: false
        });
        
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== req.user.id.toString()
        );
        
        return {
          _id: conv._id,
          participants: conv.participants,
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
          unreadCount,
          otherParticipant: otherParticipant ? {
            _id: otherParticipant._id,
            fullName: otherParticipant.fullName,
            email: otherParticipant.email,
            role: otherParticipant.role,
            companyName: otherParticipant.companyName
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        conversations: conversationsWithDetails,
        matchingUsers: matchingUsers
      }
    });
  } catch (error) {
    console.error("Search conversations error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get conversation by ID
export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "fullName email role companyName phone")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "fullName"
        }
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === req.user.id.toString())) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this conversation"
      });
    }

    // Get unread count
    const unreadCount = await Message.countDocuments({
      conversation: conversationId,
      receiver: req.user.id,
      read: false
    });

    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== req.user.id.toString()
    );

    const conversationWithDetails = {
      ...conversation.toObject(),
      unreadCount,
      otherParticipant: otherParticipant ? {
        _id: otherParticipant._id,
        fullName: otherParticipant.fullName,
        email: otherParticipant.email,
        role: otherParticipant.role,
        companyName: otherParticipant.companyName
      } : null
    };

    res.status(200).json({
      success: true,
      data: conversationWithDetails
    });
  } catch (error) {
    console.error("Get conversation by ID error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get recent conversations with message preview
export const getRecentConversations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "fullName email role companyName phone")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "fullName"
        }
      })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    // Add unread count and other participant info
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: req.user.id,
          read: false
        });
        
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== req.user.id.toString()
        );
        
        return {
          _id: conv._id,
          participants: conv.participants,
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
          unreadCount,
          otherParticipant: otherParticipant ? {
            _id: otherParticipant._id,
            fullName: otherParticipant.fullName,
            email: otherParticipant.email,
            role: otherParticipant.role,
            companyName: otherParticipant.companyName
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: conversationsWithDetails
    });
  } catch (error) {
    console.error("Get recent conversations error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export all functions
export default {
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
};