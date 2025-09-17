import React from 'react';
import './WhyCreatorsLoveUs.css';

const WhyCreatorsLoveUs = () => {
  const features = [
    {
      icon: '👆',
      title: 'Swipe to Connect',
      description:
        'Unlimited swipes. Find your perfect audience with smart filters.',
      color: '#17D2C2',
    },
    {
      icon: '💰',
      title: 'Micro-Transactions',
      description: 'No subscriptions. Pay only for content you want.',
      color: '#22C55E',
    },
    {
      icon: '✓',
      title: 'Safe & Verified',
      description: 'AI moderation and ID verification for all creators.',
      color: '#38BDF8',
    },
    {
      icon: '🏳️‍🌈',
      title: 'All Inclusive',
      description: 'LGBTQ+ friendly. All orientations, all body types welcome.',
      color: '#F59E0B',
    },
  ];

  return (
    <section className='features-section'>
      <div className='container'>
        <div className='section-header'>
          <h2>Why Creators Love Us</h2>
          <p>Everything you need to monetize your content, your way</p>
        </div>

        <div className='features-grid'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='feature-card glass-card slide-up'
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className='feature-icon'
                style={{ background: `${feature.color}20` }}
              >
                <span style={{ fontSize: '32px' }}>{feature.icon}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyCreatorsLoveUs;
