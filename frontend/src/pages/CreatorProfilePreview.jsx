import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  MessageCircle,
  Unlock,
  MapPin,
  Check,
  Camera,
  Video,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Share2,
  Bookmark,
  Send,
  Gift,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowLeft,
  Shield,
  Bell,
  Clock,
  Calendar,
  Grid3x3,
  User,
} from 'lucide-react';
import { useIsMobile } from '../utils/mobileDetection';
import './CreatorProfilePreview.css';

// Helper function to format numbers (e.g., 2300 -> 2.3k)
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const CreatorProfilePreview = ({ profileData, isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState('swipe'); // 'swipe' or 'profile'
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Debug logging to see what data is being passed
  console.log('🔍 CreatorProfilePreview received profileData:', profileData);
  console.log(
    '📷 Profile photo preview:',
    profileData?.profileImage || profileData?.profilePhotoPreview
  );
  console.log(
    '🖼️ Cover image preview:',
    profileData?.coverImage || profileData?.coverImagePreview
  );

  // Mock sample content for preview
  const sampleContent = [
    {
      id: 1,
      type: 'photo',
      price: profileData?.pricing?.photos || 2.99,
      locked: true,
      blur: true,
    },
    {
      id: 2,
      type: 'photo',
      price: profileData?.pricing?.photos || 2.99,
      locked: true,
      blur: true,
    },
    {
      id: 3,
      type: 'video',
      price: profileData?.pricing?.videos || 5.99,
      locked: true,
      blur: true,
    },
    {
      id: 4,
      type: 'photo',
      price: profileData?.pricing?.photos || 2.99,
      locked: true,
      blur: true,
    },
    {
      id: 5,
      type: 'video',
      price: profileData?.pricing?.videos || 5.99,
      locked: true,
      blur: true,
    },
    {
      id: 6,
      type: 'photo',
      price: profileData?.pricing?.photos || 2.99,
      locked: true,
      blur: true,
    },
  ];

  // Format orientation display
  const getOrientationDisplay = () => {
    const orientation = profileData?.orientation || 'Not specified';
    const gender = profileData?.gender || 'Not specified';
    return `${gender} • ${orientation}`;
  };

  // Swipe Card View Component
  const SwipeCardView = () => (
    <motion.div
      className="CreatorProfilePreview-swipe-card"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Card Images */}
      <div className="CreatorProfilePreview-card-image-container">
        {(() => {
          const profileImage = profileData?.profileImage || profileData?.profilePhotoPreview;
          const isValidImage = profileImage &&
            profileImage !== 'default-avatar.jpg' &&
            profileImage !== 'placeholder.jpg' &&
            (profileImage.startsWith('http') || profileImage.startsWith('https://') || profileImage.startsWith('data:'));

          return isValidImage ? (
            <img
              src={profileImage}
              alt={profileData?.displayName || 'Profile'}
              className="CreatorProfilePreview-card-main-image"
              onError={(e) => {
                console.warn('Failed to load profile image:', profileImage);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="CreatorProfilePreview-card-image-placeholder">
              <Camera size={48} />
              <span>Your photo here</span>
            </div>
          );
        })()}


        {/* Verified badge */}
        <div className="CreatorProfilePreview-verified-badge">
          <Check size={12} />
          <span>Verified</span>
        </div>

        {/* Live indicator */}
        <div className="CreatorProfilePreview-live-indicator">
          <span className="CreatorProfilePreview-live-dot"></span>
          <span>Online</span>
        </div>
      </div>

      {/* Card Info Overlay */}
      <div className="CreatorProfilePreview-card-info-overlay">
        <div className="CreatorProfilePreview-card-header">
          <h2>{profileData?.displayName || 'Your Name'}, 24</h2>
        </div>

        <div className="CreatorProfilePreview-card-bio">
          <p>{profileData?.bio || 'Your bio will appear here...'}</p>
        </div>

        <div className="CreatorProfilePreview-card-tags"></div>

        <div className="CreatorProfilePreview-card-stats">
          <div className="CreatorProfilePreview-stat">
            <Heart size={14} />
            <span>{formatNumber(profileData?.stats?.totalLikes || 0)} likes</span>
          </div>
          <div className="CreatorProfilePreview-stat">
            <Camera size={14} />
            <span>{profileData?.stats?.totalContent || 0} content</span>
          </div>
          <div className="CreatorProfilePreview-stat">
            <Video size={14} />
            <span>${formatNumber(profileData?.stats?.totalEarnings || 0)} earned</span>
          </div>
        </div>
      </div>

      {/* View Full Profile Button */}
      <motion.button
        className="CreatorProfilePreview-view-profile-btn"
        onClick={() => setViewMode('profile')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="View full profile details"
      >
        <Eye size={16} />
        <span>View Full Profile</span>
      </motion.button>
    </motion.div>
  );

  // Full Profile View Component - Updated to match CreatorProfile.jsx structure
  const FullProfileView = () => (
    <motion.div
      className="CreatorProfilePreview-full-profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <section className="CreatorProfilePreview-profile-container">
        {/* Profile Header */}
        <header className="CreatorProfilePreview-profile-header">
          {/* Cover Photo */}
          <div className="CreatorProfilePreview-cover-photo-container">
            {(profileData?.coverImage &&
              typeof profileData.coverImage === 'string' &&
              profileData.coverImage !== 'default-cover.jpg' &&
              (profileData.coverImage.startsWith('http') || profileData.coverImage.startsWith('data:'))) ||
            (profileData?.coverImagePreview &&
              typeof profileData.coverImagePreview === 'string' &&
              profileData.coverImagePreview.startsWith('data:')) ||
            (profileData?.coverPhoto &&
              typeof profileData.coverPhoto === 'string' &&
              profileData.coverPhoto.startsWith('http')) ? (
              <img
                src={
                  profileData?.coverImage ||
                  profileData?.coverImagePreview ||
                  profileData?.coverPhoto
                }
                alt="Cover"
                className="CreatorProfilePreview-cover-photo"
              />
            ) : (
              <div className="CreatorProfilePreview-cover-photo CreatorProfilePreview-placeholder-cover"></div>
            )}
            <div className="CreatorProfilePreview-cover-overlay"></div>

            {/* Action Buttons */}
            <div className="CreatorProfilePreview-header-actions">
              <button className="CreatorProfilePreview-action-icon-btn" aria-label="Go back">
                <ArrowLeft size={20} />
              </button>
              <button className="CreatorProfilePreview-action-icon-btn" aria-label="Share profile">
                <Share2 size={20} />
              </button>
              <button className="CreatorProfilePreview-action-icon-btn" aria-label="More options">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="CreatorProfilePreview-profile-info">
            <div className="CreatorProfilePreview-profile-avatar-section">
              <div className="CreatorProfilePreview-profile-avatar">
                {(() => {
                  const profileImage = profileData?.profileImage || profileData?.profilePhotoPreview;
                  const isValidImage = profileImage &&
                    profileImage !== 'default-avatar.jpg' &&
                    profileImage !== 'placeholder.jpg' &&
                    (profileImage.startsWith('http') || profileImage.startsWith('https://') || profileImage.startsWith('data:'));

                  return isValidImage ? (
                    <img
                      src={profileImage}
                      alt={profileData?.displayName || 'Profile'}
                      onError={(e) => {
                        console.warn('Failed to load profile avatar:', profileImage);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="CreatorProfilePreview-avatar-placeholder">
                      <Camera size={32} />
                    </div>
                  );
                })()}
                <span className="CreatorProfilePreview-online-indicator"></span>
              </div>

              <div className="CreatorProfilePreview-profile-actions">
                <button className="CreatorProfilePreview-follow-btn" aria-label="Follow creator">
                  <Bell size={18} />
                  <span>Follow</span>
                </button>
                <button className="CreatorProfilePreview-like-btn" aria-label="Like profile">
                  <Heart size={18} />
                </button>
                <button className="CreatorProfilePreview-message-btn" aria-label="Send message">
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>

            <div className="CreatorProfilePreview-profile-details">
              <div className="CreatorProfilePreview-profile-name-section">
                <h1 className="CreatorProfilePreview-profile-name">
                  {profileData?.displayName || 'Creator Name'}
                  <Shield className="CreatorProfilePreview-verified-icon" size={20} />
                </h1>
                <span className="CreatorProfilePreview-profile-username">
                  @{profileData?.username || 'username'}
                </span>
              </div>

              <div className="CreatorProfilePreview-profile-meta">
                <span className="CreatorProfilePreview-meta-item">
                  <Clock size={14} />
                  Online now
                </span>
                <span className="CreatorProfilePreview-meta-item">
                  <Calendar size={14} />
                  Joined Dec 2024
                </span>
              </div>

              <p className="CreatorProfilePreview-profile-bio">
                {profileData?.bio || 'Bio will appear here'}
              </p>

              <div className="CreatorProfilePreview-profile-tags">
                {profileData?.contentTypes?.photos && (
                  <span className="CreatorProfilePreview-profile-tag">#photos</span>
                )}
                {profileData?.contentTypes?.videos && (
                  <span className="CreatorProfilePreview-profile-tag">#videos</span>
                )}
                {profileData?.orientation && (
                  <span className="CreatorProfilePreview-profile-tag">
                    #{profileData.orientation.toLowerCase()}
                  </span>
                )}
                <span className="CreatorProfilePreview-profile-tag">#exclusive</span>
              </div>
            </div>
          </div>

          {/* Rating - Social proof for quality assessment */}
          <div className="CreatorProfilePreview-profile-stats">
            <div className="CreatorProfilePreview-stat-item">
              <span className="CreatorProfilePreview-stat-value">
                <Star size={14} />
                {profileData?.stats?.rating || 0}
              </span>
              <span className="CreatorProfilePreview-stat-label">Rating</span>
            </div>
          </div>
        </header>

        {/* Content Tabs - TODO: Implement functionality or remove */}
        {/*
        <div className='profile-tabs'>
          <button className='tab-btn active'>
            <Grid3x3 size={18} />
            <span>Content</span>
          </button>
          <button className='tab-btn'>
            <User size={18} />
            <span>About</span>
          </button>
          <button className='tab-btn'>
            <Star size={18} />
            <span>Reviews</span>
          </button>
        </div>
        */}

        {/* Tab Content */}
        <section className="CreatorProfilePreview-tab-content">
          {/* Content Filter */}
          <div className="CreatorProfilePreview-content-filter">
            <button className="CreatorProfilePreview-filter-option active" aria-pressed="true">All ({sampleContent.length})</button>
            <button className="CreatorProfilePreview-filter-option" aria-pressed="false">Photos ({sampleContent.filter(c => c.type === 'photo').length})</button>
            <button className="CreatorProfilePreview-filter-option" aria-pressed="false">Videos ({sampleContent.filter(c => c.type === 'video').length})</button>
            <button className="CreatorProfilePreview-filter-option" aria-pressed="false">Locked ({sampleContent.filter(c => c.locked).length})</button>
          </div>

          {/* Content Grid */}
          <div className="CreatorProfilePreview-content-grid">
            {sampleContent.map(content => (
              <motion.div
                key={content.id}
                className={`CreatorProfilePreview-content-item ${content.blur ? 'locked' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedContent(content);
                  setShowUnlockModal(true);
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${content.type} content`}
              >
                <div className="CreatorProfilePreview-content-preview">
                  {content.type === 'video' && (
                    <div className="CreatorProfilePreview-video-indicator">
                      <Video size={16} />
                      <span>2:34</span>
                    </div>
                  )}

                  {content.blur && (
                    <div className="CreatorProfilePreview-lock-overlay">
                      <Unlock size={20} />
                      <span className="CreatorProfilePreview-price">${content.price}</span>
                    </div>
                  )}

                  <div className="CreatorProfilePreview-content-placeholder">
                    {content.type === 'photo' ? (
                      <Camera size={24} />
                    ) : (
                      <Video size={24} />
                    )}
                  </div>

                  <div className="CreatorProfilePreview-content-stats">
                    <Heart size={12} />
                    <span>234</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </section>
    </motion.div>
  );

  // Unlock Content Modal
  const UnlockModal = () => (
    <AnimatePresence>
      {showUnlockModal && (
        <motion.div
          className="CreatorProfilePreview-unlock-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowUnlockModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlock-modal-title"
        >
          <motion.div
            className="CreatorProfilePreview-unlock-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="CreatorProfilePreview-modal-close"
              onClick={() => setShowUnlockModal(false)}
              aria-label="Close unlock modal"
            >
              <X size={20} />
            </button>

            <div className="CreatorProfilePreview-unlock-content">
              <div className="CreatorProfilePreview-unlock-icon">
                <Unlock size={48} />
              </div>

              <h3 id="unlock-modal-title">Unlock Exclusive Content</h3>
              <p>Get instant access to this {selectedContent?.type}</p>

              <div className="CreatorProfilePreview-unlock-price">
                <span className="CreatorProfilePreview-currency">$</span>
                <span className="CreatorProfilePreview-amount">{selectedContent?.price}</span>
              </div>

              <motion.button
                className="CreatorProfilePreview-unlock-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Purchase and unlock content"
              >
                <Unlock size={18} />
                <span>Unlock Now</span>
              </motion.button>

              <p className="CreatorProfilePreview-unlock-note">
                One-time payment • Instant access • Support creator
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!isOpen) return null;

  return (
    <div className="CreatorProfilePreview-overlay" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      {/* Modal Header */}
      <header className="CreatorProfilePreview-header">
        <button
          className="CreatorProfilePreview-back-btn"
          onClick={viewMode === 'swipe' ? onClose : () => setViewMode('swipe')}
          aria-label={viewMode === 'swipe' ? 'Close preview' : 'Back to card view'}
        >
          <ChevronLeft size={20} />
          <span>{viewMode === 'swipe' ? 'Close Preview' : 'Back to Card'}</span>
        </button>

        <div className="CreatorProfilePreview-title" id="preview-title">
          <Eye size={20} />
          <span>Profile Preview</span>
        </div>

        <div className="CreatorProfilePreview-view-toggle">
          <button
            className={`CreatorProfilePreview-toggle-btn ${viewMode === 'swipe' ? 'active' : ''}`}
            onClick={() => setViewMode('swipe')}
            aria-pressed={viewMode === 'swipe'}
          >
            Card View
          </button>
          <button
            className={`CreatorProfilePreview-toggle-btn ${viewMode === 'profile' ? 'active' : ''}`}
            onClick={() => setViewMode('profile')}
            aria-pressed={viewMode === 'profile'}
          >
            Full Profile
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="CreatorProfilePreview-content">
        <AnimatePresence mode="wait">
          {viewMode === 'swipe' ? (
            <SwipeCardView key="swipe" />
          ) : (
            <FullProfileView key="profile" />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Note */}
      <footer className="CreatorProfilePreview-note">
        <span>💡 This is how members will see your profile</span>
      </footer>

      {/* Unlock Modal */}
      <UnlockModal />
    </div>
  );
};

export default CreatorProfilePreview;
