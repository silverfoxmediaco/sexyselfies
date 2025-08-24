import React from 'react';
import './LandingPageV2.css';
import MainHeader from '../components/MainHeader';
import SwipeMatchMonetize from '../components/SwipeMatchMonetize';
import PhoneSampleImage from '../components/PhoneSampleImage';
import WhyCreatorsLoveUs from '../components/WhyCreatorsLoveUs';
import StartEarning from '../components/StartEarning';
import CreatorSuccessStories from '../components/CreatorSuccessStories';
import MainFAQ from '../components/MainFAQ';
import ReadyToStartEarning from '../components/ReadyToStartEarning';

const LandingPageV2 = () => {
  return (
    <div className="landing-page-v2">
      {/* Main Navigation Header */}
      <MainHeader />
      
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
        <div className="noise-overlay" />
      </div>

      {/* Hero Section Component */}
      <SwipeMatchMonetize />

      {/* Phone Demo Component */}
      <PhoneSampleImage />

      {/* Features Component */}
      <WhyCreatorsLoveUs />

      {/* Creator Benefits Component */}
      <StartEarning />

      {/* Testimonials Component */}
      <CreatorSuccessStories />

      {/* FAQ Component */}
      <MainFAQ />

      {/* Final CTA Component */}
      <ReadyToStartEarning />
    </div>
  );
};

export default LandingPageV2;