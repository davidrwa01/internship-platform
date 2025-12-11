import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css"; // Add this import

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <h3>TVET Internships Rwanda</h3> {/* Updated title to match original */}
            <p>
              Connecting TVET students with valuable internship opportunities across Rwanda to bridge the gap between education and employment.
            </p> {/* Updated description to match original */}
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Contact Info</h3> {/* Updated title to match original */}
            <ul>
              <li><i className="fas fa-map-marker-alt"></i> Kigali, Rwanda</li>
              <li><i className="fas fa-phone"></i> +250 799 387 258</li>
              <li><i className="fas fa-envelope"></i> info@tvetinternships.rw</li>
            </ul>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>

        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} TVET Internships Rwanda. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;