// backend/models/User.js - UPDATED
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { 
      type: String 
    },
    companyName: { 
      type: String 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    phone: { 
      type: String 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ["student", "company", "admin"], 
      default: "student" 
    },
    active: {
      type: Boolean,
      default: true
    },
    department: {
      type: String
    },
    skills: [{
      type: String
    }],
    location: {
      type: String
    },
    // New fields for student registration
    schoolName: {
      type: String,
    },
    homeAddress: {
      type: String,
    },
    province: {
      type: String,
    },
    District: {
      type: String,
    },
    classLevel: {
      type: String,
      enum: ["L3", "L4", "L5"],
    },
    field: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    }
  },
  { 
    timestamps: true 
  }
);

// Add index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });

export default mongoose.model("User", userSchema);