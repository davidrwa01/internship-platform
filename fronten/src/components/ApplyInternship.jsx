// src/components/ApplyInternship.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./ApplyInternship.css";

const ApplyInternship = ({ internship, onClose, onApply }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleApply = async () => {
    if (!internship) return;
    
    setLoading(true);
    try {
      const res = await API.post("/application", { 
        internshipId: internship._id 
      });
      
      alert("Application submitted successfully!");
      if (onApply) onApply(res.data.application);
      if (onClose) onClose();
      
      // Redirect to student dashboard
      navigate("/student-dashboard");
    } catch (error) {
      console.error("Application error:", error);
      const message = error.response?.data?.message || "Failed to apply for internship";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!internship) return null;

  return (
    <div className="modal apply-modal" style={{ display: "flex" }}>
      <div className="modal-content">
        <span className="close-modal" onClick={onClose}>&times;</span>
        <h2 className="modal-title">Apply for Internship</h2>
        
        <div className="internship-details">
          <h3>{internship.title}</h3>
          <p><strong>Company:</strong> {internship.company?.name}</p>
          <p><strong>Department:</strong> {internship.department}</p>
          <p><strong>Location:</strong> {internship.location}</p>
          <p><strong>Duration:</strong> {internship.duration}</p>
          {internship.price && <p><strong>Stipend:</strong> {internship.price}</p>}
        </div>

        <div className="application-actions">
          <button 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleApply}
            disabled={loading}
          >
            {loading ? "Applying..." : "Confirm Application"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyInternship;