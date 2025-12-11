import express from "express";
import { protect } from "../middleware/protect.js";
import {
  getStats,
  getAllCompanies,
  getPendingCompanies,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  approveCompany,
  rejectCompany,
  getDashboardAnalytics,
  getSuspendedUsers,
  getRevokedCompanies,
  reapproveCompany,
  revokeCompany
} from "../controllers/adminController.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Stats and analytics
router.get("/stats", getStats);
router.get("/analytics", getDashboardAnalytics);

// Company management
router.get("/companies", getAllCompanies);
router.get("/companies/pending", getPendingCompanies);
router.get("/companies/revoked", getRevokedCompanies);
router.put("/companies/:id/approve", approveCompany);
router.put("/companies/:id/reject", rejectCompany);
router.put("/companies/:id/reapprove", reapproveCompany);
router.put("/companies/:id/revoke", revokeCompany);

// User management
router.get("/users", getAllUsers);
router.get("/users/suspended", getSuspendedUsers);
router.delete("/users/:userId", deleteUser);
router.put("/users/:userId/status", toggleUserStatus);

export default router;
