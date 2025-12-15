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

const router = express.Router();

// Public routes
router.get('/', getCompanies);

// ✅ FIX: Protected routes (require authentication) - MUST COME BEFORE /:id
router.use(protect);

// ✅ FIX: Put /my-company routes BEFORE /:id to avoid conflict
router.get('/my-company', getMyCompany);
router.put('/my-company', updateMyCompany);
router.post('/logo', uploadSingle, uploadCompanyPhoto);
router.delete('/logo', deleteCompanyPhoto);
router.post('/my-company/pictures', uploadSingle, uploadCompanyPicture);
router.delete('/my-company/pictures/:pictureId', deleteCompanyPicture);

// ✅ FIX: Company creation route (protected)
router.post('/', createCompany);

// ✅ FIX: Company by ID route (public or protected based on logic in controller)
// Only match ObjectId-like ids to avoid shadowing /my-company
router.get('/:id([0-9a-fA-F]{24})', getCompany);

// ✅ FIX: Admin only routes - MUST COME AFTER /:id
router.use(requireAdmin);
router.put('/:id/status', updateCompanyStatus);
router.delete('/:id', deleteCompany);

export default router;
