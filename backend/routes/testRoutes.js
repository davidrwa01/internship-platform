// backend/routes/testRoutes.js
import express from "express";
const router = express.Router();

// Test DB connection
router.get("/test", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    res.json({ 
      message: "DB connected!", 
      collections: collections.map(c => c.name) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;