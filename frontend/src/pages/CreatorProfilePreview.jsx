import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, MessageCircle, Unlock, MapPin, Check, 
  Camera, Video, Star, TrendingUp, Users, DollarSign,
  Eye, Share2, Bookmark, Send, Gift, Sparkles,
  ChevronLeft, ChevronRight, MoreHorizontal
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import './CreatorProfilePreview.css';

const CreatorProfilePreview = ({ profileData, isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  const [viewMode, setViewMode] = useState('swipe'); // 'swipe' or 'profile'
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Mock sample content for preview
  const sampleContent = [
    { id: 1, type: 'photo', price: profileData?.pricing?.photos || 2.99, locked: true, blur: true },
    { id: 2, type: 'photo', price: profileData?.pricing?.photos || 2.99, locked: true, blur: true },
    { id: 3, type: 'video', price: profileData?.pricing?.videos || 5.99, locked: true, blur: true },
    { id: 4, type: 'photo', price: profileData?.pricing?.photos || 2.99, locked: true, blur: true },
    { id: 5, type: 'video', price: profileData?.pricing?.videos || 5.99, locked: true, blur: true },
    { id: 6, type: 'photo', price: profileData?.pricing?.photos || 2.99, locked: true, blur: true }
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
      className="swipe-card"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20 }}
    >
      {/* Card Images */}
      <div className="card-image-container">
        {profileData?.profilePhoto ? (
          <img 
            src={profileData.profilePhoto} 
            alt={profileData.displayName}
            className="card-main-image"
          />
        ) : (
          <div className="card-image-placeholder">
            <Camera size={48} />
            <span>Your photo here</span>
          </div>
        )}
        
        {/* Image dots indicator */}
        <div className="image-dots">
          {[1,2,3,4].map((_, i) => (
            <span 
              key={i} 
              className={`dot ${i === activeImageIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Verified badge */}
        <div className="verified-badge">
          <Check size={12} />
          <span>Verified</span>
        </div>

        {/* Live indicator */}
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>Online</span>
        </div>
      </div>

      {/* Card Info Overlay */}
      <div className="card-info-overlay">
        <div className="card-header">
          <h2>{profileData?.displayName || 'Your Name'}, 24</h2>
          <div className="card-location">
            <MapPin size={14} />
            <span>2 miles away</span>
          </div>
        </div>

        <div className="card-bio">
          <p>{profileData?.bio || 'Your bio will appear here...'}</p>
        </div>

        <div className="card-tags">
          {profileData?.categories?.map((cat, i) => (
            <span key={i} className="tag">{cat}</span>
          )) || ['Lifestyle', 'Fashion'].map((cat, i) => (
            <span key={i} className="tag">{cat}</span>
          ))}
        </div>

        <div className="card-stats">
          <div className="stat">
            <Heart size={14} />
            <span>2.3k likes</span>
          </div>
          <div className="stat">
            <Camera size={14} />
            <span>24 photos</span>
          </div>
          <div className="stat">
            <Video size={14} />
            <span>8 videos</span>
          </div>
        </div>
      </div>

      {/* Swipe Actions */}
      <div className="swipe-actions">
        <motion.button 
          className="swipe-btn dislike"
          whileTap={{ scale: 0.9 }}
        >
          <X size={28} />
        </motion.button>
        <motion.button 
          className="swipe-btn superlike"
          whileTap={{ scale: 0.9 }}
        >
          <Star size={24} />
        </motion.button>
        <motion.button 
          className="swipe-btn like"
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsLiked(true)}
        >
          <Heart size={28} />
        </motion.button>
      </div>

      {/* View Full Profile Button */}
      <motion.button
        className="view-profile-btn"
        onClick={() => setViewMode('profile')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Eye size={16} />
        <span>View Full Profile</span>
      </motion.button>
    </motion.div>
  );

  // Full Profile View Component
  const FullProfileView = () => (
    <motion.div 
      className="full-profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          {profileData?.coverPhoto ? (
            <img src={profileData.coverPhoto} alt="Cover" />
          ) : (
            <div className="cover-gradient"></div>
          )}
        </div>
        
        <div className="profile-main-info">
          <div className="profile-avatar">
            {profileData?.profilePhoto ? (
              <img src={profileData.profilePhoto} alt={profileData.displayName} />
            ) : (
              <div className="avatar-placeholder">
                <Camera size={32} />
              </div>
            )}
            <div className="online-badge"></div>
          </div>
          
          <div className="profile-details">
            <div className="profile-name-row">
              <h1>{profileData?.displayName || 'Creator Name'}</h1>
              <div className="verified-badge large">
                <Check size={14} />
                <span>Verified</span>
              </div>
            </div>
            
            <p className="profile-bio">{profileData?.bio || 'Bio will appear here'}</p>
            
            <div className="profile-meta">
              <span className="meta-item">
                <MapPin size={14} />
                Los Angeles, CA
              </span>
              <span className="meta-item">
                {getOrientationDisplay()}
              </span>
              <span className="meta-item">
                <Users size={14} />
                8.2k matches
              </span>
            </div>
          </div>
          
          <div className="profile-actions">
            <motion.button 
              className="action-btn primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart size={18} />
              <span>Match</span>
            </motion.button>
            <motion.button 
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle size={18} />
              <span>Message</span>
            </motion.button>
            <motion.button 
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Gift size={18} />
              <span>Tip</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">156</span>
          <span className="stat-label">Content</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">8.2k</span>
          <span className="stat-label">Matches</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">4.9</span>
          <span className="stat-label">Rating</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            ${profileData?.pricing?.photos || '2.99'}+
          </span>
          <span className="stat-label">Content Price</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-section">
        <div className="section-header">
          <h3>
            <Sparkles size={20} />
            Exclusive Content
          </h3>
          <span className="content-count">156 items</span>
        </div>
        
        <div className="content-grid">
          {sampleContent.map((content) => (
            <motion.div
              key={content.id}
              className={`content-item ${content.blur ? 'locked' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedContent(content);
                setShowUnlockModal(true);
              }}
            >
              <div className="content-preview">
                {content.type === 'video' && (
                  <div className="video-indicator">
                    <Video size={20} />
                    <span>2:34</span>
                  </div>
                )}
                
                {content.blur && (
                  <div className="lock-overlay">
                    <Unlock size={24} />
                    <span className="price">${content.price}</span>
                  </div>
                )}
                
                <div className="content-placeholder">
                  {content.type === 'photo' ? (
                    <Camera size={32} />
                  ) : (
                    <Video size={32} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="about-section">
        <h3>About Me</h3>
        <div className="about-grid">
          <div className="about-item">
            <span className="label">Orientation</span>
            <span className="value">{profileData?.orientation || 'Not specified'}</span>
          </div>
          <div className="about-item">
            <span className="label">Body Type</span>
            <span className="value">{profileData?.bodyType || 'Not specified'}</span>
          </div>
          <div className="about-item">
            <span className="label">Content Types</span>
            <span className="value">Photos & Videos</span>
          </div>
          <div className="about-item">
            <span className="label">Active Since</span>
            <span className="value">New Creator</span>
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
          className="unlock-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowUnlockModal(false)}
        >
          <motion.div 
            className="unlock-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="modal-close"
              onClick={() => setShowUnlockModal(false)}
            >
              <X size={20} />
            </button>
            
            <div className="unlock-content">
              <div className="unlock-icon">
                <Unlock size={48} />
              </div>
              
              <h3>Unlock Exclusive Content</h3>
              <p>Get instant access to this {selectedContent?.type}</p>
              
              <div className="unlock-price">
                <span className="currency">$</span>
                <span className="amount">{selectedContent?.price}</span>
              </div>
              
              <motion.button 
                className="unlock-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Unlock size={18} />
                <span>Unlock Now</span>
              </motion.button>
              
              <p className="unlock-note">
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
    <div className="profile-preview-container">
      {/* Header */}
      <div className="preview-header">
        <button 
          className="back-btn"
          onClick={viewMode === 'swipe' ? onClose : () => setViewMode('swipe')}
        >
          <ChevronLeft size={20} />
          <span>{viewMode === 'swipe' ? 'Back to Setup' : 'Back to Card'}</span>
        </button>
        
        <div className="preview-title">
          <Eye size={20} />
          <span>Profile Preview</span>
        </div>
        
        <div className="view-toggle">
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
      <div className="preview-content">
        <AnimatePresence mode="wait">
          {viewMode === 'swipe' ? (
            <SwipeCardView key="swipe" />
          ) : (
            <FullProfileView key="profile" />
          )}
        </AnimatePresence>
      </div>

      {/* Preview Note */}
      <div className="preview-note">
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