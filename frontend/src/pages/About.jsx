import React from "react";
import "./Home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const About = () => {
  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <h2>About TVET Internships Rwanda</h2>
          <p>
            We bridge the gap between Rwanda’s Technical and Vocational
            Education and Training (TVET) students and companies offering
            internships. Our goal is to make finding and applying for internships
            simple, transparent, and effective.
          </p>
        </div>
      </section>

      <section className="companies-section">
        <div className="container">
          <h2 className="section-title">Our Mission</h2>
          <p>
            To empower students by connecting them with industry opportunities
            that build real-world skills, and to help companies access skilled,
            motivated talent.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default About;
