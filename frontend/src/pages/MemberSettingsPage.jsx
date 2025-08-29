import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, User, Shield, Bell, ChevronRight, ChevronLeft, 
  Save, Check, X, AlertTriangle, Download, Trash2, Menu, Eye, EyeOff
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import api from '../services/api.config';
import './MemberSettingsPage.css';

const MemberSettingsPage = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [activeSection, setActiveSection] = useState(null); // null = main menu on mobile
  const [settings, setSettings] = useState({
    // Account & Security
    email: 'member@example.com',
    username: 'member_username',
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Profile
    displayName: 'Member Name',
    bio: 'Content enthusiast and supporter of amazing creators',
    theme: 'dark',
    
    // Privacy & Safety
    profileVisibility: 'private',
    allowMessages: 'creators',
    showOnlineStatus: true,
    contentFiltering: true,
    
    // Notifications
    emailNotifications: {
      newContent: true,
      messages: true,
      specialOffers: true,
      tips: false,
      marketing: false
    },
    pushNotifications: {
      newContent: true,
      messages: true,
      specialOffers: false,
      liveStreams: true
    }
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
      title: 'Profile',
      icon: Settings,
      description: 'Display name, bio, preferences',
      priority: 'medium',
      items: 3
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      icon: Shield,
      description: 'Who can contact you',
      priority: 'high',
      items: 4
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Email & push alerts',
      priority: 'medium',
      items: 6
    }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userData = await api.get('/v1/auth/me');
      const preferences = await api.get('/v1/members/preferences');
      
      setSettings(prev => ({
        ...prev,
        email: userData.email || prev.email,
        username: userData.username || prev.username,
        displayName: userData.displayName || prev.displayName,
        bio: userData.bio || prev.bio,
        ...preferences
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

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
      await api.put('/v1/members/profile', {
        username: settings.username,
        displayName: settings.displayName,
        bio: settings.bio
      });
      
      await api.put('/v1/members/preferences', {
        profileVisibility: settings.profileVisibility,
        allowMessages: settings.allowMessages,
        showOnlineStatus: settings.showOnlineStatus,
        contentFiltering: settings.contentFiltering,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        theme: settings.theme
      });
      
      setSaveStatus('saved');
      setUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const renderMainMenu = () => (
    <div className="member-settings-main-menu">
      <div className="member-settings-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className="member-settings-sections">
        {settingSections.map((section, index) => (
          <motion.div
            key={section.id}
            className={`member-settings-section-card ${section.priority}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveSection(section.id)}
          >
            <div className="section-icon">
              <section.icon size={24} />
            </div>
            <div className="section-content">
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <span className="section-items">{section.items} settings</span>
            </div>
            <ChevronRight size={20} className="section-arrow" />
          </motion.div>
        ))}
      </div>

      {unsavedChanges && (
        <div className="member-settings-save-banner">
          <div className="save-banner-content">
            <AlertTriangle size={20} />
            <span>You have unsaved changes</span>
            <button 
              className="save-banner-btn"
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountSection = () => (
    <div className="member-settings-section">
      <div className="member-settings-section-header">
        <button 
          className="back-btn"
          onClick={() => setActiveSection(null)}
        >
          <ChevronLeft size={20} />
          <span>Account & Security</span>
        </button>
      </div>

      <div className="member-settings-groups">
        <div className="member-settings-group">
          <h3>Basic Information</h3>
          
          <div className="member-setting-item">
            <label>Email Address</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting(null, 'email', e.target.value)}
              className="member-setting-input"
            />
          </div>

          <div className="member-setting-item">
            <label>Username</label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => updateSetting(null, 'username', e.target.value)}
              className="member-setting-input"
            />
          </div>
        </div>

        <div className="member-settings-group">
          <h3>Password & Security</h3>
          
          <div className="member-setting-item">
            <label>Current Password</label>
            <input
              type="password"
              value={settings.currentPassword}
              onChange={(e) => updateSetting(null, 'currentPassword', e.target.value)}
              className="member-setting-input"
              placeholder="Enter current password"
            />
          </div>

          <div className="member-setting-item">
            <label>New Password</label>
            <input
              type="password"
              value={settings.newPassword}
              onChange={(e) => updateSetting(null, 'newPassword', e.target.value)}
              className="member-setting-input"
              placeholder="Enter new password"
            />
          </div>

          <div className="member-setting-item">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={settings.confirmPassword}
              onChange={(e) => updateSetting(null, 'confirmPassword', e.target.value)}
              className="member-setting-input"
              placeholder="Confirm new password"
            />
          </div>

          <div className="member-setting-item">
            <div className="member-setting-toggle">
              <div>
                <strong>Two-Factor Authentication</strong>
                <p>Add an extra layer of security to your account</p>
              </div>
              <button
                className={`member-toggle-switch ${settings.twoFactorEnabled ? 'active' : ''}`}
                onClick={() => updateSetting(null, 'twoFactorEnabled', !settings.twoFactorEnabled)}
              >
                <div className="member-toggle-handle"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="member-settings-section">
      <div className="member-settings-section-header">
        <button 
          className="back-btn"
          onClick={() => setActiveSection(null)}
        >
          <ChevronLeft size={20} />
          <span>Profile</span>
        </button>
      </div>

      <div className="member-settings-groups">
        <div className="member-settings-group">
          <h3>Display Settings</h3>
          
          <div className="member-setting-item">
            <label>Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSetting(null, 'displayName', e.target.value)}
              className="member-setting-input"
              placeholder="How others see your name"
            />
          </div>

          <div className="member-setting-item">
            <label>Bio</label>
            <textarea
              value={settings.bio}
              onChange={(e) => updateSetting(null, 'bio', e.target.value)}
              className="member-setting-textarea"
              placeholder="Tell creators about yourself"
              rows={3}
            />
          </div>

          <div className="member-setting-item">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting(null, 'theme', e.target.value)}
              className="member-setting-select"
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="member-settings-section">
      <div className="member-settings-section-header">
        <button 
          className="back-btn"
          onClick={() => setActiveSection(null)}
        >
          <ChevronLeft size={20} />
          <span>Privacy & Safety</span>
        </button>
      </div>

      <div className="member-settings-groups">
        <div className="member-settings-group">
          <h3>Profile Visibility</h3>
          
          <div className="member-setting-item">
            <label>Who can see your profile</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => updateSetting(null, 'profileVisibility', e.target.value)}
              className="member-setting-select"
            >
              <option value="public">Public</option>
              <option value="creators">Creators Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="member-setting-item">
            <label>Who can message you</label>
            <select
              value={settings.allowMessages}
              onChange={(e) => updateSetting(null, 'allowMessages', e.target.value)}
              className="member-setting-select"
            >
              <option value="everyone">Everyone</option>
              <option value="creators">Creators Only</option>
              <option value="none">Nobody</option>
            </select>
          </div>
        </div>

        <div className="member-settings-group">
          <h3>Activity & Status</h3>
          
          <div className="member-setting-item">
            <div className="member-setting-toggle">
              <div>
                <strong>Show Online Status</strong>
                <p>Let others see when you're active</p>
              </div>
              <button
                className={`member-toggle-switch ${settings.showOnlineStatus ? 'active' : ''}`}
                onClick={() => updateSetting(null, 'showOnlineStatus', !settings.showOnlineStatus)}
              >
                <div className="member-toggle-handle"></div>
              </button>
            </div>
          </div>

          <div className="member-setting-item">
            <div className="member-setting-toggle">
              <div>
                <strong>Content Filtering</strong>
                <p>Filter explicit content from your feed</p>
              </div>
              <button
                className={`member-toggle-switch ${settings.contentFiltering ? 'active' : ''}`}
                onClick={() => updateSetting(null, 'contentFiltering', !settings.contentFiltering)}
              >
                <div className="member-toggle-handle"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="member-settings-section">
      <div className="member-settings-section-header">
        <button 
          className="back-btn"
          onClick={() => setActiveSection(null)}
        >
          <ChevronLeft size={20} />
          <span>Notifications</span>
        </button>
      </div>

      <div className="member-settings-groups">
        <div className="member-settings-group">
          <h3>Email Notifications</h3>
          
          {Object.entries(settings.emailNotifications).map(([key, value]) => (
            <div key={key} className="member-setting-item">
              <div className="member-setting-toggle">
                <div>
                  <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong>
                </div>
                <button
                  className={`member-toggle-switch ${value ? 'active' : ''}`}
                  onClick={() => updateSetting('emailNotifications', key, !value)}
                >
                  <div className="member-toggle-handle"></div>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="member-settings-group">
          <h3>Push Notifications</h3>
          
          {Object.entries(settings.pushNotifications).map(([key, value]) => (
            <div key={key} className="member-setting-item">
              <div className="member-setting-toggle">
                <div>
                  <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong>
                </div>
                <button
                  className={`member-toggle-switch ${value ? 'active' : ''}`}
                  onClick={() => updateSetting('pushNotifications', key, !value)}
                >
                  <div className="member-toggle-handle"></div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'account':
        return renderAccountSection();
      case 'profile':
        return renderProfileSection();
      case 'privacy':
        return renderPrivacySection();
      case 'notifications':
        return renderNotificationsSection();
      default:
        return renderMainMenu();
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="member-settings-mobile">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="member-settings-mobile-content"
          >
            {renderCurrentSection()}
          </motion.div>
        </AnimatePresence>

        {/* Save Button */}
        {unsavedChanges && (
          <div className="member-settings-mobile-save">
            <button
              className="member-settings-save-btn"
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' && <div className="member-settings-spinner" />}
              {saveStatus === 'saved' && <Check size={18} />}
              {saveStatus === 'error' && <X size={18} />}
              <span>
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'saved' ? 'Saved!' : 
                 saveStatus === 'error' ? 'Failed' : 'Save Changes'}
              </span>
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation userRole={userRole} />
      </div>
    );
  }

  // Desktop layout
  return (
    <>
      {isDesktop && <MainHeader />}
      <div className="member-settings-desktop">
        <div className="member-settings-container">
          {/* Sidebar */}
          <div className="member-settings-sidebar">
            <div className="member-settings-sidebar-header">
              <h2>Settings</h2>
            </div>

            <nav className="member-settings-nav">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  className={`member-settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <section.icon size={20} />
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>

            {/* Save Button */}
            {unsavedChanges && (
              <div className="member-settings-sidebar-save">
                <button
                  className="member-settings-save-btn"
                  onClick={saveSettings}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' && <div className="member-settings-spinner" />}
                  {saveStatus === 'saved' && <Check size={18} />}
                  {saveStatus === 'error' && <X size={18} />}
                  <span>
                    {saveStatus === 'saving' ? 'Saving...' : 
                     saveStatus === 'saved' ? 'Saved!' : 
                     saveStatus === 'error' ? 'Failed' : 'Save Changes'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="member-settings-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {activeSection ? renderCurrentSection() : renderMainMenu()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      {isDesktop && <MainFooter />}
    </>
  );
};

export default MemberSettingsPage;