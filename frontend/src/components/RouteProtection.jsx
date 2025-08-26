import React from 'react';
import { Navigate } from 'react-router-dom';

// Protected Route Component for Creators
export function ProtectedCreatorRoute({ children }) {
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
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token || userRole !== 'member') {
    // Redirect to login if not authenticated
    return <Navigate to="/member/login" replace />;
  }
  
  return children;
}

// Simple coming soon placeholder
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
      <h1 style={{ 
        fontSize: '48px', 
        marginBottom: '16px', 
        background: 'linear-gradient(135deg, #17D2C2, #12B7AB)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent' 
      }}>
        {title}
      </h1>
      <p style={{ fontSize: '18px', color: '#C7C7CC', marginBottom: '32px' }}>
        This feature is coming soon!
      </p>
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