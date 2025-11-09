// src/pages/CompanyProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const CompanyProfile = ({ user }) => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company details
      const companyRes = await API.get(`/company/${companyId}`);
      setCompany(companyRes.data);

      // Fetch company's internships
      const internshipsRes = await API.get(`/internship/company/${companyId}`);
      setInternships(internshipsRes.data || []);
    } catch (err) {
      console.error("Failed to load company data:", err);
      alert("Failed to load company profile");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <div className="container text-center p-5">
          <div className="loading-spinner">Loading...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Navbar user={user} />
        <div className="container text-center p-5">
          <h3>Company not found</h3>
          <p>The company profile you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar user={user} />
      
      <section className="hero">
        <div className="container">
          <h2>{company.name}</h2>
          <p>{company.description || "No description available."}</p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          {/* Company Details */}
          <h2 className="section-title">Company Details</h2>
          <div className="company-card">
            <div className="company-body">
              <div className="company-details-grid">
                <div className="detail-item">
                  <strong>Email:</strong> {company.email}
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong> {company.phone}
                </div>
                <div className="detail-item">
                  <strong>Location:</strong> {getLocationName(company.location)}
                </div>
                {company.website && (
                  <div className="detail-item">
                    <strong>Website:</strong> {company.website}
                  </div>
                )}
                {company.experience && (
                  <div className="detail-item">
                    <strong>Experience:</strong> {company.experience}
                  </div>
                )}
              </div>
              
              {company.trainings && company.trainings.length > 0 && (
                <div className="company-trainings">
                  <strong>Training Fields:</strong>
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

          {/* Internships Offered */}
          <h2 className="section-title">Internships Offered</h2>
          <div className="companies-grid">
            {internships.length > 0 ? (
              internships.map((internship) => (
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
                      <p><strong>Department:</strong> {internship.department}</p>
                      <p><strong>Duration:</strong> {internship.duration}</p>
                      <p><strong>Stipend:</strong> {internship.price || "Not specified"}</p>
                      <p><strong>Contact:</strong> {internship.contactEmail}</p>
                    </div>
                    
                    {internship.description && (
                      <p className="internship-description">{internship.description}</p>
                    )}
                    
                    {user?.role === "student" ? (
                      <button className="btn btn-primary">Apply Now</button>
                    ) : !user ? (
                      <button 
                        className="btn btn-outline"
                        onClick={() => alert("Please login as a student to apply")}
                      >
                        Login to Apply
                      </button>
                    ) : (
                      <button className="btn btn-outline" disabled>
                        {user.role === "company" ? "Your Internship" : "View Only"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No internships currently available from this company.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default CompanyProfile;