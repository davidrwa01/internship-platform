import express from "express";
import User from "../models/User.js";
import Note from "../models/Note.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Get current user's total note downloads
router.get('/me/downloads', async (req, res) => {
  try {
    const userId = req.user._id;
    // Count total download entries across all notes for this user
    const result = await Note.aggregate([
      { $unwind: '$downloads' },
      { $match: { 'downloads.user': userId } },
      { $count: 'total' }
    ]);

    const total = result[0]?.total || 0;
    res.status(200).json({ totalDownloads: total });
  } catch (error) {
    console.error('Get user downloads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
