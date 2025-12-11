import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import { Link } from "react-router-dom";
import "./Auth.css";

const provincesWithDistricts = {
  kigali: ["Gasabo", "Kicukiro", "Nyarugenge"],
  eastern: ["Kayonza", "Rwamagana", "Ngoma", "Kirehe", "Gatsibo", "Nyagatare", "Bugesera"],
  western: ["Rubavu", "Rusizi", "Nyamasheke", "Nyabihu", "Karongi", "Rutsiro", "Ngororero"],
  northern: ["Musanze", "Burera", "Gakenke", "Rulindo", "Gicumbi"],
  southern: ["Huye", "Nyanza", "Nyaruguru", "Ruhango", "Nyamagabe", "Gasagara", "Muhanga"]
};

const Register = () => {
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    schoolName: "",
    homeAddress: "",
    province: "",
    District: "",
    classLevel: "L3",
    field: "",
    gender: "Male",
    location: "", // For company location (province & district)
  });

  const [districtOptions, setDistrictOptions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "province") {
      setFormData({
        ...formData,
        province: value,
        District: ""
      });
      setDistrictOptions(provincesWithDistricts[value] || []);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

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
              <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
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
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>School Name</label>
                  <input
                    name="schoolName"
                    className="form-control"
                    placeholder="Enter your school name"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Home Address</label>
                  <input
                    name="homeAddress"
                    className="form-control"
                    placeholder="Enter your home address"
                    value={formData.homeAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Province</label>
                  <select
                    name="province"
                    className="form-control"
                    value={formData.province}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Province</option>
                    {Object.keys(provincesWithDistricts).map((prov) => (
                      <option key={prov} value={prov}>
                        {prov.charAt(0).toUpperCase() + prov.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>District</label>
                  <select
                    name="District"
                    className="form-control"
                    value={formData.District}
                    onChange={handleChange}
                    required
                    disabled={!formData.province}
                  >
                    <option value="">Select District</option>
                    {districtOptions.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="example@gmail.com"
                    value={formData.email}
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
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Class Level</label>
                  <select
                    name="classLevel"
                    className="form-control"
                    value={formData.classLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="L3">L3</option>
                    <option value="L4">L4</option>
                    <option value="L5">L5</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Field</label>
                  <input
                    name="field"
                    className="form-control"
                    placeholder="Enter your field of study"
                    value={formData.field}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    className="form-control"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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
                    value={formData.companyName}
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
                    value={formData.fullName}
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
                    value={formData.email}
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
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Province & District</label>
                  <select
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Location</option>
                    <option value="kigali">Kigali</option>
                    <option value="eastern">Eastern</option>
                    <option value="western">Western</option>
                    <option value="northern">Northern</option>
                    <option value="southern">Southern</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Register
            </button>
          </form>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Register;
