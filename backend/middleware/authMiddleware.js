// backend/middleware/authMiddleware.js - UPDATED
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    console.log("🔐 Auth Middleware - Headers:", req.headers);
    
    let token;
    
    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("✅ Token found in header:", token ? "Yes" : "No");
    }
    
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, no token provided" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔓 Decoded token:", decoded);
    
    // Get user from token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log("❌ User not found for token");
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, user not found" 
      });
    }
    
    console.log("✅ User authenticated:", user._id, user.email);
    req.user = user;
    next();
    
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, token invalid" 
    });
  }
};