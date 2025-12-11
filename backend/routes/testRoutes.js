// backend/routes/testRoutes.js
import express from "express";

const router = express.Router();

// Test route
router.get("/", (req, res) => {
  res.json({ message: "Test route working!" });
});

export default router;