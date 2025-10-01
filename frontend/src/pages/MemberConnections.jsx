import React, { useState } from 'react';
import { Users } from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import SimpleConnectionsList from '../components/SimpleConnectionsList';
import ConnectionsStatsFilter from '../components/ConnectionsStatsFilter';
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
  const [activeFilter, setActiveFilter] = useState('total');

  // Handle filter change from stats component
  const handleFilterChange = (filterType) => {
    console.log('📊 MemberConnections: Filter changed to:', filterType);
    setActiveFilter(filterType);
  };

  console.log('🔄 MemberConnections: Rendering with isMobile:', isMobile, 'isDesktop:', isDesktop, 'activeFilter:', activeFilter);

  return (
    <div className='member-connections'>
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Stats Filter Component */}
      <ConnectionsStatsFilter
        onFilterChange={handleFilterChange}
        activeFilter={activeFilter}
      />

      {/* Filtered Connections List */}
      <SimpleConnectionsList filterType={activeFilter} />

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default MemberConnections;