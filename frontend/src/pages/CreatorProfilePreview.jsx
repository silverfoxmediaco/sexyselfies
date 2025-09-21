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
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import './CreatorProfilePreview.css';

const CreatorProfilePreview = ({ profileData, isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const userRole = getUserRole();
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
      className='swipe-card'
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Card Images */}
      <div className='card-image-container'>
        {(profileData?.profileImage || profileData?.profilePhotoPreview) &&
        profileData.profileImage !== 'default-avatar.jpg' &&
        (profileData.profileImage?.startsWith('http') ||
          profileData.profilePhotoPreview?.startsWith('data:')) ? (
          <img
            src={profileData.profileImage || profileData.profilePhotoPreview}
            alt={profileData.displayName}
            className='card-main-image'
          />
        ) : (
          <div className='card-image-placeholder'>
            <Camera size={48} />
            <span>Your photo here</span>
          </div>
        )}

        {/* Image dots indicator */}
        <div className='image-dots'>
          {[1, 2, 3, 4].map((_, i) => (
            <span
              key={i}
              className={`dot ${i === activeImageIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Verified badge */}
        <div className='verified-badge'>
          <Check size={12} />
          <span>Verified</span>
        </div>

        {/* Live indicator */}
        <div className='live-indicator'>
          <span className='live-dot'></span>
          <span>Online</span>
        </div>
      </div>

      {/* Card Info Overlay */}
      <div className='card-info-overlay'>
        <div className='card-header'>
          <h2>{profileData?.displayName || 'Your Name'}, 24</h2>
        </div>

        <div className='card-bio'>
          <p>{profileData?.bio || 'Your bio will appear here...'}</p>
        </div>

        <div className='card-tags'></div>

        <div className='card-stats'>
          <div className='stat'>
            <Heart size={14} />
            <span>2.3k likes</span>
          </div>
          <div className='stat'>
            <Camera size={14} />
            <span>24 photos</span>
          </div>
          <div className='stat'>
            <Video size={14} />
            <span>8 videos</span>
          </div>
        </div>
      </div>

      {/* View Full Profile Button */}
      <motion.button
        className='view-profile-btn'
        onClick={() => setViewMode('profile')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Eye size={16} />
        <span>View Full Profile</span>
      </motion.button>
    </motion.div>
  );

  // Full Profile View Component - Updated to match CreatorProfile.jsx structure
  const FullProfileView = () => (
    <motion.div
      className='creator-profile-page'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className='profile-container'>
        {/* Profile Header */}
        <div className='profile-header'>
          {/* Cover Photo */}
          <div className='cover-photo-container'>
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
                alt='Cover'
                className='cover-photo'
              />
            ) : (
              <div className='cover-photo placeholder-cover'></div>
            )}
            <div className='cover-overlay'></div>

            {/* Action Buttons */}
            <div className='header-actions'>
              <button className='action-icon-btn'>
                <ArrowLeft size={20} />
              </button>
              <button className='action-icon-btn'>
                <Share2 size={20} />
              </button>
              <button className='action-icon-btn'>
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className='profile-info'>
            <div className='profile-avatar-section'>
              <div className='profile-avatar'>
                {(profileData?.profileImage ||
                  profileData?.profilePhotoPreview) &&
                profileData.profileImage !== 'default-avatar.jpg' &&
                (profileData.profileImage?.startsWith('http') ||
                  profileData.profilePhotoPreview?.startsWith('data:')) ? (
                  <img
                    src={
                      profileData.profileImage ||
                      profileData.profilePhotoPreview
                    }
                    alt={profileData.displayName}
                  />
                ) : (
                  <div className='avatar-placeholder'>
                    <Camera size={32} />
                  </div>
                )}
                <span className='online-indicator'></span>
              </div>

              <div className='profile-actions'>
                <button className='follow-btn'>
                  <Bell size={18} />
                  <span>Follow</span>
                </button>
                <button className='like-btn'>
                  <Heart size={18} />
                </button>
                <button className='message-btn'>
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>

            <div className='profile-details'>
              <div className='profile-name-section'>
                <h1 className='profile-name'>
                  {profileData?.displayName || 'Creator Name'}
                  <Shield className='verified-icon' size={20} />
                </h1>
                <span className='profile-username'>
                  @{profileData?.username || 'username'}
                </span>
              </div>

              <div className='profile-meta'>
                <span className='meta-item'>
                  <Clock size={14} />
                  Online now
                </span>
                <span className='meta-item'>
                  <Calendar size={14} />
                  Joined Dec 2024
                </span>
              </div>

              <p className='profile-bio'>
                {profileData?.bio || 'Bio will appear here'}
              </p>

              <div className='profile-tags'>
                {profileData?.contentTypes?.photos && (
                  <span className='profile-tag'>#photos</span>
                )}
                {profileData?.contentTypes?.videos && (
                  <span className='profile-tag'>#videos</span>
                )}
                {profileData?.orientation && (
                  <span className='profile-tag'>
                    #{profileData.orientation.toLowerCase()}
                  </span>
                )}
                <span className='profile-tag'>#exclusive</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className='profile-stats'>
            <div className='stat-item'>
              <span className='stat-value'>156</span>
              <span className='stat-label'>Content</span>
            </div>
            <div className='stat-item'>
              <span className='stat-value'>8.2k</span>
              <span className='stat-label'>Subscribers</span>
            </div>
            <div className='stat-item'>
              <span className='stat-value'>45.6k</span>
              <span className='stat-label'>Likes</span>
            </div>
            <div className='stat-item'>
              <span className='stat-value'>
                <Star size={14} />
                4.9
              </span>
              <span className='stat-label'>Rating</span>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
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

        {/* Tab Content */}
        <div className='tab-content'>
          {/* Content Filter */}
          <div className='content-filter'>
            <button className='filter-option active'>All ({sampleContent.length})</button>
            <button className='filter-option'>Photos ({sampleContent.filter(c => c.type === 'photo').length})</button>
            <button className='filter-option'>Videos ({sampleContent.filter(c => c.type === 'video').length})</button>
            <button className='filter-option'>Locked ({sampleContent.filter(c => c.locked).length})</button>
          </div>

          {/* Content Grid */}
          <div className='content-grid'>
            {sampleContent.map(content => (
              <motion.div
                key={content.id}
                className={`content-item ${content.blur ? 'locked' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedContent(content);
                  setShowUnlockModal(true);
                }}
              >
                <div className='content-preview'>
                  {content.type === 'video' && (
                    <div className='video-indicator'>
                      <Video size={16} />
                      <span>2:34</span>
                    </div>
                  )}

                  {content.blur && (
                    <div className='lock-overlay'>
                      <Unlock size={20} />
                      <span className='price'>${content.price}</span>
                    </div>
                  )}

                  <div className='content-placeholder'>
                    {content.type === 'photo' ? (
                      <Camera size={24} />
                    ) : (
                      <Video size={24} />
                    )}
                  </div>

                  <div className='content-stats'>
                    <Heart size={12} />
                    <span>234</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Unlock Content Modal
  const UnlockModal = () => (
    <AnimatePresence>
      {showUnlockModal && (
        <motion.div
          className='unlock-modal-overlay'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowUnlockModal(false)}
        >
          <motion.div
            className='unlock-modal'
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className='modal-close'
              onClick={() => setShowUnlockModal(false)}
            >
              <X size={20} />
            </button>

            <div className='unlock-content'>
              <div className='unlock-icon'>
                <Unlock size={48} />
              </div>

              <h3>Unlock Exclusive Content</h3>
              <p>Get instant access to this {selectedContent?.type}</p>

              <div className='unlock-price'>
                <span className='currency'>$</span>
                <span className='amount'>{selectedContent?.price}</span>
              </div>

              <motion.button
                className='unlock-btn'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Unlock size={18} />
                <span>Unlock Now</span>
              </motion.button>

              <p className='unlock-note'>
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
    <div className='profile-preview-container'>
      {/* Header */}
      <div className='preview-header'>
        <button
          className='back-btn'
          onClick={viewMode === 'swipe' ? onClose : () => setViewMode('swipe')}
        >
          <ChevronLeft size={20} />
          <span>{viewMode === 'swipe' ? 'Back to Setup' : 'Back to Card'}</span>
        </button>

        <div className='preview-title'>
          <Eye size={20} />
          <span>Profile Preview</span>
        </div>

        <div className='view-toggle'>
          <button
            className={`toggle-btn ${viewMode === 'swipe' ? 'active' : ''}`}
            onClick={() => setViewMode('swipe')}
          >
            Card View
          </button>
          <button
            className={`toggle-btn ${viewMode === 'profile' ? 'active' : ''}`}
            onClick={() => setViewMode('profile')}
          >
            Full Profile
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className='preview-content'>
        <AnimatePresence mode='wait'>
          {viewMode === 'swipe' ? (
            <SwipeCardView key='swipe' />
          ) : (
            <FullProfileView key='profile' />
          )}
        </AnimatePresence>
      </div>

      {/* Preview Note */}
      <div className='preview-note'>
        <span>💡 This is how members will see your profile</span>
      </div>

      {/* Unlock Modal */}
      <UnlockModal />

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorProfilePreview;
