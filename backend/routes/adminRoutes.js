import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getStats, getPendingCompanies } from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/companies/pending", getPendingCompanies);

export default router;