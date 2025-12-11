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
                <span>{company.approved ? 'Company Approved' : 'Pending Approval'}</span>
              </div>
              {!company.approved && (
                <p className="approval-note">
                  Your company is pending admin approval. You can create internships, but they won't be visible to students until approved.
                </p>
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
              />
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
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
            <div className="actions-grid">
              <Link to="/messages" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="action-content">
                  <h4>Messages</h4>
                  <p>Check your conversations</p>
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
              onClick={() => setActiveTab("applications")}
            >
              <i className="fas fa-users"></i>
              Applications ({applications.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <i className="fas fa-chart-bar"></i>
              Analytics
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
                    onClick={() => setShowForm(!showForm)}
                    disabled={!company?.approved}
                  >
                    {showForm ? (
                      <><i className="fas fa-times"></i> Cancel</>
                    ) : (
                      <><i className="fas fa-plus"></i> Add New Internship</>
                    )}
                  </button>
                  {company && !company.approved && (
                    <span className="approval-warning">
                      <i className="fas fa-exclamation-triangle"></i> Create internships after approval
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
                        <label>Contact Phone</label>
                        <input
                          type="text"
                          name="contactPhone"
                          className="form-control"
                          placeholder="+250 XXX XXX XXX"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description *</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="3"
                        placeholder="Describe the internship role, responsibilities, and learning opportunities..."
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>Requirements</label>
                      <textarea
                        name="requirements"
                        className="form-control"
                        rows="2"
                        placeholder="List any requirements, skills, or qualifications needed..."
                        value={formData.requirements}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin"></i> {editingInternshipId ? 'Updating...' : 'Adding...'}</>
                        ) : (
                          <><i className={`fas ${editingInternshipId ? 'fa-save' : 'fa-plus'}`}></i> {editingInternshipId ? 'Update Internship' : 'Add Internship'}</>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCancelForm}
                        disabled={loading}
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Internship List */}
              <div className="companies-grid">
                {internships.length > 0 ? (
                  internships.map((internship) => (
                    <div key={internship._id} className="company-card internship-card">
                      <div className="internship-badge">
                        <span className="badge badge-primary">{internship.department}</span>
                        <span className={`badge ${internship.applicants?.length > 0 ? 'badge-success' : 'badge-secondary'}`}>
                          <i className="fas fa-users"></i> {internship.applicants?.length || 0}
                        </span>
                      </div>
                      
                      <div className="company-header">
                        <h3>{internship.title}</h3>
                        <div className="company-location">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{getLocationName(internship.location)}</span>
                        </div>
                      </div>

                      <div className="company-body">
                        <div className="internship-details-grid">
                          <div className="detail-item">
                            <strong><i className="fas fa-clock"></i> Duration:</strong>
                            <span>{internship.duration}</span>
                          </div>
                          <div className="detail-item">
                            <strong><i className="fas fa-money-bill-wave"></i> Stipend:</strong>
                            <span>{internship.price || "Not specified"}</span>
                          </div>
                          <div className="detail-item">
                            <strong><i className="fas fa-envelope"></i> Contact:</strong>
                            <span>{internship.contactEmail}</span>
                          </div>
                          <div className="detail-item">
                            <strong><i className="fas fa-calendar"></i> Posted:</strong>
                            <span>{new Date(internship.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {internship.description && (
                          <div className="description-section">
                            <h4><i className="fas fa-info-circle"></i> Description</h4>
                            <p>{internship.description}</p>
                          </div>
                        )}

                        {internship.requirements && (
                          <div className="requirements-section">
                            <h4><i className="fas fa-tasks"></i> Requirements</h4>
                            <p>{internship.requirements}</p>
                          </div>
                        )}

                        <div className="internship-footer">
                          <div className="internship-actions">
                            <button
                              className="btn btn-outline"
                              onClick={() => {
                                setSelectedInternshipId(internship._id);
                                setSelectedInternshipTitle(internship.title);
                                setShowApplicantsModal(true);
                              }}
                            >
                              <i className="fas fa-users"></i> View Applicants ({internship.applicants?.length || 0})
                            </button>
                            <button
                              className="btn btn-warning"
                              onClick={() => startEditInternship(internship)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteInternship(internship._id)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-briefcase fa-3x"></i>
                    <h3>No Internships Posted Yet</h3>
                    <p>Start by creating your first internship opportunity for students.</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowForm(true)}
                      disabled={!company?.approved}
                    >
                      <i className="fas fa-plus"></i> Create Your First Internship
                    </button>
                    {company && !company.approved && (
                      <p className="approval-note" style={{ marginTop: "1rem" }}>
                        <i className="fas fa-info-circle"></i> You must be approved by an admin before creating internships.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "applications" ? (
            <div>
              <div className="dashboard-header">
                <h2 className="section-title">
                  <i className="fas fa-users"></i> Student Applications
                </h2>
                <div className="header-actions">
                  <button onClick={fetchApplications} className="btn btn-outline">
                    <i className="fas fa-refresh"></i> Refresh
                  </button>
                  <button onClick={() => navigate('/messages')} className="btn btn-primary">
                    <i className="fas fa-comments"></i> Go to Messages
                  </button>
                </div>
              </div>

              {applications.length > 0 ? (
                <div className="applications-container">
                  <div className="applications-filters">
                    <div className="filter-group">
                      <label>Filter by Status:</label>
                      <select className="form-control" style={{width: '200px'}}>
                        <option value="all">All Applications</option>
                        <option value="pending">Pending Only</option>
                        <option value="accepted">Accepted Only</option>
                        <option value="rejected">Rejected Only</option>
                      </select>
                    </div>
                    <div className="filter-stats">
                      <span className="stat-item">
                        <i className="fas fa-clock text-warning"></i> Pending: {stats.pendingApplications}
                      </span>
                      <span className="stat-item">
                        <i className="fas fa-check-circle text-success"></i> Accepted: {stats.acceptedApplications}
                      </span>
                      <span className="stat-item">
                        <i className="fas fa-times-circle text-danger"></i> Rejected: {stats.rejectedApplications}
                      </span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="styled-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Internship</th>
                          <th>Applied</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => {
                          const statusBadge = getStatusBadge(app.status);
                          return (
                            <tr key={app._id}>
                              <td>
                                <div className="student-info">
                                  <div className="student-avatar">
                                    {app.student?.photo ? (
                                      <img src={app.student.photo} alt={app.student.fullName} />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <i className="fas fa-user"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div className="student-details">
                                    <strong>{app.student?.fullName || "N/A"}</strong>
                                    <div className="text-muted">
                                      <i className="fas fa-envelope"></i> {app.student?.email}
                                    </div>
                                    {app.student?.phone && (
                                      <div className="text-muted">
                                        <i className="fas fa-phone"></i> {app.student.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="internship-info">
                                  <strong>{app.internship?.title}</strong>
                                  <div className="text-muted">
                                    <i className="fas fa-building"></i> {app.internship?.department}
                                  </div>
                                  <div className="text-muted">
                                    <i className="fas fa-map-marker-alt"></i> {getLocationName(app.internship?.location)}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="date-info">
                                  <div>{new Date(app.createdAt).toLocaleDateString()}</div>
                                  <small className="text-muted">{new Date(app.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge ${statusBadge.class}`}>
                                  <i className={`fas ${statusBadge.icon}`}></i> {statusBadge.text}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <div className="btn-group">
                                    {app.status === "pending" && (
                                      <>
                                        <button
                                          className="btn btn-success btn-sm"
                                          onClick={() => handleUpdateStatus(app._id, "accepted", app.student?.fullName, app.internship?.title)}
                                          title="Accept Application"
                                        >
                                          <i className="fas fa-check"></i>
                                        </button>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          onClick={() => handleUpdateStatus(app._id, "rejected", app.student?.fullName, app.internship?.title)}
                                          title="Reject Application"
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </>
                                    )}
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleMessageStudent(app.student)}
                                      title="Message Student"
                                    >
                                      <i className="fas fa-comment"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={() => viewStudentProfile(app.student)}
                                      title="View Profile"
                                    >
                                      <i className="fas fa-user"></i>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-users fa-3x"></i>
                  <h3>No Applications Yet</h3>
                  <p>When students apply to your internships, they will appear here.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setActiveTab("internships")}
                  >
                    <i className="fas fa-briefcase"></i> View Internships
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="analytics-section">
              <div className="dashboard-header">
                <h2 className="section-title">
                  <i className="fas fa-chart-bar"></i> Analytics Dashboard
                </h2>
              </div>
              
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4><i className="fas fa-chart-pie"></i> Application Status Distribution</h4>
                  <div className="chart-placeholder">
                    {/* You can integrate Chart.js or another charting library here */}
                    <div className="pie-chart">
                      <div className="chart-legend">
                        <div className="legend-item">
                          <span className="legend-color pending"></span>
                          <span>Pending: {stats.pendingApplications}</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color accepted"></span>
                          <span>Accepted: {stats.acceptedApplications}</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color rejected"></span>
                          <span>Rejected: {stats.rejectedApplications}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h4><i className="fas fa-calendar"></i> Recent Activity</h4>
                  <div className="activity-list">
                    {applications.slice(0, 5).map(app => (
                      <div key={app._id} className="activity-item">
                        <div className="activity-icon">
                          <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="activity-content">
                          <strong>{app.student?.fullName}</strong> applied to <strong>{app.internship?.title}</strong>
                          <div className="activity-time">
                            {new Date(app.createdAt).toLocaleDateString()} at {new Date(app.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <div className={`activity-status ${app.status}`}>
                          {app.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Applicants Modal */}
      {showApplicantsModal && (
        <ApplicantList
          internshipId={selectedInternshipId}
          internshipTitle={selectedInternshipTitle}
          onClose={() => {
            setShowApplicantsModal(false);
            setSelectedInternshipId(null);
            setSelectedInternshipTitle(null);
          }}
          onStatusUpdate={handleUpdateStatus}
          viewStudentProfile={viewStudentProfile}
          handleMessageStudent={handleMessageStudent}
        />
      )}

      <Footer />
    </>
  );
};

export default CompanyDashboard;