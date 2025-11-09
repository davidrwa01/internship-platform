// src/pages/StudentDashboard.jsx - Enhanced version
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const StudentDashboard = ({ user, handleLogout }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      console.log("Fetching applications for user:", user?.id);
      const res = await API.get("/application/mine");
      console.log("Applications response:", res.data);
      setApplications(res.data || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
      setError("Could not load your applications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
        return "Accepted ✅";
      case "rejected":
        return "Rejected ❌";
      default:
        return "Pending ⏳";
    }
  };

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      <section className="hero">
        <div className="container">
          <h2>Welcome back, {user?.fullName?.split(" ")[0] || "Student"}!</h2>
          <p>Track your internship applications and their current status.</p>
          <Link to="/" className="btn btn-primary">
            Browse More Internships
          </Link>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <div className="dashboard-header">
            <h2 className="section-title">My Applications ({applications.length})</h2>
            <button onClick={fetchApplications} className="btn btn-outline">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-skeleton">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell short"></div>
                  <div className="skeleton-cell short"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchApplications} className="btn btn-primary">
                Retry
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p>You haven't applied for any internships yet.</p>
              <Link to="/" className="btn btn-primary">
                Browse Internships
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Internship Position</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <strong>{app.internship?.company?.name || "N/A"}</strong>
                        <br />
                        <small>{app.internship?.company?.email || ""}</small>
                      </td>
                      <td>
                        <strong>{app.internship?.title || "N/A"}</strong>
                        <br />
                        <small>Dept: {app.internship?.department || "N/A"}</small>
                      </td>
                      <td>{app.internship?.company?.location || "N/A"}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(app.status)}`}
                        >
                          {getStatusText(app.status)}
                        </span>
                      </td>
                      <td>
                        {new Date(app.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default StudentDashboard;