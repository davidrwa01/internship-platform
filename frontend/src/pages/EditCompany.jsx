import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import CompanyGallery from "../components/CompanyGallery";
import "./EditCompany.css";

const EditCompany = ({ user, handleLogout }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    description: "",
    trainings: []
  });
  const [photo, setPhoto] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const res = await API.get("/company/my-company");
      const company = res.data;
      
      setFormData({
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        location: company.location || "",
        description: company.description || "",
        trainings: company.trainings || []
      });
      setCurrentPhoto(company.photo || "");
      setPictures(company.pictures || []);
    } catch (err) {
      console.error("Failed to fetch company data:", err);
      alert("Failed to load company data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTrainingChange = (e) => {
    const trainingArray = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({
      ...prev,
      trainings: trainingArray
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photo) {
      alert("Please select a photo to upload");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('photo', photo);

    try {
      const res = await API.post("/company/upload-photo", formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("Photo uploaded successfully!");
      setCurrentPhoto(res.data.photo);
      setPhoto(null);
      // Reset file input
      document.getElementById('photo-input').value = '';
    } catch (err) {
      console.error("Failed to upload photo:", err);
      alert("Failed to upload photo: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await API.put("/company/my-company", formData);
      alert("Company information updated successfully!");
      navigate("/waiting");
    } catch (err) {
      console.error("Failed to update company:", err);
      alert("Failed to update company information: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
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

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      <section className="edit-company-hero">
        <div className="container">
          <div className="edit-company-content">
            <h1>Edit Company Information</h1>
            <p>Update your company details while waiting for approval</p>

            <form onSubmit={handleSubmit} className="company-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <select
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Location</option>
                    <option value="kigali">Kigali</option>
                    <option value="eastern">Eastern Province</option>
                    <option value="western">Western Province</option>
                    <option value="northern">Northern Province</option>
                    <option value="southern">Southern Province</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Training Fields</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., ICT, Engineering, Business (comma separated)"
                  value={formData.trainings.join(', ')}
                  onChange={handleTrainingChange}
                />
                <small>Enter training fields separated by commas</small>
              </div>

              <div className="form-group">
                <label>Company Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="4"
                  placeholder="Describe your company..."
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate("/waiting")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="company-gallery-section container">
        <CompanyGallery pictures={pictures} setPictures={setPictures} />
      </section>

      <Footer />
    </>
  );
};

export default EditCompany;