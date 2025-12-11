import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import "./Notes.css";

const Notes = ({ user }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notes");
      // backend returns: { success, count, total, pages, currentPage, notes }
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error("Failed to load notes:", err);
      setError("Failed to load notes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const shortDesc = (text) => (text && text.length > 120 ? `${text.substring(0, 120)}...` : text || "");

  return (
    <>
      <Navbar user={user} />

      <section className="notes-hero">
        <div className="container">
          <h2>Notes Center</h2>
          <p>Browse and download study materials uploaded by admins</p>
        </div>
      </section>

      <section className="notes-list">
        <div className="container">
          {loading ? (
            <p>Loading notes…</p>
          ) : error ? (
            <div className="error">{error}</div>
          ) : notes.length === 0 ? (
            <div className="empty">No notes available</div>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <Link to={`/notes/${note._id}`} className="note-card" key={note._id}>
                  <div className="note-card-body">
                    <h3>{note.title}</h3>
                    <div className="meta">
                      <span className="category">{note.category}</span>
                      <span className="field">{note.field}</span>
                      <span className="date">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="desc">{shortDesc(note.description)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Notes;
