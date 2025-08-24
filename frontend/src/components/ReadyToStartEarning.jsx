import React from 'react';
import './ReadyToStartEarning.css';

const ReadyToStartEarning = () => {
  return (
    <section className="final-cta-section">
      <div className="container">
        <div className="cta-content">
          <h2 className="gradient-text">Ready to Start Earning?</h2>
          <p>Join thousands of creators making real money from their content</p>
          
          <div className="cta-buttons">
            <button className="btn btn-primary btn-large btn-glow">
              <span>Create Your Account</span>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14m-7-7l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="btn btn-secondary btn-large">
              <span>Learn More</span>
            </button>
          </div>
          
          <div className="cta-features">
            <div className="cta-feature">
              <svg viewBox="0 0 24 24" fill="currentColor" className="check-icon">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>No subscription required</span>
            </div>
            <div className="cta-feature">
              <svg viewBox="0 0 24 24" fill="currentColor" className="check-icon">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>80% revenue share</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReadyToStartEarning;