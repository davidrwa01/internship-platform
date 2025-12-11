import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import UploadNote from "../components/admin/UploadNote";
import ManageNotes from "../components/admin/ManageNotes";
import "./AdminDashboard.css";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminDashboard = ({ user, handleLogout }) => {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    students: 0,
    companies: 0,
    applications: 0,
    pendingCompanies: 0,
    approvedCompanies: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    internships: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notes, setNotes] = useState([]);
  const [showUploadNote, setShowUploadNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    category: '',
    level: ''
  });
  const [uploadingNote, setUploadingNote] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        companiesRes,
        usersRes,
        statsRes,
        notifRes,
        unreadNotifRes,
      ] = await Promise.all([
        API.get("/company"),
        API.get("/admin/users"),
        API.get("/admin/stats"),
        API.get("/notifications"),
        API.get("/notifications/unread-count"),
      ]);

      setCompanies(companiesRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data.data || statsRes.data);
      setNotifications(notifRes.data);
      setUnreadNotifications(unreadNotifRes.data.unreadCount);

    } catch (err) {
      console.error("Failed to load admin data:", err);
      alert(
        "Failed to load data: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.emit("user_connected", user._id);
    socket.emit("join_notifications", user._id);

    socket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotifications((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleApprove = async (companyId) => {
    try {
      await API.put(`/admin/companies/${companyId}/approve`);
      const company = companies.find((c) => c._id === companyId);
      if (company?.createdBy) {
        await API.post("/notifications", {
          recipient: company.createdBy,
          title: "Company Approved",
          message:
            "Your company registration has been approved! You can now post internships.",
          type: "approval",
        });
      }
      setCompanies((prev) =>
        prev.map((c) => (c._id === companyId ? { ...c, approved: true } : c))
      );
      alert("Company approved!");
      fetchData();
    } catch (err) {
      alert(
        "Approval failed: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleReject = async (companyId) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      await API.put(`/admin/companies/${companyId}/reject`, { reason });
      const company = companies.find((c) => c._id === companyId);
      if (company?.createdBy) {
        await API.post("/notifications", {
          recipient: company.createdBy,
          title: "Company Registration Rejected",
          message: `Your registration was rejected. Reason: ${reason}.`,
          type: "rejection",
        });
      }
      setCompanies((prev) => prev.filter((c) => c._id !== companyId));
      alert("Company rejected!");
      fetchData();
    } catch (err) {
      alert(
        "Rejection failed: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("User deleted!");
    } catch (err) {
      alert(
        "Delete failed: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const toggleUserStatus = async (userId, current) => {
    try {
      await API.put(`/admin/users/${userId}/status`, {
        active: !current,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, active: !current } : u
        )
      );
      alert(`User ${!current ? "activated" : "suspended"}!`);
    } catch (err) {
      alert("Status update failed");
    }
  };

  const getLocationName = (loc) => {
    const map = {
      kigali: "Kigali",
      eastern: "Eastern Province",
      western: "Western Province",
      northern: "Northern Province",
      southern: "Southern Province",
    };
    return map[loc] || loc;
  };

  const getSafeStats = () => ({
    students: stats.students || 0,
    companies: stats.companies || 0,
    applications: stats.applications || 0,
    pendingCompanies: stats.pendingCompanies || 0,
    approvedCompanies: stats.approvedCompanies || 0,
    approvedApplications: stats.approvedApplications || 0,
    rejectedApplications: stats.rejectedApplications || 0,
    internships: stats.internships || 0,
  });

  const safeStats = getSafeStats();
  const pendingCompaniesCount = companies.filter((c) => !c.approved).length;

  // Handle note upload success
  const handleNoteUploadSuccess = (newNote) => {
    alert("Note uploaded successfully!");
    // You could refresh notes list here if needed
  };

  return (
    <div>
      <Navbar user={user} handleLogout={handleLogout} />

      <section className="hero">
        <div className="container">
          <h2>Admin Dashboard</h2>
          <p>Manage platform users, companies, and analytics</p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1rem",
              flexWrap: "wrap",
            }}
          >
            {/* ---------- NOTIFICATIONS ---------- */}
            <button
              onClick={() => setShowNotifications(true)}
              className="btn btn-outline"
              style={{ position: "relative" }}
            >
              <i className="fas fa-bell"></i> Notifications
              {unreadNotifications > 0 && (
                <span
                  className="notification-badge"
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "red",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unreadNotifications}
                </span>
              )}
            </button>

            <button onClick={fetchData} className="btn btn-outline">
              <i className="fas fa-refresh"></i> Refresh
            </button>
          </div>
        </div>
      </section>

      {/* ------------------- TABS ------------------- */}
      <section className="tab-section">
        <div className="container">
          <div className="tab-container">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="fas fa-chart-bar"></i> Overview
            </button>
            <button
              className={`tab-btn ${activeTab === "companies" ? "active" : ""}`}
              onClick={() => setActiveTab("companies")}
            >
              <i className="fas fa-building"></i> Companies ({companies.length})
              {pendingCompaniesCount > 0 && (
                <span className="pending-badge">{pendingCompaniesCount} pending</span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <i className="fas fa-users"></i> Users ({users.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "suspended" ? "active" : ""}`}
              onClick={() => setActiveTab("suspended")}
            >
              <i className="fas fa-user-times"></i> Suspended ({users.filter(u => !u.active).length})
            </button>
            <button
              className={`tab-btn ${activeTab === "revoked" ? "active" : ""}`}
              onClick={() => setActiveTab("revoked")}
            >
              <i className="fas fa-ban"></i> Revoked ({companies.filter(c => !c.approved).length})
            </button>
            {/* ---------- NOTES CENTER TAB ---------- */}
            <button
              className={`tab-btn ${activeTab === "notes" ? "active" : ""}`}
              onClick={() => setActiveTab("notes")}
            >
              <i className="fas fa-file-alt"></i> Notes Center
            </button>
          </div>
        </div>
      </section>

      {/* ------------------- CONTENT ------------------- */}
      <section className="companies-section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading admin data…</div>
          ) : (
            <>
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="admin-overview">
                  <h2 className="section-title">Platform Analytics</h2>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Total Students</h3>
                      <div className="stat-number">{safeStats.students}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Total Companies</h3>
                      <div className="stat-number">{safeStats.companies}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Total Internships</h3>
                      <div className="stat-number">{safeStats.internships}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Total Applications</h3>
                      <div className="stat-number">{safeStats.applications}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Pending Companies</h3>
                      <div className="stat-number warning">{safeStats.pendingCompanies}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Approved Applications</h3>
                      <div className="stat-number success">{safeStats.approvedApplications}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPANIES TAB */}
              {activeTab === "companies" && (
                <div>
                  <div className="dashboard-header">
                    <h2 className="section-title">
                      Company Registrations ({pendingCompaniesCount} pending)
                    </h2>
                    <button onClick={fetchData} className="btn btn-outline">
                      <i className="fas fa-refresh"></i> Refresh
                    </button>
                  </div>

                  {companies.length === 0 ? (
                    <div className="no-data">
                      <p>No companies found</p>
                    </div>
                  ) : (
                    <div className="companies-grid">
                      {companies.map((company) => (
                        <div
                          key={company._id}
                          className={`company-card admin-company-card ${!company.approved ? "pending" : ""
                            }`}
                        >
                          <div className="company-header">
                            <h3>{company.name}</h3>
                            <div className="company-status">
                              <span
                                className={`status-badge ${company.approved ? "approved" : "pending"
                                  }`}
                              >
                                {company.approved ? "Approved" : "Pending"}
                              </span>
                            </div>
                          </div>

                          <div className="company-body">
                            <div className="company-details">
                              <p><strong>Email:</strong> {company.email}</p>
                              <p><strong>Phone:</strong> {company.phone}</p>
                              <p><strong>Location:</strong> {getLocationName(company.location)}</p>
                              <p><strong>Registered:</strong> {new Date(company.createdAt).toLocaleDateString()}</p>

                              {company.trainings?.length > 0 && (
                                <div className="company-trainings">
                                  <strong>Training Fields:</strong>
                                  <div className="training-tags">
                                    {company.trainings.map((t, i) => (
                                      <span key={i} className="training-tag">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {company.description && (
                                <p><strong>Description:</strong> {company.description}</p>
                              )}
                            </div>

                            <div className="approval-actions">
                              {!company.approved ? (
                                <>
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleApprove(company._id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleReject(company._id)}
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button className="btn btn-outline" disabled>
                                    Approved
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleReject(company._id)}
                                  >
                                    Revoke
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === "users" && (
                <div>
                  <div className="dashboard-header">
                    <h2 className="section-title">Platform Users ({users.length})</h2>
                    <button onClick={fetchData} className="btn btn-outline">
                      Refresh
                    </button>
                  </div>

                  {users.length === 0 ? (
                    <div className="no-data">
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="styled-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Registered</th>
                            <th>Actions</th>
                            <th>Profile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u._id}>
                              <td>
                                <strong>{u.fullName || u.companyName || "N/A"}</strong>
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`role-badge ${u.role}`}>{u.role}</span>
                              </td>
                              <td>
                                <span className={`status-badge ${u.active ? "active" : "inactive"
                                  }`}>
                                  {u.active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className={`btn btn-sm ${u.active ? "btn-warning" : "btn-success"
                                      }`}
                                    onClick={() => toggleUserStatus(u._id, u.active)}
                                  >
                                    {u.active ? "Suspend" : "Activate"}
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deleteUser(u._id)}
                                    disabled={u._id === user?._id}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => navigate(`/profile/${u._id}`)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUSPENDED USERS TAB */}
              {activeTab === "suspended" && (
                <div>
                  <div className="dashboard-header">
                    <h2 className="section-title">Suspended Users</h2>
                    <button onClick={fetchData} className="btn btn-outline">
                      <i className="fas fa-refresh"></i> Refresh
                    </button>
                  </div>

                  {users.filter(u => !u.active).length === 0 ? (
                    <div className="no-data">
                      <p>No suspended users found</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="styled-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Suspended Date</th>
                            <th>Actions</th>
                            <th>Profile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.filter(u => !u.active).map((u) => (
                            <tr key={u._id}>
                              <td>
                                <strong>{u.fullName || u.companyName || "N/A"}</strong>
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`role-badge ${u.role}`}>{u.role}</span>
                              </td>
                              <td>{new Date(u.updatedAt).toLocaleDateString()}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => toggleUserStatus(u._id, u.active)}
                                  >
                                    Re-activate
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deleteUser(u._id)}
                                    disabled={u._id === user?._id}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => navigate(`/profile/${u._id}`)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* REVOKED COMPANIES TAB */}
              {activeTab === "revoked" && (
                <div>
                  <div className="dashboard-header">
                    <h2 className="section-title">Revoked Companies</h2>
                    <button onClick={fetchData} className="btn btn-outline">
                      <i className="fas fa-refresh"></i> Refresh
                    </button>
                  </div>

                  {companies.filter(c => !c.approved).length === 0 ? (
                    <div className="no-data">
                      <p>No revoked companies found</p>
                    </div>
                  ) : (
                    <div className="companies-grid">
                      {companies.filter(c => !c.approved).map((company) => (
                        <div
                          key={company._id}
                          className="company-card admin-company-card revoked"
                        >
                          <div className="company-header">
                            <h3>{company.name}</h3>
                            <div className="company-status">
                              <span className="status-badge revoked">
                                Revoked
                              </span>
                            </div>
                          </div>

                          <div className="company-body">
                            <div className="company-details">
                              <p><strong>Email:</strong> {company.email}</p>
                              <p><strong>Phone:</strong> {company.phone}</p>
                              <p><strong>Location:</strong> {getLocationName(company.location)}</p>
                              <p><strong>Revoked:</strong> {new Date(company.updatedAt).toLocaleDateString()}</p>

                              {company.trainings?.length > 0 && (
                                <div className="company-trainings">
                                  <strong>Training Fields:</strong>
                                  <div className="training-tags">
                                    {company.trainings.map((t, i) => (
                                      <span key={i} className="training-tag">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {company.description && (
                                <p><strong>Description:</strong> {company.description}</p>
                              )}
                            </div>

                            <div className="approval-actions">
                              <button
                                className="btn btn-success"
                                onClick={async () => {
                                  try {
                                    await API.put(`/admin/companies/${company._id}/reapprove`);
                                    setCompanies((prev) =>
                                      prev.map((c) => (c._id === company._id ? { ...c, approved: true } : c))
                                    );
                                    alert("Company re-approved!");
                                    fetchData();
                                  } catch (err) {
                                    alert("Re-approval failed: " + (err.response?.data?.message || err.message));
                                  }
                                }}
                              >
                                Re-approve
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleReject(company._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* NOTES CENTER TAB */}
              {activeTab === "notes" && (
                <div className="admin-notes-section">
                  <div className="dashboard-header">
                    <h2 className="section-title">Notes Center Management</h2>
                    <div className="notes-tabs">
                      <button
                        className={`notes-tab-btn ${showUploadNote ? "active" : ""}`}
                        onClick={() => setShowUploadNote(true)}
                      >
                        <i className="fas fa-upload"></i> Upload Notes
                      </button>
                      <button
                        className={`notes-tab-btn ${!showUploadNote ? "active" : ""}`}
                        onClick={() => setShowUploadNote(false)}
                      >
                        <i className="fas fa-cog"></i> Manage Notes
                      </button>
                    </div>
                  </div>

                  {showUploadNote ? (
                    <UploadNote onUploadSuccess={handleNoteUploadSuccess} />
                  ) : (
                    <ManageNotes />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ---------- NOTIFICATIONS MODAL ---------- */}
      {showNotifications && (
        <div
          className="modal-overlay active"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Notifications ({unreadNotifications} unread)
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowNotifications(false)}
              >
                X
              </button>
            </div>

            <div
              className="modal-body"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              {notifications.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666" }}>
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`notification-item ${!n.read ? "unread" : ""}`}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                      background: !n.read ? "#f8f9fa" : "white",
                      cursor: "pointer",
                    }}
                    onClick={async () => {
                      if (n.read) return;
                      await API.put(`/notifications/${n._id}/read`);
                      setNotifications((prev) =>
                        prev.map((item) =>
                          item._id === n._id ? { ...item, read: true } : item
                        )
                      );
                      setUnreadNotifications((prev) => prev - 1);
                    }}
                  >
                    <div style={{ fontWeight: n.read ? "normal" : "bold" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: "0.9em", color: "#555" }}>
                      {n.message}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75em",
                        color: "#999",
                        textAlign: "right",
                      }}
                    >
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-sm"
                onClick={async () => {
                  await API.put("/notifications/mark-all-read");
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true }))
                  );
                  setUnreadNotifications(0);
                }}
              >
                Mark All as Read
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;