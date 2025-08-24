import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, User, Shield, Bell, DollarSign, BarChart3, Palette,
  ChevronRight, ChevronLeft, Save, Check, X, AlertTriangle,
  Download, Trash2, Menu, Eye, EyeOff
} from 'lucide-react';
import './CreatorSettingsPage.css';

const CreatorSettingsPage = () => {
  const [activeSection, setActiveSection] = useState(null); // null = main menu on mobile
  const [settings, setSettings] = useState({
    // Account & Security
    email: 'creator@example.com',
    username: 'creator_username',
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Profile & Branding
    displayName: 'Creator Name',
    bio: 'Professional content creator',
    accentColor: '#FF1B6B',
    theme: 'dark',
    
    // Privacy & Safety
    profileVisibility: 'public',
    allowMessages: 'subscribers',
    showOnlineStatus: true,
    allowTips: true,
    contentFiltering: true,
    
    // Notifications
    emailNotifications: {
      newSubscribers: true,
      purchases: true,
      messages: true,
      tips: true,
      analytics: false,
      marketing: false
    },
    pushNotifications: {
      newSubscribers: true,
      purchases: true,
      messages: true,
      tips: false,
      liveStreams: true
    },
    
    // Content & Monetization
    defaultPhotoPrice: 9.99,
    defaultVideoPrice: 19.99,
    subscriptionPrice: 29.99,
    allowCustomRequests: true,
    
    // Analytics & Insights
    analyticsEnabled: true,
    performanceTracking: true,
    dataExport: 'monthly'
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const settingSections = [
    {
      id: 'account',
      title: 'Account & Security',
      icon: User,
      description: 'Login, password, 2FA',
      priority: 'high',
      items: 4
    },
    {
      id: 'profile',
      title: 'Profile & Branding',
      icon: Palette,
      description: 'Display name, bio, theme',
      priority: 'medium',
      items: 3
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      icon: Shield,
      description: 'Who can see your content',
      priority: 'high',
      items: 5
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Email & push alerts',
      priority: 'medium',
      items: 8
    },
    {
      id: 'monetization',
      title: 'Monetization',
      icon: DollarSign,
      description: 'Pricing & revenue settings',
      priority: 'high',
      items: 4
    },
    {
      id: 'analytics',
      title: 'Analytics & Data',
      icon: BarChart3,
      description: 'Performance & privacy',
      priority: 'low',
      items: 3
    }
  ];

  const updateSetting = (section, key, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
    setUnsavedChanges(true);
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
    }
  };

  const goBack = () => {
    if (activeSection) {
      setActiveSection(null);
    }
  };

  // Mobile-first: Main settings menu
  const renderMainMenu = () => (
    <div className="settings-main-menu">
      <div className="settings-menu-grid">
        {settingSections.map((section, index) => (
          <motion.button
            key={section.id}
            className={`settings-menu-item ${section.priority}`}
            onClick={() => setActiveSection(section.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="menu-item-header">
              <div className="menu-item-icon">
                <section.icon size={24} />
              </div>
              {section.priority === 'high' && (
                <div className="priority-badge">!</div>
              )}
            </div>
            <div className="menu-item-content">
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <span className="item-count">{section.items} settings</span>
            </div>
            <ChevronRight size={20} className="menu-chevron" />
          </motion.button>
        ))}
      </div>
    </div>
  );

  // Mobile-optimized setting sections
  const renderAccountSection = () => (
    <div className="settings-mobile-section">
      <div className="mobile-settings-group">
        <h4>Login Information</h4>
        <div className="mobile-setting-item">
          <label>Email Address</label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => updateSetting(null, 'email', e.target.value)}
            className="mobile-input"
          />
        </div>
        <div className="mobile-setting-item">
          <label>Username</label>
          <input
            type="text"
            value={settings.username}
            onChange={(e) => updateSetting(null, 'username', e.target.value)}
            className="mobile-input"
          />
        </div>
      </div>

      <div className="mobile-settings-group">
        <h4>Security</h4>
        <div className="mobile-toggle-item">
          <div className="toggle-content">
            <div className="toggle-header">
              <Shield size={20} />
              <span>Two-Factor Authentication</span>
            </div>
            <p>Add extra security to your account</p>
          </div>
          <label className="mobile-toggle">
            <input
              type="checkbox"
              checked={settings.twoFactorEnabled}
              onChange={(e) => updateSetting(null, 'twoFactorEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="mobile-settings-group danger">
        <h4>Danger Zone</h4>
        <button 
          className="mobile-danger-btn"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 size={18} />
          Delete Account
        </button>
        <p className="danger-warning">This action cannot be undone</p>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="settings-mobile-section">
      <div className="mobile-settings-group">
        <h4>Profile Visibility</h4>
        <div className="mobile-setting-item">
          <label>Who can see your profile?</label>
          <select
            value={settings.profileVisibility}
            onChange={(e) => updateSetting(null, 'profileVisibility', e.target.value)}
            className="mobile-select"
          >
            <option value="public">Everyone</option>
            <option value="subscribers">Subscribers only</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="mobile-setting-item">
          <label>Who can message you?</label>
          <select
            value={settings.allowMessages}
            onChange={(e) => updateSetting(null, 'allowMessages', e.target.value)}
            className="mobile-select"
          >
            <option value="everyone">Everyone</option>
            <option value="subscribers">Subscribers only</option>
            <option value="none">No one</option>
          </select>
        </div>
      </div>

      <div className="mobile-settings-group">
        <h4>Privacy Controls</h4>
        <div className="mobile-toggle-item">
          <div className="toggle-content">
            <div className="toggle-header">
              <Eye size={20} />
              <span>Show online status</span>
            </div>
            <p>Let others see when you're active</p>
          </div>
          <label className="mobile-toggle">
            <input
              type="checkbox"
              checked={settings.showOnlineStatus}
              onChange={(e) => updateSetting(null, 'showOnlineStatus', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="mobile-toggle-item">
          <div className="toggle-content">
            <div className="toggle-header">
              <DollarSign size={20} />
              <span>Allow tips</span>
            </div>
            <p>Enable fans to send you tips</p>
          </div>
          <label className="mobile-toggle">
            <input
              type="checkbox"
              checked={settings.allowTips}
              onChange={(e) => updateSetting(null, 'allowTips', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-mobile-section">
      <div className="mobile-settings-group">
        <h4>Email Notifications</h4>
        {Object.entries(settings.emailNotifications).map(([key, value]) => (
          <div key={key} className="mobile-toggle-item">
            <div className="toggle-content">
              <span>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</span>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateSetting('emailNotifications', key, e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>

      <div className="mobile-settings-group">
        <h4>Push Notifications</h4>
        {Object.entries(settings.pushNotifications).map(([key, value]) => (
          <div key={key} className="mobile-toggle-item">
            <div className="toggle-content">
              <span>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</span>
            </div>
            <label className="mobile-toggle">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateSetting('pushNotifications', key, e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonetizationSection = () => (
    <div className="settings-mobile-section">
      <div className="mobile-settings-group">
        <h4>Default Pricing</h4>
        <div className="mobile-setting-item">
          <label>Photo Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.defaultPhotoPrice}
            onChange={(e) => updateSetting(null, 'defaultPhotoPrice', parseFloat(e.target.value))}
            className="mobile-input"
          />
        </div>
        <div className="mobile-setting-item">
          <label>Video Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.defaultVideoPrice}
            onChange={(e) => updateSetting(null, 'defaultVideoPrice', parseFloat(e.target.value))}
            className="mobile-input"
          />
        </div>
        <div className="mobile-setting-item">
          <label>Subscription Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.subscriptionPrice}
            onChange={(e) => updateSetting(null, 'subscriptionPrice', parseFloat(e.target.value))}
            className="mobile-input"
          />
        </div>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="settings-mobile-section">
      <div className="mobile-settings-group">
        <h4>Profile Information</h4>
        <div className="mobile-setting-item">
          <label>Display Name</label>
          <input
            type="text"
            value={settings.displayName}
            onChange={(e) => updateSetting(null, 'displayName', e.target.value)}
            className="mobile-input"
          />
        </div>
        <div className="mobile-setting-item">
          <label>Bio</label>
          <textarea
            value={settings.bio}
            onChange={(e) => updateSetting(null, 'bio', e.target.value)}
            className="mobile-textarea"
            rows={4}
            maxLength={500}
          />
          <small>{settings.bio.length}/500 characters</small>
        </div>
        <div className="mobile-setting-item">
          <label>Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting(null, 'theme', e.target.value)}
            className="mobile-select"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="settings-mobile-section">
      <div className="mobile-settings-group">
        <h4>Data Collection</h4>
        <div className="mobile-toggle-item">
          <div className="toggle-content">
            <div className="toggle-header">
              <BarChart3 size={20} />
              <span>Enable analytics</span>
            </div>
            <p>Collect data to improve performance</p>
          </div>
          <label className="mobile-toggle">
            <input
              type="checkbox"
              checked={settings.analyticsEnabled}
              onChange={(e) => updateSetting(null, 'analyticsEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="mobile-settings-group">
        <h4>Data Export</h4>
        <button className="mobile-action-btn">
          <Download size={18} />
          Export My Data
        </button>
      </div>
    </div>
  );

  const getSectionTitle = () => {
    const section = settingSections.find(s => s.id === activeSection);
    return section ? section.title : 'Settings';
  };

  const renderActiveSection = () => {
    switch(activeSection) {
      case 'account': return renderAccountSection();
      case 'profile': return renderProfileSection();
      case 'privacy': return renderPrivacySection();
      case 'notifications': return renderNotificationsSection();
      case 'monetization': return renderMonetizationSection();
      case 'analytics': return renderAnalyticsSection();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="creator-settings-mobile">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-content">
          {activeSection ? (
            <button className="mobile-back-btn" onClick={goBack}>
              <ChevronLeft size={24} />
            </button>
          ) : (
            <Settings size={24} />
          )}
          <h1>{getSectionTitle()}</h1>
          {unsavedChanges && (
            <button 
              className={`mobile-save-btn ${saveStatus}`}
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' && <div className="spinner" />}
              {saveStatus === 'saved' && <Check size={18} />}
              {saveStatus === 'error' && <X size={18} />}
              {saveStatus === 'idle' && <Save size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="mobile-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection || 'main'}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Save Button - Sticky Bottom */}
      {unsavedChanges && (
        <div className="mobile-save-bar">
          <button 
            className={`mobile-save-bar-btn ${saveStatus}`}
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' && <div className="spinner" />}
            {saveStatus === 'saved' && <Check size={20} />}
            {saveStatus === 'error' && <X size={20} />}
            {saveStatus === 'idle' && <Save size={20} />}
            <span>
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? 'Saved!' :
               saveStatus === 'error' ? 'Error' : 'Save Changes'}
            </span>
          </button>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="mobile-modal-overlay">
          <div className="mobile-delete-dialog">
            <div className="dialog-header">
              <AlertTriangle size={32} className="warning-icon" />
              <h3>Delete Account?</h3>
            </div>
            <div className="dialog-content">
              <p>This will permanently delete your account, content, and earnings.</p>
              <p><strong>This action cannot be undone.</strong></p>
            </div>
            <div className="dialog-actions">
              <button 
                className="dialog-btn secondary"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button className="dialog-btn danger">
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorSettingsPage;