import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import MainHeader from './MainHeader';
import MainFooter from './MainFooter';
import { DevModeIndicator, DEV_MODE } from './DevHelpers';
import './AppLayout.css';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Pages where we hide navigation elements
  const hideNavPages = [
    '/admin',  // Admin pages have their own header
    '/creator/verify-id',
    '/member/onboarding',
    '/creator/login',
    '/member/login',
    '/creator/register',
    '/member/register'
  ];

  // Pages where we hide the header
  const hideHeaderPages = [
    '/member/browse-creators',
    '/creator/browse-members',
    '/creator/upload'
  ];

  // Full screen pages (no padding)
  const fullScreenPages = [
    '/member/browse-creators',
    '/creator/browse-members',
    '/admin',
    '/creator/upload'
  ];

  // Pages where we ALWAYS show bottom nav (even on desktop)
  const alwaysShowBottomNavPages = [
    '/creator/dashboard',
    '/creator/browse-members',
    '/creator/messages',
    '/creator/profile',
    '/creator/analytics',
    '/creator/earnings',
    '/creator/content',
    '/creator/members',
    '/member/browse-creators',
    '/member/profile',
    '/creator/matches',
    '/creator/sales',
    '/creator/settings'
  ];

  useEffect(() => {
    // Check viewport size
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Add resize listener
    window.addEventListener('resize', checkViewport);

    // Update role when it changes
    const handleStorageChange = () => {
      setUserRole(localStorage.getItem('userRole'));
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update on location change
  useEffect(() => {
    // In DEV_MODE, auto-set role based on current path
    if (DEV_MODE) {
      const path = location.pathname;
      let newRole = localStorage.getItem('userRole');
      
      // Auto-detect role from URL
      if (path.startsWith('/admin')) {
        newRole = 'admin';
      } else if (path.startsWith('/creator')) {
        newRole = 'creator';
      } else if (path.startsWith('/member')) {
        newRole = 'member';
      }
      
      // Update role if it changed
      const currentRole = localStorage.getItem('userRole');
      if (newRole && newRole !== currentRole) {
        localStorage.setItem('userRole', newRole);
        console.log(`🔧 DEV MODE: Auto-switched to ${newRole} role based on URL`);
      }
      
      setUserRole(newRole);
    } else {
      // Production mode - just get the stored role
      setUserRole(localStorage.getItem('userRole'));
    }
  }, [location]);

  // Determine what to show
  const shouldHideNav = hideNavPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page)
  );
  
  const shouldHideHeader = hideHeaderPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page)
  );
  
  const isFullScreen = fullScreenPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page)
  );

  const shouldAlwaysShowBottomNav = alwaysShowBottomNavPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page)
  );

  const isAdminPage = location.pathname.startsWith('/admin');
  
  // Show bottom nav on mobile OR on pages that always need it (like creator dashboard)
  const showBottomNav = !shouldHideNav && userRole && !isAdminPage && (isMobile || shouldAlwaysShowBottomNav);
  const showHeader = !shouldHideHeader && !isAdminPage; // Don't show MainHeader on admin pages
  const showFooter = !isMobile && !isFullScreen && location.pathname === '/';

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <div className="app-layout mobile-layout">
        <DevModeIndicator />
        
        {/* Mobile Header - Show when needed */}
        {showHeader && <MainHeader />}
        
        {/* Main Content */}
        <main className={`
          app-content 
          mobile-content
          ${showBottomNav ? 'with-bottom-nav' : ''} 
          ${showHeader ? 'with-header' : ''}
          ${isFullScreen ? 'full-screen' : ''}
          ${isAdminPage ? 'admin-content' : ''}
        `}>
          {children}
        </main>

        {/* Bottom Navigation - Mobile Only */}
        {showBottomNav && <BottomNavigation userRole={userRole} />}
      </div>
    );
  }

  // DESKTOP LAYOUT
  return (
    <div className="app-layout desktop-layout">
      <DevModeIndicator />
      
      {/* Desktop Header - Not on admin pages */}
      {showHeader && <MainHeader />}
      
      {/* Main Content */}
      <main className={`
        app-content 
        desktop-content
        ${showBottomNav ? 'with-bottom-nav' : ''} 
        ${showHeader ? 'with-header' : ''}
        ${showFooter ? 'with-footer' : ''}
        ${isFullScreen ? 'full-screen' : ''}
        ${isAdminPage ? 'admin-content' : ''}
      `}>
        {children}
      </main>
      
      {/* Bottom Navigation - Now shows on desktop for certain pages */}
      {showBottomNav && <BottomNavigation userRole={userRole} />}
      
      {/* Desktop Footer - Only on landing page */}
      {showFooter && <MainFooter />}
    </div>
  );
};

export default AppLayout;