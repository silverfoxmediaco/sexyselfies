import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, MessageCircle, Unlock, MapPin, Check, 
  Camera, Video, Star, Users, Shield, Eye,
  ChevronLeft, Lock, Sparkles, Info, Share2
} from 'lucide-react';
import './CreatorProfileModal.css';

const CreatorProfileModal = ({ creator, isOpen, onClose, onLike, onPass, onSuperLike }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [selectedContent, setSelectedContent] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Mock content for demonstration
  const mockContent = [
    { id: 1, type: 'photo', thumbnail: '/api/placeholder/400/600', price: 2.99, locked: true },
    { id: 2, type: 'video', thumbnail: '/api/placeholder/400/600', price: 5.99, locked: true },
    { id: 3, type: 'photo', thumbnail: '/api/placeholder/400/600', price: 2.99, locked: true },
    { id: 4, type: 'photo', thumbnail: '/api/placeholder/400/600', price: 2.99, locked: true },
    { id: 5, type: 'video', thumbnail: '/api/placeholder/400/600', price: 5.99, locked: true },
    { id: 6, type: 'photo', thumbnail: '/api/placeholder/400/600', price: 2.99, locked: true },
  ];

  // Mock multiple images
  const images = [
    creator?.profilePhoto || '/api/placeholder/400/600',
    '/api/placeholder/400/600',
    '/api/placeholder/400/600',
    '/api/placeholder/400/600'
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleContentClick = (content) => {
    setSelectedContent(content);
    setShowUnlockModal(true);
  };

  const handleSwipeImage = (direction) => {
    if (direction === 'left' && imageIndex < images.length - 1) {
      setImageIndex(imageIndex + 1);
    } else if (direction === 'right' && imageIndex > 0) {
      setImageIndex(imageIndex - 1);
    }
  };

  if (!isOpen || !creator) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="creator-profile-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="creator-profile-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-controls">
              <button
                onClick={onClose}
                className="modal-control-btn"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button className="modal-control-btn">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="modal-scroll-content">
            {/* Image Gallery */}
            <div className="image-gallery">
              <img 
                src={images[imageIndex]}
                alt={creator.displayName}
                className="gallery-image"
              />
              
              {/* Image Navigation Dots */}
              <div className="image-dots">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImageIndex(idx)}
                    className={`image-dot ${idx === imageIndex ? 'active' : ''}`}
                  />
                ))}
              </div>

              {/* Touch areas for image navigation */}
              <div 
                className="touch-nav-left"
                onClick={() => handleSwipeImage('right')}
              />
              <div 
                className="touch-nav-right"
                onClick={() => handleSwipeImage('left')}
              />
            </div>

            {/* Profile Info */}
            <div className="profile-content">
              {/* Name and Basic Info */}
              <div className="profile-basic-info">
                <div className="profile-name-container">
                  <h2 className="profile-name">
                    {creator.displayName}, {creator.age}
                    {creator.verified && (
                      <span className="verified-badge">
                        <Shield size={24} />
                      </span>
                    )}
                  </h2>
                  <div className="profile-location-info">
                    <MapPin size={16} />
                    <span>{creator.distance || '2'}km away</span>
                    {creator.activeNow && (
                      <>
                        <span>•</span>
                        <span className="active-indicator">Active Now</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className="profile-bio">
                {creator.bio || 'No bio available'}
              </p>

              {/* Stats */}
              <div className="profile-stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Heart size={20} color="#EC4899" />
                  </div>
                  <span className="stat-value">
                    {creator.stats?.followers || '2.3k'}
                  </span>
                  <span className="stat-label">Followers</span>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Camera size={20} color="#8B5CF6" />
                  </div>
                  <span className="stat-value">
                    {creator.stats?.contentCount || '124'}
                  </span>
                  <span className="stat-label">Content</span>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Star size={20} color="#F59E0B" />
                  </div>
                  <span className="stat-value">
                    {creator.stats?.rating || '4.9'}
                  </span>
                  <span className="stat-label">Rating</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="profile-tabs">
                {['about', 'content', 'details'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'about' && (
                  <div className="about-grid">
                    <div className="about-item">
                      <span className="about-label">Orientation</span>
                      <span className="about-value">
                        {creator.orientation || 'Not specified'}
                      </span>
                    </div>
                    
                    <div className="about-item">
                      <span className="about-label">Gender</span>
                      <span className="about-value">
                        {creator.gender || 'Not specified'}
                      </span>
                    </div>
                    
                    
                    <div className="about-item">
                      <span className="about-label">Starting Price</span>
                      <span className="about-value">
                        ${creator.pricing?.starting || '2.99'}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="content-grid">
                    {mockContent.map((content) => (
                      <div
                        key={content.id}
                        className="content-item"
                        onClick={() => handleContentClick(content)}
                      >
                        <img
                          src={content.thumbnail}
                          alt=""
                          className={`content-thumbnail ${content.locked ? 'locked' : ''}`}
                        />
                        {content.locked && (
                          <div className="content-lock-icon">
                            <Lock size={20} color="#fff" />
                          </div>
                        )}
                        <div className="content-price">
                          ${content.price}
                        </div>
                        <div className="content-type-icon">
                          {content.type === 'video' ? <Video size={16} /> : <Camera size={16} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="details-section">
                    <div className="detail-card">
                      <h4 className="detail-title">What I Offer</h4>
                      <div className="detail-tags">
                        {['Photos', 'Videos', 'Custom Content', 'Live Shows'].map((item) => (
                          <span key={item} className="detail-tag">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="detail-title">Response Time</h4>
                      <p className="detail-text">
                        Usually responds within 2 hours
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="modal-action-buttons">
            <button
              onClick={() => {
                onPass?.();
                onClose();
              }}
              className="action-btn pass"
            >
              <X size={28} />
            </button>
            
            <button
              onClick={() => {
                onSuperLike?.();
                onClose();
              }}
              className="action-btn super"
            >
              <Star size={24} />
            </button>
            
            <button
              onClick={() => {
                onLike?.();
                onClose();
              }}
              className="action-btn like"
            >
              <Heart size={28} />
            </button>
          </div>

          {/* Unlock Modal */}
          <AnimatePresence>
            {showUnlockModal && selectedContent && (
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
                  <div className="unlock-icon">
                    <Unlock size={32} color="#17D2C2" />
                  </div>
                  
                  <h3 className="unlock-title">Unlock Content</h3>
                  
                  <p className="unlock-description">
                    Get instant access to this exclusive {selectedContent.type}
                  </p>
                  
                  <div className="unlock-price">
                    ${selectedContent.price}
                  </div>
                  
                  <button className="unlock-btn">
                    Unlock Now
                  </button>
                  
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="unlock-cancel"
                  >
                    Maybe Later
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatorProfileModal;