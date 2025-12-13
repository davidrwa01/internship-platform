// src/components/ApplyInternship.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import API from "../services/api";
import './Home.css';

const ApplyInternship = ({ user }) => {
  const { internshipId } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInternshipDetails();
  }, [internshipId]);

  const fetchInternshipDetails = async () => {
    try {
      const res = await API.get(`/internship/${internshipId}`);
      setInternship(res.data);
    } catch (err) {
      console.error("Failed to fetch internship:", err);
      setError("Failed to load internship details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || user.role !== "student") {
      alert("Please login as a student to apply for internships");
      navigate("/login");
      return;
    }

    setApplying(true);
    try {
      const res = await API.post("/application", { 
        internshipId: internshipId 
      });
      
      alert("Application submitted successfully!");
      navigate("/student-dashboard");
    } catch (err) {
      console.error("Application error:", err);
      const message = err.response?.data?.message || "Failed to apply for internship";
      alert(message);
    } finally {
      setApplying(false);
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
          <div className="loading-spinner">Loading internship details...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !internship) {
    return (
      <>
        <Navbar user={user} />
        <div className="container text-center p-5">
          <h3>Internship Not Found</h3>
          <p>{error || "The internship you're looking for doesn't exist."}</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
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
          <h2>Apply for Internship</h2>
          <p>Submit your application for this internship opportunity</p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <div className="apply-internship-card">
            <div className="internship-header">
              <h2>{internship.title}</h2>
              <div className="company-info">
                <h3>
                  <Link to={`/company/${internship.company?._id}`}>
                    {internship.company?.name}
                  </Link>
                </h3>
                <div className="company-location">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{getLocationName(internship.company?.location)}</span>
                </div>
              </div>
            </div>

            <div className="internship-details-grid">
              <div className="detail-item">
                <strong>Department:</strong>
                <span>{internship.department}</span>
              </div>
              <div className="detail-item">
                <strong>Location:</strong>
                <span>{getLocationName(internship.location)}</span>
              </div>
              <div className="detail-item">
                <strong>Duration:</strong>
                <span>{internship.duration}</span>
              </div>
              <div className="detail-item">
                <strong>Stipend:</strong>
                <span>{internship.price || "Not specified"}</span>
              </div>
              <div className="detail-item">
                <strong>Contact Email:</strong>
                <span>{internship.contactEmail}</span>
              </div>
              {internship.contactPhone && (
                <div className="detail-item">
                  <strong>Contact Phone:</strong>
                  <span>{internship.contactPhone}</span>
                </div>
              )}
            </div>

            {internship.description && (
              <div className="description-section">
                <h4>Description</h4>
                <p>{internship.description}</p>
              </div>
            )}

            {internship.requirements && (
              <div className="requirements-section">
                <h4>Requirements</h4>
                <p>{internship.requirements}</p>
              </div>
            )}

            <div className="application-actions">
              <Link to="/" className="btn btn-outline">
                Back to Internships
              </Link>
              <button 
                className="btn btn-primary" 
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? "Applying..." : "Submit Application"}
              </button>
            </div>

            <div className="application-note">
              <p>
                <i className="fas fa-info-circle"></i>
                By applying, you agree to share your profile information with the company.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default ApplyInternship;