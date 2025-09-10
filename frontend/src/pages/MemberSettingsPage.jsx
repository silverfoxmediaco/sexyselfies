import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(location.state?.activeSection || null); // null = main menu on mobile
  const [settings, setSettings] = useState({
    // Account & Security
    email: '',
    username: '',
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Profile
    displayName: '',
    theme: 'dark',
    
    // Privacy & Safety
    profileVisibility: 'visible',
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
  const [loadingSettings, setLoadingSettings] = useState(true);

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
      description: 'Display name, preferences',
      priority: 'medium',
      items: 2
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      icon: Shield,
      description: 'Creator interaction settings',
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
    setLoadingSettings(true);
    try {
      console.log('Loading user settings...');
      const userData = await api.get('/auth/me');
      console.log('Loaded user data for settings:', userData);
      
      // Try to load preferences, but don't fail if it doesn't exist
      let preferences = {};
      try {
        preferences = await api.get('/members/preferences');
      } catch (prefError) {
        console.log('No preferences found, using defaults:', prefError.message);
      }
      
      setSettings(prev => ({
        ...prev,
        // Account & Security - use real data or reasonable defaults
        email: userData.email || 'user@example.com',
        username: userData.username || userData.displayName || 'User',
        displayName: userData.displayName || userData.username || 'User',
        
        // Profile preferences
        theme: preferences.theme || userData.theme || prev.theme,
        
        // Privacy settings - simplified for creator-only interactions
        profileVisibility: (preferences.profileVisibility === 'private' || preferences.profileVisibility === 'hidden') ? 'hidden' : 'visible',
        allowMessages: (preferences.allowMessages === 'none') ? 'none' : 'creators',
        showOnlineStatus: preferences.showOnlineStatus !== undefined ? preferences.showOnlineStatus : 
                          (userData.showOnlineStatus !== undefined ? userData.showOnlineStatus : prev.showOnlineStatus),
        contentFiltering: preferences.contentFiltering !== undefined ? preferences.contentFiltering :
                         (userData.contentFiltering !== undefined ? userData.contentFiltering : prev.contentFiltering),
        
        // Notification preferences
        emailNotifications: {
          ...prev.emailNotifications,
          ...(preferences.emailNotifications || userData.emailNotifications || {})
        },
        pushNotifications: {
          ...prev.pushNotifications,
          ...(preferences.pushNotifications || userData.pushNotifications || {})
        }
      }));
      
      console.log('Settings updated successfully');
      setLoadingSettings(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      
      // If API fails completely, at least try to get basic user data
      try {
        const basicUserData = await api.get('/auth/me');
        setSettings(prev => ({
          ...prev,
          email: basicUserData.email || prev.email,
          username: basicUserData.username || basicUserData.displayName || prev.username,
          displayName: basicUserData.displayName || basicUserData.username || prev.displayName,
          bio: basicUserData.bio || ''
        }));
      } catch (basicError) {
        console.error('Failed to load even basic user data:', basicError);
      }
      
      setLoadingSettings(false);
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
      // Save basic profile settings
      await api.put('/auth/profile', {
        username: settings.username,
        displayName: settings.displayName
      });
      
      // Save preferences
      await api.put('/members/preferences', {
        profileVisibility: settings.profileVisibility,
        allowMessages: settings.allowMessages,
        showOnlineStatus: settings.showOnlineStatus,
        contentFiltering: settings.contentFiltering,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        theme: settings.theme
      });

      // Handle password change if provided
      if (settings.currentPassword && settings.newPassword && settings.confirmPassword) {
        if (settings.newPassword !== settings.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        
        if (settings.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }

        await api.put('/auth/updatepassword', {
          currentPassword: settings.currentPassword,
          newPassword: settings.newPassword
        });

        // Clear password fields after successful change
        setSettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
      
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
              placeholder={loadingSettings ? "Loading..." : "Enter your email address"}
              disabled={loadingSettings}
            />
          </div>

          <div className="member-setting-item">
            <label>Username</label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => updateSetting(null, 'username', e.target.value)}
              className="member-setting-input"
              placeholder={loadingSettings ? "Loading..." : "Enter your username"}
              disabled={loadingSettings}
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
              placeholder={loadingSettings ? "Loading..." : "How others see your name"}
              disabled={loadingSettings}
            />
          </div>
        </div>

        <div className="member-settings-group">
          <h3>Preferences</h3>
          
          <div className="member-setting-item">
            <div className="member-setting-toggle">
              <div>
                <strong>Show Online Status</strong>
                <p>Let creators see when you're online</p>
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
            <label>Content Filtering</label>
            <select
              value={settings.contentFiltering}
              onChange={(e) => updateSetting(null, 'contentFiltering', e.target.value)}
              className="member-setting-select"
            >
              <option value="none">Show All Content</option>
              <option value="mild">Filter Mild Content</option>
              <option value="strict">Strict Filtering</option>
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
          <h3>Creator Interaction Settings</h3>
          
          <div className="member-setting-item">
            <label>Profile visibility to creators</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => updateSetting(null, 'profileVisibility', e.target.value)}
              className="member-setting-select"
            >
              <option value="visible">Visible to Creators</option>
              <option value="hidden">Hidden from Creators</option>
            </select>
          </div>

          <div className="member-setting-item">
            <label>Creator messages</label>
            <select
              value={settings.allowMessages}
              onChange={(e) => updateSetting(null, 'allowMessages', e.target.value)}
              className="member-setting-select"
            >
              <option value="creators">Allow creators to message me</option>
              <option value="none">Don't allow messages</option>
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

        {/* Save Button */}
        {unsavedChanges && (
          <div className="member-settings-desktop-save">
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
      {isDesktop && <MainFooter />}
    </>
  );
};

export default MemberSettingsPage;