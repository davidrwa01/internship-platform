// src/components/StartConversation.jsx
import React, { useState } from "react";
import API from "../services/api";

const StartConversation = ({ user, onConversationStarted }) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const startConversation = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !message) return;

    setLoading(true);
    try {
      // First, find user by email to get their ID
      const usersRes = await API.get("/admin/users"); // You might need a different endpoint
      const recipient = usersRes.data.find(u => u.email === recipientEmail);
      
      if (!recipient) {
        alert("User not found with that email");
        return;
      }

      // Send first message
      const res = await API.post("/messages", {
        recipientId: recipient._id,
        content: message
      });

      if (res.data.success) {
        alert("Message sent successfully!");
        setRecipientEmail("");
        setMessage("");
        if (onConversationStarted) {
          onConversationStarted(recipient._id, recipient.fullName || recipient.email);
        }
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-conversation">
      <h4>Start New Conversation</h4>
      <form onSubmit={startConversation}>
        <div className="form-group">
          <label>Recipient Email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Enter user's email"
            required
          />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows="3"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default StartConversation;