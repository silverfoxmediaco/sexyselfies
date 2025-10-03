import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MemberWallet from '../components/Wallet/MemberWallet';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './MemberBilling.css';

const MemberBilling = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="MemberBilling-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Mobile Header */}
      {isMobile && (
        <div className="MemberBilling-mobile-header">
          <button onClick={handleBack} className="MemberBilling-back-btn">
            <ArrowLeft size={20} />
          </button>
          <h1>Wallet & Billing</h1>
          <div></div> {/* Spacer for center alignment */}
        </div>
      )}

      {/* Main Content */}
      <div className="MemberBilling-content">
        <MemberWallet />
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default MemberBilling;