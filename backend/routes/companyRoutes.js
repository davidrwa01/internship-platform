import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllCompanies,
  approveCompany,
  getCompanyById,
  updateCompanyProfile,
  getMyCompany
} from "../controllers/companyController.js";

const router = express.Router();

// GET /api/company → list all companies
router.get("/", getAllCompanies);

// GET /api/company/my → get logged-in company
router.get("/my", protect, getMyCompany);

// GET /api/company/:id → get single company
router.get("/:id", getCompanyById);

// PUT /api/company/profile → update company profile
router.put("/profile", protect, updateCompanyProfile);

// PUT /api/company/:id/approve → approve company
router.put("/:id/approve", protect, approveCompany);

export default router;