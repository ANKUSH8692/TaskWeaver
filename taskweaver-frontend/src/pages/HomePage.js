import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      <header className="hero-section">
        <div className="hero-content">
          <h1>TaskWeaver</h1>
          <p>Streamline Your Team's Task Management</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/home.jpg" alt="Task Management" />
        </div>
      </header>

      <section className="features-section">
        <div className="container">
          <h2>Why Choose TaskWeaver?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Smart Task Assignment</h3>
              <p>Automatic task distribution using advanced algorithms</p>
            </div>
            <div className="feature-card">
              <h3>Real-time Progress Tracking</h3>
              <p>Monitor task progress and team performance</p>
            </div>
            <div className="feature-card">
              <h3>Role-based Access</h3>
              <p>Different interfaces for admins and employees</p>
            </div>
          </div>
        </div>
      </section>

      <section className="developer-info">
        <div className="container">
          <h2>About the Developer</h2>
          <div className="developer-card">
            <p>Built with modern technologies including React, Redux, Node.js, and MongoDB</p>
            <p>Features secure authentication and real-time task management</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;