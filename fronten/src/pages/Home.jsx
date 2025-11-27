import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal from "../components/Modal";

import API from "../services/api";
import "./Home.css";

const Home = ({ user, handleLogout, setUser }) => {
  const [companies, setCompanies] = useState([]);
  const [internships, setInternships] = useState([]);
  const [locationFilter, setLocationFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("companies");

  // ✅ Fetch companies & internships
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const companiesRes = await API.get("/company");
        console.log("Companies response:", companiesRes.data);
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);

        const internshipsRes = await API.get("/internship");
        console.log("Internships response:", internshipsRes.data);
        const internshipsData = Array.isArray(internshipsRes.data)
          ? internshipsRes.data
          : [];
        setInternships(internshipsData);
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
  }, []);

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
    setSelectedInternship(internship);
    setShowApplyModal(true);
  };

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

  // Filters
  const filteredCompanies = companies.filter((company) => {
    const byLocation =
      locationFilter === "all" || company.location === locationFilter;
    const byDepartment =
      departmentFilter === "all" ||
      company.trainings?.some((t) =>
        t.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    return byLocation && byDepartment;
  });

  const filteredInternships = internships.filter((internship) => {
    const byLocation =
      locationFilter === "all" || internship.location === locationFilter;
    const byDepartment =
      departmentFilter === "all" || internship.department === departmentFilter;
    return byLocation && byDepartment;
  });

  const uniqueDepartments = [
    ...new Set([
      ...companies.flatMap((c) => c.trainings || []),
      ...internships.map((i) => i.department).filter(Boolean),
    ]),
  ];

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
                      {/* ✅ Updated: clickable company name */}
                      <h3>
                        <Link
                          to={`/company/${company._id}`}
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                          }}
                        >
                          {company.name}
                        </Link>
                      </h3>
                      <div className="company-location">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{getLocationName(company.location)}</span>
                      </div>
                    </div>
                    <div className="company-body">
                      <div className="company-trainings">
                        {company.trainings?.map((training, i) => (
                          <span key={i} className="training-tag">
                            {training}
                          </span>
                        ))}
                      </div>
                      <p>{company.description || "No description available."}</p>
                      <div className="company-contact">
                        <div className="contact-info">
                          <div>
                            <i className="fas fa-envelope"></i> {company.email}
                          </div>
                          <div>
                            <i className="fas fa-phone"></i> {company.phone}
                          </div>
                        </div>

                        {user?.role === "student" ? (
                          <Link
                            to={`/company/${company._id}`}
                            className="btn btn-outline"
                          >
                            View Internships
                          </Link>
                        ) : user?.role === "company" ? (
                          <button className="btn btn-outline" disabled>
                            Your Company
                          </button>
                        ) : user?.role === "admin" ? (
                          <button className="btn btn-outline" disabled>
                            Admin View
                          </button>
                        ) : (
                          <Link to="/login" className="btn btn-outline">
                            Login to View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No companies match your filters.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setLocationFilter("all");
                    setDepartmentFilter("all");
                  }}
                >
                  Clear Filters
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
                {filteredInternships.map((internship) => (
                  <div key={internship._id} className="company-card">
                    <div className="company-header">
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
                          <button
                            className="btn btn-primary"
                            onClick={() => handleApplyClick(internship)}
                          >
                            Apply Now
                          </button>
                        ) : user?.role === "company" ? (
                          <button className="btn btn-outline" disabled>
                            Your Internship
                          </button>
                        ) : user?.role === "admin" ? (
                          <button className="btn btn-outline" disabled>
                            Admin View
                          </button>
                        ) : (
                          <Link to="/login" className="btn btn-primary">
                            Login to Apply
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No internships match your filters.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setLocationFilter("all");
                    setDepartmentFilter("all");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {showApplyModal && selectedInternship && (
        <ApplyInternship
          internship={selectedInternship}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedInternship(null);
          }}
          onApply={handleApplicationSuccess}
        />
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} />}
      <Footer />
    </>
  );
};

export default Home;
  