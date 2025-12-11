// backend/controllers/authController.js - UPDATED
import User from "../models/User.js";
import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { notifyAdminNewCompany, notifyAdminNewStudent } from "./notificationController.js";


export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      fullName,
      companyName,
      phone,
      schoolName,
      homeAddress,
      province,
      District,
      classLevel,
      field,
      gender,
      location
    } = req.body;

    console.log("Registration attempt:", { email, role, companyName });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      email,
      password: hashedPassword,
      role,
      fullName: fullName || companyName,
      companyName: role === "company" ? companyName : undefined,
      phone,
      ...(role === "student" && {
        schoolName,
        homeAddress,
        province: req.body.province || "",
        District: req.body.District || "",
        classLevel,
        field,
        gender,
      }),
      ...(role === "company" && {
        location,
      }),
    };

    // Create user
    const user = await User.create(userData);

    console.log("User created:", user._id);

    // If user is a company, create company profile
    if (role === "company") {
      const company = await Company.create({
        name: companyName,
        email: email,
        phone: phone,
        location: location || "kigali",
        createdBy: user._id
      });
      console.log("Company profile created:", company._id);
      
      // NOTIFY ADMIN ABOUT NEW COMPANY REGISTRATION
      await notifyAdminNewCompany(company._id);
    }

    // If user is student, notify admin
    if (role === "student") {
      // NOTIFY ADMIN ABOUT NEW STUDENT REGISTRATION
      await notifyAdminNewStudent(user._id);
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        companyName: user.companyName,
        phone: user.phone,
        schoolName: user.schoolName,
        homeAddress: user.homeAddress,
        province: user.province,
        District :user.District,
        classLevel: user.classLevel,
        field: user.field,
        gender: user.gender,
        location: user.location
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add this function to your auth controller
export const notifyAdminForCompanyRegistration = async (companyUser) => {
  try {
    // Find admin users
    const adminUsers = await User.find({ role: "admin" });
    
    for (const admin of adminUsers) {
      await Notification.create({
        recipient: admin._id,
        sender: companyUser._id,
        type: "new_company_registration",
        title: "New Company Registration",
        message: `${companyUser.companyName || companyUser.email} has registered and is waiting for approval`,
        relatedApplication: null
      });
    }
    
    console.log(`✅ Admin notified about new company: ${companyUser.companyName}`);
  } catch (error) {
    console.error("Admin notification error:", error);
  }
};

// Call this function after creating a company user in your registration logic

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ message: "Account is suspended. Please contact admin." });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        companyName: user.companyName,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};