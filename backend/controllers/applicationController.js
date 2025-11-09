// backend/controllers/applicationController.js
import Application from "../models/Application.js";
import Internship from "../models/Internship.js";
import Company from "../models/Company.js";

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
    const internship = await Internship.findById(internshipId);
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

// Get applications for company's internships
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
      select: "fullName email phone"
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
      .populate('internship');

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

    res.status(200).json({
      message: "Application status updated",
      application
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ message: error.message });
  }
};