import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import ApplyInternshipModal from "../components/ApplyInternshipModal";
import API from "../services/api";
import "./Home.css";
import { useNavigate } from "react-router-dom";

const Home = ({ user, handleLogout, setUser }) => {
  const [companies, setCompanies] = useState([]);
  const [internships, setInternships] = useState([]);
  const [appliedInternshipIds, setAppliedInternshipIds] = useState(new Set());
  const [locationFilter, setLocationFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("companies");
  const [notesCount, setNotesCount] = useState(0);
  const navigate = useNavigate();

  
  // ✅ Fetch companies & internships - UPDATED: Only approved companies
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch only approved companies
        const companiesRes = await API.get("/company");
        console.log("All companies response:", companiesRes.data);
        
        // Filter to show only approved companies to students and non-logged in users
        const allCompanies = Array.isArray(companiesRes.data) ? companiesRes.data : [];
        const approvedCompanies = allCompanies.filter(company => 
          company.approved === true
        );
        
        console.log("Approved companies:", approvedCompanies);
        setCompanies(approvedCompanies);

        // Fetch internships
        const internshipsRes = await API.get("/internship");
        console.log("All internships response:", internshipsRes.data);
        
        const allInternships = Array.isArray(internshipsRes.data.data) ? internshipsRes.data.data : [];
        console.log("Raw internships data:", allInternships);

        // Filter internships: only show internships from approved companies
        const approvedInternships = allInternships.filter(internship => {
          console.log("Checking internship:", internship.title, "with company:", internship.company);
          // If internship has company data, check if company is approved
          if (internship.company && internship.company.approved !== undefined) {
            console.log("Company approved flag:", internship.company.approved);
            return internship.company.approved === true;
          }
          
          // If no company data, try to find the company in our approved companies list
          const relatedCompany = approvedCompanies.find(comp => 
            comp._id === internship.company?._id || comp._id === internship.company
          );
          console.log("Found related company:", relatedCompany ? relatedCompany.name : "None");
          return relatedCompany !== undefined;
        });
        
        console.log("Approved internships:", approvedInternships);

        // Added: filter out internships already applied for by logged-in student
        let filteredInternships = approvedInternships;
        if (user?.role === "student") {
          filteredInternships = approvedInternships.filter(
            (internship) => !appliedInternshipIds.has(internship._id)
          );
        }

        setInternships(filteredInternships);
        // Fetch notes count for homepage tab
        try {
          const notesRes = await API.get('/notes');
          setNotesCount(notesRes.data.total || (notesRes.data.notes || []).length || 0);
        } catch (e) {
          console.warn('Failed to fetch notes count', e);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        alert("Failed to load data. Please check if the server is running.");
        setCompanies([]);
        setInternships([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, appliedInternshipIds]);

  // ✅ Apply modal logic
  const handleApplyClick = (internship) => {
    if (!user) {
      alert("Please login to apply for internships");
      return;
    }
    if (user.role !== "student") {
      alert("Only students can apply for internships");
      return;
    }
    
    // Additional check: ensure internship is from approved company
    const internshipCompany = companies.find(comp => 
      comp._id === internship.company?._id || comp._id === internship.company
    );
    
    if (!internshipCompany || !internshipCompany.approved) {
      alert("This internship is not available for application at the moment.");
      return;
    }
    
    setSelectedInternship(internship);
    setShowApplyModal(true);
  };

  // Fetch applied internships of logged-in student
  useEffect(() => {
    const fetchApplications = async () => {
      if (user?.role === "student") {
        try {
          const res = await API.get("/application/my-applications");
          if (Array.isArray(res.data)) {
            const appliedIds = new Set(res.data.map(app => app.internship._id));
            setAppliedInternshipIds(appliedIds);
          }
        } catch (error) {
          console.error("Failed to fetch applied internships:", error);
        }
      }
    };
    fetchApplications();
  }, [user]);

  const handleApplicationSuccess = (application) => {
    console.log("Application successful:", application);
    setShowApplyModal(false);
    setSelectedInternship(null);
  };

  // Helper
  const getLocationName = (val) => {
    const locations = {
      kigali: "Kigali",
      eastern: "Eastern Province",
      western: "Western Province",
      northern: "Northern Province",
      southern: "Southern Province",
    };
    return locations[val] || val;
  };

  // Filters - UPDATED: Only show approved companies and their internships
  const filteredCompanies = companies.filter((company) => {
    // Always filter out unapproved companies (should already be filtered, but double-check)
    if (company.approved !== true) return false;
    
    const byLocation =
      locationFilter === "all" || company.location === locationFilter;
    const byDepartment =
      departmentFilter === "all" ||
      company.trainings?.some((t) =>
        t.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    return byLocation && byDepartment;
  });

  console.log("Fetched internships data:", internships);
  console.log("Current Filters - Location:", locationFilter, "Department:", departmentFilter);
  const filteredInternships = internships.filter((internship) => {
    const internshipLocation = internship.location ? internship.location.toLowerCase().trim() : "";
    const internshipDepartment = internship.department ? internship.department.toLowerCase().trim() : "";
    const filterLocation = locationFilter.toLowerCase().trim();
    const filterDepartment = departmentFilter.toLowerCase().trim();

    const byLocation =
      filterLocation === "all" || internshipLocation === filterLocation;
    const byDepartment =
      filterDepartment === "all" || internshipDepartment === filterDepartment;
    return byLocation && byDepartment;
  });
  console.log("Filtered internships count:", filteredInternships.length);

  const uniqueDepartments = [
    ...new Set([
      ...companies.flatMap((c) => c.trainings || []),
      ...internships.map((i) => i.department).filter(Boolean),
    ]),
  ];

  // Function to check if user can view company details
  const canViewCompanyDetails = (company) => {
    if (!company.approved) return false;
    
    // Admin can see all companies
    if (user?.role === "admin") return true;
    
    // Company users can see their own company even if not approved (for editing)
    if (user?.role === "company" && user.id === company.createdBy?._id) return true;
    
    // Students and non-logged in users can only see approved companies
    return company.approved === true;
  };

  return (
    <>
      <Navbar
        user={user}
        handleLogout={handleLogout}
        setShowModal={setShowModal}
        setUser={setUser}
      />

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h2>Connecting TVET Students with Internship Opportunities</h2>
          <p>
            Find the perfect internship placement to kickstart your career in
            Rwanda
          </p>

          {user ? (
            <Link
              to={
                user.role === "student"
                  ? "/student-dashboard"
                  : user.role === "company"
                  ? "/company-dashboard"
                  : "/admin-dashboard"
              }
              className="btn btn-primary"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-outline">
                Register
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <section className="tab-section">
        <div className="container">
          <div className="tab-container">
            <button
              className={`tab-btn ${
                activeTab === "companies" ? "active" : ""
              }`}
              onClick={() => setActiveTab("companies")}
            >
              <i className="fas fa-building"></i> Companies (
              {filteredCompanies.length})
            </button>
            <button
              className={`tab-btn ${
                activeTab === "internships" ? "active" : ""
              }`}
              onClick={() => setActiveTab("internships")}
            >
              <i className="fas fa-briefcase"></i> Internships (
              {filteredInternships.length})
            </button>
            <Link
              to="/notes"
              className={`tab-btn notes-tab ${activeTab === "notes" ? "active" : ""}`}
              onClick={() => setActiveTab("notes")}
            >
              <i className="fas fa-file-alt"></i> Notes ({notesCount})
            </Link>
          </div>
        </div>
      </section>
      {/* Filters */}
      <section className="filter-section">
        <div className="container">
          <div className="filter-container">
            <div className="filter-group">
              <label>Filter by Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="all">All Locations</option>
                <option value="kigali">Kigali</option>
                <option value="eastern">Eastern Province</option>
                <option value="western">Western Province</option>
                <option value="northern">Northern Province</option>
                <option value="southern">Southern Province</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Filter by Field</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Fields</option>
                {uniqueDepartments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Companies */}
      {activeTab === "companies" && (
        <section className="companies-section">
          <div className="container">
            <h2 className="section-title">Available Internship Companies</h2>
            {loading ? (
              <div className="loading-skeleton">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="company-card skeleton" />
                ))}
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="companies-grid">
                {filteredCompanies.map((company) => (
                  <div key={company._id} className="company-card">
                    <div className="company-header">
                      {/* Show approval status badge for admin */}
                      {user?.role === "admin" && (
                        <div className="company-status-badge">
                          <span className={`status-badge ${company.approved ? 'approved' : 'pending'}`}>
                            {company.approved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </div>
                      )}
                      
                      {/* ✅ Updated: clickable company name - only if approved or admin/owner */}
                      <h3>
                        {canViewCompanyDetails(company) ? (
                          <Link
                            to={`/company/${company._id}`}
                            style={{
                              color: "inherit",
                              textDecoration: "none",
                            }}
                          >
                            {company.name}
                          </Link>
                        ) : (
                          <span style={{ opacity: company.approved ? 1 : 0.6 }}>
                            {company.name}
                            {!company.approved && " (Pending Approval)"}
                          </span>
                        )}
                      </h3>
                      <div className="company-location">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{getLocationName(company.location)}</span>
                      </div>
                    </div>
                    <div className="company-body">
                      {/* Training Fields */}
                      {company.trainings && company.trainings.length > 0 && (
                        <div className="company-trainings">
                          <div className="training-tags">
                            {company.trainings.slice(0, 3).map((training, i) => (
                              <span key={i} className="training-tag">
                                {training}
                              </span>
                            ))}
                            {company.trainings.length > 3 && (
                              <span className="training-tag more-tag">
                                +{company.trainings.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Company Description */}
                      <p className="company-description">
                        {company.description 
                          ? (company.description.length > 120 
                              ? `${company.description.substring(0, 120)}...` 
                              : company.description)
                          : "No description available."}
                      </p>

                      {/* Contact Info */}
                      <div className="company-contact-info">
                        <div className="contact-item">
                          <i className="fas fa-envelope"></i>
                          <span>{company.email}</span>
                        </div>
                        {company.phone && (
                          <div className="contact-item">
                            <i className="fas fa-phone"></i>
                            <span>{company.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="company-actions">
                        {user?.role === "student" ? (
                          canViewCompanyDetails(company) ? (
                            <Link
                              to={`/company/${company._id}`}
                              className="btn btn-primary btn-block"
                            >
                              <i className="fas fa-briefcase"></i> View Internships
                            </Link>
                          ) : (
                            <button className="btn btn-outline btn-block" disabled>
                              <i className="fas fa-lock"></i> Company Pending Approval
                            </button>
                          )
                        ) : user?.role === "company" ? (
                          user.id === company.createdBy?._id ? (
                            <Link to="/company-dashboard" className="btn btn-outline btn-block">
                              <i className="fas fa-cog"></i> Manage Your Company
                            </Link>
                          ) : (
                            <button className="btn btn-outline btn-block" disabled>
                              <i className="fas fa-building"></i> Another Company
                            </button>
                          )
                        ) : user?.role === "admin" ? (
                          <Link to="/admin-dashboard" className="btn btn-outline btn-block">
                            <i className="fas fa-user-shield"></i> Manage in Admin
                          </Link>
                        ) : (
                          <Link to="/login" className="btn btn-primary btn-block">
                            <i className="fas fa-sign-in-alt"></i> Login to View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-building fa-3x"></i>
                <p>No companies match your filters.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setLocationFilter("all");
                    setDepartmentFilter("all");
                  }}
                >
                  <i className="fas fa-redo"></i> Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Internships */}
      {activeTab === "internships" && (
        <section className="companies-section">
          <div className="container">
            <h2 className="section-title">Available Internships</h2>
            {loading ? (
              <div className="loading-skeleton">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="company-card skeleton" />
                ))}
              </div>
            ) : filteredInternships.length > 0 ? (
              <div className="companies-grid">
                {filteredInternships.map((internship) => {
                  const internshipCompany = companies.find(comp => 
                    comp._id === internship.company?._id || comp._id === internship.company
                  );
                  
                  const isApprovedCompany = internshipCompany && internshipCompany.approved;
                  
                  return (
                    <div key={internship._id} className="company-card">
                      <div className="company-header">
                        {/* Show company approval status for admin */}
                        {user?.role === "admin" && internshipCompany && (
                          <div className="company-status-badge">
                            <span className={`status-badge ${isApprovedCompany ? 'approved' : 'pending'}`}>
                              Company: {isApprovedCompany ? '✓ Approved' : '⏳ Pending'}
                            </span>
                          </div>
                        )}
                        
                        <h3>{internship.title}</h3>
                        <div className="company-location">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{getLocationName(internship.location)}</span>
                        </div>
                      </div>
                      <div className="company-body">
                        <div className="internship-details">
                          <p>
                            <strong>Company:</strong>{" "}
                            {internship.company?.name || "Unknown"}
                            {!isApprovedCompany && user?.role === "admin" && " (Pending)"}
                          </p>
                          <p>
                            <strong>Department:</strong> {internship.department}
                          </p>
                          <p>
                            <strong>Duration:</strong> {internship.duration}
                          </p>
                          <p>
                            <strong>Stipend:</strong>{" "}
                            {internship.price || "Not specified"}
                          </p>
                        </div>

                        {internship.description && (
                          <p className="internship-description">
                            {internship.description.length > 150
                              ? `${internship.description.substring(0, 150)}...`
                              : internship.description}
                          </p>
                        )}

                        <div className="company-contact">
                          <div className="contact-info">
                            <div>
                              <i className="fas fa-envelope"></i>{" "}
                              {internship.contactEmail}
                            </div>
                            {internship.contactPhone && (
                              <div>
                                <i className="fas fa-phone"></i>{" "}
                                {internship.contactPhone}
                              </div>
                            )}
                          </div>

                          {user?.role === "student" ? (
                            isApprovedCompany ? (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleApplyClick(internship)}
                              >
                                Apply Now
                              </button>
                            ) : (
                              <button className="btn btn-outline" disabled>
                                Company Pending Approval
                              </button>
                            )
                          ) : user?.role === "company" ? (
                            user.id === internship.company?.createdBy?._id ? (
                              <Link to="/company-dashboard" className="btn btn-outline">
                                Manage in Dashboard
                              </Link>
                            ) : (
                              <button className="btn btn-outline" disabled>
                                Another Company
                              </button>
                            )
                          ) : user?.role === "admin" ? (
                            <Link to="/admin-dashboard" className="btn btn-outline">
                              Manage in Admin
                            </Link>
                          ) : (
                            <Link to="/login" className="btn btn-primary">
                              Login to Apply
                            </Link>
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
                <p>No internships match your filters.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setLocationFilter("all");
                    setDepartmentFilter("all");
                  }}
                >
                  <i className="fas fa-redo"></i> Clear Filters
                </button>
              </div>
            )}
          </div>

        </section>
      )}

      {showApplyModal && selectedInternship && (
        <ApplyInternshipModal
          internship={selectedInternship}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedInternship(null);
          }}
          onApply={handleApplicationSuccess}
          user={user}
        />
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} />}
      <Footer />
    </>
  );
};

export default Home;