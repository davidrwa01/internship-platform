import Company from "../models/Company.js";
import User from "../models/User.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import Notes from "../models/Notes.js";
import File from "../models/File.js";

// Enhanced stats with all required metrics
export const getStats = async (req, res) => {
  try {
    const [
      totalCompanies,
      totalStudents, 
      totalInternships,
      totalApplications,
      pendingCompanies,
      approvedCompanies,
      approvedApplications,
      rejectedApplications
    ] = await Promise.all([
      Company.countDocuments(),
      User.countDocuments({ role: "student" }),
      Internship.countDocuments(),
      Application.countDocuments(),
      Company.countDocuments({ approved: false }),
      Company.countDocuments({ approved: true }),
      Application.countDocuments({ status: "accepted" }),
      Application.countDocuments({ status: "rejected" })
    ]);

    res.status(200).json({
      success: true,
      data: {
        students: totalStudents,
        companies: totalCompanies,
        internships: totalInternships,
        applications: totalApplications,
        pendingCompanies: pendingCompanies,
        approvedCompanies: approvedCompanies,
        approvedApplications: approvedApplications,
        rejectedApplications: rejectedApplications,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all companies for admin
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("createdBy", "email fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending companies
export const getPendingCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ approved: false })
      .populate("createdBy", "email fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users for admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle user active status
export const toggleUserStatus = async (req, res) => {
  try {
    const { active } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id && !active) {
      return res.status(400).json({ message: "Cannot deactivate your own account" });
    }

    user.active = active;
    await user.save();

    res.status(200).json({ 
      message: `User ${active ? 'activated' : 'suspended'} successfully`,
      user 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve company with notification
export const approveCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate("createdBy");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.approved = true;
    await company.save();

    // Create notification for company owner
    let notification;
    if (company.createdBy) {
      notification = await Notification.create({
        recipient: company.createdBy._id,
        type: "approval",
        title: "Company Approved",
        message: `Your company "${company.name}" has been approved! You can now post internships and manage applications.`,
      });
    }

    // Emit real-time notification
    try {
      const io = req.app.get("io");
      if (io && company.createdBy) {
        io.to(company.createdBy._id.toString()).emit("company_approved", {
          company: company,
          notification: notification
        });
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    res.status(200).json({ 
      message: "Company approved successfully", 
      company 
    });
  } catch (error) {
    console.error("Approve company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Reject company
export const rejectCompany = async (req, res) => {
  try {
    const { reason } = req.body;
    const company = await Company.findById(req.params.id).populate("createdBy");
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Create notification before deleting
    let notification;
    if (company.createdBy) {
      notification = await Notification.create({
        recipient: company.createdBy._id,
        type: "rejection",
        title: "Company Registration Rejected",
        message: `Your company registration for "${company.name}" was rejected. Reason: ${reason}. Please contact admin for more information.`,
      });
    }

    const companyName = company.name;
    await Company.findByIdAndDelete(req.params.id);

    // Emit real-time notification
    try {
      const io = req.app.get("io");
      if (io && company.createdBy) {
        io.to(company.createdBy._id.toString()).emit("company_rejected", {
          companyName: companyName,
          reason: reason,
          notification: notification
        });
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    res.status(200).json({ message: "Company rejected successfully" });
  } catch (error) {
    console.error("Reject company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get platform analytics for dashboard
export const getDashboardAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      newRegistrations,
      newApplications,
      recentCompanies
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Company.find({ createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        newRegistrations,
        newApplications,
        recentCompanies
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get suspended users
export const getSuspendedUsers = async (req, res) => {
  try {
    const users = await User.find({ active: false }).select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get revoked companies
export const getRevokedCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ approved: false })
      .populate("createdBy", "email fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Re-approve revoked company
export const reapproveCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate("createdBy");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.approved = true;
    await company.save();

    // Create notification for company owner
    let notification;
    if (company.createdBy) {
      notification = await Notification.create({
        recipient: company.createdBy._id,
        type: "approval",
        title: "Company Re-approved",
        message: `Your company "${company.name}" has been re-approved! You can now post internships and manage applications.`,
      });
    }

    // Emit real-time notification
    try {
      const io = req.app.get("io");
      if (io && company.createdBy) {
        io.to(company.createdBy._id.toString()).emit("company_reapproved", {
          company: company,
          notification: notification
        });
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    res.status(200).json({
      message: "Company re-approved successfully",
      company
    });
  } catch (error) {
    console.error("Re-approve company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Revoke approved company
export const revokeCompany = async (req, res) => {
  try {
    const { reason } = req.body;
    const company = await Company.findById(req.params.id).populate("createdBy");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.approved = false;
    await company.save();

    // Create notification for company owner
    let notification;
    if (company.createdBy) {
      notification = await Notification.create({
        recipient: company.createdBy._id,
        type: "revocation",
        title: "Company Access Revoked",
        message: `Your company "${company.name}" access has been revoked. Reason: ${reason}. Please contact admin for more information.`,
      });
    }

    // Emit real-time notification
    try {
      const io = req.app.get("io");
      if (io && company.createdBy) {
        io.to(company.createdBy._id.toString()).emit("company_revoked", {
          company: company,
          reason: reason,
          notification: notification
        });
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    res.status(200).json({
      message: "Company revoked successfully",
      company
    });
  } catch (error) {
    console.error("Revoke company error:", error);
    res.status(500).json({ message: error.message });
  }
};
