import Application from "../models/Application.js";
import Internship from "../models/Internship.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// -------------------------------------------------
// Helper: Create Notification with proper routing
// -------------------------------------------------
const createNotification = async (data) => {
  try {
    return await Notification.create(data);
  } catch (err) {
    console.error("Notification error:", err);
  }
};

// -------------------------------------------------
// STUDENT: Create Application (Student → Company notification)
// -------------------------------------------------
export const createApplication = async (req, res) => {
  try {
    const { internshipId } = req.body;
    if (!internshipId) {
      return res.status(400).json({ message: "Internship ID required" });
    }

    const internship = await Internship.findById(internshipId).populate("company");
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Check if company is approved
    if (!internship.company.approved) {
      return res.status(400).json({ message: "Cannot apply to internships from unapproved companies" });
    }

    const existing = await Application.findOne({
      student: req.user._id,
      internship: internshipId,
    });
    if (existing) {
      return res.status(400).json({ message: "Already applied" });
    }

    const application = await Application.create({
      student: req.user.id,
      internship: internshipId,
      status: "pending",
    });

    // ✅ FIXED: Send notification to COMPANY (not student)
    const companyUser = await User.findOne({ _id: internship.createdBy });
    if (companyUser) {
      await createNotification({
        recipient: companyUser._id, // Send to COMPANY
        sender: req.user.id,
        type: "application",
        title: "New Internship Application",
        message: `${req.user.fullName || req.user.email} applied for your internship "${internship.title}"`,
        relatedApplication: application._id,
        relatedInternship: internshipId
      }, req.app.get("io"));

      console.log(`✅ Application notification sent to company: ${companyUser.email}`);
    } else {
      console.log("⚠️ Company user not found for notification");
    }

    await application.populate({
      path: "internship",
      populate: { path: "company", select: "name location contactEmail" },
    });

    res.status(201).json({ message: "Applied successfully", application });
  } catch (error) {
    console.error("Create app error:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------------------------
// STUDENT: Get My Applications
// -------------------------------------------------
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate({
        path: "internship",
        populate: { path: "company", select: "name location email phone" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    console.error("Get my apps error:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------------------------
// STUDENT: Cancel (Delete) Application – ONLY PENDING
// -------------------------------------------------
export const cancelApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel application that is already ${application.status}`,
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    // Send notification to company about application cancellation
    const companyUser = await User.findOne({ _id: application.internship.createdBy });
    if (companyUser) {
      await createNotification({
        recipient: companyUser._id,
        sender: req.user.id,
        type: "application_cancelled",
        title: "Application Cancelled",
        message: `${req.user.fullName || req.user.email} cancelled their application for "${application.internship.title}"`,
        relatedApplication: application._id,
        relatedInternship: application.internship._id
      }, req.app.get("io"));

      console.log(`✅ Application cancellation notification sent to company: ${companyUser.email}`);
    }

    res.status(200).json({ message: "Application cancelled successfully" });
  } catch (error) {
    console.error("Cancel app error:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------------------------
// COMPANY: Get Applications for My Internships
// -------------------------------------------------
export const getCompanyApplications = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const internships = await Internship.find({ company: company._id });
    const internshipIds = internships.map((i) => i._id);

    const applications = await Application.find({
      internship: { $in: internshipIds },
    })
      .populate({ path: "internship", select: "title department" })
      .populate({
        path: "student",
        select: "fullName email phone schoolName studentLocation",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    console.error("Get company apps error:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------------------------
// COMPANY: Update Application Status (Company → Student notification)
// -------------------------------------------------
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const application = await Application.findById(req.params.id)
      .populate("internship")
      .populate("student");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (application.internship.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    application.status = status;
    await application.save();

    // ✅ Send notification to STUDENT about status update
    await createNotification({
      recipient: application.student._id,
      sender: req.user.id,
      type: "status_update",
      title: "Application Status Updated",
      message: `Your application for "${application.internship.title}" has been ${status}`,
      relatedApplication: application._id,
      relatedInternship: application.internship._id,
    }, req.app.get("io"));

    res.status(200).json({ message: "Status updated", application });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------------------------------------
// COMPANY: Get Applicants List for a Specific Internship
// -------------------------------------------------
export const getApplicationsByInternshipId = async (req, res) => {
  try {
    const { internshipId } = req.params;

    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    if (internship.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view applicants for this internship" });
    }

    const applications = await Application.find({ internship: internshipId })
      .populate({
        path: "student",
        select: "fullName email phone classLevel field schoolName"
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error("Get applications by internship error:", error);
    res.status(500).json({ message: "Failed to get applicants list" });
  }
};