import Internship from "../models/Internship.js";
import Company from "../models/Company.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Follow from "../models/Follow.js";

// Helper function to emit socket events
const emitSocketEvent = (io, event, data, room = null) => {
  try {
    if (io && room) {
      io.to(room).emit(event, data);
    } else if (io) {
      io.emit(event, data);
    }
  } catch (socketError) {
    console.error("Socket emission error:", socketError);
  }
};

// Get all internships with advanced filtering and pagination
export const getInternships = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      location,
      department,
      company,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    let query = {};
    
    // For non-admin users, only show internships from approved companies
    if (req.user && req.user.role !== 'admin') {
      const approvedCompanies = await Company.find({ approved: true }).select('_id');
      const approvedCompanyIds = approvedCompanies.map(comp => comp._id);
      query.company = { $in: approvedCompanyIds };
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Department filter
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    // Company filter
    if (company) {
      const companies = await Company.find({ 
        name: { $regex: company, $options: 'i' } 
      }).select('_id');
      const companyIds = companies.map(comp => comp._id);
      query.company = { ...query.company, $in: companyIds };
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const internships = await Internship.find(query)
      .populate("company", "name email phone location approved logo website")
      .populate("createdBy", "email fullName")
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Internship.countDocuments(query);

    res.status(200).json({
      success: true,
      count: internships.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: internships
    });
  } catch (error) {
    console.error("❌ Get internships error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch internships",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

// Get internships for logged-in company with stats
export const getMyInternships = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    let query = { company: company._id };
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const internships = await Internship.find(query)
      .populate("company", "name email phone location logo")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get application counts for each internship
    const internshipsWithStats = await Promise.all(
      internships.map(async (internship) => {
        const applications = await Application.find({ 
          internship: internship._id 
        });
        
        const applicationStats = {
          total: applications.length,
          pending: applications.filter(app => app.status === 'pending').length,
          accepted: applications.filter(app => app.status === 'accepted').length,
          rejected: applications.filter(app => app.status === 'rejected').length
        };

        return {
          ...internship.toObject(),
          applicationStats
        };
      })
    );

    // Get total counts for pagination
    const total = await Internship.countDocuments(query);

    res.status(200).json({
      success: true,
      count: internships.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: internshipsWithStats
    });
  } catch (error) {
    console.error("❌ Get my internships error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch your internships"
    });
  }
};

// Create internship with notification
export const createInternship = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user.id });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }
    
    // Check if company is approved
    if (!company.approved) {
      return res.status(403).json({ 
        success: false,
        message: "Your company must be approved by admin to create internships" 
      });
    }

    // Validate required fields
    const requiredFields = ['title', 'department', 'description', 'requirements', 'location'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const internship = new Internship({
      ...req.body,
      company: company._id,
      createdBy: req.user.id,
      status: 'active'
    });

    await internship.save();
    
    await internship.populate("company", "name email phone location approved logo");

    // Create notification for admin about new internship
    try {
      const admins = await User.find({ role: 'admin', active: true });
      const io = req.app.get("io");

      for (const admin of admins) {
        const notification = await Notification.create({
          recipient: admin._id,
          sender: req.user.id,
          type: "new_internship",
          title: "New Internship Posted",
          message: `New internship "${internship.title}" posted by ${company.name}`,
          relatedInternship: internship._id
        });

        emitSocketEvent(io, "new_notification", notification, `notifications_${admin._id}`);
      }

      // Create notification for all followers of the company
      const followers = await Follow.find({ following: company._id }).populate("follower");
      for (const follow of followers) {
        const notification = await Notification.create({
          recipient: follow.follower._id,
          sender: req.user.id,
          type: "new_internship",
          title: "New Internship Posted",
          message: `${company.name} posted a new internship: "${internship.title}"`,
          relatedInternship: internship._id,
          relatedCompany: company._id
        });

        emitSocketEvent(io, "new_notification", notification, `notifications_${follow.follower._id}`);
      }
    } catch (notifError) {
      console.error("Notification creation error:", notifError);
    }

    res.status(201).json({
      success: true,
      message: "Internship created successfully",
      data: internship
    });
  } catch (error) {
    console.error("❌ Create internship error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to create internship",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

// Get internship by ID with detailed information
export const getInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate("company", "name email phone location approved logo website description")
      .populate("createdBy", "email fullName");

    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check if internship is from approved company for non-admin users
    if (req.user && req.user.role !== 'admin' && !internship.company.approved) {
      return res.status(403).json({ 
        success: false,
        message: "This internship is from a company that is not yet approved" 
      });
    }

    // Get application count and user's application status if user is student
    let userApplication = null;
    let applicationStats = null;

    if (req.user && req.user.role === 'student') {
      userApplication = await Application.findOne({
        internship: internship._id,
        student: req.user.id
      });

      const applications = await Application.find({ internship: internship._id });
      applicationStats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length
      };
    }

    res.status(200).json({
      success: true,
      data: {
        ...internship.toObject(),
        userApplication,
        applicationStats
      }
    });
  } catch (error) {
    console.error("❌ Get internship error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch internship details"
    });
  }
};

