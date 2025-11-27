// backend/server.js - UPDATED
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/database.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import internshipRoutes from "./routes/internshipRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; // NEW
import messageRoutes from "./routes/messageRoutes.js"; // NEW

dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Connect DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/internship", internshipRoutes);
app.use("/api/application", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/test", testRoutes);
app.use("/api/notifications", notificationRoutes); // NEW
app.use("/api/messages", messageRoutes); // NEW

// Health check
app.get("/", (req, res) => {
  res.send("TVET Internship Platform API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});