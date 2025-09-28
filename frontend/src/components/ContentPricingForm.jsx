import React from 'react';
import { Image, Video, MessageCircle, DollarSign } from 'lucide-react';
import './ContentPricingForm.css';

const ContentPricingForm = ({
  formData,
  onChange,
  errors = {},
  showHeader = true,
  showContext = true,
  className = ''
}) => {
  const contentTypeConfig = [
    {
      id: 'photos',
      icon: <Image size={24} />,
      label: 'Photos',
      priceRange: '$0.99 - $9.99',
      minPrice: 0.99,
      maxPrice: 9.99,
      defaultPrice: 2.99
    },
    {
      id: 'videos',
      icon: <Video size={24} />,
      label: 'Videos',
      priceRange: '$2.99 - $19.99',
      minPrice: 2.99,
      maxPrice: 19.99,
      defaultPrice: 5.99
    },
    {
      id: 'messages',
      icon: <MessageCircle size={24} />,
      label: 'Messages',
      priceRange: '$0.99 - $9.99',
      minPrice: 0.99,
      maxPrice: 9.99,
      defaultPrice: 1.99
    }
  ];

  const handleContentTypeToggle = (contentType) => {
    onChange('contentTypes', {
      ...formData.contentTypes,
      [contentType]: !formData.contentTypes[contentType]
    });
  };

  const handlePriceChange = (contentType, value) => {
    onChange('pricing', {
      ...formData.pricing,
      [contentType]: {
        ...formData.pricing[contentType],
        default: parseFloat(value)
      }
    });
  };

  return (
    <div className={`ContentPricingForm ${className}`}>
      {showHeader && (
        <div className="ContentPricingForm-header">
          <h2>Set Your Default Pricing & Content Types</h2>
          <p>Save time on future uploads with smart defaults</p>
        </div>
      )}

      {showContext && (
        <div className="ContentPricingForm-context">
          <p className="ContentPricingForm-context-intro">
            📝 Hi! Although you can set individual pricing on each upload, having defaults will:
          </p>
          <ul className="ContentPricingForm-context-benefits">
            <li>• Speed up your content publishing process</li>
            <li>• Help maintain consistent pricing strategy</li>
            <li>• Show potential fans your typical price ranges</li>
            <li>• Reduce decision fatigue when uploading multiple items</li>
          </ul>
          <p className="ContentPricingForm-context-note">
            You can always override these prices for specific content pieces during upload.
          </p>
        </div>
      )}

      {/* Content Types Selection */}
      <div className="ContentPricingForm-group">
        <label className="ContentPricingForm-label">
          CONTENT TYPES YOU'LL SHARE
          <span className="ContentPricingForm-required">*</span>
        </label>
        <div className="ContentPricingForm-types-grid">
          {contentTypeConfig.map(type => (
            <div
              key={type.id}
              className={`ContentPricingForm-type-card ${
                formData.contentTypes[type.id] ? 'active' : ''
              }`}
              onClick={() => handleContentTypeToggle(type.id)}
            >
              {type.icon}
              <span>{type.label}</span>
              <span className="ContentPricingForm-price-range">
                {type.priceRange}
              </span>
            </div>
          ))}
        </div>
        {errors.contentTypes && (
          <span className="ContentPricingForm-error">{errors.contentTypes}</span>
        )}
      </div>

      {/* Dynamic Pricing Inputs */}
      {contentTypeConfig.map(type => (
        formData.contentTypes[type.id] && (
          <div key={type.id} className="ContentPricingForm-group">
            <label className="ContentPricingForm-label">
              {type.label.toUpperCase()} PRICE
            </label>
            <p className="ContentPricingForm-helper">
              💡 {type.id === 'photos'
                ? 'This will auto-fill when uploading photos (you can still change it per photo)'
                : type.id === 'videos'
                ? 'Your go-to video price - saves time on bulk uploads'
                : 'Default for sending exclusive content via DMs'}
            </p>
            <div className="ContentPricingForm-pricing-wrapper">
              <span className="ContentPricingForm-currency">$</span>
              <input
                type="number"
                className="ContentPricingForm-pricing-input"
                min={type.minPrice}
                max={type.maxPrice}
                step="0.01"
                placeholder={type.defaultPrice.toString()}
                value={formData.pricing[type.id]?.default || ''}
                onChange={(e) => handlePriceChange(type.id, e.target.value)}
              />
            </div>
          </div>
        )
      ))}

      {/* Pro Tip */}
      <div className="ContentPricingForm-pro-tip">
        <p>
          ⚡ <strong>Pro Tip:</strong> Set prices slightly higher than your
          minimum - you can always discount individual items, but raising prices
          later feels awkward to fans.
        </p>
      </div>
    </div>
  );
};

export default ContentPricingForm;