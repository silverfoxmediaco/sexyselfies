import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit3, Eye, Settings, Share2, Camera } from 'lucide-react';
import CreatorProfilePreview from '../pages/CreatorProfilePreview';
import EditProfileImagesModal from './EditProfileImagesModal';
import './CreatorQuickActions.css';

const CreatorQuickActions = ({
  profileData,
  showSettings = true,
  showShare = true,
  showPreview = true,
  showEditProfileImages = true,
  onEditProfile,
  additionalActions = [],
  className = ''
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditImagesModal, setShowEditImagesModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const navigate = useNavigate();

  // Don't render if not the creator's own profile
  if (!profileData || !profileData.isOwnProfile) {
    return null;
  }

  const handleEditProfile = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      // Use short route pattern to match dashboard navigation
      navigate('/creator/profile-setup');
    }
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const handleSettings = () => {
    // Use short route pattern to match dashboard navigation
    navigate('/creator/settings');
  };

  const handleEditProfileImages = () => {
    setShowEditImagesModal(true);
  };

  const handleImagesUpdated = (updatedImages) => {
    // Refresh the page to show updated images
    window.location.reload();
  };

  const handleShare = async () => {
    if (!profileData.displayName && !profileData.id) {
      alert('Profile information is incomplete');
      return;
    }

    setShareLoading(true);
    const shareUrl = `${window.location.origin}/creator/${profileData.id || profileData._id}`;
    const shareText = `Check out ${profileData.displayName || 'this creator'}'s profile on SexySelfies!`;

    try {
      // Try Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: `${profileData.displayName || 'Creator'} - SexySelfies`,
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        alert('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Final fallback - show the URL in an alert
      alert(`Share your profile: ${shareUrl}`);
    } finally {
      setShareLoading(false);
    }
  };

  const defaultActions = [
    {
      id: 'edit',
      icon: <Edit3 size={20} />,
      label: 'Edit Profile',
      onClick: handleEditProfile,
      show: true
    },
    {
      id: 'edit-profile-images',
      icon: <Camera size={20} />,
      label: 'Edit Profile Images',
      onClick: handleEditProfileImages,
      show: showEditProfileImages
    },
    {
      id: 'preview',
      icon: <Eye size={20} />,
      label: 'Preview',
      onClick: handlePreview,
      show: showPreview
    },
    {
      id: 'settings',
      icon: <Settings size={20} />,
      label: 'Settings',
      onClick: handleSettings,
      show: showSettings
    },
    {
      id: 'share',
      icon: <Share2 size={20} />,
      label: shareLoading ? 'Sharing...' : 'Share Profile',
      onClick: handleShare,
      show: showShare,
      disabled: shareLoading
    }
  ];

  const allActions = [
    ...defaultActions.filter(action => action.show),
    ...additionalActions
  ];

  return (
    <>
      <div className={`CreatorQuickActions-container ${className}`}>
        <div className="CreatorQuickActions-grid">
          {allActions.map((action, index) => (
            <motion.button
              key={action.id || index}
              className={`CreatorQuickActions-button ${action.disabled ? 'disabled' : ''}`}
              onClick={action.onClick}
              disabled={action.disabled}
              whileHover={{ scale: action.disabled ? 1 : 1.05 }}
              whileTap={{ scale: action.disabled ? 1 : 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="CreatorQuickActions-button-icon">
                {action.icon}
              </div>
              <span className="CreatorQuickActions-button-label">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {showPreviewModal && (
        <CreatorProfilePreview
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          creatorData={profileData}
        />
      )}

      <EditProfileImagesModal
        isOpen={showEditImagesModal}
        onClose={() => setShowEditImagesModal(false)}
        currentProfileImage={profileData?.profileImage}
        currentCoverImage={profileData?.coverImage}
        creatorId={profileData?._id || profileData?.id}
        onImagesUpdated={handleImagesUpdated}
      />
    </>
  );
};

export default CreatorQuickActions;