// Get internships by company ID with enhanced security
export const getInternshipsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        message: "Company ID is required" 
      });
    }

    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }
    
    // Security check: If company is not approved and user is not admin/owner, restrict access
    const isAdmin = req.user?.role === 'admin';
    const isCompanyOwner = req.user?.id === company.createdBy?.toString();
    
    if (!company.approved && !isAdmin && !isCompanyOwner) {
      return res.status(403).json({ 
        success: false,
        message: "This company is not approved yet. Internships are not visible to students." 
      });
    }
    
    let query = { company: companyId };
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const internships = await Internship.find(query)
      .populate("company", "name email phone location approved logo")
      .populate("createdBy", "email fullName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Internship.countDocuments(query);

    res.status(200).json({
      success: true,
      count: internships.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: internships
    });
  } catch (error) {
    console.error("❌ Get internships by company error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to load company internships"
    });
  }
};

// Update internship with validation
export const updateInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check if user owns this internship or is admin
    const company = await Company.findOne({ createdBy: req.user.id });
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && (!company || internship.company.toString() !== company._id.toString())) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this internship" 
      });
    }

    // Prevent updating certain fields if not admin
    if (!isAdmin) {
      const restrictedFields = ['company', 'createdBy', 'status'];
      restrictedFields.forEach(field => {
        if (req.body[field]) {
          delete req.body[field];
        }
      });
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("company", "name email phone location logo");

    res.status(200).json({
      success: true,
      message: "Internship updated successfully",
      data: updatedInternship
    });
  } catch (error) {
    console.error("❌ Update internship error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to update internship"
    });
  }
};

// Delete internship with cleanup
export const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check if user owns this internship or is admin
    const company = await Company.findOne({ createdBy: req.user.id });
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && (!company || internship.company.toString() !== company._id.toString())) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this internship" 
      });
    }

    // Delete all related applications
    await Application.deleteMany({ internship: internship._id });

    // Delete related notifications
    await Notification.deleteMany({ relatedInternship: internship._id });

    await Internship.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Internship and all related applications deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete internship error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete internship"
    });
  }
};

// Toggle internship status (active/inactive)
export const toggleInternshipStatus = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check if user owns this internship or is admin
    const company = await Company.findOne({ createdBy: req.user.id });
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && (!company || internship.company.toString() !== company._id.toString())) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this internship" 
      });
    }

    internship.status = internship.status === 'active' ? 'inactive' : 'active';
    await internship.save();

    res.status(200).json({
      success: true,
      message: `Internship ${internship.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: internship
    });
  } catch (error) {
    console.error("❌ Toggle internship status error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update internship status"
    });
  }
};

// Get internship statistics for dashboard
export const getInternshipStats = async (req, res) => {
  try {
    let companyFilter = {};
    
    // If user is company, only show stats for their company
    if (req.user.role === 'company') {
      const company = await Company.findOne({ createdBy: req.user.id });
      if (company) {
        companyFilter = { company: company._id };
      }
    }

    const [
      totalInternships,
      activeInternships,
      inactiveInternships,
      internshipsByDepartment,
      recentInternships
    ] = await Promise.all([
      Internship.countDocuments(companyFilter),
      Internship.countDocuments({ ...companyFilter, status: 'active' }),
      Internship.countDocuments({ ...companyFilter, status: 'inactive' }),
      Internship.aggregate([
        { $match: companyFilter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Internship.find(companyFilter)
        .populate("company", "name logo")
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalInternships,
        active: activeInternships,
        inactive: inactiveInternships,
        byDepartment: internshipsByDepartment,
        recent: recentInternships
      }
    });
  } catch (error) {
    console.error("❌ Get internship stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch internship statistics"
    });
  }
};

export default {
  getInternships,
  getMyInternships,
  createInternship,
  getInternship,
  getInternshipsByCompany,
  updateInternship,
  deleteInternship,
  toggleInternshipStatus,
  getInternshipStats
};