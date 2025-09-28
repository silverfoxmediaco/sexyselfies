import React from 'react';
import {
  MessageCircle,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  Bell
} from 'lucide-react';
import './AutomationSettings.css';

const AutomationSettings = ({
  formData,
  onChange,
  errors = {},
  showHeader = true,
  showTips = true,
  className = ''
}) => {
  const successTips = [
    {
      icon: <Clock size={16} />,
      text: 'Post content during peak hours (8-10 PM) for better engagement'
    },
    {
      icon: <DollarSign size={16} />,
      text: 'Creators with automation enabled earn 40% more on average'
    },
    {
      icon: <Zap size={16} />,
      text: 'Automated welcome messages increase connection rates by 3x'
    },
    {
      icon: <Bell size={16} />,
      text: 'Quick responses in the first hour lead to higher tips'
    }
  ];

  const handleWelcomeMessageChange = (value) => {
    onChange('welcomeMessage', {
      ...formData.welcomeMessage,
      text: value
    });
  };

  return (
    <div className={`AutomationSettings ${className}`}>
      {showHeader && (
        <div className="AutomationSettings-header">
          <h2>Work Smarter with Automation</h2>
          <p>Set up smart features to save time and earn more</p>
        </div>
      )}

      {/* Welcome Message */}
      <div className="AutomationSettings-group">
        <label className="AutomationSettings-label">
          <MessageCircle size={18} />
          Welcome Message (Auto-sent to new connections)
        </label>
        <div className="AutomationSettings-card">
          <textarea
            className="AutomationSettings-textarea"
            placeholder="Hi! Thanks for connecting..."
            rows="3"
            value={formData.welcomeMessage?.text || ''}
            onChange={(e) => handleWelcomeMessageChange(e.target.value)}
            maxLength={500}
          />
          <div className="AutomationSettings-char-count">
            {(formData.welcomeMessage?.text || '').length}/500 characters
          </div>
        </div>
        {errors.welcomeMessage && (
          <span className="AutomationSettings-error">{errors.welcomeMessage}</span>
        )}
      </div>

      {/* Future automation features can be added here */}
      {/* Example: Auto-response timing, content scheduling, etc. */}

      {/* Success Tips */}
      {showTips && (
        <div className="AutomationSettings-group">
          <label className="AutomationSettings-label">
            <TrendingUp size={18} />
            Success Tips
          </label>
          <div className="AutomationSettings-tips">
            {successTips.map((tip, index) => (
              <div key={index} className="AutomationSettings-tip">
                {tip.icon}
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationSettings;