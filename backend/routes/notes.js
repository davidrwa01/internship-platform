import express from 'express';
import Note from '../models/Note.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect as auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for notes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/notes/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/jpg',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOCX, PPT, images, videos, TXT'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: fileFilter
});

// Helper function to determine file type
const getFileType = (mimetype) => {
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'docx';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'ppt';
  if (mimetype.includes('image')) return 'image';
  if (mimetype.includes('video')) return 'video';
  if (mimetype.includes('text')) return 'txt';
  return 'other';
};

// @route   POST /api/notes/upload
// @desc    Admin upload note
// @access  Private/Admin
router.post('/upload', auth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
      const { title, description, category, field, tags } = req.body;

      // Validate required fields before attempting to save
      if (!category || !field) {
        return res.status(400).json({ message: 'Please provide both "category" and "field" for the note.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
      }

    const note = new Note({
      title,
      description: description || '',
      category,
      field,
      fileUrl: req.file.path,
      fileType: getFileType(req.file.mimetype),
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await note.save();
    
    res.status(201).json({
      message: 'Note uploaded successfully',
      note: {
        _id: note._id,
        title: note.title,
        description: note.description,
        category: note.category,
        field: note.field,
        fileType: note.fileType,
        fileSize: note.fileSize,
        downloadCount: note.downloadCount,
        tags: note.tags,
        uploadedBy: note.uploadedBy,
        createdAt: note.createdAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ message: error.message || 'Upload failed' });
  }
});

// @route   GET /api/notes
// @desc    Get all notes (students can access)
// @access  Private (Student, Admin)
router.get('/', auth, async (req, res) => {
  try {
    const { category, field, search, page = 1, limit = 10 } = req.query;
    let query = { isActive: true };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by field
    if (field && field !== 'all') {
      query.field = field;
    }
    
    // Search functionality
    if (search && search.trim() !== '') {
      query.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    // Get notes with pagination
    const notes = await Note.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'fullName email')
      .select('-__v');
    
    // Get total count for pagination
    const total = await Note.countDocuments(query);
    
    res.json({
      success: true,
      count: notes.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/latest
// @desc    Get latest notes for homepage preview
// @access  Public
router.get('/latest', async (req, res) => {
  try {
    const notes = await Note.find({ isActive: true })
      .sort('-createdAt')
      .limit(5)
      .select('title description category field fileType downloadCount createdAt');
    
    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Get latest notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/categories
// @desc    Get all unique categories and fields
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Note.distinct('category');
    const fields = await Note.distinct('field');
    
    res.json({
      success: true,
      categories,
      fields
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/:id
// @desc    Get note by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('uploadedBy', 'fullName email');
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/download/:id
// @desc    Download note (increment download count)
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (!note.isActive) {
      return res.status(400).json({ message: 'Note is not available' });
    }
    
    // Increment download count
    note.downloadCount += 1;
    // Record per-user download for analytics
    try {
      note.downloads.push({ user: req.user._id, downloadedAt: Date.now() });
    } catch (pushErr) {
      console.error('Failed to push download record:', pushErr);
    }
    await note.save();
    
    const filePath = path.join(__dirname, '..', note.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set appropriate headers
    const filename = `${note.title}${path.extname(note.fileUrl)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update note (Admin only)
// @access  Private/Admin
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, field, tags, isActive } = req.body;
    
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update fields
    if (title) note.title = title;
    if (description !== undefined) note.description = description;
    if (category) note.category = category;
    if (field) note.field = field;
    if (tags !== undefined) note.tags = tags.split(',').map(tag => tag.trim());
    if (isActive !== undefined) note.isActive = isActive;
    
    await note.save();
    
    res.json({
      success: true,
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(400).json({ message: error.message || 'Update failed' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Delete file from storage
    const filePath = path.join(__dirname, '..', note.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await note.deleteOne();
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;