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
  const [sessionStats, setSessionStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    fetchDashboardStats();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch regular dashboard stats
      const response = await api.get('/admin/dashboard/stats');
      
      if (response.success) {
        setStats(response.data);
      }

      // Fetch session analytics
      try {
        const sessionResponse = await api.get('/sessions/admin/analytics?days=1');
        if (sessionResponse.success) {
          setSessionStats(sessionResponse.data);
        }
      } catch (sessionError) {
        console.error('Failed to fetch session stats:', sessionError);
        // Don't fail the entire dashboard if session stats fail
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
        {(location.pathname === '/admin' || location.pathname === '/admin/dashboard') && !loading && (
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

              <div className="stat-card">
                <div className="stat-icon sessions">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 13.5l3.5 2.5L12 18.5 8.5 16l3.5-2.5z"/>
                  </svg>
                </div>
                <div className="stat-details">
                  <h3>Active Sessions</h3>
                  <p className="stat-number">{sessionStats?.activeSessions || 0}</p>
                  <span className="stat-meta">{sessionStats?.totalSessions || 0} total today</span>
                </div>
              </div>

              {sessionStats?.security?.totalSuspiciousActivities > 0 && (
                <div className="stat-card alert-card">
                  <div className="stat-icon security">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z"/>
                    </svg>
                    {sessionStats.security.totalSuspiciousActivities > 0 && (
                      <span className="alert-badge">{sessionStats.security.totalSuspiciousActivities}</span>
                    )}
                  </div>
                  <div className="stat-details">
                    <h3>Security Alerts</h3>
                    <p className="stat-number">{sessionStats.security.totalSuspiciousActivities}</p>
                    <span className="stat-meta">Suspicious activities detected</span>
                  </div>
                </div>
              )}
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

            {/* Session Analytics */}
            {sessionStats && (
              <div className="session-analytics">
                <h2>Session Analytics (24h)</h2>
                
                {/* Platform Activity Overview */}
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h3>Platform Activity</h3>
                    <div className="analytics-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Avg Session Duration</span>
                        <span className="metric-value">{sessionStats.avgDurationMinutes?.toFixed(1) || 0} min</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Unique Users</span>
                        <span className="metric-value">{sessionStats.uniqueUsers || 0}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Total Activities</span>
                        <span className="metric-value">{sessionStats.totalActivities || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3>Device Breakdown</h3>
                    <div className="device-stats">
                      {sessionStats.deviceBreakdown?.map((device, index) => (
                        <div key={index} className="device-item">
                          <span className="device-type">{device._id || 'Unknown'}</span>
                          <div className="device-bar">
                            <div 
                              className="device-fill" 
                              style={{ width: `${(device.count / sessionStats.totalSessions * 100)}%` }}
                            ></div>
                            <span className="device-count">{device.count}</span>
                          </div>
                        </div>
                      )) || (
                        <div className="no-data">No device data available</div>
                      )}
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3>User Type Activity</h3>
                    <div className="user-type-stats">
                      {sessionStats.userTypeBreakdown?.map((userType, index) => (
                        <div key={index} className="user-type-item">
                          <div className="user-type-header">
                            <span className="user-type-label">{userType._id}</span>
                            <span className="user-type-count">{userType.count} sessions</span>
                          </div>
                          <div className="user-type-details">
                            <span>Avg: {userType.avgDuration?.toFixed(1) || 0}min</span>
                            {userType.totalRevenue && (
                              <span>Revenue: ${userType.totalRevenue?.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      )) || (
                        <div className="no-data">No user type data available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Peak Hours */}
                {sessionStats.peakHours && sessionStats.peakHours.length > 0 && (
                  <div className="peak-hours-section">
                    <h3>Peak Activity Hours</h3>
                    <div className="peak-hours-list">
                      {sessionStats.peakHours.slice(0, 3).map((hour, index) => (
                        <div key={index} className="peak-hour-item">
                          <span className="hour-time">
                            {hour._id === 0 ? '12 AM' : 
                             hour._id === 12 ? '12 PM' : 
                             hour._id > 12 ? `${hour._id - 12} PM` : `${hour._id} AM`}
                          </span>
                          <span className="hour-sessions">{hour.sessions} sessions</span>
                          <span className="hour-duration">Avg: {hour.avgDuration?.toFixed(1) || 0}min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
        {location.pathname !== '/admin' && location.pathname !== '/admin/dashboard' && <Outlet />}
      </main>
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default AdminDashboard;