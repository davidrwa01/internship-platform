import express from 'express';
import { protect } from '../middleware/protect.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getCompanies,
  getCompany,
  getMyCompany,
  updateMyCompany,
  createCompany,
  updateCompanyStatus,
  deleteCompany,
  uploadCompanyPhoto,
  uploadCompanyPicture,
  deleteCompanyPicture,
  deleteCompanyPhoto
} from '../controllers/companyController.js';
import { uploadSingle } from '../middleware/upload.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getCompanies);
router.get('/:id', getCompany);

// Protected routes (require authentication)
router.use(protect);

router.get('/my-company', getMyCompany);
router.put('/my-company', updateMyCompany);
router.post('/', createCompany);

// Admin only routes
router.use(requireAdmin);
router.put('/:id/status', updateCompanyStatus);
router.delete('/:id', deleteCompany);

// Photo upload routes (protected)
router.post('/logo', uploadSingle, uploadCompanyPhoto);
router.delete('/logo', deleteCompanyPhoto);
// Company gallery pictures (company users upload with description)
router.post('/my-company/pictures', uploadSingle, uploadCompanyPicture);
router.delete('/my-company/pictures/:pictureId', deleteCompanyPicture);

export default router;
