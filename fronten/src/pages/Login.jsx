// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });

      // Save token only
      localStorage.setItem("token", res.data.token);

      // Update user state in App.jsx
      if (setUser) {
        setUser(res.data.user);
      }

      // Show success
      alert("Login successful!");

      // Navigate based on role
      const role = res.data.user.role;
      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "company") {
        navigate("/company-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <h2>Login</h2>
          <p>Access your account to manage internships.</p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <form className="modal-content" onSubmit={handleSubmit}>
            <h3 className="modal-title">Sign In</h3>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Login;