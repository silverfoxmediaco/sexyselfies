import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Edit3, Eye, Settings, Camera, MapPin, 
  Heart, Users, DollarSign, TrendingUp, Share2,
  Star, Calendar, Check, Clock, AlertCircle, Upload
} from 'lucide-react';
// import CreatorProfilePreview from './CreatorProfilePreview';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import creatorService from '../services/creator.service';
import './CreatorProfilePage.css';

const CreatorProfilePage = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    matches: 0,
    earnings: 0,
    rating: 0
  });

  const loadProfileData = async () => {
    console.log('CreatorProfilePage: loadProfileData called');
    try {
      // Check if in development mode - use multiple methods
      const isDevelopment = import.meta.env.DEV || 
                           import.meta.env.MODE === 'development' || 
                           localStorage.getItem('token') === 'dev-token-12345';
      console.log('CreatorProfilePage: isDevelopment =', isDevelopment);
      console.log('CreatorProfilePage: import.meta.env.DEV =', import.meta.env.DEV);
      console.log('CreatorProfilePage: import.meta.env.MODE =', import.meta.env.MODE);
      console.log('CreatorProfilePage: hostname =', window.location.hostname);
      console.log('CreatorProfilePage: localStorage token =', localStorage.getItem('token'));
      
      if (isDevelopment) {
        // Use mock data in development - customize based on username
        const mockProfile = {
          displayName: username === 'tamara' ? "tamara" : (username || "Sarah Martinez"),
          bio: username === 'tamara' ? "Creative content creator" : "Content creator passionate about fitness and lifestyle",
          location: "Los Angeles, CA",
          profilePhoto: username === 'tamara' ? "/placeholders/tamara.jpg" : "/placeholders/sarah.jpg",
          isVerified: true,
          subscribers: 1234,
          totalContent: 67,
          joinDate: "2023-08-15"
        };

        const mockStats = {
          views: 15420,
          likes: 3240,
          earnings: 2847.50,
          rating: 4.8
        };

        setProfileData(mockProfile);
        setStats(mockStats);
        console.log('DEV MODE: Using mock profile data for username:', username, mockProfile);
        return; // Exit early in development mode
      } else {
        // Use actual API call to get profile data
        const response = await creatorService.getProfile();
        if (response && response.data) {
          setProfileData(response.data);
          
          // If this is the current user's profile (no specific username or matches logged in user)
          const isOwnProfile = !username || username === response.data.username || username === response.data.displayName;
          
          if (isOwnProfile) {
            // Load additional stats for own profile
            try {
              const statsResponse = await creatorService.getAnalytics('30d');
              if (statsResponse && statsResponse.data) {
                setStats({
                  totalViews: statsResponse.data.views || 0,
                  matches: statsResponse.data.connections || 0,
                  earnings: statsResponse.data.earnings || 0,
                  rating: statsResponse.data.rating || 0
                });
              }
            } catch (error) {
              console.warn('Could not load profile stats:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      
      // Get creator info from localStorage as fallback
      const storedDisplayName = localStorage.getItem('displayName') || 
                               localStorage.getItem('creatorName') ||
                               localStorage.getItem('username') ||
                               username ||
                               'Unknown Creator';
      
      setProfileData({
        displayName: storedDisplayName,
        bio: "No bio available",
        location: "Unknown location",
        profilePhoto: "/placeholders/default-avatar.jpg",
        isVerified: false,
        subscribers: 0,
        totalContent: 0,
        joinDate: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no username in URL, fetch current user data and redirect
    if (!username) {
      const fetchCurrentUserAndRedirect = async () => {
        try {
          // Check if in development mode
          const isDevelopment = import.meta.env.DEV || 
                               import.meta.env.MODE === 'development' || 
                               localStorage.getItem('token') === 'dev-token-12345';
          
          let currentUsername = 'profile'; // fallback
          
          if (isDevelopment) {
            // In development, use tamara as default
            currentUsername = 'tamara';
          } else {
            // In production, fetch the actual user profile from API
            try {
              const response = await creatorService.getProfile();
              if (response && response.data) {
                currentUsername = response.data.username || 
                                response.data.displayName || 
                                localStorage.getItem('username') || 
                                localStorage.getItem('displayName') ||
                                'profile';
              }
            } catch (error) {
              console.error('Failed to fetch current user profile:', error);
              // Fallback to localStorage
              currentUsername = localStorage.getItem('username') || 
                              localStorage.getItem('displayName') || 
                              'profile';
            }
          }
          
          console.log('CreatorProfilePage: No username in URL, redirecting to:', `/creator/profile/${currentUsername}`);
          navigate(`/creator/profile/${currentUsername}`, { replace: true });
        } catch (error) {
          console.error('Error getting current user for redirect:', error);
          // Fallback redirect
          navigate('/creator/profile/profile', { replace: true });
        }
      };

      fetchCurrentUserAndRedirect();
      return; // Don't load profile data yet
    }

    loadProfileData();
  }, [username, navigate]);

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
      const formData = new FormData();
      formData.append('profileImage', file);

      // Use uploadApi for file uploads
      const { uploadApi } = await import('../services/api.config');
      const response = await uploadApi.post('/creators/profile/image', formData);

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
    if (fileInputRef.current && !uploadingPhoto) {
      fileInputRef.current.click();
    }
  };

  if (loading) {
    console.log('CreatorProfilePage: Still loading...');
    return (
      <div className="creator-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  console.log('CreatorProfilePage: Rendering main content', { profileData, stats });

  return (
    <div className="creator-profile-page">
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      
      {/* Header */}
      <div className="profile-header">
        <div className="profile-page-header-content">
          <h1>
            <User size={24} />
            My Profile
          </h1>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="profile-overview">
        <div className="profile-card">
          <div className="profile-avatar">
            {profileData?.profilePhoto ? (
              <div className="avatar-container" onClick={handleAvatarClick}>
                <img src={profileData.profilePhoto} alt={profileData.displayName} />
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
              </div>
            ) : (
              <div 
                className={`avatar-placeholder ${uploadingPhoto ? 'uploading' : ''}`}
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
                    <span>Add Photo</span>
                  </>
                )}
              </div>
            )}
            {profileData?.isOnline && <div className="online-indicator"></div>}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              disabled={uploadingPhoto}
            />
          </div>

          <div className="profile-info">
            <div className="name-section">
              <h2>{profileData?.displayName || 'Your Name'}</h2>
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

        {/* Stats Grid */}
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

      {/* Quick Actions */}
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Share2 size={20} />
            <span>Share Profile</span>
          </motion.button>
        </div>
      </div>

      {/* Profile Preview Modal */}
      {showPreview && (
        <div className="preview-placeholder">
          <p>Preview functionality will be added back once the main page loads</p>
          <button onClick={() => setShowPreview(false)}>Close</button>
        </div>
      )}
      
      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorProfilePage;