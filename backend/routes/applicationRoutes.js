import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createApplication,
  getMyApplications,
  getCompanyApplications,
  updateApplicationStatus
} from "../controllers/applicationController.js";

const router = express.Router();

// Student applies for an internship
router.post("/", protect, createApplication);

// Get applications for logged-in student
router.get("/mine", protect, getMyApplications);

// Get applications for company's internships
router.get("/company", protect, getCompanyApplications);

// Update application status (company)
router.put("/:id/status", protect, updateApplicationStatus);

export default router;