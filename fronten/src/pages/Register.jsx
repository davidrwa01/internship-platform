// src/pages/Register.jsx
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Home.css";

const Register = () => {
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", { ...formData, role });
      alert("Registration successful!");
      console.log(res.data);
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <h2>Register</h2>
          <p>Create an account to apply or offer internships.</p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <form className="modal-content" onSubmit={handleSubmit}>
            <h3 className="modal-title">Create Account</h3>

            <div className="form-group">
              <label>Register as:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-control"
              >
                <option value="student">Student</option>
                <option value="company">Company</option>
              </select>
            </div>

            {role === "student" ? (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    name="fullName"
                    className="form-control"
                    placeholder="Enter your full name"
                    onChange={handleChange}
                    required
                  />
                </div>

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
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    className="form-control"
                    placeholder="+250..."
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    name="companyName"
                    className="form-control"
                    placeholder="Enter company name"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Owner Full Name</label>
                  <input
                    name="fullName"
                    className="form-control"
                    placeholder="Company owner's full name"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="company@example.com"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    name="phone"
                    className="form-control"
                    placeholder="+250..."
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

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
              Register
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Register;