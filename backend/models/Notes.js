import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['ICT', 'Hospitality', 'Construction', 'Agriculture', 'Healthcare', 'Automotive', 'General'],
    default: 'General'
  },
  level: {
    type: String,
    enum: ['L3', 'L4', 'L5', 'All'],
    default: 'All'
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloads: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
noteSchema.index({ category: 1, level: 1 });
noteSchema.index({ uploadedBy: 1, createdAt: -1 });

export default mongoose.model('Notes', noteSchema);
