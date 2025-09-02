import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import './SwipeConnectMonetize.css';
import logo from '../assets/sexysselfies_logo.png';

const SwipeConnectMonetize = () => {
  const navigate = useNavigate();
  // Removed videoOpen state - no longer needed
  const [counters, setCounters] = useState({ creators: 0, earned: 0, connections: 0 });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    const targets = { creators: 102500, earned: 11850000, connections: 45000 };
    const increments = {
      creators: targets.creators / steps,
      earned: targets.earned / steps,
      connections: targets.connections / steps
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setCounters(prev => ({
          creators: Math.min(prev.creators + increments.creators, targets.creators),
          earned: Math.min(prev.earned + increments.earned, targets.earned),
          connections: Math.min(prev.connections + increments.connections, targets.connections)
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
            {/* Logo */}
            <Link to="/" className="swipe-hero-logo">
              <img 
                src={logo} 
                alt="SexySelfies" 
                className="swipe-hero-logo-img"
              />
            </Link>
            
            <div className="header-buttons">
              <Link to="/member/login" className="mainheader-btn-secondary">
                <LogIn size={18} />
                <span>Member Login</span>
              </Link>
              <Link to="/member/register" className="mainheader-btn-primary">
                <UserPlus size={18} />
                <span>Join Free</span>
              </Link>
            </div>
            <div className="launch-chip pulse-animation">
              <span className="chip-icon">🚀</span>
              <span>Launching January 2026</span>
            </div>
            
            <h1 className="hero-title">
              <span className="gradient-text">Swipe.</span>
              <span className="gradient-text-2"> Connect.</span>
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
              <button 
                className="btn btn-secondary btn-large"
                onClick={() => navigate('/creator/login')}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4m-5-4l5-5-5-5m5 5H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Already a Creator? Login Here</span>
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
                  {Math.floor(counters.connections).toLocaleString()}
                </div>
                <div className="stat-label">Daily Connections</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal removed - replaced with creator login button */}
    </>
  );
};

export default SwipeConnectMonetize;