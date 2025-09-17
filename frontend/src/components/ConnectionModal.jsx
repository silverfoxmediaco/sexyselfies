import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  DollarSign,
  Crown,
  Zap,
  X,
} from 'lucide-react';
import './ConnectionModal.css';

const ConnectionModal = ({
  isOpen,
  onClose,
  connectionType,
  connectionData,
  userRole = 'member', // 'member' or 'creator'
  onNavigateToProfile,
  onNavigateToChat,
  autoClose = false, // Set to false by default - modal stays open
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = path => (window.location.href = path);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);

      // Only auto-close if explicitly enabled (default is false)
      if (autoClose) {
        const timer = setTimeout(() => {
          onClose();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, onClose, autoClose]);

  // Handle navigation to profile
  const handleNavigateToProfile = () => {
    const { creatorId, memberId } = connectionData || {};
    const profileId = userRole === 'member' ? creatorId : memberId;

    if (onNavigateToProfile) {
      onNavigateToProfile(profileId);
    } else {
      // Default navigation
      navigate(
        userRole === 'member'
          ? `/creator/${profileId}`
          : `/member/profile/${profileId}`
      );
    }
    onClose();
  };

  // Handle navigation to chat
  const handleNavigateToChat = () => {
    const { connectionId, creatorId, memberId } = connectionData || {};

    if (onNavigateToChat) {
      onNavigateToChat(connectionId);
    } else {
      // Default navigation
      navigate(
        userRole === 'member'
          ? `/member/chat/${connectionId || creatorId}`
          : `/creator/chat/${connectionId || memberId}`
      );
    }
    onClose();
  };

  // Handle modal content click - navigate to profile
  const handleModalClick = e => {
    // Don't navigate if clicking on buttons or close button
    if (
      e.target.closest('.connection-btn') ||
      e.target.closest('.close-button')
    ) {
      return;
    }
    handleNavigateToProfile();
  };

  // Different connection types and their messages
  const getConnectionContent = () => {
    const { creatorName, memberName, profilePhoto, message, spending } =
      connectionData || {};

    switch (connectionType) {
      case 'mutual_interest':
        return {
          icon: <Heart className='connection-icon pulse' size={60} />,
          title: "It's a Connection!",
          subtitle:
            userRole === 'member'
              ? `${creatorName} was already interested in you! 🎉`
              : `${memberName} already liked your profile! 🔥`,
          description:
            userRole === 'member'
              ? 'They sent you a message earlier. Check it out!'
              : "This is a hot lead - they're ready to spend!",
          actionText: 'Start Chat',
          secondaryText: 'View Profile',
          primaryAction: handleNavigateToChat,
          secondaryAction: handleNavigateToProfile,
          highlight: true,
        };

      case 'creator_reached_out':
        return {
          icon: <MessageCircle className='connection-icon bounce' size={60} />,
          title: 'VIP Interest!',
          subtitle: `${creatorName} sent you an exclusive message!`,
          description: "This creator specifically chose you. Don't miss out!",
          actionText: 'Read Message',
          secondaryText: 'View Profile',
          primaryAction: handleNavigateToChat,
          secondaryAction: handleNavigateToProfile,
          highlight: true,
        };

      case 'high_value_connection':
        return {
          icon: <Crown className='connection-icon glow' size={60} />,
          title: 'Premium Connection!',
          subtitle:
            userRole === 'member'
              ? `You connected with a top creator!`
              : `You connected with a VIP member!`,
          description:
            userRole === 'member'
              ? 'This creator has exclusive content just for you'
              : `${memberName} has spent $${spending}+ on the platform`,
          actionText: userRole === 'member' ? 'Unlock Content' : 'Send Offer',
          secondaryText: 'View Profile',
          primaryAction: handleNavigateToChat,
          secondaryAction: handleNavigateToProfile,
          highlight: true,
          premium: true,
        };

      case 'first_connection':
        return {
          icon: <Star className='connection-icon spin' size={60} />,
          title: 'Your First Connection!',
          subtitle: 'Congratulations on making your first connection!',
          description: 'This is the beginning of something special',
          actionText: 'Start Chat',
          secondaryText: 'View Profile',
          primaryAction: handleNavigateToChat,
          secondaryAction: handleNavigateToProfile,
          highlight: true,
        };

      case 'instant_connection':
        return {
          icon: <Zap className='connection-icon flash' size={60} />,
          title: 'Instant Connection!',
          subtitle: `You and ${userRole === 'member' ? creatorName : memberName} liked each other!`,
          description: 'When you know, you know! Start chatting now.',
          actionText: 'Start Chat',
          secondaryText: 'View Profile',
          primaryAction: handleNavigateToChat,
          secondaryAction: handleNavigateToProfile,
          highlight: true,
        };

      case 'creator_poke':
        return {
          icon: <Sparkles className='connection-icon sparkle' size={60} />,
          title: 'You Got Poked!',
          subtitle: `${creatorName} wants your attention!`,
          description: "They're interested in connecting with you",
          actionText: 'Poke Back',
          secondaryText: 'View Profile',
          primaryAction: handleNavigateToChat,
          secondaryAction: handleNavigateToProfile,
          highlight: false,
        };

      default:
        return {
          icon: <Heart className='connection-icon' size={60} />,
          title: 'New Connection!',
          subtitle: "You've made a new connection!",
          description: 'Keep swiping to find more connections',
          actionText: 'View Connection',
          secondaryText: 'Keep Browsing',
          primaryAction: handleNavigateToProfile,
          secondaryAction: onClose,
          highlight: false,
        };
    }
  };

  const content = getConnectionContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - clicking it does NOT close the modal */}
          <motion.div
            className='connection-backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.stopPropagation()} // Prevent closing
          />

          {/* Modal */}
          <motion.div
            className={`connection-modal ${content.premium ? 'premium' : ''} ${content.highlight ? 'highlight' : ''}`}
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={handleModalClick} // Click modal content to view profile
            style={{ cursor: 'pointer' }} // Show it's clickable
          >
            {/* Close Button */}
            <button
              className='close-button'
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              aria-label='Close'
            >
              <X size={24} />
            </button>

            {/* Confetti Effect */}
            {showConfetti && content.highlight && (
              <div className='confetti-container'>
                {[...Array(30)].map((_, i) => (
                  <div key={i} className={`confetti confetti-${i % 5}`} />
                ))}
              </div>
            )}

            {/* Profile Photo if available */}
            {connectionData?.profilePhoto && (
              <div className='connection-profile-photo'>
                <img src={connectionData.profilePhoto} alt='Profile' />
                <div className='photo-glow' />
              </div>
            )}

            {/* Icon */}
            <div className='connection-icon-container'>
              {content.icon}
              <div className='icon-bg-pulse' />
            </div>

            {/* Content */}
            <div className='connection-content'>
              <h2 className='connection-title'>{content.title}</h2>
              <p className='connection-subtitle'>{content.subtitle}</p>
              <p className='connection-description'>{content.description}</p>
            </div>

            {/* Stats for high value connections */}
            {connectionType === 'high_value_connection' &&
              userRole === 'creator' && (
                <div className='connection-stats'>
                  <div className='stat-item'>
                    <DollarSign size={20} />
                    <span>${connectionData?.spending || 0}</span>
                  </div>
                  <div className='stat-item'>
                    <TrendingUp size={20} />
                    <span>High Spender</span>
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className='connection-actions'>
              <button
                className='connection-btn primary'
                onClick={e => {
                  e.stopPropagation();
                  content.primaryAction();
                }}
              >
                {content.actionText}
              </button>
              <button
                className='connection-btn secondary'
                onClick={e => {
                  e.stopPropagation();
                  content.secondaryAction();
                }}
              >
                {content.secondaryText}
              </button>
            </div>

            {/* Match Score/Compatibility (optional) */}
            {connectionType === 'mutual_interest' && (
              <div className='connection-compatibility'>
                <div className='compatibility-bar'>
                  <div
                    className='compatibility-fill'
                    style={{ width: '85%' }}
                  />
                </div>
                <span className='compatibility-text'>85% Compatibility</span>
              </div>
            )}

            {/* Tap hint */}
            <p className='tap-hint'>Tap card to view profile</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConnectionModal;
