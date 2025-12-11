import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const CompanyProfile = ({ user }) => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [internshipsLoading, setInternshipsLoading] = useState(false);
  const [error, setError] = useState("");
  const [myApplications, setMyApplications] = useState([]);
  const [applyingInternships, setApplyingInternships] = useState({});
  const [activeTab, setActiveTab] = useState("details");

  // Fetch all data on mount
  useEffect(() => {
    fetchCompanyData();
    if (user && user.role === "student") {
      checkFollowStatus();
      fetchMyApplications();
    }
  }, [companyId, user]);

  // Fetch company data and internships
  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔍 Fetching company data for:", companyId);

      const companyRes = await API.get(`/company/${companyId}`);
      setCompany(companyRes.data);
      console.log("✅ Company data loaded:", companyRes.data);

      // Load internships for this company
      await fetchCompanyInternships();
    } catch (err) {
      console.error("❌ Failed to load company data:", err);
      setError("Failed to load company profile");
      if (err.response?.status === 403) {
        alert("This company profile is not available.");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch internships for this company
  const fetchCompanyInternships = async () => {
    try {
      setInternshipsLoading(true);
      setError("");
      console.log("🔍 Fetching internships for company:", companyId);

      const internshipsRes = await API.get(`/internship/company/${companyId}`);
      console.log("📦 Raw API response:", internshipsRes.data);
      
      // Handle different response formats
      let internshipsData = [];
      
      if (Array.isArray(internshipsRes.data)) {
        // Direct array response
        internshipsData = internshipsRes.data;
      } else if (internshipsRes.data && Array.isArray(internshipsRes.data.data)) {
        // Nested data structure
        internshipsData = internshipsRes.data.data;
      } else if (internshipsRes.data && internshipsRes.data.internships) {
        // Alternative nested structure
        internshipsData = internshipsRes.data.internships;
      }
      
      console.log("✅ Parsed internships data:", internshipsData);
      console.log("📊 Internships count:", internshipsData.length);
      
      setInternships(internshipsData);
      
      if (internshipsData.length === 0) {
        console.log("ℹ️ No internships found for this company");
      } else {
        console.log("🎉 Successfully loaded", internshipsData.length, "internships");
      }
    } catch (err) {
      console.error("❌ Failed to load company internships:", err);
      console.error("Error details:", err.response);

      // Handle different error types
      if (err.response?.status === 403) {
        console.log("🔒 Company not approved - internships not visible");
        setInternships([]);
        setError("This company is pending approval. Internships are not visible yet.");
      } else if (err.response?.status === 404) {
        console.log("📭 No internships found (404)");
        setInternships([]);
        // Don't show error for 404, just show empty state
      } else {
        console.log("⚠️ Server error loading internships");
        setInternships([]);
        setError("Failed to load company internships. Please try again.");
      }
    } finally {
      setInternshipsLoading(false);
    }
  };

  // Fetch student's applications
  const fetchMyApplications = async () => {
    try {
      console.log("🔍 Fetching student applications...");
      const res = await API.get("/application/my-applications");
      setMyApplications(res.data || []);
      console.log("✅ Applications loaded:", res.data?.length || 0);
    } catch (err) {
      console.error("❌ Failed to fetch applications:", err);
    }
  };

  // Check if student is following this company
  const checkFollowStatus = async () => {
    try {
      const res = await API.get(`/follow/is-following/${companyId}`);
      setIsFollowing(res.data.isFollowing);
      console.log("👥 Follow status:", res.data.isFollowing);
    } catch (err) {
      console.error("❌ Failed to check follow status:", err);
    }
  };

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!user) {
      alert("Please login to follow companies");
      return;
    }

    if (user.role !== "student") {
      alert("Only students can follow companies");
      return;
    }

    if (!company?.approved) {
      alert("You can only follow approved companies");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await API.delete(`/follow/unfollow/${companyId}`);
        setIsFollowing(false);
        alert("Unfollowed company successfully");
      } else {
        await API.post("/follow/follow", { companyId });
        setIsFollowing(true);
        alert("Following company! You'll see their new internships first.");
      }
    } catch (err) {
      console.error("❌ Follow action failed:", err);
      alert("Failed to follow/unfollow company");
    } finally {
      setFollowLoading(false);
    }
  };

  // Check if student has applied to an internship
  const hasApplied = (internshipId) => {
    return myApplications.some(
      (app) => app.internship?._id === internshipId || app.internship === internshipId
    );
  };

  // Get application status for an internship
  const getApplicationStatus = (internshipId) => {
    const application = myApplications.find(
      (app) => app.internship?._id === internshipId || app.internship === internshipId
    );
    return application?.status || null;
  };

  // Handle application submission
  const handleApplyClick = async (internship) => {
    if (!user) {
      alert("Please login to apply for internships");
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      alert("Only students can apply for internships");
      return;
    }

    if (!company?.approved) {
      alert("This company is not yet approved. You cannot apply to internships from unapproved companies.");
      return;
    }

    if (hasApplied(internship._id)) {
      alert("You have already applied to this internship");
      return;
    }

    setApplyingInternships({ ...applyingInternships, [internship._id]: true });

    try {
      console.log("📝 Submitting application for internship:", internship._id);
      
      const response = await API.post("/application", {
        internshipId: internship._id,
      });

      console.log("✅ Application submitted successfully:", response.data);
      alert("Application submitted successfully! The company will review your application.");
      
      // Refresh applications list
      await fetchMyApplications();
    } catch (err) {
      console.error("❌ Failed to apply:", err);
      const errorMessage = err.response?.data?.message || "Failed to submit application";
      alert(errorMessage);
    } finally {
      setApplyingInternships({ ...applyingInternships, [internship._id]: false });
    }
  };

  // Format location names
  const getLocationName = (location) => {
    const locations = {
      kigali: "Kigali",
      eastern: "Eastern Province",
      western: "Western Province",
      northern: "Northern Province",
      southern: "Southern Province",
    };
    return locations[location?.toLowerCase()] || location;
  };

  // Check if user can view internships
  const canViewInternships = () => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'company' && user.id === company?.createdBy?._id) return true;
    return company?.approved === true;
  };

  // Get button content based on application status
  const getApplyButtonContent = (internship) => {
    const internshipId = internship._id;
    const applying = applyingInternships[internshipId];
    const applied = hasApplied(internshipId);
    const status = getApplicationStatus(internshipId);

    if (applying) {
      return {
        text: "Applying...",
        icon: "fa-spinner fa-spin",
        disabled: true,
        className: "btn-primary"
      };
    }

    if (applied) {
      if (status === "accepted") {
        return {
          text: "✓ Accepted",
          icon: "fa-check-circle",
          disabled: true,
          className: "btn-success"
        };
      } else if (status === "rejected") {
        return {
          text: "✗ Rejected",
          icon: "fa-times-circle",
          disabled: true,
          className: "btn-danger"
        };
      } else {
        return {
          text: "⏳ Pending Review",
          icon: "fa-clock",
          disabled: true,
          className: "btn-warning"
        };
      }
    }

    return {
      text: "Apply Now",
      icon: "fa-paper-plane",
      disabled: false,
      className: "btn-primary"
    };
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <div className="container text-center p-5">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p style={{ marginTop: "1rem", fontSize: "1.1rem", color: "#6366f1" }}>
              Loading Company Profile...
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Company not found state
  if (!company) {
    return (
      <>
        <Navbar user={user} />
        <div className="container text-center p-5">
          <div className="empty-state">
            <i className="fas fa-exclamation-triangle fa-3x" style={{ color: "#ff6b6b" }}></i>
            <h3 style={{ marginTop: "1rem" }}>Company Not Found</h3>
            <p>The company profile you're looking for doesn't exist.</p>
            <Link to="/" className="btn btn-primary">
              <i className="fas fa-home"></i> Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Main render
  return (
    <>
      <Navbar user={user} />

      {/* Hero Section - Company Header */}
      <section className="hero">
        <div className="container">
          <div className="company-profile-header">
            <div className="company-title-section">
              <h2>
                <i className="fas fa-building"></i> {company.name}
              </h2>
              <div className="company-approval-status">
                <span className={`status-badge ${company.approved ? 'approved' : 'pending'}`}>
                  {company.approved ? '✓ Approved Company' : '⏳ Pending Approval'}
                </span>
              </div>
            </div>

            <p className="company-tagline">
              {company.description || "Innovative company offering exciting internship opportunities."}
            </p>

            <div className="company-action-buttons">
              {user?.role === "student" && (
                <button
                  className={`btn ${isFollowing ? "btn-outline" : "btn-primary"}`}
                  onClick={handleFollow}
                  disabled={followLoading || !company.approved}
                >
                  <i className={`fas ${isFollowing ? "fa-check" : "fa-plus"}`}></i>
                  {followLoading
                    ? "Loading..."
                    : !company.approved
                    ? "Company Not Approved"
                    : isFollowing
                    ? "Following"
                    : "Follow Company"}
                </button>
              )}

              <Link to="/" className="btn btn-outline">
                <i className="fas fa-arrow-left"></i> Back to Companies
              </Link>
            </div>

            {!company.approved && (
              <div className="approval-notice">
                <i className="fas fa-info-circle"></i>
                <p>
                  This company is pending approval. Students cannot view or apply to internships until the company is approved by administration.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Company Details Section */}
      <section className="companies-section">
        <div className="container">
          {/* Tab Navigation */}
          <div className="company-tabs">
            <button
              className={`tab-button ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              <i className="fas fa-info-circle"></i> Details
            </button>
            <button
              className={`tab-button ${activeTab === "pictures" ? "active" : ""}`}
              onClick={() => setActiveTab("pictures")}
            >
              <i className="fas fa-images"></i> Pictures
            </button>
          </div>

          {activeTab === "details" && (
            <>
              <h2 className="section-title">
                <i className="fas fa-info-circle"></i> Company Information
              </h2>
              <div className="company-card">
                <div className="company-body">
                  <div className="company-details-grid">
                    <div className="detail-item">
                      <i className="fas fa-envelope"></i>
                      <div>
                        <strong>Email</strong>
                        <span>{company.email}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <i className="fas fa-phone"></i>
                      <div>
                        <strong>Phone</strong>
                        <span>{company.phone || "Not provided"}</span>
                      </div>
                    </div>

                    {company.whatsappNumber && (
                      <div className="detail-item">
                        <i className="fab fa-whatsapp"></i>
                        <div>
                          <strong>WhatsApp</strong>
                          <a
                            href={`https://wa.me/${company.whatsappNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-link"
                          >
                            Chat on WhatsApp
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="detail-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <div>
                        <strong>Location</strong>
                        <span>{getLocationName(company.location)}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <i className="fas fa-check-circle"></i>
                      <div>
                        <strong>Status</strong>
                        <span className={`status-text ${company.approved ? 'approved' : 'pending'}`}>
                          {company.approved ? 'Verified & Approved' : 'Pending Approval'}
                        </span>
                      </div>
                    </div>

                    {company.website && (
                      <div className="detail-item">
                        <i className="fas fa-globe"></i>
                        <div>
                          <strong>Website</strong>
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="company-website-link"
                          >
                            {company.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {company.trainings && company.trainings.length > 0 && (
                    <div className="company-trainings">
                      <h4><i className="fas fa-graduation-cap"></i> Training Fields</h4>
                      <div className="training-tags">
                        {company.trainings.map((training, index) => (
                          <span key={index} className="training-tag">
                            {training}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Internships Section */}
              <h2 className="section-title" style={{ marginTop: "3rem" }}>
                <i className="fas fa-briefcase"></i> Available Internships
                {canViewInternships() ? (
                  <span className="internship-count"> ({internships.length})</span>
                ) : (
                  <span className="approval-warning"> - Restricted</span>
                )}
              </h2>

              {/* Debug Panel for Admin */}
              {user?.role === 'admin' && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
                  padding: '15px',
                  marginBottom: '20px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  border: '2px solid #6366f1'
                }}>
                  <strong style={{ color: '#4338ca' }}>🔧 Debug Info (Admin Only):</strong>
                  <div style={{ marginTop: '10px', display: 'grid', gap: '5px' }}>
                    <div>✓ Company ID: <code>{companyId}</code></div>
                    <div>✓ Company Approved: <strong>{company.approved ? '✅ Yes' : '❌ No'}</strong></div>
                    <div>✓ Can View Internships: <strong>{canViewInternships() ? '✅ Yes' : '❌ No'}</strong></div>
                    <div>✓ Internships Count: <strong>{internships.length}</strong></div>
                    <div>✓ Loading State: {internshipsLoading ? '⏳ Loading...' : '✅ Loaded'}</div>
                    <div>✓ Error: {error || '✅ None'}</div>
                    <div>✓ API Endpoint: <code>/internship/company/{companyId}</code></div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && !internshipsLoading && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{error}</p>
                  <button onClick={fetchCompanyInternships} className="btn btn-outline btn-sm">
                    <i className="fas fa-redo"></i> Retry Loading
                  </button>
                </div>
              )}

              {/* Restricted Access for Unapproved Companies */}
              {!canViewInternships() ? (
                <div className="empty-state">
                  <div className="restricted-access">
                    <i className="fas fa-lock fa-3x"></i>
                    <h4>Internships Not Available</h4>
                    <p>This company is pending approval. Internships will be visible once the company is approved by administration.</p>
                  </div>
                </div>
              ) : internshipsLoading ? (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin fa-2x"></i>
                  <p style={{ marginTop: "1rem" }}>Loading Internships...</p>
                </div>
              ) : internships.length > 0 ? (
                <div className="companies-grid">
                  {internships.map((internship) => {
                    const buttonContent = user?.role === "student" ? getApplyButtonContent(internship) : null;

                    return (
                      <div key={internship._id} className="company-card internship-card">
                        <div className="company-header">
                          <h3>{internship.title}</h3>
                          <div className="company-location">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{getLocationName(internship.location)}</span>
                          </div>
                        </div>

                        <div className="company-body">
                          <div className="internship-details">
                            <div className="detail-row">
                              <i className="fas fa-building"></i>
                              <div>
                                <strong>Department</strong>
                                <span>{internship.department}</span>
                              </div>
                            </div>

                            <div className="detail-row">
                              <i className="fas fa-clock"></i>
                              <div>
                                <strong>Duration</strong>
                                <span>{internship.duration}</span>
                              </div>
                            </div>

                            <div className="detail-row">
                              <i className="fas fa-money-bill-wave"></i>
                              <div>
                                <strong>Stipend</strong>
                                <span>{internship.price || "Not specified"}</span>
                              </div>
                            </div>

                            <div className="detail-row">
                              <i className="fas fa-envelope"></i>
                              <div>
                                <strong>Contact</strong>
                                <span>{internship.contactEmail}</span>
                              </div>
                            </div>

                            <div className="detail-row">
                              <i className="fas fa-calendar-alt"></i>
                              <div>
                                <strong>Posted</strong>
                                <span>{new Date(internship.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {internship.description && (
                            <div className="internship-description">
                              <h4><i className="fas fa-align-left"></i> Description</h4>
                              <p>{internship.description}</p>
                            </div>
                          )}

                          {internship.requirements && (
                            <div className="internship-requirements">
                              <h4><i className="fas fa-list-check"></i> Requirements</h4>
                              <p>{internship.requirements}</p>
                            </div>
                          )}

                          {/* Application Button */}
                          <div className="internship-actions">
                            {user?.role === "student" ? (
                              company.approved ? (
                                <button
                                  className={`btn ${buttonContent.className} btn-block`}
                                  onClick={() => handleApplyClick(internship)}
                                  disabled={buttonContent.disabled}
                                >
                                  <i className={`fas ${buttonContent.icon}`}></i>
                                  {buttonContent.text}
                                </button>
                              ) : (
                                <div className="application-restricted">
                                  <button className="btn btn-outline btn-block" disabled>
                                    <i className="fas fa-lock"></i> Company Pending Approval
                                  </button>
                                  <p className="restriction-note">
                                    Applications will be available once the company is approved
                                  </p>
                                </div>
                              )
                            ) : !user ? (
                              <Link to="/login" className="btn btn-primary btn-block">
                                <i className="fas fa-sign-in-alt"></i> Login to Apply
                              </Link>
                            ) : (
                              <button className="btn btn-outline btn-block" disabled>
                                <i className="fas fa-eye"></i>
                                {user.role === "company" ? "Your Internship" : "View Only"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-briefcase fa-3x"></i>
                  <h3>No Internships Posted Yet</h3>
                  <p>
                    {user?.role === 'company' && user.id === company.createdBy?._id
                      ? "You haven't posted any internships yet. Create your first internship to attract talented students!"
                      : "This company hasn't posted any internships currently. Please check back later or explore other companies."}
                  </p>
                  {user?.role === 'company' && user.id === company.createdBy?._id && (
                    <Link to="/company-dashboard" className="btn btn-primary">
                      <i className="fas fa-plus"></i> Post Your First Internship
                    </Link>
                  )}
                  {user?.role === 'student' && (
                    <Link to="/" className="btn btn-primary">
                      <i className="fas fa-search"></i> Browse Other Companies
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "pictures" && (
            <>
              <h2 className="section-title">
                <i className="fas fa-images"></i> Company Pictures
              </h2>
              <div className="company-card">
                <div className="company-body">
                  {company.pictures && company.pictures.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {company.pictures.map((pic) => (
                        <div key={pic._id || pic.url} style={{
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'transform 0.2s',
                          cursor: 'pointer'
                        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                          <div style={{
                            width: '100%',
                            height: '220px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5'
                          }}>
                            {pic.url ? (
                              <img src={pic.url} alt={pic.description || 'company picture'} style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }} />
                            ) : (
                              <div style={{ color: '#999', fontSize: '14px' }}>No image</div>
                            )}
                          </div>
                          <div style={{ padding: '16px' }}>
                            {pic.description && (
                              <p style={{
                                margin: '0 0 8px 0',
                                fontSize: '14px',
                                color: '#555',
                                fontWeight: '500'
                              }}>
                                {pic.description}
                              </p>
                            )}
                            <div style={{
                              fontSize: '12px',
                              color: '#999',
                              marginTop: '8px'
                            }}>
                              <i className="fas fa-calendar"></i> {new Date(pic.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-images fa-3x"></i>
                      <h3>No Pictures Yet</h3>
                      <p>This company hasn't uploaded any pictures yet. Check back later to see photos of their work environment and team!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CompanyProfile;
