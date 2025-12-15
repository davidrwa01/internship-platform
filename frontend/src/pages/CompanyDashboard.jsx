import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApplicantList from "../components/ApplicantList";
import CompanyGallery from "../components/CompanyGallery";
import ImageUpload from "../components/ImageUpload";
import API from "../services/api";
import "./Home.css";

const CompanyDashboard = ({ user, handleLogout }) => {
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [company, setCompany] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("internships");
  const [adminUser, setAdminUser] = useState(null);
  const [stats, setStats] = useState({
    totalInternships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0
  });
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [selectedInternshipTitle, setSelectedInternshipTitle] = useState(null);
  const [editingInternshipId, setEditingInternshipId] = useState(null);
  const navigate = useNavigate();

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    price: "",
    contactEmail: user?.email || "",
    contactPhone: user?.phone || "",
    description: "",
    requirements: "",
    duration: "",
  });

  // Fetch data
  useEffect(() => {
    fetchCompanyData();
    fetchAdminUser();
    if (activeTab === "internships") {
      fetchInternships();
    } else {
      fetchApplications();
    }
  }, [activeTab]);
  
  // Fetch admin user info
  const fetchAdminUser = async () => {
    try {
      const res = await API.get("/users");
      if (Array.isArray(res.data)) {
        const admin = res.data.find(u => u.role === "admin");
        if (admin) {
          setAdminUser(admin);
        }
      }
    } catch (error) {
      console.error("Failed to fetch admin user:", error);
    }
  };
  
  // Handler for "Contact Admin" button click
  const handleContactAdminClick = () => {
    if (!adminUser) {
      alert("Admin user not found");
      return;
    }
    navigate(`/messages?user=${adminUser._id}&adminName=${encodeURIComponent(adminUser.fullName || adminUser.email || "Admin")}`);
  };

  const fetchCompanyData = async () => {
    try {
      const res = await API.get("/company/my-company");
      setCompany(res.data);
    } catch (err) {
      console.error("Failed to load company data:", err);
      // If company not found, redirect to create company profile
      if (err.response?.status === 404) {
        navigate("/edit-company");
        return;
      }
    }
  };

  const fetchInternships = async () => {
    try {
      const res = await API.get("/internship/company/my/internships");
      setInternships(res.data?.data || []);
      updateStats(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load internships:", err);
      // If company not found, redirect to create company profile
      if (err.response?.status === 404) {
        navigate("/edit-company");
        return;
      }
      alert("Failed to load internships");
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await API.get("/application/company");
      setApplications(res.data || []);
      updateApplicationStats(res.data || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
      alert("Failed to load applications");
    }
  };

  const updateStats = (internshipsData) => {
    setStats(prev => ({
      ...prev,
      totalInternships: internshipsData.length
    }));
  };

  const updateApplicationStats = (applicationsData) => {
    const pending = applicationsData.filter(app => app.status === "pending").length;
    const accepted = applicationsData.filter(app => app.status === "accepted").length;
    const rejected = applicationsData.filter(app => app.status === "rejected").length;
    
    setStats(prev => ({
      ...prev,
      totalApplications: applicationsData.length,
      pendingApplications: pending,
      acceptedApplications: accepted,
      rejectedApplications: rejected
    }));
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddInternship = async (e) => {
    e.preventDefault();
    
    // Check if company is approved
    if (!company?.approved) {
      alert("Your company is not approved yet. Please wait for admin approval before creating internships.");
      return;
    }
    
    setLoading(true);

    try {
      if (!formData.title.trim() || !formData.department.trim() || !formData.location.trim()) {
        alert("Please fill in all required fields (Title, Department, Location)");
        setLoading(false);
        return;
      }

      let res;
      if (editingInternshipId) {
        // Update existing internship
        res = await API.put(`/internship/${editingInternshipId}`, formData);
        setInternships(internships.map(internship =>
          internship._id === editingInternshipId ? res.data : internship
        ));
        alert("Internship updated successfully!");
      } else {
        // Add new internship
        res = await API.post("/internship", formData);
        setInternships([...internships, res.data]);
        alert("Internship added successfully!");
      }

      setFormData({
        title: "",
        department: "",
        location: "",
        price: "",
        contactEmail: user?.email || "",
        contactPhone: user?.phone || "",
        description: "",
        requirements: "",
        duration: "",
      });
      setShowForm(false);
      setEditingInternshipId(null);

      // Refresh stats
      fetchInternships();
    } catch (err) {
      console.error("Failed to save internship:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        `Failed to ${editingInternshipId ? 'update' : 'add'} internship. Check console for details.`;
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInternship = async (internshipId) => {
    // Check if company is approved
    if (!company?.approved) {
      alert("Your company is not approved yet. Please wait for admin approval before deleting internships.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this internship?")) return;

    try {
      await API.delete(`/internship/${internshipId}`);
      setInternships(internships.filter((internship) => internship._id !== internshipId));
      alert("Internship deleted successfully!");
      
      // Refresh stats
      fetchInternships();
    } catch (err) {
      console.error("Failed to delete internship:", err);
      alert("Failed to delete internship");
    }
  };

  const handleUpdateStatus = async (applicationId, status, studentName, internshipTitle) => {
    // Check if company is approved
    if (!company?.approved) {
      alert("Your company is not approved yet. Please wait for admin approval before managing applications.");
      return;
    }
    
    try {
      await API.put(`/application/${applicationId}/status`, { status });
      
      // Create notification for student
      try {
        const application = applications.find(app => app._id === applicationId);
        if (application?.student?._id) {
          await API.post("/notifications", {
            recipient: application.student._id,
            title: "Application Status Updated",
            message: `Your application for "${internshipTitle}" has been ${status}`,
            type: "status_update",
            relatedApplication: applicationId
          });
        }
      } catch (notifErr) {
        console.error("Failed to send notification:", notifErr);
      }

      alert(`Application ${status} successfully! ${studentName} has been notified.`);
      
      // Refresh both applications and internships data
      fetchApplications();
      fetchInternships(); // This will refresh the applicant counts in internship cards
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update application status");
    }
  };

  const viewStudentProfile = (student) => {
    if (student?._id) {
      navigate(`/profile/${student._id}`);
    } else {
      alert(`Student Profile:
Name: ${student.fullName || "N/A"}
Email: ${student.email}
Phone: ${student.phone || "N/A"}
School: ${student.schoolName || "N/A"}
Location: ${student.studentLocation || "N/A"}`);
    }
  };

  const handleMessageStudent = async (student) => {
    // Check if company is approved
    if (!company?.approved) {
      alert("Your company is not approved yet. Please wait for admin approval before messaging students.");
      return;
    }
    
    if (!student?._id) {
      alert("Student information not available");
      return;
    }

    try {
      // Navigate directly to messages with the student
      navigate(`/messages?user=${student._id}&studentName=${
        encodeURIComponent(student.fullName || student.email || 'Student')
      }`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      navigate('/messages');
    }
  };

  const getLocationName = (location) => {
    const locations = {
      kigali: "Kigali",
      eastern: "Eastern Province",
      western: "Western Province",
      northern: "Northern Province",
      southern: "Southern Province",
    };
    return locations[location] || location;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return { class: "approved", text: "✅ Accepted", icon: "fa-check" };
      case "rejected":
        return { class: "rejected", text: "❌ Rejected", icon: "fa-times" };
      default:
        return { class: "pending", text: "⏳ Pending", icon: "fa-clock" };
    }
  };

  // Reset form when closing
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingInternshipId(null);
    setFormData({
      title: "",
      department: "",
      location: "",
      price: "",
      contactEmail: user?.email || "",
      contactPhone: user?.phone || "",
      description: "",
      requirements: "",
      duration: "",
    });
  };

  // Start editing an internship
  const startEditInternship = (internship) => {
    // Check if company is approved
    if (!company?.approved) {
      alert("Your company is not approved yet. Please wait for admin approval before editing internships.");
      return;
    }
    
    setFormData({
      title: internship.title,
      department: internship.department,
      location: internship.location,
      price: internship.price || "",
      contactEmail: internship.contactEmail,
      contactPhone: internship.contactPhone || "",
      description: internship.description,
      requirements: internship.requirements || "",
      duration: internship.duration,
    });
    setEditingInternshipId(internship._id);
    setShowForm(true);
  };

  // Handle photo upload success
  const handlePhotoUploadSuccess = (data) => {
    setCompany(prev => ({
      ...prev,
      photo: data.photo
    }));
    // Refresh company data
    fetchCompanyData();
  };

  // Helper to disable actions when company is not approved
  const isActionDisabled = () => {
    return !company?.approved;
  };

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      <section className="hero">
        <div className="container">
          <h2>Company Dashboard</h2>
          <p>Manage your internship offers and student applicants.</p>
          
          {/* Company Status */}
          {company && (
            <div className="company-status-banner">
              <div className={`status-indicator ${company.approved ? 'approved' : 'pending'}`}>
                <i className={`fas ${company.approved ? 'fa-check-circle' : 'fa-clock'}`}></i>
                <span>{company.approved ? '✅ Company Approved' : '⏳ Pending Admin Approval'}</span>
              </div>
              {!company.approved && (
                <div className="approval-message">
                  <p>
                    <i className="fas fa-info-circle"></i> 
                    <strong>Your company is pending admin approval.</strong>
                    <br />
                    You can view your dashboard and edit company information, but cannot:
                    <ul>
                      <li>• Create new internships</li>
                      <li>• Edit/Delete existing internships</li>
                      <li>• Accept/Reject applications</li>
                      <li>• Send messages to students</li>
                    </ul>
                    Please wait for admin approval or contact admin for updates.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Company Image Upload Component */}
          {company && (
            <div className="dashboard-section">
              <h3><i className="fas fa-camera"></i> Company Logo</h3>
              <ImageUpload
                currentImage={company.photo}
                onUploadSuccess={handlePhotoUploadSuccess}
                label="Upload Company Logo"
                endpoint="/company/upload-photo"
                aspectRatio="1:1"
                maxSizeMB={5}
                disabled={isActionDisabled()}
              />
              {isActionDisabled() && (
                <p className="disabled-note">
                  <i className="fas fa-lock"></i> Upload disabled until approval
                </p>
              )}
            </div>
          )}

          {/* Company Gallery (pictures) */}
          {company && (
            <div className="dashboard-section">
              <h3><i className="fas fa-images"></i> Company Gallery</h3>
              <CompanyGallery 
                pictures={company.pictures || []} 
                companyId={company._id}
                onUpdate={() => fetchCompanyData()}
                readonly={isActionDisabled()}
              />
              {isActionDisabled() && (
                <p className="disabled-note">
                  <i className="fas fa-lock"></i> Gallery management disabled until approval
                </p>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
            <div className="actions-grid">
              <Link to="/messages" className={`action-card ${isActionDisabled() ? 'disabled' : ''}`}>
                <div className="action-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="action-content">
                  <h4>Messages</h4>
                  <p>Check your conversations</p>
                  {isActionDisabled() && (
                    <small className="disabled-action">(Locked until approval)</small>
                  )}
                </div>
              </Link>
              
              <button 
                onClick={activeTab === "internships" ? fetchInternships : fetchApplications} 
                className="action-card"
              >
                <div className="action-icon">
                  <i className="fas fa-refresh"></i>
                </div>
                <div className="action-content">
                  <h4>Refresh</h4>
                  <p>Update dashboard data</p>
                </div>
              </button>
              
              <button 
                onClick={handleContactAdminClick} 
                className="action-card"
              >
                <div className="action-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <div className="action-content">
                  <h4>Contact Admin</h4>
                  <p>Get help from admin</p>
                </div>
              </button>
              
              <Link to="/edit-company" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <div className="action-content">
                  <h4>Edit Profile</h4>
                  <p>Update company info</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-section">
        <div className="container">
          <h3 className="section-title"><i className="fas fa-chart-line"></i> Dashboard Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.totalInternships}</h3>
                <p>Total Internships</p>
              </div>
              <div className="stat-trend">
                <i className="fas fa-arrow-up"></i>
                <span>Active</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.totalApplications}</h3>
                <p>Total Applications</p>
              </div>
              <div className="stat-trend">
                <i className="fas fa-users"></i>
                <span>All Time</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.pendingApplications}</h3>
                <p>Pending Reviews</p>
              </div>
              <div className="stat-trend warning">
                <i className="fas fa-exclamation-circle"></i>
                <span>Needs Action</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.acceptedApplications}</h3>
                <p>Accepted Interns</p>
              </div>
              <div className="stat-trend success">
                <i className="fas fa-check-circle"></i>
                <span>Successful</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="tab-section">
        <div className="container">
          <div className="tab-container">
            <button
              className={`tab-btn ${activeTab === "internships" ? "active" : ""}`}
              onClick={() => setActiveTab("internships")}
            >
              <i className="fas fa-briefcase"></i>
              My Internships ({internships.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
              onClick={() => {
                if (company?.approved) {
                  setActiveTab("applications");
                } else {
                  alert("Applications tab is only available after admin approval.");
                }
              }}
              disabled={!company?.approved}
            >
              <i className="fas fa-users"></i>
              Applications ({applications.length})
              {!company?.approved && <span className="tab-lock-icon"><i className="fas fa-lock"></i></span>}
            </button>
            <button
              className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => {
                if (company?.approved) {
                  setActiveTab("analytics");
                } else {
                  alert("Analytics tab is only available after admin approval.");
                }
              }}
              disabled={!company?.approved}
            >
              <i className="fas fa-chart-bar"></i>
              Analytics
              {!company?.approved && <span className="tab-lock-icon"><i className="fas fa-lock"></i></span>}
            </button>
          </div>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          {activeTab === "internships" ? (
            <div>
              <div className="dashboard-header">
                <h2 className="section-title">
                  <i className="fas fa-briefcase"></i> Your Internship Offers
                </h2>
                <div className="header-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      if (company?.approved) {
                        setShowForm(!showForm);
                      } else {
                        alert("Please wait for admin approval before creating internships.");
                      }
                    }}
                    disabled={!company?.approved}
                  >
                    {showForm ? (
                      <><i className="fas fa-times"></i> Cancel</>
                    ) : (
                      <><i className="fas fa-plus"></i> Add New Internship</>
                    )}
                  </button>
                  {!company?.approved && (
                    <span className="approval-warning">
                      <i className="fas fa-lock"></i> Create internships after approval
                    </span>
                  )}
                </div>
              </div>

              {/* Add/Edit Internship Form */}
              {showForm && company?.approved && (
                <div className="company-card form-card">
                  <h3>
                    <i className={`fas ${editingInternshipId ? 'fa-edit' : 'fa-plus-circle'}`}></i> 
                    {editingInternshipId ? 'Edit Internship' : 'Add New Internship'}
                  </h3>
                  <form onSubmit={handleAddInternship}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Internship Title *</label>
                        <input
                          type="text"
                          name="title"
                          className="form-control"
                          placeholder="e.g., Software Development Intern"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Department *</label>
                        <select
                          name="department"
                          className="form-control"
                          value={formData.department}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="ICT">ICT & Technology</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Business">Business & Management</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Finance">Finance & Accounting</option>
                          <option value="Hospitality">Hospitality & Tourism</option>
                          <option value="Construction">Construction</option>
                          <option value="Agriculture">Agriculture</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Education">Education</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Location *</label>
                        <select
                          name="location"
                          className="form-control"
                          value={formData.location}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Location</option>
                          <option value="kigali">Kigali</option>
                          <option value="eastern">Eastern Province</option>
                          <option value="western">Western Province</option>
                          <option value="northern">Northern Province</option>
                          <option value="southern">Southern Province</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Duration *</label>
                        <input
                          type="text"
                          name="duration"
                          className="form-control"
                          placeholder="e.g., 3 months, 6 months"
                          value={formData.duration}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Stipend/Price</label>
                        <input
                          type="text"
                          name="price"
                          className="form-control"
                          placeholder="e.g., 50,000 RWF/month, Unpaid"
                          value={formData.price}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Contact Email *</label>
                        <input
                          type="email"
                          name="contactEmail"
                          className="form-control"
                          placeholder="internships@company.com"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Co
