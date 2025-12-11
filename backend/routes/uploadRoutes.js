import express from 'express';
import { uploadSingle, uploadMultiple, handleMulterError } from '../middleware/upload.js';
import { protect } from '../middleware/protect.js';
import {
  uploadInternshipDocument,
  uploadCompanyLogo,
  uploadCompanyPicture,
  uploadNote,
  getUserFiles,
  deleteFile
} from '../controllers/uploadController.js';

const router = express.Router();

// All upload routes require authentication
router.use(protect);

// Single file upload routes
router.post('/internship-document', uploadSingle, uploadInternshipDocument);
router.post('/company-logo', uploadSingle, uploadCompanyLogo);
router.post('/company-picture', uploadSingle, uploadCompanyPicture);
router.post('/note', uploadSingle, uploadNote);

// Multiple files upload (if needed)
router.post('/multiple', uploadMultiple, (req, res) => {
  res.json({
    message: 'Files uploaded successfully',
    files: req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      url: file.path,
      size: file.size
    }))
  });
});

// Get user's uploaded files
router.get('/my-files', getUserFiles);

// Delete a file
router.delete('/:fileId', deleteFile);

// Error handling middleware (must be last)
router.use(handleMulterError);

export default router;
