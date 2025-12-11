import React, { useState } from "react";
import "./Home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for contacting us! We’ll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <h2>Contact Us</h2>
          <p>We’d love to hear from you! Fill out the form below to get in touch.</p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                type="text"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="form-control"
                rows="4"
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Send Message
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Contact;
