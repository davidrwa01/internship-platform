import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NotesCenter() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchNotes();
    fetchCategories();
  }, [selectedCategory]);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notes', {
        headers: { Authorization: `Bearer ${token}` },
        params: { category: selectedCategory || undefined }
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleDownload = async (noteId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/notes/download/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Refresh notes to update download count
      fetchNotes();
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="notes-center">
      <h2>Notes Center</h2>
      <div className="filter-section">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="notes-grid">
        {notes.map(note => (
          <div key={note._id} className="note-card">
            <h3>{note.title}</h3>
            <p>{note.description}</p>
            <div className="note-meta">
              <span>Category: {note.category}</span>
              <span>Downloads: {note.downloadCount}</span>
              <span>Type: {note.fileType}</span>
            </div>
            <button 
              onClick={() => handleDownload(note._id, note.title)}
              className="download-btn"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotesCenter;