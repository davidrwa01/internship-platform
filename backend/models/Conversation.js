// backend/models/Conversation.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);