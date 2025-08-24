import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SwipeMatchMonetize.css';

const SwipeMatchMonetize = () => {
  const navigate = useNavigate();
  const [videoOpen, setVideoOpen] = useState(false);
  const [counters, setCounters] = useState({ creators: 0, earned: 0, matches: 0 });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    const targets = { creators: 102500, earned: 11850000, matches: 45000 };
    const increments = {
      creators: targets.creators / steps,
      earned: targets.earned / steps,
      matches: targets.matches / steps
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setCounters(prev => ({
          creators: Math.min(prev.creators + increments.creators, targets.creators),
          earned: Math.min(prev.earned + increments.earned, targets.earned),
          matches: Math.min(prev.matches + increments.matches, targets.matches)
        }));
        currentStep++;
      } else {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="launch-chip pulse-animation">
              <span className="chip-icon">🚀</span>
              <span>Launching January 2025</span>
            </div>
            
            <h1 className="hero-title">
              <span className="gradient-text">Swipe.</span>
              <span className="gradient-text-2"> Match.</span>
              <span className="gradient-text-3"> Monetize.</span>
            </h1>
            
            <p className="hero-description">
              The content platform that combines Tinder's discovery with OnlyFans' economy. 
              <span className="highlight-text"> Instagram Plus content only.</span>
            </p>

            <div className="hero-cta-group">
              <button 
                className="btn btn-primary btn-large btn-glow"
                onClick={() => navigate('/creator/register')}
              >
                <span>Start Earning Today</span>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14m-7-7l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="btn btn-secondary btn-large" onClick={() => setVideoOpen(true)}>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="social-proof">
              <div className="stat-item">
                <div className="stat-number counter-number">
                  {Math.floor(counters.creators).toLocaleString()}+
                </div>
                <div className="stat-label">Creators</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-number counter-number">
                  ${Math.floor(counters.earned).toLocaleString()}
                </div>
                <div className="stat-label">Earned</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-number counter-number">
                  {Math.floor(counters.matches).toLocaleString()}
                </div>
                <div className="stat-label">Daily Matches</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {videoOpen && (
        <div className="video-modal" onClick={() => setVideoOpen(false)}>
          <div className="video-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setVideoOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="video-placeholder">
              <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <h3>Demo Video Coming Soon</h3>
              <p>See how SexySelfies works in action</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SwipeMatchMonetize;