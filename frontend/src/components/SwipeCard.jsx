import React, { useState, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
} from 'framer-motion';
import { Shield, MoreHorizontal, Flag, UserX, EyeOff } from 'lucide-react';
import ReportModal from './ReportModal';
import BlockUserModal from './BlockUserModal';
import safetyManager from '../utils/safetyManager';
import './SwipeCard.css';

const SwipeCard = ({
  content, // Now expects content object instead of creator
  creator, // Legacy prop for backward compatibility
  onSwipe,
  onViewProfile,
  onPurchase, // New prop for content purchase
  onModalStateChange, // New prop to notify parent of modal state
  isTop = false,
  style = {},
  dragEnabled = true,
  showActions = true,
  minimalView = false,
}) => {
  // Support both new content-focused and legacy creator-focused modes
  const isContentMode = !!content;
  const cardData = isContentMode ? content : creator;
  // Motion values for drag
  const motionValue = useMotionValue(0);
  const rotateValue = useTransform(motionValue, [-200, 200], [-30, 30]);
  const opacityValue = useTransform(
    motionValue,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5]
  );

  // Animation controls
  const controls = useAnimation();

  // State
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState(null);

  // Safety menu state
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Refs
  const cardRef = useRef(null);
  const swipeThreshold = 100;
  const swipeVelocityThreshold = 500;

  // Handle content vs creator mode
  let allPhotos;
  if (isContentMode) {
    // Content mode: Single content piece
    allPhotos = [{
      url: content.url,
      isFree: content.isFree,
      isPaid: content.isPaid,
      price: content.price,
      type: content.type,
      title: content.title,
    }];
  } else {
    // Legacy creator mode: Profile + content photos
    const profilePhoto = {
      url: creator.profileImage,
      isFree: true,
      isPaid: false,
      price: 0,
    };
    const contentPhotos = (creator.photos || []).map(photo =>
      typeof photo === 'string'
        ? { url: photo, isFree: true, isPaid: false, price: 0 }
        : photo
    );
    const allPhotosArray = [profilePhoto, ...contentPhotos];
    allPhotos = allPhotosArray.length > 0 ? allPhotosArray.sort(() => Math.random() - 0.5) : [profilePhoto];
  }

  // Handle drag end
  const handleDragEnd = (event, info) => {
    const swipeDirection =
      info.offset.x > swipeThreshold
        ? 'right'
        : info.offset.x < -swipeThreshold
          ? 'left'
          : null;

    // Check for swipe up (Quick Profile View)
    const swipeUp =
      info.offset.y < -swipeThreshold ||
      info.velocity.y < -swipeVelocityThreshold;

    if (swipeUp) {
      // Handle swipe up for Quick Profile View
      handleQuickProfileView();
      // Snap back to center (no exit animation)
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    } else if (
      swipeDirection ||
      Math.abs(info.velocity.x) > swipeVelocityThreshold
    ) {
      const finalDirection =
        swipeDirection || (info.velocity.x > 0 ? 'right' : 'left');
      setExitDirection(finalDirection);

      // Animate card off screen
      controls
        .start({
          x: finalDirection === 'right' ? 300 : -300,
          opacity: 0,
          transition: { duration: 0.3 },
        })
        .then(() => {
          if (onSwipe) {
            const itemId = isContentMode ? content._id : creator._id;
            onSwipe(finalDirection, itemId);
          }
        });
    } else {
      // Snap back to center
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    }
  };

  // Handle quick profile view (swipe up) or content purchase (tap on paid content)
  const handleQuickProfileView = () => {
    if (isContentMode) {
      // In content mode, swipe up goes to creator profile
      if (onViewProfile && content.creator) {
        onViewProfile(content.creator);
      }
    } else {
      // Legacy creator mode
      if (onSwipe) {
        onSwipe('up', creator._id);
      }
    }
  };

  // Handle content purchase
  const handleContentPurchase = () => {
    if (isContentMode && allPhotos[currentPhotoIndex]?.isPaid && onPurchase) {
      onPurchase(content);
    }
  };

  // Handle photo navigation
  const handlePhotoNavigation = direction => {
    if (direction === 'next' && currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  // Touch handlers for photo navigation
  const handleCardTouch = e => {
    if (!isTop || minimalView) return;

    const cardWidth = cardRef.current?.offsetWidth || 0;
    const touchX = e.nativeEvent.offsetX || e.touches?.[0]?.clientX;
    const isLeftSide = touchX < cardWidth / 2;

    if (isLeftSide) {
      handlePhotoNavigation('prev');
    } else {
      handlePhotoNavigation('next');
    }
  };

  // Double tap detection (disabled - was for Super Like)
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    // Super Like functionality removed
    // Double tap now just handles photo navigation
    const now = Date.now();
    lastTap.current = now;
    // Could repurpose for quick profile view if needed
    // handleQuickProfileView();
  };

  // Calculate time ago
  const getTimeAgo = timestamp => {
    if (!timestamp) return '';
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Safety menu handlers
  const handleSafetyMenuToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSafetyMenu(!showSafetyMenu);
  };

  const handleReportContent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSafetyMenu(false);
    setShowReportModal(true);
  };

  const handleReportSuccess = async (reportData) => {
    try {
      // Hide content from this specific user
      const contentId = isContentMode ? content._id : null;
      const creatorId = isContentMode ? content.creator?._id : creator?._id;

      if (contentId) {
        safetyManager.hideContent(contentId, 'reported_content');
      }

      // If we have creator info, hide all their future content for this user
      if (creatorId) {
        safetyManager.addReportedCreator(creatorId);
      }

      setShowReportModal(false);
    } catch (error) {
      console.error('Error handling report success:', error);
    }
  };

  // Close safety menu when clicking outside
  const handleOutsideClick = (e) => {
    if (showSafetyMenu) {
      setShowSafetyMenu(false);
    }
  };

  // Notify parent component when modal state changes
  React.useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(showReportModal || showBlockModal);
    }
  }, [showReportModal, showBlockModal, onModalStateChange]);

  return (
    <motion.div
      ref={cardRef}
      className={`swipecard-container ${isTop ? 'swipecard-top' : ''} ${exitDirection ? `swipecard-exit-${exitDirection}` : ''} ${minimalView ? 'swipecard-minimal' : ''}`}
      style={{
        x: motionValue,
        rotate: rotateValue,
        opacity: opacityValue,
        ...style,
      }}
      drag={dragEnabled && isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      animate={controls}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={!minimalView ? handleDoubleTap : undefined}
    >
      <div
        className='swipecard-photo-container'
        onClick={!minimalView ? handleCardTouch : undefined}
      >
        {/* Main Photo */}
        <img
          src={allPhotos[currentPhotoIndex]?.url || (isContentMode ? content.url : creator.profileImage)}
          alt={isContentMode ? content.title || content.creator?.displayName : creator.displayName || ''}
          className={`swipecard-photo ${allPhotos[currentPhotoIndex]?.isPaid === true || (allPhotos[currentPhotoIndex]?.isFree === false && allPhotos[currentPhotoIndex]?.price > 0) ? 'swipecard-photo-blurred' : ''}`}
          draggable='false'
        />

        {/* Paid Content Overlay */}
        {!minimalView && (allPhotos[currentPhotoIndex]?.isPaid === true || (allPhotos[currentPhotoIndex]?.isFree === false && allPhotos[currentPhotoIndex]?.price > 0)) && (
          <div className='swipecard-paid-overlay' onClick={handleContentPurchase}>
            <div className='swipecard-unlock-icon'>🔒</div>
            <div className='swipecard-price'>
              ${(allPhotos[currentPhotoIndex]?.price || 0).toFixed(2)}
            </div>
            <div className='swipecard-unlock-text'>Tap to unlock</div>
          </div>
        )}

        {/* Safety Menu Button - Top Right */}
        {!minimalView && isTop && (
          <div className='swipecard-safety-menu-container'>
            <button
              className='swipecard-safety-menu-button'
              onClick={handleSafetyMenuToggle}
              aria-label='Safety options'
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Safety Menu Dropdown */}
            {showSafetyMenu && (
              <div className='swipecard-safety-menu-dropdown' onClick={handleOutsideClick}>
                <button
                  className='swipecard-safety-menu-item'
                  onClick={handleReportContent}
                  aria-label='Report this content'
                >
                  <Flag size={16} />
                  <span>Report</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Creator Attribution (Content Mode Only) - REMOVED for cleaner UI */}
        {/* {isContentMode && !minimalView && content.creator && (
          <div className='swipecard-creator-attribution'>
            <img
              src={content.creator.profileImage}
              alt={content.creator.displayName}
              className='attribution-avatar'
            />
            <div className='attribution-info'>
              <span className='attribution-name'>{content.creator.displayName}</span>
              {content.creator.isVerified && (
                <Shield size={14} className='attribution-verified' />
              )}
            </div>
          </div>
        )} */}

        {/* Photo Indicators - NOT in minimal view */}
        {!minimalView && allPhotos.length > 1 && (
          <div className='swipecard-photo-indicators'>
            {allPhotos.map((_, index) => (
              <div
                key={index}
                className={`photo-indicator ${index === currentPhotoIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Gradient Overlay - NOT in minimal view */}
        {!minimalView && <div className='swipecard-gradient-overlay' />}

        {/* Minimal View Status - ONLY show these in minimal view and creator mode */}
        {minimalView && !isContentMode && (
          <div className='swipecard-minimal-status'>
            {cardData?.isOnline && (
              <div className='minimal-online-indicator'>
                <span className='minimal-online-dot'></span>
              </div>
            )}
            {cardData?.verified && (
              <div className='minimal-verified-indicator'>
                <Shield size={16} className='minimal-verified-icon' />
              </div>
            )}
          </div>
        )}

        {/* Full View Content - NOT in minimal view and only for creator mode */}
        {!minimalView && !isContentMode && (
          <>
            {/* Top Bar */}
            <div className='swipecard-top-bar'>
              {cardData?.isOnline && (
                <div className='swipecard-online-status'>
                  <span className='online-dot-indicator' />
                  <span>Online</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className='swipecard-badges'>
              {cardData?.verified && (
                <span className='swipecard-badge verified-badge'>
                  <Shield size={12} />
                  <span>Verified</span>
                </span>
              )}
            </div>

            {/* Last Active (if not online) */}
            {!cardData?.isOnline && cardData?.lastActive && (
              <div className='swipecard-last-active'>
                Active {getTimeAgo(cardData.lastActive)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          contentId={isContentMode ? content._id : creator?._id}
          contentType={isContentMode ? 'content' : 'creator'}
          reportedUserId={isContentMode ? content.creator?._id : creator?._id}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </motion.div>
  );
};

export default SwipeCard;
