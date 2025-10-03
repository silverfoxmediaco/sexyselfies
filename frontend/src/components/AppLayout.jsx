import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import BottomNavigation from './BottomNavigation';

const AppLayout = ({ children }) => {
  const { user, userRole } = useContext(AuthContext);
  const location = useLocation();
  const [shouldShowNavigation, setShouldShowNavigation] = useState(true);

  // Routes that should NOT show bottom navigation
  const noNavigationRoutes = [
    // Authentication routes
    '/creator/login',
    '/creator/register',
    '/creator/verify-id',
    '/member/login',
    '/member/register',
    '/admin/login',

    // Onboarding flow
    '/onboarding',

    // Profile setup flows (before navigation is ready)
    '/creator/profile-setup',
    '/creator/verification',

    // Full screen experiences
    '/creator/profile-preview',

    // Chat routes (have their own navigation)
    '/chat/',
    '/member/chat/',
    '/creator/chat/',
    '/member/messages/',
    '/creator/messages/',
  ];

  // Public routes that should show guest navigation
  const publicRoutesWithNavigation = [
    '/',
    '/landing',
    '/landing-v1',
    '/terms',
    '/privacy',
    '/help',
  ];

  // Special routes that have their own navigation or UI
  const specialRoutes = [
    '/terms', // TOS has its own header but needs bottom nav
    '/privacy', // Future privacy policy
  ];

  useEffect(() => {
    const currentPath = location.pathname;

    // Check if current route should not show navigation
    const shouldHideNav = noNavigationRoutes.some(route => {
      if (route.endsWith('/')) {
        return currentPath.startsWith(route);
      }
      return currentPath === route || currentPath.startsWith(route + '/');
    });

    if (shouldHideNav) {
      setShouldShowNavigation(false);
      return;
    }

    // For public routes or special routes, always show navigation
    const isPublicRoute = publicRoutesWithNavigation.includes(currentPath);
    const isSpecialRoute = specialRoutes.some(route => currentPath.startsWith(route));

    if (isPublicRoute || isSpecialRoute) {
      setShouldShowNavigation(true);
      return;
    }

    // For all other routes, show navigation if user is logged in
    setShouldShowNavigation(true);
  }, [location.pathname]);

  // Determine the appropriate user role for navigation
  const getNavigationUserRole = () => {
    // If user is logged in, use their actual role
    if (user && userRole) {
      return userRole;
    }

    // For public routes, show guest navigation
    const currentPath = location.pathname;
    const isPublicRoute = publicRoutesWithNavigation.some(route =>
      currentPath === route || currentPath.startsWith(route)
    );

    if (isPublicRoute) {
      return null; // Guest navigation
    }

    // Default to no navigation for unrecognized routes
    return userRole;
  };

  const navigationRole = getNavigationUserRole();

  return (
    <div className="AppLayout-container" style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main content area */}
      <main className="AppLayout-content" style={{
        flex: 1,
        paddingBottom: shouldShowNavigation ? '80px' : '0' // Space for bottom nav
      }}>
        {children}
      </main>

      {/* Conditional Bottom Navigation */}
      {shouldShowNavigation && (
        <BottomNavigation
          userRole={navigationRole}
          onRefresh={() => {
            // Handle refresh if needed
            window.location.reload();
          }}
          notificationCount={0} // TODO: Connect to real notification system
        />
      )}
    </div>
  );
};

export default AppLayout;