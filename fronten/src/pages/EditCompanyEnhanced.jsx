import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import CompanyGallery from "../components/CompanyGallery";
import { Button, Card, FormGroup, Input, Alert } from "../components/ui";
import "./EditCompany.css";

const EditCompanyEnhanced = ({ user, handleLogout }) => {
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    province: "",
    district: "",
    description: "",
    trainings: []
  });
  const [photo, setPhoto] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/company/my-company");
      const company = res.data;
      
      setFormData({
        name: company.name || "",
        ownerName: company.ownerName || "",
        email: company.email || "",
        phone: company.phone || "",
        province: company.province || "",
        district: company.district || "",
        description: company.description || "",
        trainings: company.trainings || []
      });
      setCurrentPhoto(company.photo || "");
      setPictures(company.pictures || []);
    } catch (err) {
      console.error("Failed to fetch company data:", err);
      setErrors({ general: "Failed to load company data" });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Company name is required";
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.email.includes("@")) newErrors.email = "Invalid email format";
    if (!formData.province) newErrors.province = "Province is required";
    if (!formData.district.trim()) newErrors.district = "District is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
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
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ photo: "File size must be less than 5MB" });
        return;
      }
      setPhoto(file);
      setErrors(prev => ({ ...prev, photo: "" }));
    }
  };

  const handlePhotoUpload = async () => {
    if (!photo) {
      setErrors({ photo: "Please select a photo to upload" });
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
      setSuccessMessage("Photo uploaded successfully!");
      setCurrentPhoto(res.data.photo);
      setPhoto(null);
      document.getElementById('photo-input').value = '';
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to upload photo:", err);
      setErrors({ photo: err.response?.data?.message || "Failed to upload photo" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      await API.put("/company/my-company", formData);
      setSuccessMessage("Company information updated successfully!");
      setTimeout(() => navigate("/waiting"), 2000);
    } catch (err) {
      console.error("Failed to update company:", err);
      setErrors({ general: err.response?.data?.message || "Failed to update company information" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
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
            <h1><i className="fas fa-building"></i> Edit Company Information</h1>
            <p>Update your company details while waiting for approval</p>

            {successMessage && (
              <Alert variant="success" title="Success!" icon="check-circle">
                {successMessage}
              </Alert>
            )}

            {errors.general && (
              <Alert variant="danger" title="Error" icon="exclamation-circle">
                {errors.general}
              </Alert>
            )}

            <Card title="Company Details" className="edit-company-card">
              <form onSubmit={handleSubmit} className="company-form">
                <div className="ui-form-row">
                  <FormGroup label="Company Name" required error={errors.name}>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      icon="building"
                    />
                  </FormGroup>

                  <FormGroup label="Owner Name" required error={errors.ownerName}>
                    <Input
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      placeholder="Enter owner name"
                      icon="user"
                    />
                  </FormGroup>
                </div>

                <div className="ui-form-row">
                  <FormGroup label="Email" required error={errors.email}>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      icon="envelope"
                    />
                  </FormGroup>

                  <FormGroup label="Phone Number" error={errors.phone}>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      icon="phone"
                    />
                  </FormGroup>
                </div>

                <div className="ui-form-row">
                  <FormGroup label="Province" required error={errors.province}>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className="ui-input"
                    >
                      <option value="">Select Province</option>
                      <option value="kigali">Kigali</option>
                      <option value="eastern">Eastern Province</option>
                      <option value="western">Western Province</option>
                      <option value="northern">Northern Province</option>
                      <option value="southern">Southern Province</option>
                    </select>
                  </FormGroup>

                  <FormGroup label="District" required error={errors.district}>
                    <Input
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Enter district"
                      icon="map-marker-alt"
                    />
                  </FormGroup>
                </div>

                <FormGroup 
                  label="Training Fields" 
                  hint="Enter training fields separated by commas"
                >
                  <textarea
                    className="ui-input"
                    placeholder="e.g., ICT, Engineering, Business"
                    value={formData.trainings.join(', ')}
                    onChange={handleTrainingChange}
                    style={{ minHeight: '80px', resize: 'vertical' }}
                  />
                </FormGroup>

                <FormGroup label="Company Description" className="ui-form-group--full">
                  <textarea
                    name="description"
                    className="ui-input"
                    rows="5"
                    placeholder="Describe your company..."
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{ minHeight: '120px', resize: 'vertical' }}
                  />
                </FormGroup>

                <div className="form-actions">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate("/waiting")}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={saving}
                    isLoading={saving}
                  >
                    {saving ? "Updating..." : "Update Company"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Photo Upload Section */}
      <section className="container" style={{ marginTop: '30px' }}>
        <Card title="Company Logo" subtitle="Upload and manage your company logo">
          <div style={{ padding: '20px' }}>
            {currentPhoto && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img 
                  src={currentPhoto} 
                  alt="Company Logo" 
                  style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} 
                />
              </div>
            )}
            {errors.photo && (
              <Alert variant="danger" icon="exclamation-circle">
                {errors.photo}
              </Alert>
            )}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Input
                type="file"
                id="photo-input"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <Button
                variant="primary"
                onClick={handlePhotoUpload}
                disabled={!photo}
                icon="upload"
              >
                Upload Photo
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Gallery Section */}
      <section className="container" style={{ marginTop: '30px', marginBottom: '30px' }}>
        <CompanyGallery pictures={pictures} setPictures={setPictures} />
      </section>

      <Footer />
    </>
  );
};

export default EditCompanyEnhanced;
