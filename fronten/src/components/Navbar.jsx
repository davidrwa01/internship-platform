// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
const Navbar = ({ user, setShowModal, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getDashboardLink = () => {
    switch (user?.role) {
      case "student":
        return "/student-dashboard";
      case "company":
        return "/company-dashboard";
      case "admin":
        return "/admin-dashboard";
      default:
        return "/";
    }
  };

  const onLogout = (e) => {
    e.preventDefault();
    handleLogout();
    setIsOpen(false);
    navigate("/");
  };

  const getGreetingName = () => {
    if (user?.fullName) return user.fullName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header>
      <div className="container">
        <nav className="navbar" aria-label="Main navigation">
          {/* Logo */}
          <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
            <i className="fas fa-graduation-cap"></i>
            <h1>TVET Internships Rwanda</h1>
          </Link>

          {/* Hamburger Button (Mobile Only) */}
          <button
            className="hamburger"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          {/* Desktop Nav Links */}
          <div className="nav-links desktop-only">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>

          {/* Auth Section (Desktop) */}
          {user && <NotificationBell user={user} />}
          <div className="auth-buttons desktop-only">
            {user ? (
              <div className="user-section">
                <span className="user-greeting">
                  Hi, <strong>{getGreetingName()}</strong>!
                </span>
                <Link to={getDashboardLink()} className="btn btn-outline">
                  Dashboard
                </Link>
                <button className="btn btn-primary" onClick={onLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModal(true)}
                >
                  Register Company
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu (Hidden on Desktop) */}
          <div
            id="mobile-menu"
            className={`mobile-menu ${isOpen ? "open" : ""}`}
          >
            <div className="mobile-nav-links">
              <Link to="/" onClick={toggleMenu}>Home</Link>
              <Link to="/about" onClick={toggleMenu}>About</Link>
              <Link to="/contact" onClick={toggleMenu}>Contact</Link>
            </div>

            <div className="mobile-auth">
              {user ? (
                <>
                  <div className="user-greeting-mobile">
                    Hi, <strong>{getGreetingName()}</strong>!
                  </div>
                  <Link
                    to={getDashboardLink()}
                    className="btn btn-outline full-width"
                    onClick={toggleMenu}
                  >
                    Dashboard
                  </Link>
                  <button
                    className="btn btn-primary full-width"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-outline full-width"
                    onClick={toggleMenu}
                  >
                    Login
                  </Link>
                  <button
                    className="btn btn-primary full-width"
                    onClick={() => {
                      setShowModal(true);
                      toggleMenu();
                    }}
                  >
                    Register Company
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;