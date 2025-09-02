import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminHeader from '../components/AdminHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './AdminContent.css';

const AdminContent = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [content, setContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, flagged, removed
  const [contentType, setContentType] = useState('all'); // all, image, video
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removalReason, setRemovalReason] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [filter, contentType]);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      // Since we don't have real content yet, we'll use dummy data
      setContent(getDummyContent());
    } catch (error) {
      console.error('Failed to fetch content:', error);
      setContent(getDummyContent());
    } finally {
      setLoading(false);
    }
  };

  const getDummyContent = () => {
    // Import the actual images
    const image1 = '/src/assets/jessatsexyselfies_57308_a_beautiful_brunette_girl_in_her_20s__fde0d022-97f5-4153-a96f-e43f6ca953b5_0.png';
    const image2 = '/src/assets/jessatsexyselfies_57308_a_beautiful_brunette_girl_in_her_20s__fde0d022-97f5-4153-a96f-e43f6ca953b5_1.png';
    const image3 = '/src/assets/jessatsexyselfies_57308_a_beautiful_brunette_girl_in_her_20s__fde0d022-97f5-4153-a96f-e43f6ca953b5_2.png';
    
    return [
      {
        _id: '1',
        type: 'image',
        url: image1,
        thumbnailUrl: image1,
        creator: {
          _id: 'c1',
          email: 'jessica.creator@example.com',
          stageName: 'Jessica Rose'
        },
        status: 'approved',
        uploadedAt: new Date('2024-01-15').toISOString(),
        views: 245,
        purchases: 12,
        earnings: 35.88,
        reports: 0,
        aiFlags: [],
        isBlurred: false,
        price: 2.99
      },
      {
        _id: '2',
        type: 'image',
        url: image2,
        thumbnailUrl: image2,
        creator: {
          _id: 'c1',
          email: 'jessica.creator@example.com',
          stageName: 'Jessica Rose'
        },
        status: 'pending',
        uploadedAt: new Date('2024-01-16').toISOString(),
        views: 0,
        purchases: 0,
        earnings: 0,
        reports: 0,
        aiFlags: [],
        isBlurred: true,
        price: 4.99
      },
      {
        _id: '3',
        type: 'image',
        url: image3,
        thumbnailUrl: image3,
        creator: {
          _id: 'c1',
          email: 'jessica.creator@example.com',
          stageName: 'Jessica Rose'
        },
        status: 'flagged',
        uploadedAt: new Date('2024-01-14').toISOString(),
        views: 567,
        purchases: 45,
        earnings: 134.55,
        reports: 3,
        aiFlags: ['nudity_detected'],
        isBlurred: true,
        price: 2.99
      },
      {
        _id: '4',
        type: 'video',
        url: image1,
        thumbnailUrl: image1,
        duration: '2:45',
        creator: {
          _id: 'c2',
          email: 'sophia.creator@example.com',
          stageName: 'Sophia Belle'
        },
        status: 'approved',
        uploadedAt: new Date('2024-01-13').toISOString(),
        views: 892,
        purchases: 67,
        earnings: 334.33,
        reports: 0,
        aiFlags: [],
        isBlurred: false,
        price: 4.99
      },
      {
        _id: '5',
        type: 'image',
        url: image2,
        thumbnailUrl: image2,
        creator: {
          _id: 'c3',
          email: 'emma.creator@example.com',
          stageName: 'Emma Divine'
        },
        status: 'pending',
        uploadedAt: new Date('2024-01-17').toISOString(),
        views: 0,
        purchases: 0,
        earnings: 0,
        reports: 0,
        aiFlags: [],
        isBlurred: true,
        price: 3.99
      },
      {
        _id: '6',
        type: 'image',
        url: image3,
        thumbnailUrl: image3,
        creator: {
          _id: 'c4',
          email: 'olivia.creator@example.com',
          stageName: 'Olivia Moon'
        },
        status: 'approved',
        uploadedAt: new Date('2024-01-12').toISOString(),
        views: 1234,
        purchases: 89,
        earnings: 265.11,
        reports: 1,
        aiFlags: [],
        isBlurred: false,
        price: 2.99
      }
    ];
  };

  const handleApprove = async (contentId) => {
    setProcessing(true);
    try {
      // API call would go here
      alert('Content approved!');
      setContent(prev => prev.map(c => 
        c._id === contentId ? { ...c, status: 'approved' } : c
      ));
    } catch (error) {
      console.error('Failed to approve content:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedContent || !removalReason.trim()) {
      alert('Please provide a removal reason');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      // API call would go here
      alert('Content removed!');
      setContent(prev => prev.filter(c => c._id !== selectedContent._id));
      setSelectedContent(null);
      setShowRemoveModal(false);
      setRemovalReason('');
    } catch (error) {
      console.error('Failed to remove content:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved': return 'content-status-approved';
      case 'pending': return 'content-status-pending';
      case 'flagged': return 'content-status-flagged';
      case 'removed': return 'content-status-removed';
      default: return '';
    }
  };

  const filteredContent = content.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (contentType !== 'all' && item.type !== contentType) return false;
    return true;
  });

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="content-admin-loading">
          <div className="content-spinner"></div>
          <p>Loading content...</p>
        </div>
      </>
    );
  }

  return (
    <div className="admin-content-page">
      <AdminHeader />
      
      {/* Header */}
      <div className="content-page-header">
        <div>
          <h2>Content Review</h2>
          <p className="content-subtitle">Review and moderate uploaded content</p>
        </div>
        
        <div className="content-header-controls">
          <select 
            className="content-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
            <option value="removed">Removed</option>
          </select>
          
          <select 
            className="content-filter-select"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          
          <div className="content-view-toggle">
            <button 
              className={`content-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button 
              className={`content-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="2" rx="1"/>
                <rect x="1" y="7" width="14" height="2" rx="1"/>
                <rect x="1" y="12" width="14" height="2" rx="1"/>
              </svg>
            </button>
          </div>
          
          <button 
            className="content-refresh-btn"
            onClick={fetchContent}
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.65 2.35a8 8 0 1 0 0 11.3"/>
              <path d="M14 0v5h-5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="content-main-area">
        {filteredContent.length === 0 ? (
          <div className="content-empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="#8E8E93">
              <path d="M8 16l8-8h32l8 8v32l-8 8H16l-8-8V16z"/>
              <path d="M24 24h16v16H24z" fill="#0A0A0A"/>
            </svg>
            <p>No content to review</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="content-items-grid">
            {filteredContent.map((item) => (
              <div key={item._id} className="content-item-card">
                {/* Thumbnail with blur */}
                <div className="content-item-thumbnail">
                  {item.isBlurred && (
                    <div className="content-blur-overlay">
                      <button 
                        className="content-preview-btn"
                        onClick={() => setImagePreview(item)}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                        </svg>
                        <span>Preview</span>
                      </button>
                    </div>
                  )}
                  <img 
                    src={item.thumbnailUrl} 
                    alt="Content thumbnail"
                    className={item.isBlurred ? 'content-blurred-img' : ''}
                  />
                  {item.type === 'video' && (
                    <div className="content-video-duration">{item.duration}</div>
                  )}
                  <div className={`content-status-badge ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </div>
                </div>

                {/* Content Info */}
                <div className="content-item-info">
                  <div className="content-creator-info">
                    <span className="content-creator-name">{item.creator.stageName}</span>
                    <span className="content-upload-date">
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* AI Flags */}
                  {item.aiFlags && item.aiFlags.length > 0 && (
                    <div className="content-ai-flags">
                      {item.aiFlags.map((flag, index) => (
                        <span key={index} className="content-ai-flag">
                          ⚠️ {flag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="content-item-actions">
                    {item.status === 'pending' && (
                      <>
                        <button 
                          className="content-action-btn content-approve-btn"
                          onClick={() => handleApprove(item._id)}
                          disabled={processing}
                        >
                          Approve
                        </button>
                        <button 
                          className="content-action-btn content-reject-btn"
                          onClick={() => {
                            setSelectedContent(item);
                            setShowRemoveModal(true);
                          }}
                          disabled={processing}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {item.status === 'flagged' && (
                      <>
                        <button 
                          className="content-action-btn content-review-btn"
                          onClick={() => setSelectedContent(item)}
                        >
                          Review
                        </button>
                        <button 
                          className="content-action-btn content-remove-btn"
                          onClick={() => {
                            setSelectedContent(item);
                            setShowRemoveModal(true);
                          }}
                          disabled={processing}
                        >
                          Remove
                        </button>
                      </>
                    )}
                    {item.status === 'approved' && (
                      <button 
                        className="content-action-btn content-flag-btn"
                        onClick={() => {
                          setContent(prev => prev.map(c => 
                            c._id === item._id ? { ...c, status: 'flagged' } : c
                          ));
                        }}
                      >
                        Flag for Review
                      </button>
                    )}
                  </div>

                  {/* Stats Badges - Always visible */}
                  <div className="content-stats-badges">
                    <div className="content-stat-badge content-stat-views">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M7 4C4.5 4 2.2 5.4 1 7.5c1.2 2.1 3.5 3.5 6 3.5s4.8-1.4 6-3.5C11.8 5.4 9.5 4 7 4zm0 5.8c-1.3 0-2.3-1-2.3-2.3S5.7 5.2 7 5.2s2.3 1 2.3 2.3S8.3 9.8 7 9.8zm0-3.7c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4S7.8 6.1 7 6.1z"/>
                      </svg>
                      <span>{item.views}</span>
                    </div>
                    <div className="content-stat-badge content-stat-purchases">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M10.5 6.5h-7c-.3 0-.5.2-.5.5v5c0 .3.2.5.5.5h7c.3 0 .5-.2.5-.5V7c0-.3-.2-.5-.5-.5zm-3.5 4h-1V8h1v2.5zM11 4.5C11 2 9 0 6.5 0S2 2 2 4.5c0 1.9 1.2 3.5 2.8 4.2.1-.2.3-.4.5-.5-.1 0-.1-.1-.2-.1-1.3-.5-2.1-1.8-2.1-3.3C3 2.7 4.7 1 6.8 1s3.8 1.7 3.8 3.8c0 1.4-.8 2.7-2 3.3-.1 0-.2.1-.2.1.2.1.4.3.5.5C10.3 8 11.5 6.4 11 4.5z"/>
                      </svg>
                      <span>{item.purchases}</span>
                    </div>
                    <div className="content-stat-badge content-stat-earnings">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M7 0C3.1 0 0 3.1 0 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 12.8c-3.2 0-5.8-2.6-5.8-5.8S3.8 1.2 7 1.2s5.8 2.6 5.8 5.8-2.6 5.8-5.8 5.8zm.5-9.3h-2v.8c-.7.2-1.2.8-1.2 1.6 0 1 .7 1.5 1.7 1.8l.5.1v2c-.4-.1-.7-.3-.9-.7h-1c.2.9.9 1.4 1.9 1.5v.9h1v-.9c.8-.1 1.5-.6 1.5-1.5 0-.8-.5-1.3-1.3-1.5l-.2-.1V4.3c.3 0 .6.2.7.5h1c-.1-.7-.7-1.2-1.7-1.3v-.8zm-1 3.2c-.3-.1-.5-.2-.5-.5s.2-.5.5-.5v1zm1 2.1v1.1c-.3 0-.6-.2-.6-.5 0-.3.2-.5.6-.6z"/>
                      </svg>
                      <span>${item.earnings.toFixed(2)}</span>
                    </div>
                    {item.reports > 0 && (
                      <div className="content-stat-badge content-stat-reports">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                          <path d="M7 0C3.1 0 0 3.1 0 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 12.3c-2.9 0-5.3-2.4-5.3-5.3S4.1 1.7 7 1.7s5.3 2.4 5.3 5.3-2.4 5.3-5.3 5.3zm-.7-8.8h1.4v4.2H6.3V3.5zm0 5.6h1.4V10.5H6.3V9.1z"/>
                        </svg>
                        <span>{item.reports}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="content-list-view">
            <table className="content-data-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Creator</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Views</th>
                  <th>Sales</th>
                  <th>Reports</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="content-list-thumbnail">
                        <img src={item.thumbnailUrl} alt="Thumbnail" />
                      </div>
                    </td>
                    <td>{item.creator.stageName}</td>
                    <td>
                      <span className="content-type-badge">{item.type}</span>
                    </td>
                    <td>
                      <span className={`content-list-status-badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{new Date(item.uploadedAt).toLocaleDateString()}</td>
                    <td>{item.views}</td>
                    <td>${item.earnings}</td>
                    <td>
                      <span className={item.reports > 0 ? 'content-has-reports' : ''}>
                        {item.reports}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="content-list-action-btn"
                        onClick={() => setSelectedContent(item)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div 
          className="content-preview-modal"
          onClick={() => setImagePreview(null)}
        >
          <div className="content-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="content-preview-close-btn"
              onClick={() => setImagePreview(null)}
            >
              ✕
            </button>
            <img src={imagePreview.url} alt="Full preview" />
            <div className="content-preview-info">
              <h3>Content Preview</h3>
              <p>Creator: {imagePreview.creator.stageName}</p>
              <p>Price: ${imagePreview.price}</p>
              {imagePreview.aiFlags && imagePreview.aiFlags.length > 0 && (
                <div className="content-preview-flags">
                  <strong>AI Flags:</strong>
                  {imagePreview.aiFlags.map((flag, index) => (
                    <span key={index} className="content-flag-item">{flag}</span>
                  ))}
                </div>
              )}
              <div className="content-preview-actions">
                <button 
                  className="content-modal-action-btn content-modal-approve"
                  onClick={() => {
                    handleApprove(imagePreview._id);
                    setImagePreview(null);
                  }}
                >
                  Approve
                </button>
                <button 
                  className="content-modal-action-btn content-modal-reject"
                  onClick={() => {
                    setSelectedContent(imagePreview);
                    setShowRemoveModal(true);
                    setImagePreview(null);
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Content Details Panel */}
      {selectedContent && !showRemoveModal && !imagePreview && (
        <div className="content-details-panel">
          <div className="content-details-header">
            <h2>Content Details</h2>
            <button 
              className="content-details-close-btn"
              onClick={() => setSelectedContent(null)}
            >
              ✕
            </button>
          </div>

          <div className="content-details-body">
            <div className="content-detail-image">
              <img src={selectedContent.url} alt="Content" />
              {selectedContent.type === 'video' && (
                <div className="content-detail-video-duration">{selectedContent.duration}</div>
              )}
            </div>

            <div className="content-detail-info">
              <div className="content-detail-section">
                <h3>Creator Information</h3>
                <p><strong>Name:</strong> {selectedContent.creator.stageName}</p>
                <p><strong>Email:</strong> {selectedContent.creator.email}</p>
                <p><strong>ID:</strong> {selectedContent.creator._id}</p>
              </div>

              <div className="content-detail-section">
                <h3>Content Metrics</h3>
                <div className="content-metrics-grid">
                  <div className="content-metric">
                    <label>Views</label>
                    <span>{selectedContent.views}</span>
                  </div>
                  <div className="content-metric">
                    <label>Purchases</label>
                    <span>{selectedContent.purchases}</span>
                  </div>
                  <div className="content-metric">
                    <label>Earnings</label>
                    <span>${selectedContent.earnings}</span>
                  </div>
                  <div className="content-metric">
                    <label>Reports</label>
                    <span className={selectedContent.reports > 0 ? 'content-metric-has-reports' : ''}>
                      {selectedContent.reports}
                    </span>
                  </div>
                </div>
              </div>

              {selectedContent.aiFlags && selectedContent.aiFlags.length > 0 && (
                <div className="content-detail-section">
                  <h3>AI Detection Flags</h3>
                  <div className="content-flags-list">
                    {selectedContent.aiFlags.map((flag, index) => (
                      <span key={index} className="content-flag-badge">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="content-detail-actions">
                {selectedContent.status === 'pending' && (
                  <>
                    <button 
                      className="content-detail-action-btn content-detail-approve"
                      onClick={() => {
                        handleApprove(selectedContent._id);
                        setSelectedContent(null);
                      }}
                    >
                      Approve Content
                    </button>
                    <button 
                      className="content-detail-action-btn content-detail-reject"
                      onClick={() => setShowRemoveModal(true)}
                    >
                      Reject Content
                    </button>
                  </>
                )}
                {selectedContent.status === 'flagged' && (
                  <>
                    <button 
                      className="content-detail-action-btn content-detail-approve"
                      onClick={() => {
                        handleApprove(selectedContent._id);
                        setSelectedContent(null);
                      }}
                    >
                      Clear Flags & Approve
                    </button>
                    <button 
                      className="content-detail-action-btn content-detail-remove"
                      onClick={() => setShowRemoveModal(true)}
                    >
                      Remove Content
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Content Modal */}
      {showRemoveModal && (
        <div className="content-removal-overlay" onClick={() => setShowRemoveModal(false)}>
          <div className="content-removal-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Remove Content</h2>
            <p>
              Please provide a reason for removing this content. 
              The creator will be notified.
            </p>
            
            <div className="content-removal-reasons">
              <button 
                className="content-reason-btn"
                onClick={() => setRemovalReason('Violates community guidelines')}
              >
                Community Guidelines
              </button>
              <button 
                className="content-reason-btn"
                onClick={() => setRemovalReason('Inappropriate content')}
              >
                Inappropriate
              </button>
              <button 
                className="content-reason-btn"
                onClick={() => setRemovalReason('Copyright violation')}
              >
                Copyright
              </button>
              <button 
                className="content-reason-btn"
                onClick={() => setRemovalReason('Explicit content beyond platform standards')}
              >
                Too Explicit
              </button>
            </div>
            
            <textarea
              className="content-removal-textarea"
              placeholder="Enter removal reason..."
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              rows="4"
            />
            
            <div className="content-removal-actions">
              <button 
                className="content-removal-btn content-removal-cancel"
                onClick={() => setShowRemoveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="content-removal-btn content-removal-confirm"
                onClick={handleRemove}
                disabled={processing || !removalReason.trim()}
              >
                Remove Content
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default AdminContent;