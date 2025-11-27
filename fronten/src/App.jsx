// src/App.jsx - UPDATED
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import API from "./services/api";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyProfile from "./pages/CompanyProfile";
import ApplyInternship from "./components/ApplyInternship"; // ADD THIS IMPORT

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await API.get("/auth/me");
        setUser(data.user);
      } catch (err) {
        console.warn("Session invalid → clearing storage", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading) return <div className="text-center p-5">Loading…</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role))
      return <Navigate to="/" replace />;

    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home user={user} handleLogout={handleLogout} setUser={setUser} />} />
        <Route path="/about" element={<About user={user} />} />
        <Route path="/contact" element={<Contact user={user} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/company/:companyId" element={<CompanyProfile user={user} />} />

        {/* Apply Route - ADD THIS */}
        <Route 
          path="/apply/:internshipId" 
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ApplyInternship user={user} />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard user={user} handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-dashboard"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyDashboard user={user} handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard user={user} handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;