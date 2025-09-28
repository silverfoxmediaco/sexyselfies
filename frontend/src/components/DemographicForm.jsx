import React from 'react';
import './DemographicForm.css';

const DemographicForm = ({
  formData,
  onChange,
  errors = {},
  showHeader = true,
  headerTitle = "Help Members Find You",
  headerSubtitle = "Set your browse preferences to attract the right audience",
  className = ''
}) => {
  const genderOptions = ['Male', 'Female'];

  const orientationOptions = [
    'Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual'
  ];

  const bodyTypeOptions = [
    { value: 'slim', label: 'Slim' },
    { value: 'slender', label: 'Slender' },
    { value: 'athletic', label: 'Athletic' },
    { value: 'average', label: 'Average' },
    { value: 'curvy', label: 'Curvy' },
    { value: 'plus-size', label: 'Plus Size' },
    { value: 'bbw', label: 'BBW' },
    { value: 'muscular', label: 'Muscular' },
    { value: 'dad-bod', label: 'Dad Bod' },
    { value: 'mom-bod', label: 'Mom Bod' }
  ];

  const ethnicityOptions = [
    { value: '', label: 'Prefer not to say' },
    { value: 'caucasian', label: 'Caucasian/White' },
    { value: 'black', label: 'Black/African' },
    { value: 'hispanic', label: 'Hispanic/Latino' },
    { value: 'asian', label: 'Asian' },
    { value: 'middle-eastern', label: 'Middle Eastern' },
    { value: 'native-american', label: 'Native American' },
    { value: 'pacific-islander', label: 'Pacific Islander' },
    { value: 'mixed', label: 'Mixed/Multi-racial' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className={`DemographicForm ${className}`}>
      {showHeader && (
        <div className="DemographicForm-header">
          <h2>{headerTitle}</h2>
          <p>{headerSubtitle}</p>
        </div>
      )}

      {/* Gender */}
      <div className="DemographicForm-group">
        <label className="DemographicForm-label">
          I am
          <span className="DemographicForm-required">*</span>
        </label>
        <div className="DemographicForm-radio-group">
          {genderOptions.map(option => (
            <label key={option} className="DemographicForm-radio-label">
              <input
                type="radio"
                name="gender"
                value={option.toLowerCase()}
                checked={formData.gender === option.toLowerCase()}
                onChange={e => onChange('gender', e.target.value)}
              />
              <span className="DemographicForm-radio-custom"></span>
              <span>{option}</span>
            </label>
          ))}
        </div>
        {errors.gender && (
          <span className="DemographicForm-error">{errors.gender}</span>
        )}
      </div>

      {/* Orientation */}
      <div className="DemographicForm-group">
        <label className="DemographicForm-label">
          My orientation
          <span className="DemographicForm-required">*</span>
        </label>
        <div className="DemographicForm-radio-group">
          {orientationOptions.map(option => (
            <label key={option} className="DemographicForm-radio-label">
              <input
                type="radio"
                name="orientation"
                value={option.toLowerCase()}
                checked={formData.orientation === option.toLowerCase()}
                onChange={e => onChange('orientation', e.target.value)}
              />
              <span className="DemographicForm-radio-custom"></span>
              <span>{option}</span>
            </label>
          ))}
        </div>
        {errors.orientation && (
          <span className="DemographicForm-error">{errors.orientation}</span>
        )}
      </div>

      {/* Body Type */}
      <div className="DemographicForm-group">
        <label className="DemographicForm-label">
          Body Type (Optional)
        </label>
        <select
          className="DemographicForm-select"
          value={formData.bodyType}
          onChange={e => onChange('bodyType', e.target.value)}
        >
          <option value="">Select...</option>
          {bodyTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ethnicity */}
      <div className="DemographicForm-group">
        <label className="DemographicForm-label">
          Ethnicity (Optional)
        </label>
        <select
          className="DemographicForm-select"
          value={formData.ethnicity}
          onChange={e => onChange('ethnicity', e.target.value)}
        >
          {ethnicityOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DemographicForm;