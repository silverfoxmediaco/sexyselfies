import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminHeader from '../components/AdminHeader';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './AdminVerifications.css';

const AdminVerifications = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [verifications, setVerifications] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, today, week
  const [imageModal, setImageModal] = useState({ show: false, url: '' });

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/verification/pending`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setVerifications(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (creator) => {
    if (!window.confirm('Are you sure you want to approve this creator?')) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Call the notification endpoint for approval
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/approve-verification`,
        { userId: creator.user._id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Remove from list
      setVerifications(prev => prev.filter(v => v._id !== creator._id));
      setSelectedCreator(null);
      
      // Show success message
      alert('Creator approved successfully! They will receive an email notification.');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve creator');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Call the notification endpoint for rejection
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/reject-verification`,
        { 
          userId: selectedCreator.user._id,
          reason: rejectionReason 
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Remove from list
      setVerifications(prev => prev.filter(v => v._id !== selectedCreator._id));
      setSelectedCreator(null);
      setShowRejectionModal(false);
      setRejectionReason('');
      
      // Show success message
      alert('Creator rejected. They will receive an email with the reason.');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject creator');
    } finally {
      setProcessing(false);
    }
  };

  const openImageModal = (url) => {
    setImageModal({ show: true, url });
  };

  const closeImageModal = () => {
    setImageModal({ show: false, url: '' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedCreator || processing) return;
      
      if (e.key === 'a' || e.key === 'A') {
        handleApprove(selectedCreator);
      } else if (e.key === 'r' || e.key === 'R') {
        setShowRejectionModal(true);
      } else if (e.key === 'Escape') {
        setSelectedCreator(null);
        setShowRejectionModal(false);
        closeImageModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCreator, processing]);

  const filteredVerifications = verifications.filter(v => {
    if (filter === 'all') return true;
    const submittedAt = new Date(v.verificationSubmittedAt);
    const now = new Date();
    
    if (filter === 'today') {
      return submittedAt.toDateString() === now.toDateString();
    } else if (filter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return submittedAt >= weekAgo;
    }
    return true;
  });

  // Helper function to get document info
  const getDocumentInfo = (creator) => {
    const docs = [];
    if (creator.verification) {
      if (creator.verification.idFrontUrl) {
        docs.push({ 
          url: creator.verification.idFrontUrl, 
          type: 'ID Front',
          label: 'Document 1'
        });
      }
      if (creator.verification.idBackUrl) {
        docs.push({ 
          url: creator.verification.idBackUrl, 
          type: 'ID Back',
          label: 'Document 2'
        });
      }
      if (creator.verification.selfieUrl) {
        docs.push({ 
          url: creator.verification.selfieUrl, 
          type: 'Selfie with ID',
          label: 'Document 3'
        });
      }
    }
    return docs;
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="verifications-loading">
          <div className="spinner"></div>
          <p>Loading verifications...</p>
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
      
      <div className="admin-verifications">
        {/* Content Header */}
        <div className="verifications-header">
          <div>
            <h2>Pending Reviews</h2>
            <p className="subtitle">{filteredVerifications.length} creators awaiting verification</p>
          </div>
          
          <div className="header-controls">
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
            
            <button className="refresh-btn" onClick={fetchPendingVerifications}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="verifications-content">
          {/* List */}
          <div className="verifications-list">
            {filteredVerifications.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/>
                </svg>
                <h3>No pending verifications</h3>
                <p>All creator verifications have been reviewed</p>
              </div>
            ) : (
              filteredVerifications.map(creator => {
                const documents = getDocumentInfo(creator);
                return (
                  <div 
                    key={creator._id}
                    className={`verification-item ${selectedCreator?._id === creator._id ? 'selected' : ''}`}
                    onClick={() => setSelectedCreator(creator)}
                  >
                    <div className="creator-info">
                      <div className="creator-avatar">
                        {(creator.displayName || creator.user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="creator-details">
                        <h4>{creator.displayName || 'No stage name'}</h4>
                        <p>{creator.user?.email}</p>
                        <span className="submission-time">
                          Submitted {creator.verificationSubmittedAt ? 
                            new Date(creator.verificationSubmittedAt).toLocaleDateString() : 
                            'Invalid Date'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="verification-status">
                      <span className="status-badge pending">PENDING REVIEW</span>
                      <span className="doc-count">
                        {documents.length} documents
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details Panel */}
          {selectedCreator && (
            <div className="verification-details">
              <div className="details-header">
                <h2>Verification Details</h2>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedCreator(null)}
                >
                  ✕
                </button>
              </div>

              <div className="details-content">
                {/* Creator Info */}
                <div className="detail-section">
                  <h3>Creator Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Stage Name</label>
                      <p>{selectedCreator.displayName || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p>{selectedCreator.user?.email}</p>
                    </div>
                    <div className="info-item">
                      <label>Registration Date</label>
                      <p>{selectedCreator.user?.createdAt ? 
                        new Date(selectedCreator.user.createdAt).toLocaleDateString() : 
                        'Unknown'
                      }</p>
                    </div>
                    <div className="info-item">
                      <label>Submission Date</label>
                      <p>{selectedCreator.verificationSubmittedAt ? 
                        new Date(selectedCreator.verificationSubmittedAt).toLocaleString() : 
                        'Unknown'
                      }</p>
                    </div>
                    <div className="info-item">
                      <label>User ID</label>
                      <p style={{ fontSize: '12px', opacity: 0.7 }}>{selectedCreator.user?._id}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="detail-section">
                  <h3>Verification Documents</h3>
                  <div className="documents-grid">
                    {getDocumentInfo(selectedCreator).map((doc, index) => (
                      <div key={index} className="document-item" onClick={() => openImageModal(doc.url)}>
                        <div className="document-preview">
                          <img src={doc.url} alt={doc.type} />
                          <div className="document-overlay">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M15 3v4a3 3 0 003 3h4m-8-7H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V8l-6-5z"/>
                            </svg>
                            <span>Click to view</span>
                          </div>
                        </div>
                        <div className="document-info">
                          <span className="document-type">{doc.type}</span>
                          <span className="document-label">{doc.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="detail-actions">
                  <button 
                    className="action-btn approve"
                    onClick={() => handleApprove(selectedCreator)}
                    disabled={processing}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    Approve Creator
                  </button>
                  
                  <button 
                    className="action-btn reject"
                    onClick={() => setShowRejectionModal(true)}
                    disabled={processing}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                    </svg>
                    Reject
                  </button>
                </div>

                <div className="keyboard-hints">
                  <span><kbd>A</kbd> Approve</span>
                  <span><kbd>R</kbd> Reject</span>
                  <span><kbd>ESC</kbd> Close</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="modal-overlay" onClick={() => setShowRejectionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Reject Verification</h2>
              <p>Please provide a reason for rejection:</p>
              
              <div className="rejection-reasons">
                <button 
                  className="reason-btn"
                  onClick={() => setRejectionReason('ID document is unclear or illegible')}
                >
                  Unclear ID
                </button>
                <button 
                  className="reason-btn"
                  onClick={() => setRejectionReason('ID appears to be expired')}
                >
                  Expired ID
                </button>
                <button 
                  className="reason-btn"
                  onClick={() => setRejectionReason('Face does not match ID photo')}
                >
                  Face Mismatch
                </button>
                <button 
                  className="reason-btn"
                  onClick={() => setRejectionReason('Missing required documentation')}
                >
                  Missing Documents
                </button>
              </div>
              
              <textarea
                className="rejection-textarea"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
              />
              
              <div className="modal-actions">
                <button 
                  className="modal-btn cancel"
                  onClick={() => setShowRejectionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn confirm"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || processing}
                >
                  Reject Creator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {imageModal.show && (
          <div className="image-modal-overlay" onClick={closeImageModal}>
            <div className="image-modal-content">
              <img src={imageModal.url} alt="Document" />
              <button className="image-modal-close" onClick={closeImageModal}>
                ✕
              </button>
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

export default AdminVerifications;