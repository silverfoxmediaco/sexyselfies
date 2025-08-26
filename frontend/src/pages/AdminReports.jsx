import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminHeader from '../components/AdminHeader';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './AdminReports.css';

const AdminReports = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, resolved, all
  const [actionNotes, setActionNotes] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState('');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/admin/moderation/reports`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: filter === 'all' ? undefined : filter }
        }
      );
      
      if (response.data.success) {
        setReports(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!selectedReport) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/admin/moderation/reports/${selectedReport._id}/resolve`,
        {
          action: action,
          reason: actionNotes || `Report ${action} by admin`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        // Refresh reports list
        await fetchReports();
        setSelectedReport(null);
        setShowActionModal(false);
        setActionNotes('');
        alert(`Report ${action} successfully!`);
      }
    } catch (error) {
      console.error('Failed to process action:', error);
      alert('Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  const prepareAction = (action) => {
    setCurrentAction(action);
    setShowActionModal(true);
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'admin-reports-severity-critical';
      case 'high': return 'admin-reports-severity-high';
      case 'medium': return 'admin-reports-severity-medium';
      case 'low': return 'admin-reports-severity-low';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'admin-reports-status-pending';
      case 'resolved': return 'admin-reports-status-resolved';
      case 'dismissed': return 'admin-reports-status-dismissed';
      default: return '';
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="admin-reports-loading">
          <div className="admin-reports-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Admin Navigation Header */}
      <AdminHeader />
      
      <div className="admin-reports-container">
        {/* Content Header */}
        <div className="admin-reports-header">
          <div>
            <h2>User Reports</h2>
            <p className="admin-reports-subtitle">{reports.length} {filter !== 'all' ? filter : ''} reports</p>
          </div>
          
          <div className="admin-reports-header-controls">
            <select 
              className="admin-reports-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="all">All Reports</option>
            </select>
            
            <button className="admin-reports-refresh-btn" onClick={fetchReports}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-reports-content">
          {/* Reports List */}
          <div className="admin-reports-list">
            {reports.length === 0 ? (
              <div className="admin-reports-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 9v2m0 4h.01M3 7l9-4 9 4v7c0 5-4 9-9 9s-9-4-9-9V7z" strokeWidth="2"/>
                </svg>
                <h3>No {filter !== 'all' ? filter : ''} reports</h3>
                <p>All reports have been handled</p>
              </div>
            ) : (
              reports.map(report => (
                <div 
                  key={report._id}
                  className={`admin-reports-item ${selectedReport?._id === report._id ? 'selected' : ''}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="admin-reports-main">
                    <div className="admin-reports-header-info">
                      <span className={`admin-reports-severity-badge ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                      <span className={`admin-reports-status-badge ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    
                    <div className="admin-reports-details">
                      <h4>{report.category}</h4>
                      <p className="admin-reports-reason">{report.reason}</p>
                      <div className="admin-reports-meta">
                        <span>Reported by: {report.reportedBy?.email || 'Unknown'}</span>
                        <span className="admin-reports-dot">•</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {report.reportedUser && (
                    <div className="admin-reports-reported-user">
                      <span className="admin-reports-label">Reported User:</span>
                      <span className="admin-reports-user-email">{report.reportedUser.email}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Report Details Panel */}
          {selectedReport && (
            <div className="admin-reports-details-panel">
              <div className="admin-reports-panel-header">
                <h2>Report Details</h2>
                <button 
                  className="admin-reports-close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </button>
              </div>

              <div className="admin-reports-panel-content">
                {/* Report Info */}
                <div className="admin-reports-detail-section">
                  <h3>Report Information</h3>
                  <div className="admin-reports-info-grid">
                    <div className="admin-reports-info-item">
                      <label>Category</label>
                      <p>{selectedReport.category}</p>
                    </div>
                    <div className="admin-reports-info-item">
                      <label>Severity</label>
                      <p className={getSeverityColor(selectedReport.severity)}>
                        {selectedReport.severity}
                      </p>
                    </div>
                    <div className="admin-reports-info-item">
                      <label>Status</label>
                      <p className={getStatusColor(selectedReport.status)}>
                        {selectedReport.status}
                      </p>
                    </div>
                    <div className="admin-reports-info-item">
                      <label>Reason</label>
                      <p>{selectedReport.reason}</p>
                    </div>
                    {selectedReport.details && (
                      <div className="admin-reports-info-item full-width">
                        <label>Additional Details</label>
                        <p>{selectedReport.details}</p>
                      </div>
                    )}
                    <div className="admin-reports-info-item">
                      <label>Reported Date</label>
                      <p>{new Date(selectedReport.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Reporter Info */}
                <div className="admin-reports-detail-section">
                  <h3>Reporter Information</h3>
                  <div className="admin-reports-info-grid">
                    <div className="admin-reports-info-item">
                      <label>Email</label>
                      <p>{selectedReport.reportedBy?.email || 'Unknown'}</p>
                    </div>
                    <div className="admin-reports-info-item">
                      <label>User Type</label>
                      <p>{selectedReport.reportedBy?.role || 'Member'}</p>
                    </div>
                  </div>
                </div>

                {/* Reported User Info */}
                {selectedReport.reportedUser && (
                  <div className="admin-reports-detail-section">
                    <h3>Reported User</h3>
                    <div className="admin-reports-info-grid">
                      <div className="admin-reports-info-item">
                        <label>Email</label>
                        <p>{selectedReport.reportedUser.email}</p>
                      </div>
                      <div className="admin-reports-info-item">
                        <label>User ID</label>
                        <p className="admin-reports-user-id">{selectedReport.reportedUser._id}</p>
                      </div>
                      {selectedReport.reportedUser.strikes !== undefined && (
                        <div className="admin-reports-info-item">
                          <label>Current Strikes</label>
                          <p className="admin-reports-strikes">{selectedReport.reportedUser.strikes}/3</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reported Content */}
                {selectedReport.reportedContent && (
                  <div className="admin-reports-detail-section">
                    <h3>Reported Content</h3>
                    <div className="admin-reports-content-preview">
                      {selectedReport.reportedContent.type === 'image' ? (
                        <img 
                          src={selectedReport.reportedContent.url} 
                          alt="Reported content"
                          className="admin-reports-reported-image"
                        />
                      ) : (
                        <div className="admin-reports-content-info">
                          <p><strong>Type:</strong> {selectedReport.reportedContent.type}</p>
                          <p><strong>Content ID:</strong> {selectedReport.reportedContent._id}</p>
                          {selectedReport.reportedContent.description && (
                            <p><strong>Description:</strong> {selectedReport.reportedContent.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action History */}
                {selectedReport.actionHistory && selectedReport.actionHistory.length > 0 && (
                  <div className="admin-reports-detail-section">
                    <h3>Action History</h3>
                    <div className="admin-reports-action-history">
                      {selectedReport.actionHistory.map((action, index) => (
                        <div key={index} className="admin-reports-history-item">
                          <span className="admin-reports-history-action">{action.action}</span>
                          <span className="admin-reports-history-admin">by {action.adminEmail}</span>
                          <span className="admin-reports-history-date">
                            {new Date(action.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedReport.status === 'pending' && (
                  <div className="admin-reports-panel-actions">
                    <button 
                      className="admin-reports-action-btn dismiss"
                      onClick={() => prepareAction('dismiss')}
                      disabled={processing}
                    >
                      Dismiss Report
                    </button>
                    <button 
                      className="admin-reports-action-btn warning"
                      onClick={() => prepareAction('warning')}
                      disabled={processing}
                    >
                      Issue Warning
                    </button>
                    <button 
                      className="admin-reports-action-btn suspend"
                      onClick={() => prepareAction('suspend')}
                      disabled={processing}
                    >
                      Suspend User
                    </button>
                    <button 
                      className="admin-reports-action-btn ban"
                      onClick={() => prepareAction('ban')}
                      disabled={processing}
                    >
                      Ban User
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && (
          <div className="admin-reports-modal-overlay" onClick={() => setShowActionModal(false)}>
            <div className="admin-reports-modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Action: {currentAction.replace('_', ' ').toUpperCase()}</h2>
              <p>Please provide notes for this action:</p>
              
              <textarea
                className="admin-reports-action-notes"
                placeholder="Enter reason for this action..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows="4"
              />
              
              <div className="admin-reports-modal-actions">
                <button 
                  className="admin-reports-modal-btn cancel"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="admin-reports-modal-btn confirm"
                  onClick={() => handleAction(currentAction)}
                  disabled={processing}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default AdminReports;