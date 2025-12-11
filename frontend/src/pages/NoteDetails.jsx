import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./NoteDetails.css";

const NoteDetails = ({ user }) => {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/notes/${id}`);
      setNote(res.data.note || null);
    } catch (err) {
      console.error("Failed to load note:", err);
      setError("Failed to load note. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Request file as blob so browser saves it locally
      const res = await API.get(`/notes/download/${id}`, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      let filename = note?.title || 'note';
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match) filename = match[1];

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Optionally refresh note to update download count
      fetchNote();
    } catch (err) {
      console.error('Download failed:', err);
      alert(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="container">Loading note…</div>
      <Footer />
    </>
  );

  if (error || !note) return (
    <>
      <Navbar user={user} />
      <div className="container">{error || 'Note not found'}</div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar user={user} />
      <section className="note-detail-hero">
        <div className="container">
          <h2>{note.title}</h2>
          <div className="meta">
            <span className="category">{note.category}</span>
            <span className="field">{note.field}</span>
            <span className="uploader">Uploaded by: {note.uploadedBy?.fullName || note.uploadedBy}</span>
            <span className="date">{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="description">{note.description}</p>

          <div className="download-actions">
            <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Downloading…' : `Download (${note.fileType?.toUpperCase() || 'FILE'})`}
            </button>
            <span className="download-count">Downloads: {note.downloadCount || 0}</span>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default NoteDetails;
