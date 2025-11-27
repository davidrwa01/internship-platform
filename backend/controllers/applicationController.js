// backend/controllers/applicationController.js
import Application from "../models/Application.js";
import Internship from "../models/Internship.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Helper function to create notifications
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
  }
};

// Student applies for an internship
export const createApplication = async (req, res) => {
  try {
    const { internshipId } = req.body;
    
    console.log("Application request from user:", req.user.id);
    console.log("Internship ID:", internshipId);

    if (!internshipId) {
      return res.status(400).json({ message: "Internship ID is required" });
    }

    // Ensure internship exists
    const internship = await Internship.findById(internshipId).populate("company");
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Check if student already applied
    const existing = await Application.findOne({
      student: req.user.id,
      internship: internshipId,
    });
    if (existing) {
      return res.status(400).json({ message: "Already applied for this internship" });
    }

    // Create new application
    const application = await Application.create({
      student: req.user.id,
      internship: internshipId,
      status: "pending",
    });

    // Create notification for company
    const companyUser = await User.findOne({ email: internship.company.email });
    if (companyUser) {
      await createNotification({
        recipient: companyUser._id,
        sender: req.user.id,
        type: "application",
        title: "New Application",
        message: `${req.user.fullName || req.user.email} applied for your internship: ${internship.title}`,
        relatedApplication: application._id,
        relatedInternship: internshipId,
      });
    }

    // Populate data before sending response
    await application.populate({
      path: "internship",
      populate: { path: "company", select: "name location contactEmail" }
    });

    console.log("Application created successfully:", application._id);

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get logged-in student's applications
export const getMyApplications = async (req, res) => {
  try {
    console.log("Getting applications for user:", req.user.id);
    
    const applications = await Application.find({ student: req.user.id })
      .populate({
        path: "internship",
        populate: { 
          path: "company", 
          select: "name location email phone" 
        },
      })
      .sort({ createdAt: -1 });
    
    console.log("Found applications:", applications.length);
    res.status(200).json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get applications for company's internships - FIXED: Make sure this export exists
export const getCompanyApplications = async (req, res) => {
  try {
    console.log("Getting company applications for user:", req.user.email);
    
    // Find company owned by logged-in user
    const company = await Company.findOne({ email: req.user.email });
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Find internships owned by this company
    const internships = await Internship.find({ company: company._id });
    const internshipIds = internships.map(internship => internship._id);

    // Find applications for these internships
    const applications = await Application.find({ 
      internship: { $in: internshipIds } 
    })
    .populate({
      path: "internship",
      select: "title department"
    })
    .populate({
      path: "student",
      select: "fullName email phone schoolName studentLocation"
    })
    .sort({ createdAt: -1 });

    console.log("Found company applications:", applications.length);
    res.status(200).json(applications);
  } catch (error) {
    console.error("Get company applications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('internship')
      .populate('student');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify the company owns this internship
    const company = await Company.findOne({ email: req.user.email });
    
    if (!company || application.internship.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    application.status = status;
    await application.save();

    // Create notification for student
    await createNotification({
      recipient: application.student._id,
      sender: req.user.id,
      type: "status_update",
      title: "Application Status Updated",
      message: `Your application for ${application.internship.title} has been ${status}`,
      relatedApplication: application._id,
      relatedInternship: application.internship._id,
    });

    res.status(200).json({
      message: "Application status updated",
      application
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ message: error.message });
  }
};