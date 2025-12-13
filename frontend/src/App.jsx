// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import API from "./services/api";

// ── Lazy-load pages (prevents 500 on missing file) ─────────────────────
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const ApplyInternship = lazy(() => import("./components/ApplyInternship"));
const Notes = lazy(() => import("./pages/Notes"));
const NoteDetails = lazy(() => import("./pages/NoteDetails"));
const EditCompany = lazy(() => import("./pages/EditCompany"));
const EditCompanyEnhanced = lazy(() => import("./pages/EditCompanyEnhanced"));

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* --------------------------------------------------------------
     Verify session on mount
     -------------------------------------------------------------- */
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
        console.warn("Invalid session – clearing", err);
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

  /* --------------------------------------------------------------
     ProtectedRoute – role-aware
     -------------------------------------------------------------- */
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading)
      return <div className="text-center p-5">Loading session…</div>;

    // If there's no authenticated user, send them to the public Home page
    // so they see the app landing page first instead of being forced to /login.
    if (!user) return <Navigate to="/" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role))
      return <Navigate to="/" replace />;

    return children;
  };

  /* --------------------------------------------------------------
     Fallback UI while lazy-loading
     -------------------------------------------------------------- */
  const LazyFallback = () => (
    <div className="text-center p-5">Loading page…</div>
  );

  /* --------------------------------------------------------------
     Routes
     -------------------------------------------------------------- */
  return (
    <Router>
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          {/* ── PUBLIC ──────────────────────────────────────── */}
          <Route
            path="/"
            element={<Home user={user} handleLogout={handleLogout} setUser={setUser} />}
          />
          <Route path="/about" element={<About user={user} />} />
          <Route path="/contact" element={<Contact user={user} />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="/company/:companyId" element={<CompanyProfile user={user} />} />
          <Route path="/notes" element={<Notes user={user} />} />
          <Route path="/notes/:id" element={<NoteDetails user={user} />} />

          {/* ── APPLY (student only) ─────────────────────────── */}
          <Route
            path="/apply/:internshipId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ApplyInternship user={user} />
              </ProtectedRoute>
            }
          />

          {/* ── EDIT COMPANY ─────────────────────────────────── */}
          <Route
            path="/edit-company"
            element={
              <ProtectedRoute allowedRoles={["company"]}>
                <EditCompany user={user} handleLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-company-enhanced"
            element={
              <ProtectedRoute allowedRoles={["company"]}>
                <EditCompanyEnhanced user={user} handleLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* ── DASHBOARDS ───────────────────────────────────── */}
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

          {/* ── 404 Fallback ─────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;