import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ students: 0, companies: 0, applications: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resCompanies = await API.get("/company");
        const resStats = await API.get("/admin/stats");
        setCompanies(resCompanies.data);
        setStats(resStats.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load admin data");
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await API.put(`/company/${id}/approve`);
      setCompanies((prev) =>
        prev.map((c) => (c._id === id ? { ...c, approved: true } : c))
      );
    } catch {
      alert("Approval failed");
    }
  };

  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <h2>Admin Dashboard</h2>
          <p>Manage companies, users, and analytics.</p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <h2 className="section-title">Pending Companies</h2>
          <div className="companies-grid">
            {companies.map((c) => (
              <div key={c._id} className="company-card">
                <div className="company-header">
                  <h3>{c.name}</h3>
                </div>
                <div className="company-body">
                  {c.approved ? (
                    <p style={{ color: "green" }}>✅ Approved</p>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApprove(c._id)}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "40px" }}>
            <h2 className="section-title">Platform Analytics</h2>
            <p>Students: {stats.students}</p>
            <p>Companies: {stats.companies}</p>
            <p>Applications: {stats.applications}</p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default AdminDashboard;
