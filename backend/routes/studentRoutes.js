// backend/routes/studentRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  getStudentProfile, 
  getStudentApplications,
  updateStudentProfile 
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/profile", protect, getStudentProfile);
router.get("/my-applications", protect, getStudentApplications);
router.put("/profile", protect, updateStudentProfile);
router.get("/application/applications", protect, getStudentApplications);


export default router;