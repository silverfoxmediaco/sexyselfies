import React from 'react';
import './StartEarning.css';

const StartEarning = () => {
  const creatorBenefits = [
    { text: '80% revenue share', icon: '📈' },
    { text: 'Weekly payouts', icon: '💳' },
    { text: 'No explicit content required', icon: '🔒' },
    { text: 'Set your own prices', icon: '💎' },
  ];

  return (
    <section className='creator-section'>
      <div className='container'>
        <div className='creator-content'>
          <div className='creator-info-column'>
            <h2>Start Earning in Minutes</h2>
            <p className='section-description'>
              No professional equipment needed. Just your phone and your
              confidence.
            </p>
            <div className='benefits-list'>
              {creatorBenefits.map((benefit, index) => (
                <div key={index} className='benefit-item'>
                  <span className='benefit-icon'>{benefit.icon}</span>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
            <button className='btn btn-primary btn-large btn-glow'>
              <span>Become a Creator</span>
              <svg
                className='btn-icon'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <path
                  d='M13 7l5 5m0 0l-5 5m5-5H6'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </button>
          </div>

          <div className='stats-card-container'>
            <div className='stats-card glass-card floating-card'>
              <div className='stats-main'>
                <div className='stats-percentage gradient-text'>80%</div>
                <div className='stats-label'>Revenue Share</div>
              </div>
              <div className='stats-divider' />
              <div className='stats-details'>
                <div className='stat-row'>
                  <span>Avg. Creator Income</span>
                  <span className='stat-value'>$3,500/mo</span>
                </div>
                <div className='stat-row'>
                  <span>Top Creator Income</span>
                  <span className='stat-value'>$25,000/mo</span>
                </div>
                <div className='stat-row'>
                  <span>Payout Schedule</span>
                  <span className='stat-value'>Weekly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartEarning;
