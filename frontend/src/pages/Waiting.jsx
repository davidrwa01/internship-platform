import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Waiting.css";

const Waiting = ({ user, handleLogout }) => {
  const [company, setCompany] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanyStatus();
    fetchAdminInfo();
  }, []);

  const fetchCompanyStatus = async () => {
    try {
      const res = await API.get("/company/my-company");
      setCompany(res.data);
    } catch (err) {
      console.error("Failed to fetch company status:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminInfo = async () => {
    try {
      // Get admin users
      const res = await API.get("/admin/users");
      const admins = res.data.filter(u => u.role === "admin");
      if (admins.length > 0) {
        setAdminInfo(admins[0]); // Get first admin
      }
    } catch (err) {
      console.error("Failed to fetch admin info:", err);
    }
  };

  const handleMessageAdmin = () => {
    if (adminInfo?._id) {
      navigate(`/messages?user=${adminInfo._id}&userName=Admin`);
    } else {
      alert("Admin information not available");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <div className="loading">Loading...</div>
        <Footer />
      </>
    );
  }

  // If company is approved, redirect to company dashboard
  if (company?.approved) {
    navigate("/company-dashboard");
    return null;
  }

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      <section className="waiting-hero">
        <div className="container">
          <div className="waiting-content">
            <div className="waiting-icon">
              <i className="fas fa-clock"></i>
            </div>
            <h1>Awaiting Approval</h1>
            <p className="waiting-message">
              Your company registration is currently under review by our administration team. 
              You will be able to access all features once your account is approved.
            </p>

            <div className="waiting-info">
              <div className="info-card">
                <h3>Company Information</h3>
                <div className="info-details">
                  <p><strong>Company Name:</strong> {company?.name || "N/A"}</p>
                  <p><strong>Email:</strong> {company?.email || "N/A"}</p>
                  <p><strong>Status:</strong> 
                    <span className="status-pending">Pending Approval</span>
                  </p>
                  <p><strong>Registered:</strong> {company ? new Date(company.createdAt).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>

              {adminInfo && (
                <div className="info-card">
                  <h3>Administration Contact</h3>
                  <div className="info-details">
                    <p><strong>Admin:</strong> {adminInfo.fullName || "Platform Admin"}</p>
                    <p><strong>Email:</strong> {adminInfo.email}</p>
                    <p><strong>Role:</strong> Administrator</p>
                  </div>
                  
                  <div className="action-buttons">
                    <button 
                      className="btn btn-primary"
                      onClick={handleMessageAdmin}
                    >
                      <i className="fas fa-envelope"></i>
                      Message Admin
                    </button>
                    <Link to="/edit-company" className="btn btn-outline">
                      <i className="fas fa-edit"></i>
                      Edit Company Info
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="waiting-instructions">
              <h3>What to Expect</h3>
              <ul>
                <li>✓ Approval process typically takes 24-48 hours</li>
                <li>✓ You'll receive notification when approved</li>
                <li>✓ Once approved, you can post internships and manage applications</li>
                <li>✓ Contact admin if you have urgent questions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Waiting;