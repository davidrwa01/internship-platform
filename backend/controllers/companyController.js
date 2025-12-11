import Company from "../models/Company.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import pkg from 'multer-storage-cloudinary';
const CloudinaryStorage = pkg;

// Import upload middleware
import { uploadSingle } from '../middleware/upload.js';

// Helper: Create notification
const createNotification = async (data) => {
  try {
    return await Notification.create(data);
  } catch (err) {
    console.error("Notification error:", err);
  }
};

// Get all companies (with approval filtering)
export const getCompanies = async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, only show approved companies
    if (req.user && req.user.role !== 'admin') {
      query.approved = true;
    }
    
    const companies = await Company.find(query)
      .populate("createdBy", "email fullName")
      .sort({ createdAt: -1 });
    
    res.status(200).json(companies);
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get company by ID
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate("createdBy");
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    // If user is not admin and company is not approved, restrict access
    if (req.user && req.user.role !== 'admin' && !company.approved) {
      return res.status(403).json({ message: "Company not approved" });
    }
    
    res.status(200).json(company);
  } catch (error) {
    console.error("Get company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get company by logged-in user
export const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (error) {
    console.error("Get my company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update company
export const updateMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update company fields
    const { name, ownerName, email, phone, province, district, description, trainings, whatsappNumber } = req.body;

    company.name = name || company.name;
    company.ownerName = ownerName || company.ownerName;
    company.email = email || company.email;
    company.phone = phone || company.phone;
    company.province = province || company.province;
    company.district = district || company.district;
    company.description = description || company.description;
    company.trainings = trainings || company.trainings;
    company.whatsappNumber = whatsappNumber || company.whatsappNumber;

    await company.save();
    res.status(200).json({ message: "Company updated successfully", company });
  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create company (Company → Admin notification)
export const createCompany = async (req, res) => {
  try {
    const { name, email, phone, location, description, trainings } = req.body;

    // Check if user already has a company
    const existingCompany = await Company.findOne({ createdBy: req.user.id });
    if (existingCompany) {
      return res.status(400).json({ message: "You already have a company registered" });
    }

    const company = new Company({
      name,
      email,
      phone,
      location,
      description,
      trainings,
      createdBy: req.user.id,
      approved: false // Default to not approved
    });

    await company.save();

    // ✅ FIXED: Send notification to ADMIN about new company registration
    const adminUsers = await User.find({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await createNotification({
        recipient: admin._id, // Send to ADMIN
        sender: req.user.id,
        type: "company_registration",
        title: "New Company Registration",
        message: `New company "${name}" registered and awaiting approval`,
        relatedCompany: company._id
      });
    }
    
    console.log(`✅ Company registration notification sent to ${adminUsers.length} admin(s)`);

    res.status(201).json(company);
  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Approve/Reject company (Admin → Company notification)
export const updateCompanyStatus = async (req, res) => {
  try {
    const { approved } = req.body;
    
    const company = await Company.findById(req.params.id).populate("createdBy");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.approved = approved;
    await company.save();

    // ✅ Send notification to COMPANY about approval status
    if (company.createdBy) {
      await createNotification({
        recipient: company.createdBy._id, // Send to COMPANY
        sender: req.user.id,
        type: "company_approval",
        title: approved ? "Company Approved" : "Company Rejected",
        message: approved 
          ? `Your company "${company.name}" has been approved and is now visible to students`
          : `Your company "${company.name}" registration was rejected. Please contact admin for details.`,
        relatedCompany: company._id
      });
      
      console.log(`✅ Company status notification sent to company: ${company.name}`);
    }

    res.status(200).json({ 
      message: `Company ${approved ? 'approved' : 'rejected'} successfully`, 
      company 
    });
  } catch (error) {
    console.error("Update company status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete company
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await Company.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Upload company photo
export const uploadCompanyPhoto = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    // Update company with photo URL
    company.photo = req.file.path; // Cloudinary URL
    company.logoPublicId = req.file.filename || req.file.public_id || company.logoPublicId;
    await company.save();

    res.status(200).json({
      message: "Photo uploaded successfully",
      photo: req.file.path,
      company
    });
  } catch (error) {
    console.error("Upload photo error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Upload a picture for company (gallery) with optional description
export const uploadCompanyPicture = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No picture uploaded" });
    }

    const description = req.body.description || "";
    const publicId = req.file.filename || req.file.public_id || null;
    const url = req.file.path || req.file.secure_url || req.file.url;

    const pic = {
      url,
      description,
      publicId,
      uploadedBy: req.user._id,
      createdAt: Date.now()
    };

    company.pictures = company.pictures || [];
    company.pictures.push(pic);
    await company.save();

    res.status(201).json({ message: 'Picture uploaded', picture: pic, company });
  } catch (error) {
    console.error('Upload company picture error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a picture from company gallery
export const deleteCompanyPicture = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { pictureId } = req.params;
    const pic = company.pictures.id(pictureId);
    if (!pic) {
      return res.status(404).json({ message: 'Picture not found' });
    }

    // Remove from Cloudinary if publicId exists
    if (pic.publicId) {
      try {
        await cloudinary.uploader.destroy(pic.publicId);
      } catch (err) {
        console.warn('Failed to delete picture from Cloudinary:', err.message);
      }
    }

    pic.remove();
    await company.save();

    res.status(200).json({ message: 'Picture deleted', company });
  } catch (error) {
    console.error('Delete company picture error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete company photo
export const deleteCompanyPhoto = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.photo) {
      return res.status(400).json({ message: "No photo to delete" });
    }

    // Delete from Cloudinary
    const publicId = company.photo.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`company-photos/${publicId}`);

    // Remove photo from company
    company.photo = null;
    await company.save();

    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({ message: error.message });
  }
};
