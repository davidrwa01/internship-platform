import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  followCompany,
  unfollowCompany,
  getFollowedCompanies,
  getCompanyFollowers,
  isFollowing,
} from "../controllers/followController.js";

const router = express.Router();

// Protect all routes
router.use(protect);

router.post("/follow", followCompany);
router.delete("/unfollow/:companyId", unfollowCompany);
router.get("/my-follows", getFollowedCompanies);
router.get("/company-followers", getCompanyFollowers);
router.get("/is-following/:companyId", isFollowing);

export default router;
