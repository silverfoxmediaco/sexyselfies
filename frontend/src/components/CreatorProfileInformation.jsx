import React from 'react';
import { Edit2, User, Heart, Users, MapPin, Globe, Calendar } from 'lucide-react';
import './CreatorProfileInformation.css';

const CreatorProfileInformation = ({
  creatorData,
  isOwnProfile,
  onEditClick,
  className = '',
  showTitle = true
}) => {
  // Temporary debug logging to see what data we're receiving
  console.log('🌟 CreatorProfileInformation component RENDERED!');
  console.log('🔍 CreatorProfileInformation received creatorData:', creatorData);
  console.log('📊 Individual field values:', {
    gender: creatorData?.gender,
    orientation: creatorData?.orientation,
    bodyType: creatorData?.bodyType,
    ethnicity: creatorData?.ethnicity,
    age: creatorData?.age,
    location: creatorData?.location
  });

  const formatValue = (value) => {
    console.log('🎯 formatValue called with:', value, 'type:', typeof value);
    if (!value || value === '') {
      console.log('🎯 formatValue returning: Not specified (empty value)');
      return 'Not specified';
    }
    // Format ethnicity values
    if (value === 'caucasian') return 'Caucasian/White';
    if (value === 'black') return 'Black/African';
    if (value === 'hispanic') return 'Hispanic/Latino';
    if (value === 'asian') return 'Asian';
    if (value === 'middle-eastern') return 'Middle Eastern';
    if (value === 'native-american') return 'Native American';
    if (value === 'pacific-islander') return 'Pacific Islander';
    if (value === 'mixed') return 'Mixed/Multi-racial';
    // Default capitalization
    const formatted = value.charAt(0).toUpperCase() + value.slice(1);
    console.log('🎯 formatValue returning:', formatted);
    return formatted;
  };

  const details = [
    {
      label: 'Gender',
      value: formatValue(creatorData?.gender),
      icon: <User size={14} />
    },
    {
      label: 'Orientation',
      value: formatValue(creatorData?.orientation),
      icon: <Heart size={14} />
    },
    {
      label: 'Body Type',
      value: formatValue(creatorData?.bodyType),
      icon: <Users size={14} />
    },
    {
      label: 'Ethnicity',
      value: formatValue(creatorData?.ethnicity),
      icon: <Globe size={14} />
    },
    {
      label: 'Age',
      value: creatorData?.age ? `${creatorData.age} years` : 'Not specified',
      icon: <Calendar size={14} />
    },
    {
      label: 'Location',
      value: creatorData?.location?.country || creatorData?.location || 'Not specified',
      icon: <MapPin size={14} />
    }
  ];

  return (
    <div className={`CreatorProfileInformation-container ${className}`}>
      {showTitle && (
        <div className="CreatorProfileInformation-header">
          <h3>Profile Information</h3>
          {isOwnProfile && (
            <button
              onClick={onEditClick}
              className="CreatorProfileInformation-edit-btn"
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
          )}
        </div>
      )}

      <div className="CreatorProfileInformation-grid">
        {details.map((detail, index) => (
          <div key={index} className="CreatorProfileInformation-item">
            <span className="CreatorProfileInformation-label">
              {detail.icon}
              {detail.label}
            </span>
            <span className="CreatorProfileInformation-value">
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorProfileInformation;