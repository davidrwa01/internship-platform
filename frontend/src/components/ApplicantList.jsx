import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./ApplicantList.css";

const ApplicantList = ({ 
  internshipId, 
  onClose, 
  onStatusUpdate, 
  viewStudentProfile, 
  handleMessageStudent,
  internshipTitle // Add this missing prop
}) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (internshipId) {
      fetchApplicants();
    }
  }, [internshipId, page]);

  const fetchApplicants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/application/internship/${internshipId}?page=${page}&limit=${limit}`);

      if (res.data.success) {
        setApplicants(res.data.data);
        setTotalApplicants(res.data.count);
      } else {
        setError("Failed to load applicants");
      }
    } catch (err) {
      console.error("Fetch applicants error:", err);
      setError("Failed to load applicants");
    }
    setLoading(false);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page * limit < totalApplicants) setPage(page + 1);
  };

  // Handle status update and refresh the list
  const handleStatusUpdate = async (applicationId, status, studentName) => {
    await onStatusUpdate(applicationId, status, studentName, internshipTitle);
    fetchApplicants(); // Refresh the list after status update
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content applicants-modal">
        <div className="modal-header">
          <h3>Applicants for {internshipTitle}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        {loading && <p>Loading applicants...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <>
            {applicants.length === 0 ? (
              <p>No applicants yet for this internship.</p>
            ) : (
              <>
                <table className="applicants-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Class Level</th>
                      <th>Field of Study</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app) => (
                      <tr key={app._id}>
                        <td>{app.student?.fullName || "N/A"}</td>
                        <td>{app.student?.email || "N/A"}</td>
                        <td>{app.student?.phone || "N/A"}</td>
                        <td>{app.student?.classLevel || "N/A"}</td>
                        <td>{app.student?.field || "N/A"}</td>
                        <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${app.status}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {app.status === "pending" && (
                              <>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleStatusUpdate(app._id, "accepted", app.student?.fullName)}
                                >
                                  <i className="fas fa-check"></i> Accept
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleStatusUpdate(app._id, "rejected", app.student?.fullName)}
                                >
                                  <i className="fas fa-times"></i> Reject
                                </button>
                              </>
                            )}
                            {(app.status === "accepted" || app.status === "rejected") && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleStatusUpdate(app._id, "pending", app.student?.fullName)}
                              >
                                <i className="fas fa-undo"></i> Reset
                              </button>
                            )}
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMessageStudent(app.student)}
                            >
                              <i className="fas fa-comments"></i> Message
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => viewStudentProfile(app.student)}
                            >
                              <i className="fas fa-user"></i> Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalApplicants > limit && (
                  <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={page === 1}>
                      <i className="fas fa-chevron-left"></i> Prev
                    </button>
                    <span>Page {page} of {Math.ceil(totalApplicants / limit)}</span>
                    <button onClick={handleNextPage} disabled={page * limit >= totalApplicants}>
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicantList;