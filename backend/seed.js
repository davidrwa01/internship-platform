
// Add to backend/server.js for testing
app.get("/api/debug/messages", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id });
    const messages = await Message.find({ 
      $or: [{ sender: req.user.id }, { receiver: req.user.id }] 
    });
    
    res.json({
      userId: req.user.id,
      conversations: conversations.length,
      messages: messages.length,
      conversationDetails: conversations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});