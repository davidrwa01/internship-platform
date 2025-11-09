// src/pages/CompanyDashboard.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const CompanyDashboard = ({ user, handleLogout }) => {
  const [internships, setInternships] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New internship form state
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    price: "",
    contactEmail: user?.email || "", // Pre-fill with company email
    contactPhone: user?.phone || "", // Pre-fill with company phone
    description: "",
    requirements: "",
    duration: ""
  });

  // Fetch company's internships
  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      console.log("Fetching internships...");
      const res = await API.get("/internship/mine");
      console.log("Internships response:", res.data);
      setInternships(res.data || []);
    } catch (err) {
      console.error("Failed to load internships:", err);
      console.error("Error details:", err.response?.data);
      alert("Failed to load internships. Please check console for details.");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddInternship = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Adding internship with data:", formData);
      
      // Validate required fields
      if (!formData.title.trim() || !formData.department.trim() || !formData.location.trim()) {
        alert("Please fill in all required fields (Title, Department, Location)");
        setLoading(false);
        return;
      }

      const res = await API.post("/internship", formData);
      console.log("Add internship response:", res.data);
      
      setInternships([...internships, res.data]);
      setFormData({
        title: "",
        department: "",
        location: "",
        price: "",
        contactEmail: user?.email || "",
        contactPhone: user?.phone || "",
        description: "",
        requirements: "",
        duration: ""
      });
      setShowForm(false);
      alert("Internship added successfully!");
    } catch (err) {
      console.error("Failed to add internship:", err);
      console.error("Error response:", err.response?.data);
      
      // Show detailed error message
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Failed to add internship. Check console for details.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInternship = async (internshipId) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) return;

    try {
      await API.delete(`/internship/${internshipId}`);
      setInternships(internships.filter(internship => internship._id !== internshipId));
      alert("Internship deleted successfully!");
    } catch (err) {
      console.error("Failed to delete internship:", err);
      alert("Failed to delete internship");
    }
  };

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />
      
      <section className="hero">
        <div className="container">
          <h2>Company Dashboard</h2>
          <p>Manage your internship offers and student applicants.</p>
          <p><small>Debug: User role: {user?.role}, Email: {user?.email}</small></p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <div className="dashboard-header">
            <h2 className="section-title">Your Internship Offers</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "+ Add New Internship"}
            </button>
          </div>

          {/* Add Internship Form */}
          {showForm && (
            <div className="company-card form-card">
              <h3>Add New Internship</h3>
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
                      <option value="ICT">ICT</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business">Business</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Construction">Construction</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Healthcare">Healthcare</option>
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
                    placeholder="List any requirements (skills, education, etc.)..."
                    value={formData.requirements}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Internship"}
                </button>
              </form>
            </div>
          )}

          {/* Internships List */}
          <div className="companies-grid">
            {internships.length > 0 ? (
              internships.map((internship) => (
                <div key={internship._id} className="company-card">
                  <div className="company-header">
                    <h3>{internship.title}</h3>
                    <div className="company-location">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{internship.location}</span>
                    </div>
                  </div>
                  
                  <div className="company-body">
                    <div className="internship-details">
                      <p><strong>Department:</strong> {internship.department}</p>
                      <p><strong>Duration:</strong> {internship.duration}</p>
                      <p><strong>Stipend:</strong> {internship.price || "Not specified"}</p>
                      <p><strong>Contact:</strong> {internship.contactEmail}</p>
                      {internship.contactPhone && (
                        <p><strong>Phone:</strong> {internship.contactPhone}</p>
                      )}
                    </div>
                    
                    {internship.description && (
                      <p className="internship-description">{internship.description}</p>
                    )}
                    
                    {internship.requirements && (
                      <div className="requirements">
                        <strong>Requirements:</strong>
                        <p>{internship.requirements}</p>
                      </div>
                    )}
                    
                    <div className="internship-footer">
                      <div className="applicants-count">
                        <i className="fas fa-users"></i>
                        <span>{internship.applicants?.length || 0} Applicants</span>
                      </div>
                      
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteInternship(internship._id)}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No internships posted yet.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Create Your First Internship
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default CompanyDashboard;