import React, { useState, useEffect } from 'react';
import { Eye, X, Monitor, Smartphone } from 'lucide-react';
import CreatorProfile from './CreatorProfile'; // Import the ACTUAL profile component
import './CreatorProfilePreview.css';

const CreatorProfilePreview = ({ onClose }) => {
  const [deviceView, setDeviceView] = useState('mobile'); // 'mobile' or 'desktop'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [creatorData, setCreatorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the creator's data from localStorage or session
    const loadCreatorData = async () => {
      try {
        // First try to get from localStorage (where auth stores user data)
        const storedUser = localStorage.getItem('user');
        const storedCreator = localStorage.getItem('creatorProfile');
        
        let creatorInfo = null;
        
        // Try parsing stored creator profile first
        if (storedCreator) {
          try {
            creatorInfo = JSON.parse(storedCreator);
          } catch (e) {
            console.error('Failed to parse stored creator profile:', e);
          }
        }
        
        // If no creator profile, try user data
        if (!creatorInfo && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            creatorInfo = userData;
          } catch (e) {
            console.error('Failed to parse stored user data:', e);
          }
        }
        
        // If we still don't have data, fetch it
        if (!creatorInfo) {
          // Try to fetch the current creator's profile
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch('/api/v1/creator/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              creatorInfo = data.profile || data.creator || data;
            }
          }
        }
        
        // Format the data for CreatorProfile component
        const formattedData = {
          id: creatorInfo?._id || creatorInfo?.id || 'preview',
          _id: creatorInfo?._id || creatorInfo?.id || 'preview',
          username: creatorInfo?.username || 'your_username',
          displayName: creatorInfo?.displayName || creatorInfo?.name || 'Your Name',
          profileImage: creatorInfo?.profileImage || creatorInfo?.avatar || 'https://via.placeholder.com/200',
          coverImage: creatorInfo?.coverImage || creatorInfo?.cover || null,
          bio: creatorInfo?.bio || 'Your bio will appear here. Tell members about yourself!',
          location: creatorInfo?.location || { country: 'Your Location' },
          isOnline: true,
          verified: creatorInfo?.verified !== undefined ? creatorInfo.verified : false,
          age: creatorInfo?.age || null,
          orientation: creatorInfo?.orientation || 'Not specified',
          gender: creatorInfo?.gender || 'Not specified',
          bodyType: creatorInfo?.bodyType || 'Not specified',
          ethnicity: creatorInfo?.ethnicity || 'Not specified',
          height: creatorInfo?.height || 'Not specified',
          createdAt: creatorInfo?.createdAt || new Date().toISOString(),
          lastActive: Date.now(),
          stats: {
            totalConnections: creatorInfo?.stats?.connections || creatorInfo?.stats?.totalConnections || 0,
            totalLikes: creatorInfo?.stats?.totalLikes || 0,
            rating: creatorInfo?.stats?.rating || 0,
            reviewCount: creatorInfo?.stats?.reviewCount || 0
          }
        };
        
        // Add sample content to show how it will look
        formattedData.content = creatorInfo?.content || [
          {
            id: '1',
            type: 'photo',
            thumbnail: formattedData.profileImage,
            title: 'Sample Photo 1',
            price: 2.99,
            likes: 234,
            date: new Date(),
            isLocked: true,
            isPurchased: false
          },
          {
            id: '2',
            type: 'video',
            thumbnail: formattedData.profileImage,
            title: 'Sample Video',
            price: 5.99,
            likes: 567,
            date: new Date(),
            isLocked: true,
            isPurchased: false,
            duration: '2:34'
          },
          {
            id: '3',
            type: 'photo',
            thumbnail: formattedData.profileImage,
            title: 'Free Preview',
            price: 0,
            likes: 890,
            date: new Date(),
            isLocked: false,
            isPurchased: false
          }
        ];
        
        setCreatorData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading creator data for preview:', error);
        
        // Set default preview data if all else fails
        setCreatorData({
          id: 'preview',
          _id: 'preview',
          username: 'your_username',
          displayName: 'Your Display Name',
          profileImage: 'https://via.placeholder.com/200',
          coverImage: null,
          bio: 'Your bio will appear here',
          location: { country: 'Your Location' },
          isOnline: true,
          verified: false,
          age: null,
          orientation: 'Not specified',
          gender: 'Not specified',
          bodyType: 'Not specified',
          ethnicity: 'Not specified',
          height: 'Not specified',
          createdAt: new Date().toISOString(),
          lastActive: Date.now(),
          stats: {
            totalConnections: 0,
            totalLikes: 0,
            rating: 0,
            reviewCount: 0
          },
          content: []
        });
        setLoading(false);
      }
    };
    
    loadCreatorData();
  }, []);

  // Don't render until we have data
  if (loading || !creatorData) {
    return (
      <div className="profile-preview-wrapper">
        <div className="preview-loading">
          <div className="preview-loading-spinner"></div>
          <p>Preparing preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-preview-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Preview Controls Header */}
      {!isFullscreen && (
        <div className="preview-controls">
          <button className="preview-close-btn" onClick={onClose}>
            <X size={20} />
            <span>Close Preview</span>
          </button>
          
          <div className="preview-title">
            <Eye size={20} />
            <span>Profile Preview - This is how members see your profile</span>
          </div>
          
          <div className="preview-device-toggle">
            <button 
              className={`device-btn ${deviceView === 'mobile' ? 'active' : ''}`}
              onClick={() => setDeviceView('mobile')}
            >
              <Smartphone size={18} />
              <span>Mobile</span>
            </button>
            <button 
              className={`device-btn ${deviceView === 'desktop' ? 'active' : ''}`}
              onClick={() => setDeviceView('desktop')}
            >
              <Monitor size={18} />
              <span>Desktop</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview Container with Device Frame */}
      <div className="preview-container">
        <div className={`device-frame ${deviceView}`}>
          {deviceView === 'mobile' && !isFullscreen && (
            <div className="device-notch"></div>
          )}
          
          {/* Actual Profile Component in iframe-like container */}
          <div className="preview-viewport">
            <div className="profile-preview-sandbox">
              <CreatorProfile 
                // Pass preview mode flag to disable actual navigation
                isPreviewMode={true}
                // Pass the creator data directly to avoid API calls
                previewCreatorData={creatorData}
              />
            </div>
          </div>
          
          {deviceView === 'mobile' && !isFullscreen && (
            <div className="device-home-indicator"></div>
          )}
        </div>
      </div>

      {/* Preview Info Bar */}
      {!isFullscreen && (
        <div className="preview-info-bar">
          <div className="preview-info-text">
            💡 Tip: This preview shows exactly how members will see your profile. 
            {deviceView === 'mobile' ? ' Try desktop view to see the full experience.' : ' Try mobile view to see how most users browse.'}
          </div>
          <button 
            className="fullscreen-toggle"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          </button>
        </div>
      )}
      
      {/* Fullscreen close button */}
      {isFullscreen && (
        <button 
          className="fullscreen-close-btn"
          onClick={() => setIsFullscreen(false)}
        >
          <X size={24} />
        </button>
      )}
    </div>
  );
};

export default CreatorProfilePreview;