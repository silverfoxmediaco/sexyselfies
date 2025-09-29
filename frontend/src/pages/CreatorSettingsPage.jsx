import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  User,
  Shield,
  Bell,
  BarChart3,
  Palette,
  ChevronRight,
  ChevronLeft,
  Save,
  Check,
  X,
  AlertTriangle,
  Download,
  Trash2,
  Menu,
  Eye,
  EyeOff,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import SettingsMenu from '../components/SettingsMenu';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import authService from '../services/auth.service';
import creatorService from '../services/creator.service';
import './CreatorSettingsPage.css';

const CreatorSettingsPage = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [activeSection, setActiveSection] = useState(null); // null = main menu on mobile
  const [settings, setSettings] = useState({
    // Account & Security
    email: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',

    // Profile & Branding
    displayName: '',
    bio: '',
    accentColor: '#17D2C2', // Use app's primary color

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
      marketing: false,
    },
    pushNotifications: {
      newSubscribers: true,
      purchases: true,
      messages: true,
      tips: false,
      liveStreams: true,
    },

    // Analytics & Insights
    analyticsEnabled: true,
    performanceTracking: true,
    dataExport: 'monthly',

    // Payments & Payouts
    payoutMethod: 'weekly', // 'weekly' or 'instant'
    payoutThreshold: 50,
    autoPayoutEnabled: false,
    paypalEmail: '',
    paypalConnected: false,
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const settingSections = [
    {
      id: 'account',
      title: 'Account & Security',
      icon: User,
      description: 'Login, password, 2FA',
      priority: 'high',
      items: 4,
    },
    {
      id: 'profile',
      title: 'Profile & Branding',
      icon: Palette,
      description: 'Display name, bio, branding',
      priority: 'medium',
      items: 2,
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      icon: Shield,
      description: 'Who can see your content',
      priority: 'high',
      items: 5,
    },
    {
      id: 'payments',
      title: 'Payments & Payouts',
      icon: CreditCard,
      description: 'Payout methods & preferences',
      priority: 'high',
      items: 4,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Email & push alerts',
      priority: 'medium',
      items: 8,
    },
    {
      id: 'analytics',
      title: 'Analytics & Data',
      icon: BarChart3,
      description: 'Performance & privacy',
      priority: 'low',
      items: 3,
    },
  ];

  // Load creator data on component mount
  useEffect(() => {
    loadCreatorData();
  }, []);

  const loadCreatorData = async () => {
    try {
      setLoading(true);

      // Get current user data (email, role, etc.)
      const userData = await authService.getCurrentUser();

      // Get creator profile data (displayName, bio, etc.)
      const profileData = await creatorService.getProfile();

      // Debug: Log the API responses to understand structure
      console.log('Auth API Response:', userData);
      console.log('Profile API Response:', profileData);

      // Handle different possible response structures
      const userEmail =
        userData.user?.email || userData.data?.user?.email || '';
      const profile = profileData.profile || profileData.data || profileData;

      // Update settings with real data
      setSettings(prevSettings => ({
        ...prevSettings,
        // From user data (auth API response)
        email: userEmail,

        // From creator profile (creator profile API response)
        username: profile?.username || profile?.user?.username || '',
        displayName: profile?.displayName || '',
        bio: profile?.bio || '',

        // Load notification preferences from localStorage (temporary until backend ready)
        ...(() => {
          try {
            const savedPrefs = localStorage.getItem('creatorNotificationPrefs');
            if (savedPrefs) {
              const prefs = JSON.parse(savedPrefs);
              return {
                emailNotifications:
                  prefs.emailNotifications || prevSettings.emailNotifications,
                pushNotifications:
                  prefs.pushNotifications || prevSettings.pushNotifications,
              };
            }
          } catch (error) {
            console.warn(
              'Failed to load notification preferences from localStorage:',
              error
            );
          }
          // Fallback to defaults
          return {
            emailNotifications: {
              ...prevSettings.emailNotifications,
              newSubscribers: true,
              purchases: true,
              messages: true,
              tips: true,
              analytics: false,
              marketing: false,
            },
            pushNotifications: {
              ...prevSettings.pushNotifications,
              newSubscribers: true,
              purchases: true,
              messages: true,
              tips: false,
              liveStreams: true,
            },
          };
        })(),

        // Load analytics preferences from localStorage (temporary until backend ready)
        ...(() => {
          try {
            const savedAnalytics = localStorage.getItem(
              'creatorAnalyticsPrefs'
            );
            if (savedAnalytics) {
              const prefs = JSON.parse(savedAnalytics);
              return {
                analyticsEnabled:
                  prefs.analyticsEnabled ?? prevSettings.analyticsEnabled,
                performanceTracking:
                  prefs.performanceTracking ?? prevSettings.performanceTracking,
                dataExport: prefs.dataExport ?? prevSettings.dataExport,
              };
            }
          } catch (error) {
            console.warn(
              'Failed to load analytics preferences from localStorage:',
              error
            );
          }
          // Fallback to defaults (already set in initial state)
          return {};
        })(),
      }));
    } catch (error) {
      console.error('Failed to load creator data:', error);
      // Keep default values if API fails
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (section, key, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value,
      }));
    }
    setUnsavedChanges(true);
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      // Save profile updates
      const profileUpdates = {
        displayName: settings.displayName,
        bio: settings.bio,
      };

      await creatorService.updateProfile(profileUpdates);

      // Save notification preferences to localStorage temporarily
      // (will be moved to backend when /creator/settings/notifications is implemented)
      const notificationPrefs = {
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        'creatorNotificationPrefs',
        JSON.stringify(notificationPrefs)
      );

      // Save analytics preferences to localStorage temporarily
      const analyticsPrefs = {
        analyticsEnabled: settings.analyticsEnabled,
        performanceTracking: settings.performanceTracking,
        dataExport: settings.dataExport,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        'creatorAnalyticsPrefs',
        JSON.stringify(analyticsPrefs)
      );

      // TODO: Future settings updates (when backend endpoints are implemented)
      // - Email changes need to be handled separately (usually requires verification)
      // - Username changes need special validation
      // - Notification preferences (save to backend via /creator/settings/notifications)
      // - Privacy settings (endpoints return 501 - not implemented yet)
      // - Two-factor authentication (not implemented)
      // - Delete account (not implemented)

      console.log('Settings saved successfully:', {
        profileUpdates,
        notificationPrefs,
      });

      setSaveStatus('saved');
      setUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const goBack = () => {
    if (activeSection) {
      setActiveSection(null);
    }
  };

  // Mobile-first: Main settings menu
  const renderMainMenu = () => (
    <div className='settings-main-menu'>
      <SettingsMenu
        menuItems={settingSections.map(section => ({
          id: section.id,
          icon: <section.icon size={24} />,
          title: section.title,
          description: section.description,
          itemCount: section.items,
          priority: section.priority,
          showBadge: section.priority === 'high'
        }))}
        onItemClick={(sectionId) => setActiveSection(sectionId)}
        className="settings-menu-grid"
      />
    </div>
  );

  // Mobile-optimized setting sections
  const renderAccountSection = () => {
    if (isMobile) {
      return (
        <div className='settings-mobile-section'>
          <div className='mobile-settings-group'>
            <h4>Login Information</h4>
            <div className='mobile-setting-item'>
              <label>Email Address</label>
              <input
                type='email'
                value={settings.email}
                onChange={e => updateSetting(null, 'email', e.target.value)}
                className='mobile-input'
              />
            </div>
            <div className='mobile-setting-item'>
              <label>Username</label>
              <input
                type='text'
                value={settings.username}
                onChange={e => updateSetting(null, 'username', e.target.value)}
                className='mobile-input'
                placeholder='Loading...'
              />
            </div>
          </div>

          <div className='mobile-settings-group'>
            <h4>Security</h4>
            <div className='mobile-toggle-item'>
              <div className='toggle-content'>
                <div className='toggle-header'>
                  <Shield size={20} />
                  <span>Two-Factor Authentication</span>
                </div>
                <p>Add extra security to your account (Coming Soon)</p>
              </div>
              <label className='mobile-toggle'>
                <input type='checkbox' checked={false} disabled={true} />
                <span className='toggle-slider'></span>
              </label>
            </div>
          </div>

          <div className='mobile-settings-group danger'>
            <h4>Danger Zone</h4>
            <button
              className='mobile-danger-btn'
              disabled={true}
              onClick={() => {}}
            >
              <Trash2 size={18} />
              Delete Account (Coming Soon)
            </button>
            <p className='danger-warning'>
              Account deletion feature coming soon
            </p>
          </div>
        </div>
      );
    }

    // Desktop version
    return (
      <div className='desktop-settings-section'>
        <div className='desktop-settings-group'>
          <h3>Login Information</h3>
          <div className='desktop-form-grid'>
            <div className='desktop-form-field'>
              <label className='desktop-label'>Email Address</label>
              <input
                type='email'
                value={settings.email}
                onChange={e => updateSetting(null, 'email', e.target.value)}
                className='desktop-input'
              />
            </div>
            <div className='desktop-form-field'>
              <label className='desktop-label'>Username</label>
              <input
                type='text'
                value={settings.username}
                onChange={e => updateSetting(null, 'username', e.target.value)}
                className='desktop-input'
                placeholder='Loading...'
              />
            </div>
          </div>
        </div>

        <div className='desktop-settings-group'>
          <h3>Security</h3>
          <div className='desktop-toggle-item'>
            <div className='desktop-toggle-content'>
              <div className='desktop-toggle-header'>
                <Shield size={20} />
                <div>
                  <span className='desktop-toggle-title'>
                    Two-Factor Authentication
                  </span>
                  <p className='desktop-toggle-desc'>
                    Add extra security to your account
                  </p>
                </div>
              </div>
            </div>
            <label className='desktop-toggle'>
              <input
                type='checkbox'
                checked={settings.twoFactorEnabled}
                onChange={e =>
                  updateSetting(null, 'twoFactorEnabled', e.target.checked)
                }
              />
              <span className='desktop-toggle-slider'></span>
            </label>
          </div>
        </div>

        <div className='desktop-settings-group danger'>
          <h3>Danger Zone</h3>
          <div className='desktop-danger-section'>
            <div className='desktop-danger-content'>
              <h4>Delete Account</h4>
              <p>
                This will permanently delete your account, content, and
                earnings. This action cannot be undone.
              </p>
            </div>
            <button
              className='desktop-danger-btn'
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPrivacySection = () => (
    <div className='settings-mobile-section'>
      <div className='mobile-settings-group'>
        <h4>Profile Visibility</h4>
        <div className='mobile-setting-item'>
          <label>Who can see your profile?</label>
          <select
            value={settings.profileVisibility}
            onChange={e =>
              updateSetting(null, 'profileVisibility', e.target.value)
            }
            className='mobile-select'
          >
            <option value='public'>Everyone</option>
            <option value='subscribers'>Subscribers only</option>
            <option value='private'>Private</option>
          </select>
        </div>
        <div className='mobile-setting-item'>
          <label>Who can message you?</label>
          <select
            value={settings.allowMessages}
            onChange={e => updateSetting(null, 'allowMessages', e.target.value)}
            className='mobile-select'
          >
            <option value='everyone'>Everyone</option>
            <option value='subscribers'>Subscribers only</option>
            <option value='none'>No one</option>
          </select>
        </div>
      </div>

      <div className='mobile-settings-group'>
        <h4>Privacy Controls</h4>
        <div className='mobile-toggle-item'>
          <div className='toggle-content'>
            <div className='toggle-header'>
              <Eye size={20} />
              <span>Show online status</span>
            </div>
            <p>Let others see when you're active</p>
          </div>
          <label className='mobile-toggle'>
            <input
              type='checkbox'
              checked={settings.showOnlineStatus}
              onChange={e =>
                updateSetting(null, 'showOnlineStatus', e.target.checked)
              }
            />
            <span className='toggle-slider'></span>
          </label>
        </div>

        <div className='mobile-toggle-item'>
          <div className='toggle-content'>
            <div className='toggle-header'>
              <DollarSign size={20} />
              <span>Allow tips</span>
            </div>
            <p>Enable fans to send you tips</p>
          </div>
          <label className='mobile-toggle'>
            <input
              type='checkbox'
              checked={settings.allowTips}
              onChange={e => updateSetting(null, 'allowTips', e.target.checked)}
            />
            <span className='toggle-slider'></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className='settings-mobile-section'>
      <div className='notification-disclaimer'>
        <p>
          <strong>Note:</strong> Notification preferences are saved locally and
          will be fully functional when backend integration is completed.
        </p>
      </div>

      <div className='mobile-settings-group'>
        <h4>Email Notifications</h4>
        {Object.entries(settings.emailNotifications).map(([key, value]) => (
          <div key={key} className='mobile-toggle-item'>
            <div className='toggle-content'>
              <span>
                {key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')}
              </span>
            </div>
            <label className='mobile-toggle'>
              <input
                type='checkbox'
                checked={value}
                onChange={e =>
                  updateSetting('emailNotifications', key, e.target.checked)
                }
              />
              <span className='toggle-slider'></span>
            </label>
          </div>
        ))}
      </div>

      <div className='mobile-settings-group'>
        <h4>Push Notifications</h4>
        {Object.entries(settings.pushNotifications).map(([key, value]) => (
          <div key={key} className='mobile-toggle-item'>
            <div className='toggle-content'>
              <span>
                {key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')}
              </span>
            </div>
            <label className='mobile-toggle'>
              <input
                type='checkbox'
                checked={value}
                onChange={e =>
                  updateSetting('pushNotifications', key, e.target.checked)
                }
              />
              <span className='toggle-slider'></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className='settings-mobile-section'>
      <div className='mobile-settings-group'>
        <h4>Profile Information</h4>
        <div className='mobile-setting-item'>
          <label>Display Name</label>
          <input
            type='text'
            value={settings.displayName}
            onChange={e => updateSetting(null, 'displayName', e.target.value)}
            className='mobile-input'
          />
        </div>
        <div className='mobile-setting-item'>
          <label>Bio</label>
          <textarea
            value={settings.bio}
            onChange={e => updateSetting(null, 'bio', e.target.value)}
            className='mobile-textarea'
            rows={4}
            maxLength={500}
          />
          <small>{settings.bio.length}/500 characters</small>
        </div>
      </div>
    </div>
  );

  // Handle data export
  const handleDataExport = async () => {
    try {
      setSaveStatus('saving');

      // Call the actual data export API
      const response = await creatorService.exportAnalyticsData({
        format: 'json',
        period: '30d',
        sections: 'all',
      });

      // Create downloadable file
      const blob = new Blob([JSON.stringify(response, null, 2)], {
        type: 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `creator-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Data export failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const renderPaymentsSection = () => (
    <div className='settings-mobile-section'>
      <div className='notification-disclaimer'>
        <p>
          <strong>Note:</strong> Payment and payout settings are saved to your account.
          Changes may take up to 24 hours to take effect.
        </p>
      </div>

      <div className='mobile-settings-group'>
        <h4>Payout Settings</h4>
        <div className='mobile-select-item'>
          <div className='select-content'>
            <div className='select-header'>
              <DollarSign size={20} />
              <span>Payout Method</span>
            </div>
            <p>Choose how often you receive payments</p>
          </div>
          <select
            value={settings.payoutMethod}
            onChange={e => updateSetting(null, 'payoutMethod', e.target.value)}
            className='mobile-select'
          >
            <option value='weekly'>Weekly Payouts</option>
            <option value='instant'>Instant Payouts (+2% fee)</option>
          </select>
        </div>

        <div className='mobile-input-item'>
          <div className='input-content'>
            <div className='input-header'>
              <CreditCard size={20} />
              <span>Minimum Payout</span>
            </div>
            <p>Minimum amount before payout is triggered</p>
          </div>
          <div className='input-wrapper'>
            <span className='input-prefix'>$</span>
            <input
              type='number'
              value={settings.payoutThreshold}
              onChange={e => updateSetting(null, 'payoutThreshold', e.target.value)}
              min='10'
              max='1000'
              step='5'
              className='mobile-input'
            />
          </div>
        </div>

        <div className='mobile-toggle-item'>
          <div className='toggle-content'>
            <div className='toggle-header'>
              <DollarSign size={20} />
              <span>Auto Payout</span>
            </div>
            <p>Automatically send payouts when threshold is reached</p>
          </div>
          <label className='mobile-toggle'>
            <input
              type='checkbox'
              checked={settings.autoPayout}
              onChange={e => updateSetting(null, 'autoPayout', e.target.checked)}
            />
            <span className='toggle-slider'></span>
          </label>
        </div>
      </div>

      <div className='mobile-settings-group'>
        <h4>Payment Account</h4>
        <div className='payment-account-status'>
          <div className='account-info'>
            <CreditCard size={24} />
            <div className='account-details'>
              <span className='account-status'>PayPal Account</span>
              <span className='account-email'>
                {settings.paypalConnected ? 'creator@example.com' : 'Not connected'}
              </span>
            </div>
          </div>
          <button
            className={`mobile-action-btn ${settings.paypalConnected ? 'secondary' : 'primary'}`}
            onClick={() => {
              if (settings.paypalConnected) {
                updateSetting(null, 'paypalConnected', false);
              } else {
                updateSetting(null, 'paypalConnected', true);
              }
            }}
          >
            {settings.paypalConnected ? 'Disconnect' : 'Connect PayPal'}
          </button>
        </div>
        <p className='action-description'>
          Connect your PayPal account to receive payments securely
        </p>
      </div>

      <div className='mobile-settings-group'>
        <h4>Quick Stats</h4>
        <div className='stats-grid'>
          <div className='stat-item'>
            <span className='stat-value'>$0.00</span>
            <span className='stat-label'>Pending Balance</span>
          </div>
          <div className='stat-item'>
            <span className='stat-value'>$0.00</span>
            <span className='stat-label'>This Month</span>
          </div>
          <div className='stat-item'>
            <span className='stat-value'>$0.00</span>
            <span className='stat-label'>Total Earned</span>
          </div>
          <div className='stat-item'>
            <span className='stat-value'>0</span>
            <span className='stat-label'>Total Payouts</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className='settings-mobile-section'>
      <div className='notification-disclaimer'>
        <p>
          <strong>Note:</strong> Analytics preferences are saved locally. Data
          export downloads your actual analytics data from the server.
        </p>
      </div>

      <div className='mobile-settings-group'>
        <h4>Data Collection</h4>
        <div className='mobile-toggle-item'>
          <div className='toggle-content'>
            <div className='toggle-header'>
              <BarChart3 size={20} />
              <span>Enable analytics</span>
            </div>
            <p>Collect data to improve performance (Local Setting)</p>
          </div>
          <label className='mobile-toggle'>
            <input
              type='checkbox'
              checked={settings.analyticsEnabled}
              onChange={e =>
                updateSetting(null, 'analyticsEnabled', e.target.checked)
              }
            />
            <span className='toggle-slider'></span>
          </label>
        </div>
      </div>

      <div className='mobile-settings-group'>
        <h4>Data Export</h4>
        <button
          className='mobile-action-btn'
          onClick={handleDataExport}
          disabled={saveStatus === 'saving'}
        >
          <Download size={18} />
          {saveStatus === 'saving' ? 'Exporting...' : 'Export My Data'}
        </button>
        <p className='action-description'>
          Download your analytics data as JSON
        </p>
      </div>
    </div>
  );

  const getSectionTitle = () => {
    const section = settingSections.find(s => s.id === activeSection);
    return section ? section.title : 'Settings';
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'account':
        return renderAccountSection();
      case 'profile':
        return renderProfileSection();
      case 'privacy':
        return renderPrivacySection();
      case 'payments':
        return renderPaymentsSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'analytics':
        return renderAnalyticsSection();
      default:
        return renderMainMenu();
    }
  };

  return (
    <div className='CreatorSettingsPage-container'>
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}

      {/* Main Content Wrapper */}
      <div className={`creator-settings ${isMobile ? 'mobile' : 'desktop'}`}>
        {loading ? (
          <div className='settings-loading'>
            <div className='loading-spinner'></div>
            <p>Loading your settings...</p>
          </div>
        ) : isMobile ? (
          // Mobile Layout
          <>
            {/* Mobile Header */}
            <div className='mobile-header'>
              <div className='mobile-header-content'>
                {activeSection ? (
                  <button className='mobile-back-btn' onClick={goBack}>
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
                    {saveStatus === 'saving' && <div className='spinner' />}
                    {saveStatus === 'saved' && <Check size={18} />}
                    {saveStatus === 'error' && <X size={18} />}
                    {saveStatus === 'idle' && <Save size={18} />}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Content */}
            <div className='mobile-content'>
              <AnimatePresence mode='wait'>
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
              <div className='mobile-save-bar'>
                <button
                  className={`mobile-save-bar-btn ${saveStatus}`}
                  onClick={saveSettings}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' && <div className='spinner' />}
                  {saveStatus === 'saved' && <Check size={20} />}
                  {saveStatus === 'error' && <X size={20} />}
                  {saveStatus === 'idle' && <Save size={20} />}
                  <span>
                    {saveStatus === 'saving'
                      ? 'Saving...'
                      : saveStatus === 'saved'
                        ? 'Saved!'
                        : saveStatus === 'error'
                          ? 'Error'
                          : 'Save Changes'}
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          // Desktop Layout - Show section content or main menu
          <div className='desktop-settings-content'>
            {!activeSection ? (
              <>
                <div className='desktop-settings-header'>
                  <Settings size={28} />
                  <h1>Settings</h1>
                  <p>Manage your account, privacy, and platform preferences</p>
                </div>
                {renderMainMenu()}
              </>
            ) : (
              <div className='desktop-section-view'>
                <div className='desktop-section-header'>
                  <button className='desktop-back-btn' onClick={goBack}>
                    <ChevronLeft size={24} />
                    <span>Back to Settings</span>
                  </button>
                  <h2>{getSectionTitle()}</h2>
                </div>
                <div className='desktop-section-content'>
                  {renderActiveSection()}
                </div>
                {unsavedChanges && (
                  <div className='desktop-save-section'>
                    <button
                      className={`desktop-save-btn ${saveStatus}`}
                      onClick={saveSettings}
                      disabled={saveStatus === 'saving'}
                    >
                      {saveStatus === 'saving' && <div className='spinner' />}
                      {saveStatus === 'saved' && <Check size={20} />}
                      {saveStatus === 'error' && <X size={20} />}
                      {saveStatus === 'idle' && <Save size={20} />}
                      <span>
                        {saveStatus === 'saving'
                          ? 'Saving...'
                          : saveStatus === 'saved'
                            ? 'Saved!'
                            : saveStatus === 'error'
                              ? 'Error'
                              : 'Save Changes'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Delete Dialog */}
        {showDeleteDialog && (
          <div className='modal-overlay'>
            <div className='delete-dialog'>
              <div className='dialog-header'>
                <AlertTriangle size={32} className='warning-icon' />
                <h3>Delete Account?</h3>
              </div>
              <div className='dialog-content'>
                <p>
                  This will permanently delete your account, content, and
                  earnings.
                </p>
                <p>
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
              <div className='dialog-actions'>
                <button
                  className='dialog-btn secondary'
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </button>
                <button className='dialog-btn danger'>Delete Forever</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorSettingsPage;
