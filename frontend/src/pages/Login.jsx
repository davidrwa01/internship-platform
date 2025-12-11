import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", formData);
      // Save token to localStorage
      localStorage.setItem("token", res.data.token);
      // Update user state in the parent component
      setUser(res.data.user);
      // Redirect user to dashboard based on role
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
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <h2>Login</h2>
          <p>Welcome back! Please login to your account.</p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <form className="modal-content" onSubmit={handleSubmit}>
            <h3 className="modal-title">Login to your account</h3>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="example@gmail.com"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit">
              Login
            </button>
          </form>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Login;
