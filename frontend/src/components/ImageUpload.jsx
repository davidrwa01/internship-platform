import React, { useState, useRef } from "react";
import API from "../services/api";
import "./ImageUpload.css";

const ImageUpload = ({
  currentImage,
  onUploadSuccess,
  label = "Upload Image",
  endpoint,
  aspectRatio = "1:1",
  maxSizeMB = 5
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !endpoint) return;

    const formData = new FormData();
    formData.append('photo', selectedFile); // Using 'photo' as the field name based on backend expectation

    setUploading(true);
    setError("");

    try {
      const response = await API.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }

      // Reset state
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className="image-upload-container">
      <div className="image-upload-header">
        <h4>{label}</h4>
      </div>

      <div className="image-upload-content">
        {/* Current/Preview Image Display */}
        {displayImage && (
          <div className="image-preview">
            <img
              src={displayImage}
              alt="Preview"
              className="preview-image"
              style={{
                aspectRatio: aspectRatio,
                objectFit: 'cover'
              }}
            />
          </div>
        )}

        {/* File Input */}
        <div className="file-input-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
            id={`file-input-${Math.random()}`}
          />
          <label
            htmlFor={`file-input-${Math.random()}`}
            className="file-input-label"
          >
            <i className="fas fa-cloud-upload-alt"></i>
            {selectedFile ? selectedFile.name : "Choose Image"}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="upload-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && (
          <div className="upload-actions">
            <button
              onClick={handleCancel}
              className="btn btn-outline cancel-btn"
              disabled={uploading}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button
              onClick={handleUpload}
              className="btn btn-primary upload-btn"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload"></i> Upload
                </>
              )}
            </button>
          </div>
        )}

        {/* File Size Info */}
        <div className="file-info">
          <small>Maximum file size: {maxSizeMB}MB. Supported formats: JPG, PNG, GIF</small>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
