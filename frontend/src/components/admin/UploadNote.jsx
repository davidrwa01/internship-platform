import React, { useState } from "react";
import API from "../../services/api";
import "./UploadNote.css";

const UploadNote = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    field: "",
    tags: ""
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError("File size must be less than 100MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/mpeg',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Invalid file type. Allowed: PDF, DOCX, PPT, images, videos, TXT");
        return;
      }
      
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!formData.category.trim()) {
      setError("Category is required");
      return;
    }
    
    if (!formData.field.trim()) {
      setError("Field is required");
      return;
    }

    const data = new FormData();
    data.append("file", file);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("field", formData.field);
    data.append("tags", formData.tags);

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const response = await API.post("/notes/upload", data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setSuccess("Note uploaded successfully!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        field: "",
        tags: ""
      });
      setFile(null);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
      // Callback for parent component
      if (onUploadSuccess) {
        onUploadSuccess(response.data.note);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-note-container">
      <div className="upload-header">
        <h3>Upload New Note</h3>
        <p>Upload study materials for students to download</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter note title"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g., Mathematics, Programming"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Field *</label>
            <input
              type="text"
              name="field"
              value={formData.field}
              onChange={handleInputChange}
              placeholder="e.g., ICT, Construction, Hospitality"
              required
            />
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="e.g., advanced, tutorial, exam"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter note description (optional)"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>File * (Max 100MB)</label>
          <div className="file-upload-area">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.txt"
              required
            />
            <div className="file-upload-info">
              {file ? (
                <div className="file-selected">
                  <i className="fas fa-file"></i>
                  <div>
                    <strong>{file.name}</strong>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              ) : (
                <div className="file-prompt">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>Click to browse or drag and drop file here</p>
                  <small>Supports: PDF, DOCX, PPT, Images, Videos, TXT</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-upload"></i> Upload Note
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadNote;