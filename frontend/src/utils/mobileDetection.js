import { useState, useEffect } from 'react';

// Hook to detect mobile devices
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return isMobile;
};

// Get user role from localStorage
export const getUserRole = () => {
  return localStorage.getItem('userRole');
};