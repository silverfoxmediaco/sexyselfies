import React from 'react';
import { Camera, Shield, Bell, CheckCircle, Heart, MessageCircle, MapPin, Clock, Calendar, Loader2 } from 'lucide-react';
import './ProfileInfoOverlay.css';

const ProfileInfoOverlay = ({
  creator,
  isFollowing = false,
  hasMatched = false,
  isFavorited = false,
  connectLoading = false,
  likeLoading = false,
  onFollow,
  onLike,
  onMessage
}) => {
  const getTimeAgo = (timestamp) => {
    if (!timestamp || timestamp === 'Invalid Date' || isNaN(new Date(timestamp))) {
      return 'recently';
    }
    const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="ProfileInfoOverlay-container">
      {/* Avatar Section */}
      <div className="ProfileInfoOverlay-avatar-section">
        <div className="ProfileInfoOverlay-avatar">
          {(creator?.profileImage &&
            typeof creator.profileImage === 'string' &&
            creator.profileImage !== 'default-avatar.jpg' &&
            creator.profileImage !== '' &&
            (creator.profileImage.startsWith('http') || creator.profileImage.startsWith('data:'))) ||
          (creator?.profilePhotoPreview &&
            typeof creator.profilePhotoPreview === 'string' &&
            creator.profilePhotoPreview.startsWith('data:')) ? (
            <img
              src={creator.profileImage || creator.profilePhotoPreview}
              alt={creator.displayName || creator.username}
            />
          ) : (
            <div className="ProfileInfoOverlay-avatar-placeholder">
              <Camera size={24} />
            </div>
          )}
          {creator?.isOnline && (
            <span className="ProfileInfoOverlay-online-indicator"></span>
          )}
        </div>

        {/* Profile Details */}
        <div className="ProfileInfoOverlay-details">
          <div className="ProfileInfoOverlay-name-section">
            <h1 className="ProfileInfoOverlay-name">
              {creator?.displayName || creator?.username || 'Creator'}
              {creator?.verified && (
                <Shield className="ProfileInfoOverlay-verified-icon" size={16} />
              )}
            </h1>
            <span className="ProfileInfoOverlay-username">
              @{creator?.username || 'username'}
            </span>
          </div>

          {creator?.bio && (
            <p className="ProfileInfoOverlay-bio">{creator.bio}</p>
          )}

          <div className="ProfileInfoOverlay-meta">
            {creator?.location?.country && (
              <span className="ProfileInfoOverlay-meta-item">
                <MapPin size={12} />
                {creator.location.country}
              </span>
            )}
            <span className="ProfileInfoOverlay-meta-item">
              <Clock size={12} />
              {creator?.isOnline
                ? 'Online now'
                : `Active ${getTimeAgo(creator?.lastActive)}`}
            </span>
            {creator?.createdAt && (
              <span className="ProfileInfoOverlay-meta-item">
                <Calendar size={12} />
                Joined {new Date(creator.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="ProfileInfoOverlay-actions">
        <button
          className={`ProfileInfoOverlay-follow-btn ${isFollowing ? 'following' : ''} ${connectLoading ? 'loading' : ''}`}
          onClick={onFollow}
          disabled={connectLoading}
        >
          {connectLoading ? (
            <>
              <Loader2 size={16} className="ProfileInfoOverlay-spinner" />
              <span>Connecting...</span>
            </>
          ) : isFollowing ? (
            <>
              <CheckCircle size={16} />
              <span>Connected</span>
            </>
          ) : (
            <>
              <Bell size={16} />
              <span>Connect</span>
            </>
          )}
        </button>

        <button
          className={`ProfileInfoOverlay-like-btn ${isFavorited ? 'favorited' : ''} ${likeLoading ? 'loading' : ''}`}
          onClick={onLike}
          disabled={likeLoading}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {likeLoading ? (
            <Loader2 size={16} className="ProfileInfoOverlay-spinner" />
          ) : (
            <Heart
              size={16}
              fill={isFavorited ? 'currentColor' : 'none'}
            />
          )}
        </button>

        <button
          className={`ProfileInfoOverlay-message-btn ${isFollowing ? 'connected' : ''}`}
          onClick={onMessage}
          disabled={!isFollowing}
          title={isFollowing ? 'Send message' : 'Connect first to message'}
        >
          <MessageCircle size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProfileInfoOverlay;