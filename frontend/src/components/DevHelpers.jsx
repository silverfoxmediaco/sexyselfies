import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

// ============================================
// DEVELOPMENT MODE TOGGLE
// Set this to true to bypass all authentication
// IMPORTANT: Set to false before production!
// ============================================
export const DEV_MODE = true; // Change to false for production

// Protected Route Component for Creators
export function ProtectedCreatorRoute({ children }) {
  // Skip protection in dev mode
  if (DEV_MODE) {
    return children;
  }
  
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token || userRole !== 'creator') {
    // Redirect to login if not authenticated
    return <Navigate to="/creator/login" replace />;
  }
  
  return children;
}

// Protected Route Component for Members
export function ProtectedMemberRoute({ children }) {
  // Skip protection in dev mode
  if (DEV_MODE) {
    return children;
  }
  
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token || userRole !== 'member') {
    // Redirect to login if not authenticated
    return <Navigate to="/member/login" replace />;
  }
  
  return children;
}

// Temporary placeholder component for routes that don't exist yet
export function ComingSoon({ title }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0A0A',
      color: '#FFFFFF',
      fontFamily: 'Poppins, sans-serif'
    }}>
      {DEV_MODE && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: '#FF6B6B',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          🔧 DEV MODE
        </div>
      )}
      <h1 style={{ fontSize: '48px', marginBottom: '16px', background: 'linear-gradient(135deg, #17D2C2, #12B7AB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h1>
      <p style={{ fontSize: '18px', color: '#C7C7CC', marginBottom: '32px' }}>This feature is coming soon!</p>
      <button 
        onClick={() => window.history.back()}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #17D2C2, #12B7AB)',
          color: '#000',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
      >
        Go Back
      </button>
    </div>
  );
}

// Minimized Dev Mode Indicator Component
export function DevModeIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  if (!DEV_MODE) return null;
  
  // Function to switch roles and navigate
  const switchRole = () => {
    const roles = ['creator', 'member', 'admin'];
    const currentRole = localStorage.getItem('userRole') || 'creator';
    const currentIndex = roles.indexOf(currentRole);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    
    // Update role
    localStorage.setItem('userRole', nextRole);
    
    // Navigate to appropriate default page for the new role
    let targetPath = '/';
    switch(nextRole) {
      case 'member':
        targetPath = '/member/browse-creators'; // Member homepage
        break;
      case 'creator':
        targetPath = '/creator/dashboard'; // Creator dashboard
        break;
      case 'admin':
        targetPath = '/admin/dashboard'; // Admin dashboard
        break;
    }
    
    console.log(`🔧 DEV MODE: Switched to ${nextRole} role, navigating to ${targetPath}`);
    
    // Navigate to the new page
    navigate(targetPath);
    
    // Force a page reload to ensure everything updates properly
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  // Minimized version - just a small floating button
  if (!isExpanded) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
        color: 'white',
        width: '40px',
        height: '40px',
        borderRadius: '20px',
        fontSize: '20px',
        fontWeight: '600',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(true)}
      title="Dev Mode Active - Click to expand"
      >
        🔧
      </div>
    );
  }
  
  // Expanded version
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span 
        style={{ cursor: 'pointer' }}
        onClick={() => setIsExpanded(false)}
        title="Click to minimize"
      >
        🔧
      </span>
      <div>
        <div>DEV MODE ACTIVE</div>
        <div style={{ fontSize: '11px', opacity: 0.9 }}>
          Role: {localStorage.getItem('userRole') || 'none'}
        </div>
      </div>
      <button
        onClick={switchRole}
        style={{
          marginLeft: '12px',
          padding: '4px 12px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '6px',
          color: 'white',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Switch Role
      </button>
      <button
        onClick={() => setIsExpanded(false)}
        style={{
          marginLeft: '8px',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.2)',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          lineHeight: 1
        }}
        title="Minimize"
      >
        ×
      </button>
    </div>
  );
}