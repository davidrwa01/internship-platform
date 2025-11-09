import Company from "../models/Company.js";
import User from "../models/User.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";

export const getStats = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalInternships = await Internship.countDocuments();
    const totalApplications = await Application.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        companies: totalCompanies,
        students: totalStudents,
        internships: totalInternships,
        applications: totalApplications,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPendingCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ approved: false }).sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};