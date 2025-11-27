// src/pages/CompanyDashboard.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const CompanyDashboard = ({ user, handleLogout }) => {
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("internships"); // "internships" or "applications"

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
    if (activeTab === "internships") {
      fetchInternships();
    } else {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchInternships = async () => {
    try {
      const res = await API.get("/internship/mine");
      setInternships(res.data || []);
    } catch (err) {
      console.error("Failed to load internships:", err);
      alert("Failed to load internships");
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await API.get("/application/company");
      setApplications(res.data || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
      alert("Failed to load applications");
    }
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

      const res = await API.post("/internship", formData);
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
        duration: "",
      });
      setShowForm(false);
      alert("Internship added successfully!");
    } catch (err) {
      console.error("Failed to add internship:", err);
      const errorMessage =
        err.response?.data?.message ||
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
      setInternships(internships.filter((internship) => internship._id !== internshipId));
      alert("Internship deleted successfully!");
    } catch (err) {
      console.error("Failed to delete internship:", err);
      alert("Failed to delete internship");
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await API.put(`/application/${applicationId}/status`, { status });
      alert(`Application ${status} successfully!`);
      fetchApplications();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update application status");
    }
  };

  const viewStudentProfile = (student) => {
    alert(`Student Profile:
Name: ${student.fullName || "N/A"}
Email: ${student.email}
Phone: ${student.phone || "N/A"}
School: ${student.schoolName || "N/A"}
Location: ${student.studentLocation || "N/A"}`);
  };

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      <section className="hero">
        <div className="container">
          <h2>Company Dashboard</h2>
          <p>Manage your internship offers and student applicants.</p>
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
          </div>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          {activeTab === "internships" ? (
            <div>
              <div className="dashboard-header">
                <h2 className="section-title">Your Internship Offers</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
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
                        placeholder="Describe the internship role..."
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
                        placeholder="List any requirements..."
                        value={formData.requirements}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Adding..." : "Add Internship"}
                    </button>
                  </form>
                </div>
              )}

              {/* Internship List */}
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
                        <p><strong>Department:</strong> {internship.department}</p>
                        <p><strong>Duration:</strong> {internship.duration}</p>
                        <p><strong>Stipend:</strong> {internship.price || "Not specified"}</p>
                        <p><strong>Contact:</strong> {internship.contactEmail}</p>
                        {internship.contactPhone && <p><strong>Phone:</strong> {internship.contactPhone}</p>}

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
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                      Create Your First Internship
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="dashboard-header">
                <h2 className="section-title">Student Applications</h2>
                <button onClick={fetchApplications} className="btn btn-outline">
                  Refresh
                </button>
              </div>

              {applications.length > 0 ? (
                <div className="table-wrapper">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Internship</th>
                        <th>Applied On</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app._id}>
                          <td>
                            <strong>{app.student?.fullName || "N/A"}</strong>
                            <br />
                            <small>{app.student?.email}</small>
                            <br />
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => viewStudentProfile(app.student)}
                            >
                              View Profile
                            </button>
                          </td>
                          <td>
                            <strong>{app.internship?.title}</strong>
                            <br />
                            <small>{app.internship?.department}</small>
                          </td>
                          <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                app.status === "accepted"
                                  ? "approved"
                                  : app.status === "rejected"
                                  ? "rejected"
                                  : "pending"
                              }`}
                            >
                              {app.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {app.status === "pending" && (
                                <>
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleUpdateStatus(app._id, "accepted")}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleUpdateStatus(app._id, "rejected")}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => alert("Messaging feature coming soon")}
                              >
                                Message
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No applications received yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CompanyDashboard;
