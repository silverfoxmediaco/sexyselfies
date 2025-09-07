import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Edit3, Eye, Settings, Camera, MapPin, 
  Heart, Users, DollarSign, TrendingUp, Share2,
  Star, Calendar, Check, Clock, AlertCircle, Upload
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import CreatorProfilePreview from './CreatorProfilePreview';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import { useAuth } from '../contexts/AuthContext';
import creatorService from '../services/creator.service';
import './CreatorProfilePage.css';

const CreatorProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCreator, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    matches: 0,
    earnings: 0,
    rating: 0
  });

  // Load profile data when component mounts
  useEffect(() => {
    if (!authLoading && isAuthenticated && isCreator) {
      console.log('CreatorProfilePage: Loading profile data for creator');
      loadProfileData();
    }
  }, [isAuthenticated, authLoading, isCreator]);

  const loadProfileData = async () => {
    console.log('CreatorProfilePage: Loading creator profile data');
    setLoading(true);
    setError(null);

    try {
      // This page is for the creator's own profile only
      console.log('CreatorProfilePage: Calling creatorService.getProfile()');
      const response = await creatorService.getProfile();
      console.log('CreatorProfilePage: API response:', response);
      
      if (response && response.success && response.profile) {
        console.log('CreatorProfilePage: Setting profile data:', response.profile);
        setProfileData({
          ...response.profile,
          isOwnProfile: true
        });

        // Use stats data from profile API response
        if (response.stats) {
          console.log('CreatorProfilePage: Setting stats data:', response.stats);
          setStats({
            totalViews: response.stats.totalViews || 0,
            matches: response.stats.matches || 0,
            earnings: response.stats.earnings || 0,
            rating: response.stats.rating || 0
          });
        }
      } else {
        console.error('CreatorProfilePage: Invalid API response structure:', response);
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('CreatorProfilePage: Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    setUploadingPhoto(true);

    try {
      const response = await creatorService.updateProfilePhoto(file);

      if (response && response.success) {
        // Update profile data with new photo
        setProfileData(prev => ({
          ...prev,
          profilePhoto: response.data.imageUrl || response.data.profilePhoto
        }));
        
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        console.log('Profile photo uploaded successfully:', response.data);
      } else {
        console.error('Upload response:', response);
        alert('Failed to upload photo. Please try again.');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Error uploading photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current && !uploadingPhoto && profileData?.isOwnProfile) {
      fileInputRef.current.click();
    }
  };

  // Show loading while auth is initializing or profile is loading
  if (authLoading || loading) {
    return (
      <div className="creator-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="creator-profile-error">
        <AlertCircle size={48} />
        <h2>Authentication Required</h2>
        <p>Please log in to view this profile.</p>
        <button onClick={() => navigate('/creator/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  // Show error if not a creator
  if (!isCreator) {
    return (
      <div className="creator-profile-error">
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>This page is only available to creators.</p>
        <button onClick={() => navigate('/')}>
          Go Home
        </button>
      </div>
    );
  }

  // Show error if profile failed to load
  if (error) {
    return (
      <div className="creator-profile-error">
        <AlertCircle size={48} />
        <h2>Profile Not Found</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/creator/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Show loading if no profile data yet
  if (!profileData) {
    return (
      <div className="creator-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="creator-profile-page">
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      
      {/* Header */}
      <div className="profile-header">
        <div className="profile-page-header-content">
          <h1>
            <User size={24} />
            {profileData?.isOwnProfile ? 'My Profile' : `${profileData.displayName}'s Profile`}
          </h1>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="profile-overview">
        <div className="profile-card">
          <div className="profile-avatar">
            {profileData?.profilePhoto ? (
              <div 
                className={`avatar-container ${profileData?.isOwnProfile ? 'clickable' : ''}`} 
                onClick={handleAvatarClick}
              >
                <img src={profileData.profilePhoto} alt={profileData.displayName} />
                {profileData?.isOwnProfile && (
                  <div className="avatar-overlay">
                    {uploadingPhoto ? (
                      <div className="upload-spinner">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <>
                        <Camera size={24} />
                        <span>Change Photo</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div 
                className={`avatar-placeholder ${uploadingPhoto ? 'uploading' : ''} ${profileData?.isOwnProfile ? 'clickable' : ''}`}
                onClick={handleAvatarClick}
              >
                {uploadingPhoto ? (
                  <div className="upload-spinner">
                    <div className="spinner"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Camera size={32} />
                    <span>{profileData?.isOwnProfile ? 'Add Photo' : 'No Photo'}</span>
                  </>
                )}
              </div>
            )}
            {profileData?.isOnline && <div className="online-indicator"></div>}
            
            {/* Hidden file input - only for own profile */}
            {profileData?.isOwnProfile && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                disabled={uploadingPhoto}
              />
            )}
          </div>

          <div className="profile-info">
            <div className="name-section">
              <h2>{profileData?.displayName || 'Creator Name'}</h2>
              {profileData?.isVerified && (
                <div className="verified-badge">
                  <Check size={14} />
                  <span>Verified</span>
                </div>
              )}
            </div>

            <div className="profile-meta">
              <span className="meta-item">
                <MapPin size={14} />
                {typeof profileData?.location === 'object' 
                  ? profileData?.location?.country || 'Location not set'
                  : profileData?.location || 'Location not set'}
              </span>
              <span className="meta-item">
                <Calendar size={14} />
                Age {profileData?.age || 'Not set'}
              </span>
            </div>

            <p className="profile-bio">
              {profileData?.bio || 'Add a bio to tell members about yourself...'}
            </p>
          </div>
        </div>

        {/* Stats Grid - Only for own profile */}
        {profileData?.isOwnProfile && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon views">
                <Eye size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{(stats?.totalViews || 0).toLocaleString()}</span>
                <span className="stat-label">Total Views</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon matches">
                <Heart size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{(stats?.matches || 0).toLocaleString()}</span>
                <span className="stat-label">Matches</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon earnings">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">${(stats?.earnings || 0).toLocaleString()}</span>
                <span className="stat-label">Total Earnings</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rating">
                <Star size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats?.rating || 0}</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Details */}
      <div className="profile-details">
        <div className="details-section">
          <h3>Profile Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Gender</span>
              <span className="detail-value">{profileData?.gender || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Orientation</span>
              <span className="detail-value">{profileData?.orientation || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Body Type</span>
              <span className="detail-value">{profileData?.bodyType || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">
                {typeof profileData?.location === 'object' 
                  ? profileData?.location?.country || 'Not specified'
                  : profileData?.location || 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Content Pricing</h3>
          <div className="pricing-grid">
            <div className="pricing-item">
              <span className="pricing-label">Photos</span>
              <span className="pricing-value">
                ${profileData?.pricing?.photos || '0.00'} each
              </span>
            </div>
            <div className="pricing-item">
              <span className="pricing-label">Videos</span>
              <span className="pricing-value">
                ${profileData?.pricing?.videos || '0.00'} each
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Status */}
      <div className="profile-status">
        <div className="status-card">
          <div className="status-header">
            <h3>Profile Status</h3>
            <div className={`status-badge ${profileData?.isVerified ? 'verified' : 'pending'}`}>
              {profileData?.isVerified ? (
                <>
                  <Check size={14} />
                  <span>Verified</span>
                </>
              ) : (
                <>
                  <Clock size={14} />
                  <span>Pending Verification</span>
                </>
              )}
            </div>
          </div>
          
          {!profileData?.isVerified && (
            <div className="status-message">
              <AlertCircle size={16} />
              <span>Complete your profile verification to start receiving matches</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Only for own profile */}
      {profileData?.isOwnProfile && (
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <motion.button
              className="quick-action-btn"
              onClick={() => navigate('/creator/profile-setup')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit3 size={20} />
              <span>Edit Profile</span>
            </motion.button>
            
            <motion.button
              className="quick-action-btn"
              onClick={() => setShowPreview(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Eye size={20} />
              <span>Preview Profile</span>
            </motion.button>
            
            <motion.button
              className="quick-action-btn"
              onClick={() => navigate('/creator/settings')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings size={20} />
              <span>Settings</span>
            </motion.button>
            
            <motion.button
              className="quick-action-btn"
              onClick={() => {
                const profileUrl = `${window.location.origin}/creator/profile/${profileData.id || 'preview'}`;
                if (navigator.share) {
                  navigator.share({
                    title: `Check out ${profileData?.displayName}'s profile`,
                    text: `${profileData?.displayName} is on SexySelfies!`,
                    url: profileUrl
                  });
                } else {
                  navigator.clipboard.writeText(profileUrl);
                  alert('Profile link copied to clipboard!');
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Share2 size={20} />
              <span>Share Profile</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Profile Preview Modal */}
      <CreatorProfilePreview 
        profileData={profileData}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
      
      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorProfilePage;