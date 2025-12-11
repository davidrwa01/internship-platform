import React, { useState, useEffect } from "react";
import API from "../../services/api";
import "./ManageNotes.css";

const ManageNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    field: "",
    tags: "",
    isActive: true
  });

  useEffect(() => {
    fetchNotes();
    fetchCategories();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await API.get("/notes");
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      alert("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get("/notes/categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      return;
    }

    try {
      await API.delete(`/notes/${noteId}`);
      alert("Note deleted successfully!");
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note._id);
    setEditForm({
      title: note.title,
      description: note.description || "",
      category: note.category,
      field: note.field,
      tags: note.tags?.join(", ") || "",
      isActive: note.isActive
    });
  };

  const handleUpdateNote = async (noteId) => {
    try {
      await API.put(`/notes/${noteId}`, editForm);
      alert("Note updated successfully!");
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditForm({
      title: "",
      description: "",
      category: "",
      field: "",
      tags: "",
      isActive: true
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return 'fa-file-pdf text-danger';
      case 'docx': return 'fa-file-word text-primary';
      case 'ppt': return 'fa-file-powerpoint text-warning';
      case 'image': return 'fa-file-image text-success';
      case 'video': return 'fa-file-video text-info';
      default: return 'fa-file text-secondary';
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === "" || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || note.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="manage-notes-container">
      <div className="manage-notes-header">
        <div className="search-filter-container">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <button onClick={fetchNotes} className="btn btn-outline">
            <i className="fas fa-refresh"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-file-alt fa-3x"></i>
          <p>No notes found</p>
          {searchTerm || selectedCategory !== "all" ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="notes-table-container">
          <table className="notes-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Title</th>
                <th>Category</th>
                <th>Field</th>
                <th>Downloads</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note) => (
                <tr key={note._id}>
                  <td className="file-cell">
                    <i className={`fas ${getFileIcon(note.fileType)}`}></i>
                    <span className="file-size">{formatFileSize(note.fileSize)}</span>
                  </td>
                  <td className="title-cell">
                    {editingNote === note._id ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="edit-input"
                      />
                    ) : (
                      <div>
                        <strong>{note.title}</strong>
                        {note.description && (
                          <small className="description">{note.description}</small>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="category-cell">
                    {editingNote === note._id ? (
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        className="edit-input"
                      />
                    ) : (
                      <span className="category-badge">{note.category}</span>
                    )}
                  </td>
                  <td className="field-cell">
                    {editingNote === note._id ? (
                      <input
                        type="text"
                        value={editForm.field}
                        onChange={(e) => setEditForm({...editForm, field: e.target.value})}
                        className="edit-input"
                      />
                    ) : (
                      note.field
                    )}
                  </td>
                  <td className="downloads-cell">
                    <i className="fas fa-download"></i>
                    <span>{note.downloadCount}</span>
                  </td>
                  <td className="status-cell">
                    {editingNote === note._id ? (
                      <select
                        value={editForm.isActive}
                        onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                        className="edit-select"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${note.isActive ? 'active' : 'inactive'}`}>
                        {note.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="actions-cell">
                    {editingNote === note._id ? (
                      <div className="edit-actions">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleUpdateNote(note._id)}
                        >
                          <i className="fas fa-check"></i> Save
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={handleCancelEdit}
                        >
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => handleEditNote(note)}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteNote(note._id)}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="table-footer">
            <p>Showing {filteredNotes.length} of {notes.length} notes</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNotes;