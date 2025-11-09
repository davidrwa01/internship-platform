import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    enum: ["kigali", "eastern", "western", "northern", "southern"]
  },
  trainings: [{
    type: String
  }],
  description: String,
  website: String,
  experience: String,
  approved: { 
    type: Boolean, 
    default: false 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.model("Company", companySchema);