// src/pages/StudentProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./StudentProfile.css"; // Make sure this file exists

const StudentProfile = ({ user: currentUser, handleLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get(`/users/${id}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("User not found or you don't have permission to view this profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [id]);

  const handleMessage = () => {
    if (!currentUser) {
      alert("Please login to send messages");
      navigate("/login");
      return;
    }
    navigate(`/messages?user=${profile._id}`);
  };

  if (loading) {
    return (
      <>
        <Navbar user={currentUser} handleLogout={handleLogout} />
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar user={currentUser} handleLogout={handleLogout} />
        <div className="profile-container">
          <div className="error-state">
            <h3>Profile Not Found</h3>
            <p>{error || "The user profile you're looking for doesn't exist."}</p>
            <Link to="/" className="btn btn-primary">Back to Home</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === profile._id;

  return (
    <>
      <Navbar user={currentUser} handleLogout={handleLogout} />
      
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-large">
              {(profile.fullName || profile.name || "U")[0].toUpperCase()}
            </div>
            <h2>{profile.fullName || profile.name}</h2>
            <p className="email">{profile.email}</p>
            <span className={`role-badge ${profile.role}`}>
              {profile.role?.toUpperCase()}
            </span>
          </div>

          <div className="profile-body">
            <div className="info-grid">
              <div className="info-item">
                <strong>Phone</strong>
                <p>{profile.phone || "Not provided"}</p>
              </div>
              
              <div className="info-item">
                <strong>Location</strong>
                <p>{profile.location || profile.studentLocation || "Not provided"}</p>
              </div>
              
              <div className="info-item">
                <strong>School</strong>
                <p>{profile.schoolName || "Not provided"}</p>
              </div>
              
              <div className="info-item">
                <strong>Department</strong>
                <p>{profile.department || "Not provided"}</p>
              </div>
              
              <div className="info-item">
                <strong>Year of Study</strong>
                <p>{profile.yearOfStudy || "Not provided"}</p>
              </div>
              
              <div className="info-item">
                <strong>Registered</strong>
                <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {profile.bio && (
              <div className="bio-section">
                <h4>About</h4>
                <p>{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="skills-section">
                <h4>Skills</h4>
                <div className="skills-list">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="action-buttons">
              {!isOwnProfile && currentUser && (
                <button 
                  onClick={handleMessage}
                  className="btn btn-primary"
                >
                  Send Message
                </button>
              )}
              
              {isOwnProfile && (
                <Link to="/student-dashboard" className="btn btn-primary">
                  Edit Profile
                </Link>
              )}
              
              <Link to="/" className="btn btn-outline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default StudentProfile;