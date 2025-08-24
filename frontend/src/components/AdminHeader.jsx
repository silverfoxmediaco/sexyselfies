import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './AdminHeader.css';

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminData, setAdminData] = useState(null);
  const [stats, setStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get admin data from localStorage
    const storedAdminData = localStorage.getItem('adminData');
    if (storedAdminData) {
      setAdminData(JSON.parse(storedAdminData));
    }

    // Fetch stats for badges
    fetchStats();
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [location]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/admin/dashboard/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard Overview';
    if (path === '/admin/verifications') return 'ID Verifications';
    if (path === '/admin/reports') return 'Reports Management';
    if (path === '/admin/users') return 'User Management';
    if (path === '/admin/content') return 'Content Moderation';
    if (path === '/admin/admins') return 'Admin Management';
    return 'Admin Panel';
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="admin-header-navbar">
        <div className="admin-header-navbar-container">
          {/* Logo */}
          <Link to="/admin" className="admin-header-navbar-logo">
            <span className="admin-header-logo-icon">SS</span>
            <span className="admin-header-logo-text">Admin Panel</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="admin-header-navbar-menu admin-header-desktop-only">
            <Link 
              to="/admin" 
              className={`admin-header-nav-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link 
              to="/admin/verifications" 
              className={`admin-header-nav-link ${isActive('/admin/verifications') ? 'active' : ''}`}
            >
              <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/>
              </svg>
              <span>Verifications</span>
              {stats?.moderation?.pendingVerifications > 0 && (
                <span className="admin-header-nav-badge">{stats.moderation.pendingVerifications}</span>
              )}
            </Link>

            <Link 
              to="/admin/reports" 
              className={`admin-header-nav-link ${isActive('/admin/reports') ? 'active' : ''}`}
            >
              <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 9v2m0 4h.01M3 7l9-4 9 4v7c0 5-4 9-9 9s-9-4-9-9V7z" strokeWidth="2"/>
              </svg>
              <span>Reports</span>
              {stats?.moderation?.pendingReports > 0 && (
                <span className="admin-header-nav-badge">{stats.moderation.pendingReports}</span>
              )}
            </Link>

            <Link 
              to="/admin/users" 
              className={`admin-header-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2"/>
              </svg>
              <span>Users</span>
            </Link>

            <Link 
              to="/admin/content" 
              className={`admin-header-nav-link ${isActive('/admin/content') ? 'active' : ''}`}
            >
              <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/>
              </svg>
              <span>Content</span>
            </Link>

            {adminData?.role === 'superAdmin' && (
              <Link 
                to="/admin/admins" 
                className={`admin-header-nav-link ${isActive('/admin/admins') ? 'active' : ''}`}
              >
                <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/>
                </svg>
                <span>Admins</span>
              </Link>
            )}
          </div>

          {/* User Menu & Actions */}
          <div className="admin-header-navbar-actions">
            <button 
              className="admin-header-refresh-btn admin-header-desktop-only" 
              onClick={fetchStats}
              aria-label="Refresh stats"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>

            {/* Desktop User Dropdown */}
            <div className="admin-header-user-menu admin-header-desktop-only">
              <div className="admin-header-user-info">
                <span className="admin-header-user-avatar">
                  {adminData?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
                <div className="admin-header-user-details">
                  <span className="admin-header-user-name">{adminData?.name || 'Admin'}</span>
                  <span className="admin-header-user-role">{adminData?.role || 'admin'}</span>
                </div>
              </div>
              <button className="admin-header-logout-btn" onClick={handleLogout}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3h8v2H5v10h6v2H3a1 1 0 01-1-1V4a1 1 0 011-1zm10 6V6l5 4-5 4v-3H8V9h5z"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Hamburger Menu */}
            <button 
              className="admin-header-hamburger-menu admin-header-mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="admin-header-mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="admin-header-mobile-menu" onClick={(e) => e.stopPropagation()}>
              {/* User Info */}
              <div className="admin-header-mobile-user-info">
                <span className="admin-header-user-avatar">
                  {adminData?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
                <div className="admin-header-user-details">
                  <span className="admin-header-user-name">{adminData?.name || 'Admin'}</span>
                  <span className="admin-header-user-role">{adminData?.role || 'admin'}</span>
                </div>
              </div>

              {/* Mobile Navigation Links */}
              <div className="admin-header-mobile-nav-links">
                <Link 
                  to="/admin" 
                  className={`admin-header-mobile-nav-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                  </svg>
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/admin/verifications" 
                  className={`admin-header-mobile-nav-link ${isActive('/admin/verifications') ? 'active' : ''}`}
                >
                  <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/>
                  </svg>
                  <span>ID Verifications</span>
                  {stats?.moderation?.pendingVerifications > 0 && (
                    <span className="admin-header-nav-badge">{stats.moderation.pendingVerifications}</span>
                  )}
                </Link>

                <Link 
                  to="/admin/reports" 
                  className={`admin-header-mobile-nav-link ${isActive('/admin/reports') ? 'active' : ''}`}
                >
                  <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 9v2m0 4h.01M3 7l9-4 9 4v7c0 5-4 9-9 9s-9-4-9-9V7z" strokeWidth="2"/>
                  </svg>
                  <span>Reports</span>
                  {stats?.moderation?.pendingReports > 0 && (
                    <span className="admin-header-nav-badge">{stats.moderation.pendingReports}</span>
                  )}
                </Link>

                <Link 
                  to="/admin/users" 
                  className={`admin-header-mobile-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                >
                  <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2"/>
                  </svg>
                  <span>Users</span>
                </Link>

                <Link 
                  to="/admin/content" 
                  className={`admin-header-mobile-nav-link ${isActive('/admin/content') ? 'active' : ''}`}
                >
                  <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/>
                  </svg>
                  <span>Content</span>
                </Link>

                {adminData?.role === 'superAdmin' && (
                  <Link 
                    to="/admin/admins" 
                    className={`admin-header-mobile-nav-link ${isActive('/admin/admins') ? 'active' : ''}`}
                  >
                    <svg className="admin-header-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2"/>
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/>
                    </svg>
                    <span>Admin Management</span>
                  </Link>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="admin-header-mobile-actions">
                <button className="admin-header-mobile-refresh-btn" onClick={fetchStats}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>Refresh Data</span>
                </button>

                <button className="admin-header-mobile-logout-btn" onClick={handleLogout}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3h8v2H5v10h6v2H3a1 1 0 01-1-1V4a1 1 0 011-1zm10 6V6l5 4-5 4v-3H8V9h5z"/>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <div className="admin-header-page-header">
        <h1>{getPageTitle()}</h1>
        <p className="admin-header-page-subtitle">
          {location.pathname === '/admin' 
            ? `Welcome back, ${adminData?.name || 'Admin'}` 
            : 'Manage and monitor platform activities'}
        </p>
      </div>
    </>
  );
};

export default AdminHeader;