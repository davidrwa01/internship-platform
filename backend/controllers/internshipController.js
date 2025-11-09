// backend/controllers/internshipController.js
import Internship from "../models/Internship.js";
import Company from "../models/Company.js";

// Create new internship
export const createInternship = async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      price,
      contactEmail,
      contactPhone,
      description,
      requirements,
      duration
    } = req.body;

    console.log("Creating internship for user:", req.user);
    console.log("Request body:", req.body);

    // Validate required fields
    if (!title || !department || !location || !duration) {
      return res.status(400).json({ 
        message: "Title, department, location, and duration are required" 
      });
    }

    // Find company associated with the logged-in user
    const company = await Company.findOne({ email: req.user.email });
    if (!company) {
      console.log("Company not found for email:", req.user.email);
      return res.status(404).json({ 
        message: "Company profile not found. Please complete your company registration first." 
      });
    }

    console.log("Found company:", company._id);

    const internship = await Internship.create({
      title,
      department,
      location,
      price,
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phone,
      description,
      requirements,
      duration,
      company: company._id,
      createdBy: req.user.id
    });

    // Populate the company data before sending response
    await internship.populate('company', 'name email phone location');

    console.log("Internship created successfully:", internship._id);

    res.status(201).json({
      message: "Internship created successfully",
      internship
    });
  } catch (error) {
    console.error("Create internship error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get internships for logged-in company
export const getCompanyInternships = async (req, res) => {
  try {
    console.log("Getting internships for user:", req.user.email);
    
    const company = await Company.findOne({ email: req.user.email });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const internships = await Internship.find({ company: company._id })
      .populate('company', 'name email phone location')
      .sort({ createdAt: -1 });

    console.log("Found internships:", internships.length);
    res.status(200).json(internships);
  } catch (error) {
    console.error("Get company internships error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all internships (for home page) - FIXED: Make sure this export exists
export const getAllInternships = async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate('company', 'name email phone location trainings')
      .sort({ createdAt: -1 });
    
    console.log("All internships:", internships.length);
    res.status(200).json(internships);
  } catch (error) {
    console.error("Get all internships error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get internship by ID
export const getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('company', 'name email phone location trainings');
    
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.status(200).json(internship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get internships by company ID
export const getInternshipsByCompany = async (req, res) => {
  try {
    const internships = await Internship.find({ company: req.params.companyId })
      .populate('company', 'name email phone location')
      .sort({ createdAt: -1 });

    res.status(200).json(internships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete internship
export const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Check if the user owns this internship
    const company = await Company.findOne({ email: req.user.email });
    if (!company || internship.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this internship" });
    }

    await Internship.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Internship deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};