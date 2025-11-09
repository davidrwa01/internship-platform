import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    enum: ["kigali", "eastern", "western", "northern", "southern"]
  },
  duration: {
    type: String,
    required: true
  },
  price: String,
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: String,
  description: String,
  requirements: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.model("Internship", internshipSchema);