import React, { useRef } from 'react';
import { Camera, Check, MapPin, Calendar } from 'lucide-react';
import defaultProfileImage from '../assets/cuteblonde.png';
import './CreatorProfileCard.css';

const CreatorProfileCard = ({
  profileData,
  isOwnProfile,
  onImageUpload,
  onImageUploadStart,
  onImageUploadEnd,
  uploadingPhoto = false,
  className = ''
}) => {
  const fileInputRef = useRef(null);

  const hasValidProfileImage = () => {
    const img = profileData?.profileImage;
    return (
      img &&
      img !== '' &&
      !img.includes('default') &&
      (img.startsWith('http') || img.startsWith('https') || img.startsWith('/'))
    );
  };

  const getDisplayImage = () => {
    if (hasValidProfileImage()) {
      return profileData.profileImage;
    }
    return defaultProfileImage;
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current && !uploadingPhoto && isOwnProfile) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    if (onImageUploadStart) onImageUploadStart();

    try {
      if (onImageUpload) {
        await onImageUpload(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      if (onImageUploadEnd) onImageUploadEnd();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatLocation = (location) => {
    if (typeof location === 'object' && location !== null) {
      if (location.country && location.city) {
        return `${location.city}, ${location.country}`;
      }
      return location?.country || location?.city || 'Location not set';
    }
    return location || 'Location not set';
  };

  const formatAge = (age) => {
    if (!age || age === 0) return 'Age not set';
    return `Age ${age}`;
  };

  return (
    <div className={`CreatorProfileCard ${className}`}>
      <div className="CreatorProfileCard-avatar">
        <div
          className={`CreatorProfileCard-avatar-container ${isOwnProfile ? 'CreatorProfileCard-avatar-clickable' : ''}`}
          onClick={handleAvatarClick}
          role={isOwnProfile ? 'button' : undefined}
          tabIndex={isOwnProfile ? 0 : undefined}
          onKeyDown={(e) => {
            if (isOwnProfile && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleAvatarClick();
            }
          }}
        >
          <img
            src={getDisplayImage()}
            alt={profileData?.displayName || 'Profile'}
            className="CreatorProfileCard-avatar-image"
            onError={(e) => {
              if (e.target.src !== defaultProfileImage) {
                e.target.src = defaultProfileImage;
              }
            }}
          />

          {isOwnProfile && (
            <div className="CreatorProfileCard-avatar-overlay">
              {uploadingPhoto ? (
                <div className="CreatorProfileCard-upload-spinner">
                  <div className="CreatorProfileCard-spinner"></div>
                </div>
              ) : (
                <>
                  <Camera size={24} />
                  <span className="CreatorProfileCard-upload-text">
                    {hasValidProfileImage() ? 'Change Photo' : 'Add Photo'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {profileData?.isOnline && (
          <div className="CreatorProfileCard-online-indicator"></div>
        )}

        {isOwnProfile && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={uploadingPhoto}
            aria-label="Upload profile image"
          />
        )}
      </div>

      <div className="CreatorProfileCard-info">
        <div className="CreatorProfileCard-name-section">
          <h2 className="CreatorProfileCard-name">
            {profileData?.displayName || 'Creator Name'}
          </h2>
          {profileData?.isVerified && (
            <div className="CreatorProfileCard-verified-badge">
              <Check size={14} />
              <span>Verified</span>
            </div>
          )}
        </div>

        <div className="CreatorProfileCard-meta">
          <span className="CreatorProfileCard-meta-item">
            <MapPin size={14} />
            <span>{formatLocation(profileData?.location)}</span>
          </span>
          <span className="CreatorProfileCard-meta-item">
            <Calendar size={14} />
            <span>{formatAge(profileData?.age)}</span>
          </span>
        </div>

        <p className="CreatorProfileCard-bio">
          {profileData?.bio || (isOwnProfile
            ? 'Add a bio to tell members about yourself...'
            : 'No bio available')}
        </p>
      </div>
    </div>
  );
};

export default CreatorProfileCard;