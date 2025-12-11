import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getInternships,
  getMyInternships,
  createInternship,
  getInternship,
  getInternshipsByCompany,
  updateInternship,
  deleteInternship,
  toggleInternshipStatus,
  getInternshipStats
} from "../controllers/internshipController.js";

const router = express.Router();

// Public routes
router.get("/", getInternships);
router.get("/company/:companyId", getInternshipsByCompany);
router.get("/:id", getInternship);
router.get("/stats/dashboard", getInternshipStats);

// Protect all routes below (require authentication)
router.use(protect);

// Company routes
router.get("/company/my/internships", getMyInternships);
router.post("/", createInternship);
router.put("/:id", updateInternship);
router.patch("/:id/status", toggleInternshipStatus);
router.delete("/:id", deleteInternship);

export default router;
