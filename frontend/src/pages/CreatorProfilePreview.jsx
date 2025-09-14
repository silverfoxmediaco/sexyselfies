import React, { useState } from 'react';
import { Eye, X, Monitor, Smartphone } from 'lucide-react';
import CreatorProfile from './CreatorProfile'; // Import the ACTUAL profile component
import './CreatorProfilePreview.css';

const CreatorProfilePreview = ({ creator, onClose }) => {
  const [deviceView, setDeviceView] = useState('mobile'); // 'mobile' or 'desktop'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Prepare creator data with default values if missing
  const creatorData = {
    id: creator?.id || 'preview',
    username: creator?.username || 'preview_user',
    displayName: creator?.displayName || creator?.name || 'Creator Name',
    profileImage: creator?.profileImage || creator?.avatar || 'https://via.placeholder.com/200',
    coverImage: creator?.coverImage || creator?.cover || null,
    bio: creator?.bio || 'Your bio will appear here',
    location: creator?.location || { country: 'United States' },
    isOnline: true,
    verified: creator?.verified !== undefined ? creator.verified : true,
    age: creator?.age || 24,
    orientation: creator?.orientation || 'Not specified',
    gender: creator?.gender || 'Not specified', 
    bodyType: creator?.bodyType || 'Not specified',
    ethnicity: creator?.ethnicity || 'Not specified',
    height: creator?.height || 'Not specified',
    createdAt: creator?.createdAt || new Date().toISOString(),
    lastActive: Date.now(),
    stats: {
      totalConnections: creator?.stats?.totalConnections || 0,
      totalLikes: creator?.stats?.totalLikes || 0,
      rating: creator?.stats?.rating || 0,
      reviewCount: creator?.stats?.reviewCount || 0
    },
    content: creator?.content || []
  };

  return (
    <div className={`profile-preview-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Preview Controls Header */}
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

      {/* Preview Container with Device Frame */}
      <div className="preview-container">
        <div className={`device-frame ${deviceView}`}>
          {deviceView === 'mobile' && (
            <div className="device-notch"></div>
          )}
          
          {/* Actual Profile Component in iframe-like container */}
          <div className="preview-viewport">
            {/* 
              IMPORTANT: This renders the EXACT same component members see
              We're just wrapping it in a preview frame, not recreating it
            */}
            <div className="profile-preview-sandbox">
              <CreatorProfile 
                // Pass preview mode flag to disable actual navigation
                isPreviewMode={true}
                // Pass the creator data directly to avoid API calls
                previewCreatorData={creatorData}
              />
            </div>
          </div>
          
          {deviceView === 'mobile' && (
            <div className="device-home-indicator"></div>
          )}
        </div>
      </div>

      {/* Preview Info Bar */}
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
    </div>
  );
};

export default CreatorProfilePreview;