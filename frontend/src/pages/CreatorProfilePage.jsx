import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Edit3, Eye, Settings, Camera, MapPin, 
  Heart, Users, DollarSign, TrendingUp, Share2,
  Star, Calendar, Check, Clock, AlertCircle
} from 'lucide-react';
// import CreatorProfilePreview from './CreatorProfilePreview';
import './CreatorProfilePage.css';

const CreatorProfilePage = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    matches: 0,
    earnings: 0,
    rating: 0
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    console.log('CreatorProfilePage: loadProfileData called');
    try {
      // Check if in development mode - use multiple methods
      const isDevelopment = import.meta.env.DEV || localStorage.getItem('token') === 'dev-token-12345';
      console.log('CreatorProfilePage: isDevelopment =', isDevelopment);
      console.log('CreatorProfilePage: import.meta.env.DEV =', import.meta.env.DEV);
      console.log('CreatorProfilePage: localStorage token =', localStorage.getItem('token'));
      
      if (isDevelopment) {
        // Use mock data in development
        const mockProfile = {
          displayName: "Sarah Martinez",
          bio: "Lifestyle content creator & fitness enthusiast. Join me for exclusive behind-the-scenes content!",
          profilePhoto: null,
          coverPhoto: null,
          age: 24,
          location: "Los Angeles, CA",
          orientation: "Straight",
          gender: "Female",
          bodyType: "Athletic",
          categories: ["Lifestyle", "Fitness", "Fashion"],
          pricing: {
            photos: 2.99,
            videos: 5.99
          },
          isVerified: true,
          isOnline: true
        };

        const mockStats = {
          totalViews: 15420,
          matches: 1247,
          earnings: 3840.50,
          rating: 4.8
        };

        setProfileData(mockProfile);
        setStats(mockStats);
        console.log('DEV MODE: Using mock profile data', mockProfile);
      } else {
        // TODO: Replace with actual API call
        const response = await fetch('/api/creator/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setProfileData(data.profile);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Set default values on error
      setProfileData({
        displayName: "Creator Name",
        bio: "Bio will appear here",
        isVerified: false,
        isOnline: false
      });
      setStats({
        totalViews: 0,
        matches: 0,
        earnings: 0,
        rating: 0
      });
    } finally {
      setLoading(false);
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
              <img src={profileData.profilePhoto} alt={profileData.displayName} />
            ) : (
              <div className="avatar-placeholder">
                <Camera size={32} />
                <span>Add Photo</span>
              </div>
            )}
            {profileData?.isOnline && <div className="online-indicator"></div>}
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
                {profileData?.location || 'Location not set'}
              </span>
              <span className="meta-item">
                <Calendar size={14} />
                Age {profileData?.age || 'Not set'}
              </span>
            </div>

            <p className="profile-bio">
              {profileData?.bio || 'Add a bio to tell members about yourself...'}
            </p>

            <div className="profile-categories">
              {profileData?.categories?.map((category, index) => (
                <span key={index} className="category-tag">{category}</span>
              )) || (
                <span className="no-categories">No categories selected</span>
              )}
            </div>
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
              <span className="detail-value">{profileData?.location || 'Not specified'}</span>
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
    </div>
  );
};

export default CreatorProfilePage;