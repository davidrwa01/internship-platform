import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const ApplyInternshipModal = ({ internship, onClose, onApply, user }) => {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!user || user.role !== "student") {
      alert("Please login as a student to apply for internships");
      navigate("/login");
      onClose();
      return;
    }

    setApplying(true);
    setError("");
    try {
      const res = await API.post("/application", {
        internshipId: internship._id
      });

      alert("Application submitted successfully!");
      onApply && onApply(res.data);
      onClose();
    } catch (err) {
      console.error("Application error:", err);
      const message = err.response?.data?.message || "Failed to apply for internship";
      setError(message);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content apply-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Apply for Internship</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="internship-summary">
            <h4>{internship.title}</h4>
            <p><strong>Company:</strong> {internship.company?.name}</p>
            <p><strong>Department:</strong> {internship.department}</p>
            <p><strong>Location:</strong> {getLocationName(internship.location)}</p>
            <p><strong>Duration:</strong> {internship.duration}</p>
            <p><strong>Stipend:</strong> {internship.price || "Not specified"}</p>
          </div>

          {internship.description && (
            <div className="internship-description">
              <h5>Description</h5>
              <p>{internship.description}</p>
            </div>
          )}

          {internship.requirements && (
            <div className="internship-requirements">
              <h5>Requirements</h5>
              <p>{internship.requirements}</p>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="application-note">
            <p>
              <i className="fas fa-info-circle"></i>
              By applying, you agree to share your profile information with the company.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={applying}
          >
            {applying ? "Applying..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyInternshipModal;
