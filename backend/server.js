import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";

// Create __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import internshipRoutes from "./routes/internshipRoutes.js";
import applicationRoutes  from "./routes/applicationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import noteRoutes from "./routes/notes.js";

dotenv.config();

const app = express();
const server = createServer(app);

// ----------------------------
// Socket.IO Setup
// ----------------------------
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Make io available in routes via app.set
app.set("io", io);

// ----------------------------
// Middleware
// ----------------------------
app.use(cors({ 
  origin: process.env.CLIENT_URL || "http://localhost:5173", 
  credentials: true 
}));
app.use(express.json());
app.use(morgan("dev"));

// ----------------------------
// Database Connection
// ----------------------------
connectDB();

// ----------------------------
// API Routes
// ----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/internship", internshipRoutes);
app.use("/api/application", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// ----------------------------
// Health & Test Routes
// ----------------------------
app.get("/", (req, res) => res.send("TVET Internship Platform API is running"));
app.get("/api/test", (req, res) => res.json({ message: "API is working!" }));

// Test admin routes
app.get("/api/test-admin", (req, res) => {
  res.json({ 
    message: "Admin routes are working!",
    endpoints: [
      "/api/admin/stats",
      "/api/admin/users", 
      "/api/admin/companies",
      "/api/admin/analytics"
    ]
  });
});
// Add this with your other app.use routes
app.use('/api/notes', noteRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ----------------------------
// Socket.IO: Real-time Handling
// ----------------------------
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Track online users
  socket.on("user_connected", (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    io.emit("online_users_updated", { onlineUsers: Array.from(connectedUsers.keys()) });
  });

  // Notifications room
  socket.on("join_notifications", (userId) => {
    socket.join(`notifications_${userId}`);
    console.log(`User ${userId} joined notifications room`);
  });

  // Messaging rooms
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });
  
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Handle typing indicators
  socket.on("typing_start", (data) => {
    socket.to(data.conversationId).emit("user_typing", {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on("typing_stop", (data) => {
    socket.to(data.conversationId).emit("user_stopped_typing", {
      userId: data.userId
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    io.emit("online_users_updated", { onlineUsers: Array.from(connectedUsers.keys()) });
    console.log("User disconnected:", socket.id);
  });
});

// ----------------------------
// Error Handling Middleware
// ----------------------------
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ 
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found` 
  });
});

// ----------------------------
// Server Listening
// ----------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
  console.log(`📊 Admin routes: http://localhost:${PORT}/api/admin/stats`);
  console.log(`🔔 Notification routes: http://localhost:${PORT}/api/notifications`);
});