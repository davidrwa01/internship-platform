import express from "express";
import { register, login } from "../controllers/authController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// Register new user
router.post("/register", register);

// Login user
router.post("/login", login);

// Get current user (protected)
router.get("/me", protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        companyName: req.user.companyName,
      },
    });
  } catch (error) {
    console.error("Error in /me route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
