import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createInternship,
  getCompanyInternships,
  getAllInternships,
  getInternshipById,
  getInternshipsByCompany,
  deleteInternship
} from "../controllers/internshipController.js";

const router = express.Router();

// GET /api/internship → all internships (for home page)
router.get("/", getAllInternships);

// GET /api/internship/mine → company's internships
router.get("/mine", protect, getCompanyInternships);

// GET /api/internship/company/:companyId → internships by company
router.get("/company/:companyId", getInternshipsByCompany);

// GET /api/internship/:id → single internship
router.get("/:id", getInternshipById);

// POST /api/internship → create internship
router.post("/", protect, createInternship);

// DELETE /api/internship/:id → delete internship
router.delete("/:id", protect, deleteInternship);

export default router;