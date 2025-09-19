import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SwipeConnectMonetize.css';
import logoImage from '../assets/sexysselfies_logo.png';

const SwipeConnectMonetize = () => {
  const navigate = useNavigate();
  const [videoOpen, setVideoOpen] = useState(false);
  const [counters, setCounters] = useState({
    creators: 0,
    earned: 0,
    connections: 0,
  });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    const targets = { creators: 102500, earned: 11850000, connections: 45000 };
    const increments = {
      creators: targets.creators / steps,
      earned: targets.earned / steps,
      connections: targets.connections / steps,
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setCounters(prev => ({
          creators: Math.min(
            prev.creators + increments.creators,
            targets.creators
          ),
          earned: Math.min(prev.earned + increments.earned, targets.earned),
          connections: Math.min(
            prev.connections + increments.connections,
            targets.connections
          ),
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
      <section className='hero-section'>
        <div className='container'>
          <div className='hero-content'>
            <div className='hero-logo'>
              <img
                src={logoImage}
                alt='SexySelfies Logo'
                className='logo-image'
              />
            </div>

            <div className='launch-chip pulse-animation'>
              <span className='chip-icon'>🚀</span>
              <span>Launching January 2026</span>
            </div>

            <h1 className='hero-title'>
              <span className='gradient-text'>A Sanctuary.</span>
              <span className='gradient-text-2'> For Sexy.</span>
              <span className='gradient-text-3'> Self Expression.</span>
            </h1>

            <p className='hero-description'>
              The content platform that combines Tinder's discovery with
              OnlyFans' economy.
              <span className='highlight-text'>
                {' '}
                Instagram Plus content only.
              </span>
            </p>

            <div className='hero-cta-group'>
              <button
                className='btn btn-primary btn-large btn-glow'
                onClick={() => navigate('/onboarding')}
              >
                <span>Get Started</span>
                <svg
                  className='btn-icon'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    d='M5 12h14m-7-7l7 7-7 7'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
              <button
                className='btn btn-secondary btn-large'
                onClick={() => navigate('/creator/register')}
              >
                <span>Start Earning Today</span>
              </button>
            </div>

            {/* Member Actions - Mobile Only */}
            <div className='member-actions mobile-only'>
              <button
                className='btn btn-secondary btn-large member-login-btn'
                onClick={() => navigate('/member/login')}
              >
                <svg
                  className='btn-icon'
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m10 17 5-5-5-5"></path>
                  <path d="M15 12H3"></path>
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                </svg>
                <span>Member Login</span>
              </button>
              <button
                className='btn btn-primary btn-large member-join-btn'
                onClick={() => navigate('/onboarding')}
              >
                <svg
                  className='btn-icon'
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" x2="19" y1="8" y2="14"></line>
                  <line x1="22" x2="16" y1="11" y2="11"></line>
                </svg>
                <span>Join Free</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className='social-proof'>
              <div className='stat-item'>
                <div className='stat-number counter-number'>
                  {Math.floor(counters.creators).toLocaleString()}+
                </div>
                <div className='stat-label'>Creators</div>
              </div>
              <div className='stat-divider' />
              <div className='stat-item'>
                <div className='stat-number counter-number'>
                  ${Math.floor(counters.earned).toLocaleString()}
                </div>
                <div className='stat-label'>Earned</div>
              </div>
              <div className='stat-divider' />
              <div className='stat-item'>
                <div className='stat-number counter-number'>
                  {Math.floor(counters.connections).toLocaleString()}
                </div>
                <div className='stat-label'>Daily Connections</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {videoOpen && (
        <div className='video-modal' onClick={() => setVideoOpen(false)}>
          <div className='video-content' onClick={e => e.stopPropagation()}>
            <button className='close-btn' onClick={() => setVideoOpen(false)}>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                <path
                  d='M18 6L6 18M6 6l12 12'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </button>
            <div className='video-placeholder'>
              <svg
                className='play-icon'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M8 5v14l11-7z' />
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

export default SwipeConnectMonetize;
