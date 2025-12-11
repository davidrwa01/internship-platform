import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  ownerName: {
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
  province: {
    type: String,
    required: true,
    enum: ["kigali", "eastern", "western", "northern", "southern"]
  },
  district: {
    type: String,
    required: true
  },
  trainings: [{
    type: String
  }],
  description: String,
  website: String,
  experience: String,
  whatsappNumber: {
    type: String,
    required: false
  },
  logo: String,
  logoPublicId: String,
  approved: {
    type: Boolean,
    default: false
  },
  pictures: [
    {
      url: String,
      description: String,
      publicId: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.model("Company", companySchema);
