import React, { useState } from "react";
import API from "../services/api";
import "./CompanyGallery.css";

const CompanyGallery = ({ pictures = [], setPictures }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file to upload");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("description", description);

    try {
      setUploading(true);
      const res = await API.post("/company/my-company/pictures", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const pic = res.data.picture;
      if (typeof setPictures === "function") {
        setPictures(prev => Array.isArray(prev) ? [...prev, pic] : [pic]);
      }

      setFile(null);
      setDescription("");
      const input = document.getElementById("company-picture-input");
      if (input) input.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pictureId) => {
    if (!window.confirm("Delete this picture?")) return;
    try {
      setDeletingId(pictureId);
      await API.delete(`/company/my-company/pictures/${pictureId}`);
      if (typeof setPictures === "function") {
        setPictures(prev => Array.isArray(prev) ? prev.filter(p => String(p._id) !== String(pictureId)) : []);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Company Gallery</h3>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input id="company-picture-input" type="file" accept="image/*" onChange={handleFileChange} />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button onClick={handleUpload} disabled={uploading} className="btn btn-primary">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {Array.isArray(pictures) && pictures.length > 0 ? (
          pictures.map(pic => (
            <div key={pic._id || pic.publicId || pic.url} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
              <div style={{ width: '100%', height: 120, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                {pic.url ? (
                  <img src={pic.url} alt={pic.description || 'company picture'} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                ) : (
                  <div style={{ color: '#888' }}>No preview</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#333', marginBottom: 8 }}>{pic.description}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleDelete(pic._id)} disabled={deletingId === pic._id} className="btn btn-danger">
                  {deletingId === pic._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#666' }}>No pictures uploaded yet.</div>
        )}
      </div>
    </div>
  );
};

export default CompanyGallery;
