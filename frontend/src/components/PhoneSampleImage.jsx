import React, { useState } from 'react';
import './PhoneSampleImage.css';

const PhoneSampleImage = () => {
  const [swipeDirection, setSwipeDirection] = useState('');

  const handleSwipe = (direction) => {
    setSwipeDirection(direction);
    setTimeout(() => setSwipeDirection(''), 500);
  };

  return (
    <section className="demo-section">
      <div className="container">
        <div className="phone-mockup floating-card">
          <div className="phone-screen">
            <div className={`swipe-card ${swipeDirection}`}>
              <div className="creator-header">
                <div className="creator-avatar">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2317D2C2'/%3E%3Cstop offset='100%25' style='stop-color:%2347E0D2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23grad)'/%3E%3C/svg%3E" alt="Creator" />
                  <span className="online-badge"></span>
                </div>
                <div className="creator-info">
                  <h3>Emma Rose</h3>
                  <div className="creator-tags">
                    <span className="tag tag-verified">✓ Verified</span>
                    <span className="tag tag-online">Online</span>
                  </div>
                </div>
                <div className="creator-stats">
                  <div className="stat">
                    <span className="stat-value">4.9</span>
                    <span className="stat-label">★</span>
                  </div>
                </div>
              </div>
              
              <div className="content-preview">
                <div className="blur-overlay">
                  <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <p>Swipe right to unlock</p>
                  <span className="price-tag">$2.99</span>
                </div>
              </div>
              
              <div className="swipe-actions">
                <button className="swipe-btn reject" onClick={() => handleSwipe('swipe-left')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className="swipe-btn super" onClick={() => handleSwipe('swipe-super')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
                <button className="swipe-btn like" onClick={() => handleSwipe('swipe-right')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhoneSampleImage;