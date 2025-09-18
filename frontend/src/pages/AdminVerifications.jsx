import React, { useState, useEffect } from 'react';
import api from '../services/api.config';
import AdminHeader from '../components/AdminHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import VerificationModal from '../components/VerificationModal';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './AdminVerifications.css';

const AdminVerifications = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [verifications, setVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const response = await api.get('/verification/pending');

      if (response.success) {
        setVerifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async userId => {
    try {
      // Call the notification endpoint for approval
      await api.post('/notifications/approve-verification', {
        userId: userId,
      });

      // Remove from list and close modal
      setVerifications(prev => prev.filter(v => v.user?._id !== userId));
      setShowModal(false);
      setSelectedVerification(null);

      // Show success message
      alert(
        'Creator approved successfully! They will receive an email notification.'
      );
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve creator');
      throw error;
    }
  };

  const handleReject = async (userId, reason) => {
    try {
      // Call the notification endpoint for rejection
      await api.post('/notifications/reject-verification', {
        userId: userId,
        reason: reason,
      });

      // Remove from list and close modal
      setVerifications(prev => prev.filter(v => v.user?._id !== userId));
      setShowModal(false);
      setSelectedVerification(null);

      // Show success message
      alert('Creator rejected. They will receive an email with the reason.');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject creator');
      throw error;
    }
  };

  const openVerificationModal = verification => {
    setSelectedVerification(verification);
    setShowModal(true);
  };

  const closeVerificationModal = () => {
    setShowModal(false);
    setSelectedVerification(null);
  };

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

  // Transform creator data to modal format
  const transformVerificationData = creator => {
    const docs = [];
    if (creator.verification) {
      if (creator.verification.idFrontUrl) {
        docs.push({
          url: creator.verification.idFrontUrl,
          type: 'ID Front',
        });
      }
      if (creator.verification.idBackUrl) {
        docs.push({
          url: creator.verification.idBackUrl,
          type: 'ID Back',
        });
      }
      if (creator.verification.selfieUrl) {
        docs.push({
          url: creator.verification.selfieUrl,
          type: 'Selfie with ID',
        });
      }
    }

    return {
      userId: creator.user?._id,
      displayName: creator.displayName,
      email: creator.user?.email,
      registrationDate: creator.user?.createdAt,
      submissionDate: creator.verificationSubmittedAt,
      documents: docs,
    };
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className='verifications-loading'>
          <div className='spinner'></div>
          <p>Loading verifications...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Admin Navigation Header */}
      <AdminHeader />

      <div className='admin-verifications'>
        {/* Content Header */}
        <div className='verifications-header'>
          <div>
            <h2>Pending Reviews</h2>
            <p className='subtitle'>
              {filteredVerifications.length} creators awaiting verification
            </p>
          </div>

          <div className='header-controls'>
            <select
              className='filter-select'
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value='all'>All Time</option>
              <option value='today'>Today</option>
              <option value='week'>This Week</option>
            </select>

            <button className='refresh-btn' onClick={fetchPendingVerifications}>
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className='verifications-content'>
          {/* List */}
          <div className='verifications-list'>
            {filteredVerifications.length === 0 ? (
              <div className='empty-state'>
                <svg
                  width='64'
                  height='64'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    strokeWidth='2'
                  />
                </svg>
                <h3>No pending verifications</h3>
                <p>All creator verifications have been reviewed</p>
              </div>
            ) : (
              filteredVerifications.map(creator => {
                const verificationData = transformVerificationData(creator);
                return (
                  <div
                    key={creator._id}
                    className='verification-item'
                    onClick={() => openVerificationModal(verificationData)}
                  >
                    <div className='creator-info'>
                      <div className='creator-avatar'>
                        {(creator.displayName || creator.user?.email || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className='creator-details'>
                        <h4>{creator.displayName || 'No stage name'}</h4>
                        <p>{creator.user?.email}</p>
                        <span className='submission-time'>
                          Submitted{' '}
                          {creator.verificationSubmittedAt
                            ? new Date(
                                creator.verificationSubmittedAt
                              ).toLocaleDateString()
                            : 'Invalid Date'}
                        </span>
                      </div>
                    </div>
                    <div className='verification-status'>
                      <span className='status-badge pending'>
                        PENDING REVIEW
                      </span>
                      <span className='doc-count'>
                        {verificationData.documents.length} documents
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Verification Modal */}
        <VerificationModal
          verification={selectedVerification}
          isOpen={showModal}
          onClose={closeVerificationModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default AdminVerifications;
