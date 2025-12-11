// src/pages/StudentDashboard.jsx - PERFECT BACKEND MATCH
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./StudentDashboard.css";

const StudentDashboard = ({ user, handleLogout }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  const [notesDownloaded, setNotesDownloaded] = useState(0);
  const navigate = useNavigate();

  /* --------------------------------------------------------------
     FETCH APPLICATIONS - Using your exact backend structure
  -------------------------------------------------------------- */
  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchNotesDownloaded();
    }
  }, [user]);

  const fetchNotesDownloaded = async () => {
    try {
      const res = await API.get('/users/me/downloads');
      setNotesDownloaded(res.data.totalDownloads || 0);
    } catch (err) {
      console.error('Failed to fetch notes downloaded count:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 Fetching applications from: /api/application/my-applications");
      
      // Your backend returns: Application.find().populate("internship").populate("company")
      const response = await API.get("/application/my-applications");
      console.log("📦 Raw backend response:", response);
      
      // Your backend returns an array of applications directly
      const applicationsData = response.data;
      
      if (!Array.isArray(applicationsData)) {
        throw new Error("Invalid response format from server");
      }
      
      console.log(`✅ Loaded ${applicationsData.length} applications`);
      console.log("📊 Sample application structure:", applicationsData[0]);
      
      setApplications(applicationsData);
      calculateStats(applicationsData);
      
    } catch (err) {
      console.error("❌ Failed to load applications:", err);
      
      let errorMessage = "Could not load your applications. Please try again later.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = "Please login again to view your applications.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps) => {
    const stats = {
      total: apps.length,
      pending: apps.filter(app => app.status === "pending").length,
      accepted: apps.filter(app => app.status === "accepted").length,
      rejected: apps.filter(app => app.status === "rejected").length
    };
    setStats(stats);
  };

  /* --------------------------------------------------------------
     CANCEL APPLICATION - Matches your backend exactly
  -------------------------------------------------------------- */
  const handleCancelApplication = async (applicationId) => {
    if (!window.confirm("Are you sure you want to cancel this application? This will notify the company.")) {
      return;
    }

    setCancelling(applicationId);
    try {
      console.log("🗑️ Cancelling application:", applicationId);
      
      // Your backend: DELETE /api/application/:id
      // Only allows cancellation for pending applications
      await API.delete(`/application/${applicationId}`);
      
      // Remove from local state immediately
      const updatedApplications = applications.filter((app) => app._id !== applicationId);
      setApplications(updatedApplications);
      calculateStats(updatedApplications);
      
      console.log("✅ Application cancelled successfully");
      alert("Application cancelled successfully! The company has been notified.");
      
    } catch (err) {
      console.error("❌ Failed to cancel application:", err);
      
      let errorMessage = "Failed to cancel application. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = "Cannot cancel application that is already processed.";
      } else if (err.response?.status === 404) {
        errorMessage = "Application not found.";
      }
      
      alert(errorMessage);
    } finally {
      setCancelling(null);
    }
  };

  /* --------------------------------------------------------------
     UI HELPER FUNCTIONS - Matches your data structure
  -------------------------------------------------------------- */
  const getStatusClass = (status) => {
    switch (status) {
      case "accepted":
        return "approved";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "✅ Accepted";
      case "rejected":
        return "❌ Rejected";
      default:
        return "⏳ Pending";
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
    return locations[location] || location || "Not specified";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* --------------------------------------------------------------
     NAVIGATION FUNCTIONS
  -------------------------------------------------------------- */
  const handleViewCompanyProfile = (company) => {
    if (company?._id) {
      navigate(`/company/${company._id}`);
    } else {
      alert("Company profile not available");
    }
  };

  const handleMessageCompany = async (application) => {
    const company = application.internship?.company;
    
    if (!company) {
      alert("Company information not available");
      return;
    }

    try {
      // Find company user to message
      const usersRes = await API.get("/admin/users");
      const companyUser = usersRes.data.find(
        (u) => u.email === company.email
      );

      if (companyUser) {
        navigate(`/messages?user=${companyUser._id}&userName=${encodeURIComponent(company.name)}`);
      } else {
        navigate(
          `/messages?companyEmail=${encodeURIComponent(company.email)}&companyName=${encodeURIComponent(company.name)}`
        );
      }
    } catch (err) {
      console.error("Failed to find company user:", err);
      navigate("/messages");
    }
  };

  const handleBrowseInternships = () => {
    navigate("/");
  };

  /* --------------------------------------------------------------
     RENDER COMPONENT
  -------------------------------------------------------------- */
  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h2>Student Dashboard</h2>
          <p>Manage your internship applications and track their status</p>
          <div className="dashboard-actions">
            <button onClick={handleBrowseInternships} className="btn btn-primary">
              <i className="fas fa-briefcase"></i> Find Internships
            </button>
            <Link to="/messages" className="btn btn-outline">
              <i className="fas fa-comments"></i> Messages
            </Link>
            <button onClick={fetchApplications} className="btn btn-outline">
              <i className="fas fa-refresh"></i> Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      {!loading && !error && applications.length > 0 && (
        <section className="stats-section">
          <div className="container">
            <h3 className="stats-title">Application Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon total">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.total}</h3>
                  <p>Total Applications</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pending">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.pending}</h3>
                  <p>Pending Review</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon approved">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.accepted}</h3>
                  <p>Accepted</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon rejected">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.rejected}</h3>
                  <p>Not Accepted</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Applications Section */}
      <section className="companies-section">
        <div className="container">
          <div className="dashboard-header">
            <h2 className="section-title">
              My Applications {!loading && `(${applications.length})`}
            </h2>
            <div className="header-actions">
              <button onClick={fetchApplications} className="btn btn-outline">
                <i className="fas fa-refresh"></i> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
              <p>Loading your applications...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Unable to Load Applications</h3>
              <p>{error}</p>
              <button onClick={fetchApplications} className="btn btn-primary">
                <i className="fas fa-redo"></i> Try Again
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <h3>No Applications Yet</h3>
              <p>You haven't applied for any internships yet. Start by browsing available opportunities.</p>
              <button onClick={handleBrowseInternships} className="btn btn-primary">
                <i className="fas fa-briefcase"></i> Browse Internships
              </button>
            </div>
          ) : (
            <div className="applications-container">
              {/* Applications List */}
              <div className="applications-list">
                {applications.map((application) => (
                  <ApplicationCard 
                    key={application._id}
                    application={application}
                    onCancel={handleCancelApplication}
                    onMessage={handleMessageCompany}
                    onViewCompany={handleViewCompanyProfile}
                    cancelling={cancelling}
                    getStatusClass={getStatusClass}
                    getStatusText={getStatusText}
                    getLocationName={getLocationName}
                    formatDate={formatDate}
                  />
                ))}
              </div>

              {/* Application Summary */}
              <div className="application-summary">
                <div className="summary-card">
                  <h4>Quick Summary</h4>
                  <div className="summary-content">
                    <div className="summary-item">
                      <span className="label">Pending Applications:</span>
                      <span className="value pending">{stats.pending}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Accepted:</span>
                      <span className="value approved">{stats.accepted}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Total Applied:</span>
                      <span className="value total">{stats.total}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Notes Downloaded:</span>
                      <span className="value">{notesDownloaded}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

// Application Card Component
const ApplicationCard = ({ 
  application, 
  onCancel, 
  onMessage, 
  onViewCompany, 
  cancelling, 
  getStatusClass, 
  getStatusText, 
  getLocationName, 
  formatDate 
}) => {
  // Extract data from your backend structure
  const internship = application.internship || {};
  const company = internship.company || {};
  
  return (
    <div className="application-card">
      <div className="card-header">
        <div className="application-main-info">
          <h3>{internship.title || "Internship Position"}</h3>
          <span className={`status-badge ${getStatusClass(application.status)}`}>
            {getStatusText(application.status)}
          </span>
        </div>
        
        <div className="company-info">
          <div className="company-name">
            <i className="fas fa-building"></i>
            <strong>{company.name || "Company"}</strong>
          </div>
          <div className="application-date">
            <i className="fas fa-calendar"></i>
            Applied: {formatDate(application.createdAt)}
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="application-details">
          <div className="detail-row">
            <div className="detail-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{getLocationName(company.location)}</span>
            </div>
            <div className="detail-item">
              <i className="fas fa-building"></i>
              <span>{internship.department || "Various Departments"}</span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-item">
              <i className="fas fa-clock"></i>
              <span>{internship.duration || "Not specified"}</span>
            </div>
            <div className="detail-item">
              <i className="fas fa-money-bill-wave"></i>
              <span>{internship.price || "Stipend not specified"}</span>
            </div>
          </div>
        </div>

        {internship.description && (
          <div className="description-section">
            <p>{internship.description}</p>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="action-buttons">
          <button
            className="btn btn-outline"
            onClick={() => onViewCompany(company)}
            disabled={!company._id}
          >
            <i className="fas fa-eye"></i> View Company
          </button>
          
          <button
            className="btn btn-primary"
            onClick={() => onMessage(application)}
          >
            <i className="fas fa-envelope"></i> Message
          </button>
          
          {application.status === "pending" && (
            <button
              className="btn btn-danger"
              onClick={() => onCancel(application._id)}
              disabled={cancelling === application._id}
            >
              {cancelling === application._id ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Cancelling...
                </>
              ) : (
                <>
                  <i className="fas fa-times"></i> Cancel
                </>
              )}
            </button>
          )}
        </div>

        {/* Status Messages */}
        {application.status === "accepted" && (
          <div className="status-message success">
            <i className="fas fa-party-horn"></i>
            <div>
              <strong>Congratulations! 🎉</strong>
              <p>Your application has been accepted! The company will contact you soon.</p>
            </div>
          </div>
        )}
        
        {application.status === "rejected" && (
          <div className="status-message info">
            <i className="fas fa-info-circle"></i>
            <div>
              <strong>Application Update</strong>
              <p>This application was not accepted. Keep applying to other opportunities!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;