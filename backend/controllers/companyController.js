import Company from "../models/Company.js";
import Internship from "../models/Internship.js";

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    console.log("All companies:", companies.length);
    res.status(200).json(companies);
  } catch (error) {
    console.error("Get all companies error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    company.approved = true;
    await company.save();
    res.status(200).json({ message: "Company approved", company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCompanyProfile = async (req, res) => {
  try {
    const { name, location, trainings, description, website, experience } = req.body;
    
    const company = await Company.findOneAndUpdate(
      { email: req.user.email },
      { name, location, trainings, description, website, experience },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      message: "Company profile updated successfully",
      company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ email: req.user.email });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};