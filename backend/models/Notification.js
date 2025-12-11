import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "application",             // Student → Company
        "status_update",           // Company → Student
        "company_registration",    // Company → Admin
        "company_approval",        // Admin → Company
        "message",
        "new_company_registration", // Admin notification for new company
        "new_student_registration"  // Admin notification for new student
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    relatedInternship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
    },
    relatedCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    }
  },
  { timestamps: true }
);

// Add indexes for better performance
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);