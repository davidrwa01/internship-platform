import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  type: {
    type: String,
    enum: ['internship_document', 'company_logo', 'profile_picture'],
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ internship: 1 });
fileSchema.index({ company: 1 });

export default mongoose.model('File', fileSchema);
