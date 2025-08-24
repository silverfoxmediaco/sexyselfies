import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Shield } from 'lucide-react';
import './SwipeCard.css';

const SwipeCard = ({ 
  creator, 
  onSwipe, 
  onViewProfile,
  isTop = false,
  style = {},
  dragEnabled = true,
  showActions = true,
  minimalView = false
}) => {
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
  
  // Refs
  const cardRef = useRef(null);
  const swipeThreshold = 100;
  const swipeVelocityThreshold = 500;
  
  // Get all photos (profile photo + additional photos)
  const allPhotos = [creator.profileImage, ...(creator.photos || [])];
  
  // Handle drag end
  const handleDragEnd = (event, info) => {
    const swipeDirection = info.offset.x > swipeThreshold ? 'right' : 
                          info.offset.x < -swipeThreshold ? 'left' : null;
    
    if (swipeDirection || Math.abs(info.velocity.x) > swipeVelocityThreshold) {
      const finalDirection = swipeDirection || (info.velocity.x > 0 ? 'right' : 'left');
      setExitDirection(finalDirection);
      
      // Animate card off screen
      controls.start({
        x: finalDirection === 'right' ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 }
      }).then(() => {
        if (onSwipe) {
          onSwipe(finalDirection, creator._id);
        }
      });
    } else {
      // Snap back to center
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      });
    }
  };
  
  // Handle super like (double tap or swipe up)
  const handleSuperLike = () => {
    setExitDirection('super');
    controls.start({
      y: -300,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.5 }
    }).then(() => {
      if (onSwipe) {
        onSwipe('super', creator._id);
      }
    });
  };
  
  // Handle photo navigation
  const handlePhotoNavigation = (direction) => {
    if (direction === 'next' && currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };
  
  // Touch handlers for photo navigation
  const handleCardTouch = (e) => {
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
  
  // Double tap detection
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleSuperLike();
    }
    lastTap.current = now;
  };
  
  // Calculate time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      ref={cardRef}
      className={`swipecard-container ${isTop ? 'swipecard-top' : ''} ${exitDirection ? `swipecard-exit-${exitDirection}` : ''} ${minimalView ? 'swipecard-minimal' : ''}`}
      style={{
        x: motionValue,
        rotate: rotateValue,
        opacity: opacityValue,
        ...style
      }}
      drag={dragEnabled && isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      animate={controls}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={!minimalView ? handleDoubleTap : undefined}
    >
      <div className="swipecard-photo-container" onClick={!minimalView ? handleCardTouch : undefined}>
        {/* Main Photo */}
        <img 
          src={allPhotos[currentPhotoIndex] || creator.profileImage} 
          alt={creator.displayName || ''}
          className="swipecard-photo"
          draggable="false"
        />
        
        {/* Photo Indicators - NOT in minimal view */}
        {!minimalView && allPhotos.length > 1 && (
          <div className="swipecard-photo-indicators">
            {allPhotos.map((_, index) => (
              <div 
                key={index}
                className={`photo-indicator ${index === currentPhotoIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
        
        {/* Gradient Overlay - NOT in minimal view */}
        {!minimalView && <div className="swipecard-gradient-overlay" />}
        
        {/* Minimal View Status - ONLY show these in minimal view */}
        {minimalView && (
          <div className="swipecard-minimal-status">
            {creator.isOnline && (
              <div className="minimal-online-indicator">
                <span className="minimal-online-dot"></span>
              </div>
            )}
            {creator.verified && (
              <div className="minimal-verified-indicator">
                <Shield size={16} className="minimal-verified-icon" />
              </div>
            )}
          </div>
        )}
        
        {/* Full View Content - NOT in minimal view */}
        {!minimalView && (
          <>
            {/* Top Bar */}
            <div className="swipecard-top-bar">
              {creator.isOnline && (
                <div className="swipecard-online-status">
                  <span className="online-dot-indicator" />
                  <span>Online</span>
                </div>
              )}
            </div>
            
            {/* Badges */}
            <div className="swipecard-badges">
              {creator.verified && (
                <span className="swipecard-badge verified-badge">
                  <Shield size={12} />
                  <span>Verified</span>
                </span>
              )}
            </div>
            
            {/* Last Active (if not online) */}
            {!creator.isOnline && creator.lastActive && (
              <div className="swipecard-last-active">
                Active {getTimeAgo(creator.lastActive)}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SwipeCard;