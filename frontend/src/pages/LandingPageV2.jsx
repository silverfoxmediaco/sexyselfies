import React from 'react';
import './LandingPageV2.css';
import MainHeader from '../components/MainHeader';
import SwipeConnectMonetize from '../components/SwipeConnectMonetize';
import PhoneSampleImage from '../components/PhoneSampleImage';
import WhyCreatorsLoveUs from '../components/WhyCreatorsLoveUs';
import StartEarning from '../components/StartEarning';
import CreatorSuccessStories from '../components/CreatorSuccessStories';
import MainFAQ from '../components/MainFAQ';
import ReadyToStartEarning from '../components/ReadyToStartEarning';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';

const LandingPageV2 = () => {
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  
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
      <SwipeConnectMonetize />

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
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default LandingPageV2;