import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, CheckCircle, MapPin, Calendar, Clock, Eye,
  Edit, Share2, Settings, DollarSign, Users, TrendingUp,
  Camera, Gift, Star, Award, Target, Zap
} from 'lucide-react';
import creatorService from '../services/creator.service';
import CreatorProfilePreview from '../components/CreatorProfilePreview';
import './CreatorProfile.css';

const CreatorProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      console.log('CreatorProfilePage: Loading profile data for creator');
      setLoading(true);
      
      // Fetch creator profile
      console.log('CreatorProfilePage: Loading creator profile data');
      console.log('CreatorProfilePage: Calling creatorService.getProfile()');
      const profileResponse = await creatorService.getProfile();
      console.log('CreatorProfilePage: API response:', profileResponse);
      
      if (profileResponse.success) {
        const profileData = profileResponse.profile || profileResponse.data;
        console.log('CreatorProfilePage: Setting profile data:', profileData);
        setProfile(profileData);
        
        // Store in localStorage for preview to access
        localStorage.setItem('creatorProfile', JSON.stringify(profileData));
        
        const statsData = profileResponse.stats || {
          totalViews: 0,
          connections: 0,
          earnings: 0,
          rating: 0
        };
        console.log('CreatorProfilePage: Setting stats data:', statsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('CreatorProfilePage: Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewProfile = () => {
    setShowPreview(true);
  };

  const handleEditProfile = () => {
    navigate('/creator/profile-setup');
  };

  const getVerificationStatus = () => {
    if (!profile) return { text: 'Not Verified', color: 'text-gray-500' };
    
    if (profile.verified) {
      return { text: 'Verified', color: 'text-green-500' };
    } else if (profile.verificationStatus === 'pending') {
      return { text: 'Verification Pending', color: 'text-yellow-500' };
    } else {
      return { text: 'Not Verified', color: 'text-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="creator-profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="creator-profile-page">
        <div className="profile-error">
          <p>Failed to load profile</p>
          <button onClick={fetchProfileData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="creator-profile-page">
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
              <div className="avatar-container clickable" onClick={handleEditProfile}>
                <img 
                  src={profile.profileImage || 'https://via.placeholder.com/150'} 
                  alt={profile.displayName || profile.username}
                />
                <div className="avatar-overlay">
                  <Camera size={24} />
                  <span>Change Photo</span>
                </div>
              </div>
            </div>
            
            <div className="profile-info">
              <div className="name-section">
                <h2>{profile.displayName || profile.username}</h2>
                <div className={`verified-badge ${profile.verified ? 'verified' : ''}`}>
                  <CheckCircle size={14} />
                  <span>{getVerificationStatus().text}</span>
                </div>
              </div>
              
              <div className="profile-meta">
                {profile.location && (
                  <span className="meta-item">
                    <MapPin size={14} />
                    {profile.location.country || profile.location}
                  </span>
                )}
                {profile.age && (
                  <span className="meta-item">
                    <User size={14} />
                    Age {profile.age}
                  </span>
                )}
                <span className="meta-item">
                  <Calendar size={14} />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="profile-bio">
                {profile.bio || 'No bio added yet'}
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
                <span className="stat-value">{stats?.totalViews || 0}</span>
                <span className="stat-label">Total Views</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon matches">
                <Users size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats?.connections || 0}</span>
                <span className="stat-label">Matches</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon earnings">
                <DollarSign size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">${stats?.earnings || 0}</span>
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
                <span className="detail-value">{profile.gender || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Orientation</span>
                <span className="detail-value">{profile.orientation || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Body Type</span>
                <span className="detail-value">{profile.bodyType || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">
                  {profile.location?.country || profile.location || 'Not specified'}
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
                  ${profile.contentPricing?.photos || '0.00'} each
                </span>
              </div>
              <div className="pricing-item">
                <span className="pricing-label">Videos</span>
                <span className="pricing-value">
                  ${profile.contentPricing?.videos || '0.00'} each
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
              <div className={`status-badge ${profile.verified ? 'verified' : 'unverified'}`}>
                {profile.verified ? (
                  <>
                    <CheckCircle size={14} />
                    <span>Verified</span>
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    <span>Not Verified</span>
                  </>
                )}
              </div>
            </div>
            
            {!profile.verified && (
              <p className="status-message">
                Complete verification to unlock all features and build trust with members.
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button 
              className="quick-action-btn"
              onClick={handleEditProfile}
            >
              <Edit size={20} />
              <span>Edit Profile</span>
            </button>
            
            <button 
              className="quick-action-btn"
              onClick={handlePreviewProfile}
            >
              <Eye size={20} />
              <span>Preview Profile</span>
            </button>
            
            <button 
              className="quick-action-btn"
              onClick={() => navigate('/creator/settings')}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
            
            <button 
              className="quick-action-btn"
              onClick={() => {
                // Copy profile link
                const profileUrl = `${window.location.origin}/creator/${profile.username}`;
                navigator.clipboard.writeText(profileUrl);
                alert('Profile link copied!');
              }}
            >
              <Share2 size={20} />
              <span>Share Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Preview Modal */}
      {showPreview && (
        <CreatorProfilePreview 
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default CreatorProfilePage;