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
  Users,
  Shield,
  Eye,
  ChevronLeft,
  Lock,
  Sparkles,
  Info,
  Share2,
} from 'lucide-react';
import './CreatorProfileModal.css';
import playCircleIcon from '../assets/play_circle_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.png';
import PurchaseConfirmationModal from './PurchaseConfirmationModal';
import memberService from '../services/member.service';

const CreatorProfileModal = ({
  creator,
  isOpen,
  onClose,
  onLike,
  onPass,
  onSuperLike,
  onContentPurchased,
}) => {
  const [activeTab, setActiveTab] = useState('about');
  const [selectedContent, setSelectedContent] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [testCreditsBalance, setTestCreditsBalance] = useState(0);
  const [memberBalance, setMemberBalance] = useState(0);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [creatorContent, setCreatorContent] = useState([]);

  // Mock content for demonstration
  const mockContent = [
    {
      id: 1,
      type: 'photo',
      thumbnail: '/api/placeholder/400/600',
      price: 2.99,
      locked: true,
    },
    {
      id: 2,
      type: 'video',
      thumbnail: '/api/placeholder/400/600',
      price: 5.99,
      locked: true,
    },
    {
      id: 3,
      type: 'photo',
      thumbnail: '/api/placeholder/400/600',
      price: 2.99,
      locked: true,
    },
    {
      id: 4,
      type: 'photo',
      thumbnail: '/api/placeholder/400/600',
      price: 2.99,
      locked: true,
    },
    {
      id: 5,
      type: 'video',
      thumbnail: '/api/placeholder/400/600',
      price: 5.99,
      locked: true,
    },
    {
      id: 6,
      type: 'photo',
      thumbnail: '/api/placeholder/400/600',
      price: 2.99,
      locked: true,
    },
  ];

  // Mock multiple images
  const images = [
    creator?.profileImage || '/api/placeholder/400/600',
    '/api/placeholder/400/600',
    '/api/placeholder/400/600',
    '/api/placeholder/400/600',
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadBalances();
      loadCreatorContent();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadBalances = async () => {
    try {
      const profile = await memberService.getProfile();
      const memberData = profile.data.member || profile.data;
      setTestCreditsBalance(memberData.testCredits || 0);
      setMemberBalance(memberData.credits || 0);
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  const loadCreatorContent = async () => {
    if (!creator?._id) return;

    try {
      // TODO: Replace with actual API call to fetch creator's content
      // const response = await contentService.getCreatorContent(creator._id);
      // setCreatorContent(response.data.content);

      // For now, use mock content
      setCreatorContent(mockContent);
    } catch (error) {
      console.error('Failed to load creator content:', error);
      setCreatorContent(mockContent);
    }
  };

  const handleContentClick = content => {
    if (!content.locked) {
      // Content already unlocked, just view it
      // TODO: Implement content viewer
      return;
    }

    // Show purchase confirmation modal
    setSelectedContent(content);
    setShowPurchaseConfirmation(true);
  };

  const handlePurchaseConfirm = async (paymentMethod) => {
    setIsProcessingPurchase(true);

    try {
      let response;

      if (paymentMethod === 'test_credits') {
        // Track source as 'profile' for analytics
        response = await memberService.purchaseContentWithTestCredits(
          selectedContent._id || selectedContent.id,
          'profile'
        );
      } else {
        response = await memberService.purchaseContent(
          selectedContent._id || selectedContent.id,
          'ccbill'
        );
      }

      // Reload balances
      await loadBalances();

      // Update content in the list to mark as unlocked
      setCreatorContent((prevContent) =>
        prevContent.map((item) =>
          (item._id || item.id) === (selectedContent._id || selectedContent.id)
            ? { ...item, locked: false }
            : item
        )
      );

      // Notify parent component
      if (onContentPurchased) {
        onContentPurchased(selectedContent);
      }

      // Close modals
      setShowPurchaseConfirmation(false);
      setSelectedContent(null);

      // Success message (parent component should handle this)
      console.log('Content unlocked successfully!');
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error; // Let PurchaseConfirmationModal handle error display
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  const handlePurchaseClose = () => {
    if (!isProcessingPurchase) {
      setShowPurchaseConfirmation(false);
      setSelectedContent(null);
    }
  };

  const handleSwipeImage = direction => {
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
        className='creator-profile-modal-overlay'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className='creator-profile-modal'
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='modal-header'>
            <div className='modal-header-controls'>
              <button onClick={onClose} className='modal-control-btn'>
                <ChevronLeft size={24} />
              </button>

              <button className='modal-control-btn'>
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className='modal-scroll-content'>
            {/* Image Gallery */}
            <div className='image-gallery'>
              <img
                src={images[imageIndex]}
                alt={creator.displayName}
                className='gallery-image'
              />

              {/* Image Navigation Dots */}
              <div className='image-dots'>
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
                className='touch-nav-left'
                onClick={() => handleSwipeImage('right')}
              />
              <div
                className='touch-nav-right'
                onClick={() => handleSwipeImage('left')}
              />
            </div>

            {/* Profile Info */}
            <div className='profile-content'>
              {/* Name and Basic Info */}
              <div className='profile-basic-info'>
                <div className='profile-name-container'>
                  <h2 className='profile-name'>
                    {creator.displayName}, {creator.age}
                    {creator.verified && (
                      <span className='verified-badge'>
                        <Shield size={24} />
                      </span>
                    )}
                  </h2>
                  {creator.activeNow && (
                    <div className='profile-status-info'>
                      <span className='active-indicator'>Active Now</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p className='profile-bio'>{creator.bio || 'No bio available'}</p>

              {/* Stats */}
              <div className='profile-stats-grid'>
                <div className='stat-card'>
                  <div className='stat-icon'>
                    <Heart size={20} color='#EC4899' />
                  </div>
                  <span className='stat-value'>
                    {creator.stats?.followers || '2.3k'}
                  </span>
                  <span className='stat-label'>Followers</span>
                </div>

                <div className='stat-card'>
                  <div className='stat-icon'>
                    <Camera size={20} color='#8B5CF6' />
                  </div>
                  <span className='stat-value'>
                    {creator.stats?.contentCount || '124'}
                  </span>
                  <span className='stat-label'>Content</span>
                </div>

                <div className='stat-card'>
                  <div className='stat-icon'>
                    <Star size={20} color='#F59E0B' />
                  </div>
                  <span className='stat-value'>
                    {creator.stats?.rating || '4.9'}
                  </span>
                  <span className='stat-label'>Rating</span>
                </div>
              </div>

              {/* Tabs */}
              <div className='profile-tabs'>
                {['about', 'content', 'details'].map(tab => (
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
              <div className='tab-content'>
                {activeTab === 'about' && (
                  <div className='about-grid'>
                    <div className='about-item'>
                      <span className='about-label'>Orientation</span>
                      <span className='about-value'>
                        {creator.orientation || 'Not specified'}
                      </span>
                    </div>

                    <div className='about-item'>
                      <span className='about-label'>Gender</span>
                      <span className='about-value'>
                        {creator.gender || 'Not specified'}
                      </span>
                    </div>

                    <div className='about-item'>
                      <span className='about-label'>Starting Price</span>
                      <span className='about-value'>
                        ${creator.pricing?.starting || '2.99'}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className='content-grid'>
                    {creatorContent.map(content => (
                      <div
                        key={content._id || content.id}
                        className='content-item'
                        onClick={() => handleContentClick(content)}
                      >
                        <img
                          src={content.thumbnail || content.url}
                          alt=''
                          className={`content-thumbnail ${content.locked ? 'locked' : ''}`}
                        />
                        {content.type === 'video' && (
                          <div className='content-play-icon'>
                            <img
                              src={playCircleIcon}
                              alt='Play video'
                              className='play-icon'
                            />
                          </div>
                        )}
                        {content.locked && (
                          <div className='content-lock-icon'>
                            <Lock size={20} color='#fff' />
                          </div>
                        )}
                        <div className='content-price'>${content.price}</div>
                        <div className='content-type-icon'>
                          {content.type === 'video' ? (
                            <Video size={16} />
                          ) : (
                            <Camera size={16} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className='details-section'>
                    <div className='detail-card'>
                      <h4 className='detail-title'>What I Offer</h4>
                      <div className='detail-tags'>
                        {[
                          'Photos',
                          'Videos',
                          'Custom Content',
                          'Live Shows',
                        ].map(item => (
                          <span key={item} className='detail-tag'>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className='detail-card'>
                      <h4 className='detail-title'>Response Time</h4>
                      <p className='detail-text'>
                        Usually responds within 2 hours
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className='modal-action-buttons'>
            <button
              onClick={() => {
                onPass?.();
                onClose();
              }}
              className='action-btn pass'
            >
              <X size={28} />
            </button>

            <button
              onClick={() => {
                onSuperLike?.();
                onClose();
              }}
              className='action-btn super'
            >
              <Star size={24} />
            </button>

            <button
              onClick={() => {
                onLike?.();
                onClose();
              }}
              className='action-btn like'
            >
              <Heart size={28} />
            </button>
          </div>

          {/* Purchase Confirmation Modal */}
          {showPurchaseConfirmation && selectedContent && (
            <PurchaseConfirmationModal
              isOpen={showPurchaseConfirmation}
              onClose={handlePurchaseClose}
              onConfirm={handlePurchaseConfirm}
              content={{
                ...selectedContent,
                title: selectedContent.title || `${selectedContent.type === 'video' ? 'Video' : 'Photo'} Content`,
                url: selectedContent.thumbnail || selectedContent.url,
                creator: creator,
              }}
              memberBalance={memberBalance}
              testCreditsBalance={testCreditsBalance}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatorProfileModal;
