import React from 'react';
import { ArrowLeft, Share2, MoreVertical } from 'lucide-react';
import ProfileInfoOverlay from './ProfileInfoOverlay';
import './ProfileCoverPhoto.css';

const ProfileCoverPhoto = ({
  creator,
  coverImage,
  isMobile = false,
  isFollowing = false,
  hasMatched = false,
  onBack,
  onFollow,
  onLike,
  onMessage,
  onShare,
  onMore,
  showShareMenu = false,
  showMoreMenu = false
}) => {
  return (
    <div className="ProfileCoverPhoto-container">
      {/* Cover Image or Placeholder */}
      {(coverImage &&
        typeof coverImage === 'string' &&
        coverImage !== 'default-cover.jpg' &&
        coverImage !== '' &&
        (coverImage.startsWith('http') || coverImage.startsWith('data:'))) ? (
        <img
          src={coverImage}
          alt="Cover"
          className="ProfileCoverPhoto-image"
        />
      ) : (
        <div className="ProfileCoverPhoto-placeholder"></div>
      )}

      {/* Floating Action Buttons - Mobile Only */}
      {isMobile && (
        <div className="ProfileCoverPhoto-floating-actions">
          <button
            className="ProfileCoverPhoto-action-btn back-btn"
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="ProfileCoverPhoto-actions-right">
            <button
              className="ProfileCoverPhoto-action-btn"
              onClick={onShare}
              aria-label="Share profile"
            >
              <Share2 size={20} />
            </button>
            <button
              className="ProfileCoverPhoto-action-btn"
              onClick={onMore}
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Profile Info Overlay - Positioned at bottom */}
      <ProfileInfoOverlay
        creator={creator}
        isFollowing={isFollowing}
        hasMatched={hasMatched}
        onFollow={onFollow}
        onLike={onLike}
        onMessage={onMessage}
      />
    </div>
  );
};

export default ProfileCoverPhoto;