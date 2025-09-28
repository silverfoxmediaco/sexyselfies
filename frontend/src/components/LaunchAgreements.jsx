import React from 'react';
import { Shield, Star, TrendingUp, Eye } from 'lucide-react';
import './LaunchAgreements.css';

const LaunchAgreements = ({
  formData,
  profileData,
  onChange,
  onPreview,
  errors = {},
  showHeader = true,
  showPreview = true,
  className = ''
}) => {
  const agreements = [
    {
      id: 'agreeToTerms',
      label: (
        <>
          I agree to the{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{' '}
          and understand the 80/20 revenue split
        </>
      ),
      required: true
    },
    {
      id: 'agreeToContentPolicy',
      label: (
        <>
          I agree to the{' '}
          <a href="/content-policy" target="_blank" rel="noopener noreferrer">
            Content Policy
          </a>{' '}
          (no explicit nudity)
        </>
      ),
      required: true
    },
    {
      id: 'confirmAge',
      label: 'I confirm I am 18 years or older',
      required: true
    },
    {
      id: 'confirmOwnership',
      label: 'I own all content I will upload',
      required: true
    }
  ];

  const handleCheckboxChange = (field, checked) => {
    onChange(field, checked);
  };

  return (
    <div className={`LaunchAgreements ${className}`}>
      {showHeader && (
        <div className="LaunchAgreements-header">
          <h2>Ready to Launch! 🚀</h2>
          <p>Review and agree to our guidelines to start earning</p>
        </div>
      )}

      {/* Agreements Section */}
      <div className="LaunchAgreements-section">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="LaunchAgreements-card">
            <label className="LaunchAgreements-checkbox-label">
              <input
                type="checkbox"
                checked={formData[agreement.id] || false}
                onChange={(e) => handleCheckboxChange(agreement.id, e.target.checked)}
              />
              <span className="LaunchAgreements-checkbox-custom"></span>
              <span className="LaunchAgreements-checkbox-text">
                {agreement.label}
              </span>
            </label>
            {errors[agreement.id] && (
              <span className="LaunchAgreements-error">
                {errors[agreement.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Profile Preview Section */}
      {showPreview && profileData && (
        <div className="LaunchAgreements-preview-section">
          <h3>Your Profile Preview</h3>
          <div className="LaunchAgreements-preview-card">
            <div className="LaunchAgreements-preview-header">
              {profileData.coverImage && (
                <img
                  src={profileData.coverImage}
                  alt="Cover"
                  className="LaunchAgreements-preview-cover"
                />
              )}
              <div className="LaunchAgreements-preview-profile">
                {profileData.profileImage && (
                  <img
                    src={profileData.profileImage}
                    alt="Profile"
                    className="LaunchAgreements-preview-avatar"
                  />
                )}
                <div className="LaunchAgreements-preview-info">
                  <h4>{profileData.displayName || 'Your Name'}</h4>
                  <div className="LaunchAgreements-preview-badges">
                    <span className="LaunchAgreements-badge verified">
                      <Shield size={14} />
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="LaunchAgreements-preview-bio">
              <p>{profileData.bio || 'Your bio will appear here...'}</p>
            </div>

            <div className="LaunchAgreements-preview-stats">
              <div className="LaunchAgreements-stat">
                <Star size={16} />
                <span>New Creator</span>
              </div>
              <div className="LaunchAgreements-stat">
                <TrendingUp size={16} />
                <span>Est. $500-$2500/mo</span>
              </div>
            </div>
          </div>

          {onPreview && (
            <button
              type="button"
              className="LaunchAgreements-preview-btn"
              onClick={onPreview}
            >
              <Eye size={18} />
              <span>Preview How Members See You</span>
            </button>
          )}
        </div>
      )}

      {/* General error message */}
      {errors.submit && (
        <div className="LaunchAgreements-error-alert">
          {errors.submit}
        </div>
      )}
    </div>
  );
};

export default LaunchAgreements;