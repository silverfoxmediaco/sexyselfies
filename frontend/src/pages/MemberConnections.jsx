import React from 'react';
import { Users } from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import SimpleConnectionsList from '../components/SimpleConnectionsList';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './MemberConnections.css';

const MemberConnections = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  return (
    <div className='member-connections'>
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* ONLY the connections list component - no page headers */}
      <SimpleConnectionsList />

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default MemberConnections;