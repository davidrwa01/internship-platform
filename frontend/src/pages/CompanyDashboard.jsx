import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApplicantList from "../components/ApplicantList";
import CompanyGallery from "../components/CompanyGallery";
import ImageUpload from "../components/ImageUpload";
import API from "../services/api";
import "./Home.css";

const CompanyDashboard = ({ user, handleLogout }) => {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("internships");
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingInternshipId, setEditingInternshipId] = useState(null);

  const [stats, setStats] = useState({
    totalInternships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  });

  const isApproved = company?.approved === true;

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    fetchCompanyData();
    fetchAdminUser();
  }, []);

  useEffect(() => {
    if (!isApproved) return;

    if (activeTab === "internships") fetchInternships();
    if (activeTab === "applications") fetchApplications();
  }, [activeTab, isApproved]);

  const fetchCompanyData = async () => {
    try {
      const res = await API.get("/company/my-company");
      setCompany(res.data);
    } catch (err) {
      console.error(err);
      alert("Company profile not found. Please contact admin.");
    }
  };

  const fetchAdminUser = async () => {
    try {
      const res = await API.get("/users");
      const admin = res.data?.find(u => u.role === "admin");
      setAdminUser(admin);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInternships = async () => {
    try {
      const res = await API.get("/internship/company/my/internships");
      setInternships(res.data?.data || []);
      setStats(s => ({ ...s, totalInternships: res.data?.data?.length || 0 }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await API.get("/application/company");
      setApplications(res.data || []);

      const pending = res.data.filter(a => a.status === "pending").length;
      const accepted = res.data.filter(a => a.status === "accepted").length;
      const rejected = res.data.filter(a => a.status === "rejected").length;

      setStats(s => ({
        ...s,
        totalApplications: res.data.length,
        pendingApplications: pending,
        acceptedApplications: accepted,
        rejectedApplications: rejected,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ACTION GUARDS ================= */

  const guardAction = () => {
    if (!isApproved) {
      alert("⏳ Your company is waiting for admin approval.");
      return false;
    }
    return true;
  };

  /* ================= ADMIN CONTACT ================= */

  const handleContactAdminClick = () => {
    if (!adminUser) return alert("Admin not found");
    navigate(`/messages?user=${adminUser._id}`);
  };

  /* ================= UI ================= */

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      <section className="hero">
        <div className="container">
          <h2>Company Dashboard</h2>

          {/* 🔴 APPROVAL BANNER */}
          {company && !isApproved && (
            <div className="company-status-banner pending">
              <h3>⏳ Waiting for Admin Approval</h3>
              <p>
                Your account was created successfully.  
                An admin must approve your company before you can:
              </p>
              <ul>
                <li>Post internships</li>
                <li>Receive applications</li>
                <li>Appear to students</li>
              </ul>

              <button className="btn btn-outline" onClick={handleContactAdminClick}>
                Contact Admin
              </button>
            </div>
          )}

          {/* 🟢 APPROVED STATUS */}
          {company && isApproved && (
            <div className="company-status-banner approved">
              ✅ Company Approved — You are live!
            </div>
          )}
        </div>
      </section>

      {/* QUICK STATS (LOCKED IF NOT APPROVED) */}
      <section className={`stats-section ${!isApproved ? "locked" : ""}`}>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.totalInternships}</h3>
              <p>Internships</p>
            </div>
            <div className="stat-card">
              <h3>{stats.totalApplications}</h3>
              <p>Applications</p>
            </div>
            <div className="stat-card">
              <h3>{stats.pendingApplications}</h3>
              <p>Pending</p>
            </div>
          </div>

          {!isApproved && (
            <div className="locked-overlay">
              🔒 Locked until admin approval
            </div>
          )}
        </div>
      </section>

      {/* TABS */}
      <section className="tab-section">
        <div className="container">
          <button
            disabled={!isApproved}
            className={activeTab === "internships" ? "active" : ""}
            onClick={() => setActiveTab("internships")}
          >
            Internships
          </button>

          <button
            disabled={!isApproved}
            className={activeTab === "applications" ? "active" : ""}
            onClick={() => setActiveTab("applications")}
          >
            Applications
          </button>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="companies-section">
        <div className="container">
          {!isApproved && (
            <div className="locked-message">
              🔒 Dashboard locked. Waiting for admin approval.
            </div>
          )}

          {isApproved && activeTab === "internships" && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
              >
                ➕ Add Internship
              </button>

              {/* Internships list stays EXACTLY as you coded */}
            </>
          )}

          {isApproved && activeTab === "applications" && (
            <ApplicantList
              applications={applications}
              onStatusUpdate={guardAction}
            />
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CompanyDashboard;
