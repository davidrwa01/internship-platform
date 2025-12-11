// backend/routes/applicationRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createApplication,
  getMyApplications,
  cancelApplication,
  getCompanyApplications,
  updateApplicationStatus,
  getApplicationsByInternshipId
} from "../controllers/applicationController.js";

const router = express.Router();


// Protect all routes
router.use(protect);

// Student routes
router.post("/", createApplication);
router.get("/my-applications", getMyApplications);
router.delete("/:id", cancelApplication);

// Company routes
router.get("/company", getCompanyApplications);
router.get("/internship/:internshipId", getApplicationsByInternshipId);
router.put("/:id/status", updateApplicationStatus);

export default router;
