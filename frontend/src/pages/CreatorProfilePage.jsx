import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Eye,
  Clock,
  AlertCircle,
  Upload,
  Check,
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import CreatorProfilePreview from './CreatorProfilePreview';
import CreatorQuickActions from '../components/CreatorQuickActions';
import CreatorProfileInformation from '../components/CreatorProfileInformation';
import StatsGrid from '../components/StatsGrid';
import CreatorProfileCard from '../components/CreatorProfileCard';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import { useAuth } from '../contexts/AuthContext';
import creatorService from '../services/creator.service';
import defaultProfileImage from '../assets/cuteblonde.png';
import './CreatorProfilePage.css';

const CreatorProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCreator, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    connections: 0,
    earnings: 0,
    rating: 0,
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
      console.log('CreatorProfilePage: Calling creatorService.getProfile()');
      const response = await creatorService.getProfile();
      console.log('CreatorProfilePage: API response:', response);

      if (response && response.success && response.profile) {
        console.log(
          'CreatorProfilePage: Setting profile data:',
          response.profile
        );

        let processedProfile = {
          ...response.profile,
          isOwnProfile: true,
        };

        // Handle different possible image URL formats
        if (response.profile.profileImage) {
          // If it's a Cloudinary URL, ensure it's using HTTPS
          if (response.profile.profileImage.includes('cloudinary')) {
            processedProfile.profileImage =
              response.profile.profileImage.replace('http://', 'https://');
          }
          // If it's a relative URL, add the base server URL (without /api/v1)
          else if (!response.profile.profileImage.startsWith('http')) {
            const baseServerUrl = (
              import.meta.env.VITE_API_URL || 'http://localhost:5002'
            ).replace('/api/v1', '');
            processedProfile.profileImage = `${baseServerUrl}/${response.profile.profileImage}`;
          }
        }

        setProfileData(processedProfile);

        // Use stats data from profile API response
        if (response.stats) {
          console.log(
            'CreatorProfilePage: Setting stats data:',
            response.stats
          );
          setStats({
            totalViews: response.stats.totalViews || 0,
            connections: response.stats.connections || response.stats.totalConnections || response.stats.matches || 0,
            earnings: response.stats.earnings || 0,
            rating: response.stats.rating || 0,
          });
        }
      } else {
        console.error(
          'CreatorProfilePage: Invalid API response structure:',
          response
        );
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('CreatorProfilePage: Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    console.log('Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
    });

    try {
      const response = await creatorService.updateProfilePhoto(file);

      if (response && response.success) {
        let newImageUrl =
          response.data?.profileImage ||
          response.data?.imageUrl ||
          response.profileImage;

        console.log('Upload successful, image URL:', newImageUrl);

        // Ensure HTTPS for Cloudinary URLs
        if (newImageUrl && newImageUrl.includes('cloudinary')) {
          newImageUrl = newImageUrl.replace('http://', 'https://');
        }
        // Handle relative URLs
        else if (newImageUrl && !newImageUrl.startsWith('http')) {
          newImageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/${newImageUrl}`;
        }

        setProfileData(prev => ({
          ...prev,
          profileImage: newImageUrl,
        }));

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        console.log('Profile photo uploaded successfully:', newImageUrl);
        alert('Profile photo updated successfully!');
      } else {
        console.error('Upload failed - Response:', response);
        const errorMsg =
          response?.message || 'Failed to upload photo. Please try again.';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Photo upload error - Full details:', {
        error: error,
        message: error.message,
        response: error.response,
        data: error.response?.data,
      });

      // More specific error messages
      let errorMessage = 'Error uploading photo. ';
      if (error.response?.status === 500) {
        errorMessage +=
          'Server error - this might be a Cloudinary configuration issue on the backend.';
      } else if (error.response?.status === 413) {
        errorMessage += 'File too large.';
      } else if (error.response?.status === 415) {
        errorMessage += 'Invalid file type.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      alert(errorMessage);
    }
  };


  // Show loading while auth is initializing or profile is loading
  if (authLoading || loading) {
    return (
      <div className='creator-profile-loading'>
        <div className='loading-spinner'></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className='creator-profile-error'>
        <AlertCircle size={48} />
        <h2>Authentication Required</h2>
        <p>Please log in to view this profile.</p>
        <button onClick={() => navigate('/creator/login')}>Go to Login</button>
      </div>
    );
  }

  // Show error if not a creator
  if (!isCreator) {
    return (
      <div className='creator-profile-error'>
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>This page is only available to creators.</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  // Show error if profile failed to load
  if (error) {
    return (
      <div className='creator-profile-error'>
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
      <div className='creator-profile-loading'>
        <div className='loading-spinner'></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className='creator-profile-page'>
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}

      {/* Header */}
      <div className='profile-header'>
        <div className='profile-page-header-content'>
          <h1>
            <User size={24} />
            {profileData?.isOwnProfile
              ? 'My Profile'
              : `${profileData.displayName}'s Profile`}
          </h1>
        </div>
      </div>

      {/* Profile Overview */}
      <div className='profile-overview'>
        <CreatorProfileCard
          profileData={profileData}
          isOwnProfile={profileData?.isOwnProfile}
          onImageUpload={handlePhotoUpload}
          onImageUploadStart={() => setUploadingPhoto(true)}
          onImageUploadEnd={() => setUploadingPhoto(false)}
          uploadingPhoto={uploadingPhoto}
        />

        {/* Stats Grid - Only for own profile */}
        {profileData?.isOwnProfile && (
          <StatsGrid
            stats={{
              totalViews: stats?.totalViews || 0,
              connections: stats?.connections || 0,
              earnings: stats?.earnings || 0,
              rating: stats?.rating || 0,
            }}
            loading={loading}
          />
        )}
      </div>

      {/* Profile Details */}
      <div className='profile-details'>
        <CreatorProfileInformation
          creatorData={profileData}
          isOwnProfile={profileData?.isOwnProfile}
          onEditClick={() => navigate('/creator/profile-setup')}
        />

        <div className='details-section'>
          <h3>Content Pricing</h3>
          <div className='pricing-grid'>
            <div className='pricing-item'>
              <span className='pricing-label'>Photos</span>
              <span className='pricing-value'>
                ${profileData?.pricing?.photos || '0.00'} each
              </span>
            </div>
            <div className='pricing-item'>
              <span className='pricing-label'>Videos</span>
              <span className='pricing-value'>
                ${profileData?.pricing?.videos || '0.00'} each
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Status */}
      <div className='profile-status'>
        <div className='status-card'>
          <div className='status-header'>
            <h3>Profile Status</h3>
            <div
              className={`status-badge ${profileData?.isVerified ? 'verified' : 'pending'}`}
            >
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
            <div className='status-message'>
              <AlertCircle size={16} />
              <span>
                Complete your profile verification to start receiving connections
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Using CreatorQuickActions component */}
      <CreatorQuickActions
        profileData={profileData}
        additionalActions={[
          {
            icon: <Upload size={20} />,
            label: 'Upload Content',
            onClick: () => navigate('/creator/upload')
          }
        ]}
      />


      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorProfilePage;
