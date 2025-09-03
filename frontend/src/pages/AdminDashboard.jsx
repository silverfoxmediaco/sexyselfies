import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import api from '../services/api.config';
import AdminHeader from '../components/AdminHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    fetchDashboardStats();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Admin Header Navigation */}
      <AdminHeader />

      {/* Main Dashboard Content */}
      <main className="admin-main-content">
        {/* Dashboard Content - Stats Overview */}
        {location.pathname === '/admin' && !loading && (
          <div className="dashboard-content">
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="stat-details">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats?.users?.total || 0}</p>
                  <span className="stat-meta">
                    {stats?.users?.creators || 0} creators, {stats?.users?.members || 0} members
                  </span>
                </div>
              </div>

              <div className={`stat-card ${stats?.moderation?.pendingVerifications > 0 ? 'alert-card' : ''}`}>
                <div className="stat-icon verifications">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  {stats?.moderation?.pendingVerifications > 0 && (
                    <span className="alert-badge">{stats.moderation.pendingVerifications}</span>
                  )}
                </div>
                <div className="stat-details">
                  <h3>Pending Verifications</h3>
                  <p className="stat-number">{stats?.moderation?.pendingVerifications || 0}</p>
                  <span className="stat-meta">
                    {stats?.moderation?.pendingVerifications > 0 
                      ? 'Requires immediate attention' 
                      : 'All caught up!'
                    }
                  </span>
                </div>
                {stats?.moderation?.pendingVerifications > 0 && (
                  <Link to="/admin/verifications" className="stat-action-btn">
                    Review Now →
                  </Link>
                )}
              </div>

              <div className="stat-card">
                <div className="stat-icon reports">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                </div>
                <div className="stat-details">
                  <h3>Pending Reports</h3>
                  <p className="stat-number">{stats?.moderation?.pendingReports || 0}</p>
                  <span className="stat-meta">Require attention</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon revenue">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.69 0-2.51-5.3-1.32-5.3-5.16 0-1.81 1.11-3.16 2.93-3.51V4h2.67v1.97c1.63.39 2.75 1.48 2.85 3.08h-1.96c-.05-.64-.42-1.32-1.56-1.32-1.03 0-1.51.52-1.51 1.34 0 2.51 5.3 1.23 5.3 5.08 0 1.98-1.35 3.35-3.21 3.44z"/>
                  </svg>
                </div>
                <div className="stat-details">
                  <h3>24h Revenue</h3>
                  <p className="stat-number">${stats?.financials?.last24Hours?.total || 0}</p>
                  <span className="stat-meta">{stats?.financials?.last24Hours?.count || 0} transactions</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <Link to="/admin/verifications" className="admin-dashboard-action-btn primary">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                  Review Verifications
                </Link>
                <Link to="/admin/reports" className="admin-dashboard-action-btn warning">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  Handle Reports
                </Link>
                <Link to="/admin/users" className="admin-dashboard-action-btn info">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                  Manage Users
                </Link>
              </div>
            </div>

            {/* High Risk Users */}
            {stats?.moderation?.highRiskUsers?.length > 0 && (
              <div className="high-risk-section">
                <h2>High Risk Users</h2>
                <div className="risk-list">
                  {stats.moderation.highRiskUsers.map(user => (
                    <div key={user._id} className="risk-item">
                      <span className="risk-email">{user.email}</span>
                      <div className="risk-info">
                        <span className="risk-score">Risk: {user.riskScore}/100</span>
                        <span className="risk-strikes">{user.strikes} strikes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outlet for nested routes */}
        {location.pathname !== '/admin' && <Outlet />}
      </main>
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default AdminDashboard;