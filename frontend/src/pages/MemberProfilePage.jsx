import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings, CreditCard, Heart, Package, Clock,
  Edit2, Shield, Bell, Eye, EyeOff, LogOut,
  TrendingUp, Star, DollarSign, Calendar, ChevronRight,
  Download, Bookmark, Activity, Award, CheckCircle,
  AlertCircle, X, Save, Sliders
} from 'lucide-react';
import './MemberProfilePage.css';

const MemberProfilePage = () => {
  const navigate = useNavigate();
  // State management
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [notifications, setNotifications] = useState({
    newContent: true,
    messages: true,
    specialOffers: true,
    tips: false
  });

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData = {
        id: 'member123',
        username: 'LuxuryLover88',
        email: 'member@example.com',
        bio: 'Living my best life | Content enthusiast | Supporting amazing creators',
        joinDate: '2024-01-15',
        isVerified: true,
        stats: {
          totalSpent: 1847.50,
          totalPurchases: 47,
          favoriteCategory: 'Lifestyle',
          favoriteCreators: 5,
          totalMessages: 132
        },
        recentPurchases: [
          {
            id: 'p1',
            type: 'photo_set',
            creatorName: 'AlexisStyles',
            title: 'Exclusive Summer Collection',
            price: 49.99,
            date: '2024-11-28'
          },
          {
            id: 'p2',
            type: 'video',
            creatorName: 'FitnessQueen',
            title: 'Full Body Workout',
            price: 29.99,
            date: '2024-11-25'
          },
          {
            id: 'p3',
            type: 'message',
            creatorName: 'TravelDreams',
            title: 'Private Message',
            price: 9.99,
            date: '2024-11-24'
          }
        ],
        paymentMethods: [
          {
            id: 'pm1',
            type: 'card',
            last4: '4242',
            brand: 'Visa',
            isDefault: true
          }
        ]
      };

      setMember(mockData);
      setEditedProfile({
        username: mockData.username,
        email: mockData.email,
        bio: mockData.bio
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch member data:', err);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // API call to save profile
      // await fetch('/api/member/profile', {
      //   method: 'PUT',
      //   body: JSON.stringify(editedProfile)
      // });
      
      setMember({ ...member, ...editedProfile });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    // Save notification preferences
  };

  if (loading) {
    return (
      <div className="mpp-container">
        <div className="mpp-loading-container">
          <div className="mpp-loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mpp-container">
      <div className="mpp-content-wrapper">
        {/* Header */}
        <header className="mpp-header">
          <div className="mpp-header-content">
            <h1>My Profile</h1>
            <button className="mpp-settings-btn" aria-label="Settings">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Profile Info Section */}
        <div className="mpp-profile-info">
          <div className="mpp-profile-info-content">
            {isEditing ? (
              <div className="mpp-edit-form">
                <input
                  type="text"
                  className="mpp-edit-input"
                  value={editedProfile.username}
                  onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
                  placeholder="Username"
                />
                <textarea
                  className="mpp-edit-textarea"
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  placeholder="Bio"
                  rows={3}
                />
                <div className="mpp-edit-actions">
                  <button className="mpp-save-btn" onClick={handleSaveProfile}>
                    <Save size={16} />
                    Save
                  </button>
                  <button className="mpp-cancel-btn" onClick={() => setIsEditing(false)}>
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mpp-profile-details">
                <h2 className="mpp-username">
                  {member.username}
                  {member.isVerified && (
                    <span className="mpp-verified-icon">
                      <CheckCircle size={20} />
                    </span>
                  )}
                </h2>
                <p className="mpp-bio">{member.bio}</p>
                <div className="mpp-meta">
                  <span className="mpp-join-date">
                    <Calendar size={14} />
                    Joined {new Date(member.joinDate).toLocaleDateString()}
                  </span>
                </div>
                <button className="mpp-edit-profile-btn" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} />
                  Edit Profile
                </button>
                <button className="mpp-view-library-btn" onClick={() => navigate('/member/library')}>
                  <Package size={16} />
                  View Library
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mpp-stats-section">
          <div className="mpp-stats-grid">
            <div className="mpp-stat-card">
              <div className="mpp-stat-icon mpp-spent">
                <DollarSign size={20} />
              </div>
              <div className="mpp-stat-content">
                <div className="mpp-stat-value">${member.stats.totalSpent.toFixed(2)}</div>
                <div className="mpp-stat-label">Total Spent</div>
              </div>
            </div>

            <div className="mpp-stat-card">
              <div className="mpp-stat-icon mpp-creators">
                <Heart size={20} />
              </div>
              <div className="mpp-stat-content">
                <div className="mpp-stat-value">{member.stats.favoriteCreators}</div>
                <div className="mpp-stat-label">Favorite Creators</div>
              </div>
            </div>

            <div className="mpp-stat-card">
              <div className="mpp-stat-icon mpp-purchases">
                <Package size={20} />
              </div>
              <div className="mpp-stat-content">
                <div className="mpp-stat-value">{member.stats.totalPurchases}</div>
                <div className="mpp-stat-label">Purchases</div>
              </div>
            </div>

            <div className="mpp-stat-card">
              <div className="mpp-stat-icon mpp-messages">
                <Star size={20} />
              </div>
              <div className="mpp-stat-content">
                <div className="mpp-stat-value">{member.stats.totalMessages}</div>
                <div className="mpp-stat-label">Messages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mpp-tab-navigation">
          <div className="mpp-tab-container">
            <button 
              className={`mpp-tab-btn ${activeTab === 'profile' ? 'mpp-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`mpp-tab-btn ${activeTab === 'purchases' ? 'mpp-active' : ''}`}
              onClick={() => setActiveTab('purchases')}
            >
              Purchases
            </button>
            <button 
              className={`mpp-tab-btn ${activeTab === 'favorites' ? 'mpp-active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              Favorites
            </button>
            <button 
              className={`mpp-tab-btn ${activeTab === 'settings' ? 'mpp-active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mpp-tab-content">
          {activeTab === 'profile' && (
            <div className="mpp-profile-tab">
              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <Activity size={18} />
                  Activity Overview
                </h3>
                <div className="mpp-activity-list">
                  <div className="mpp-activity-item">
                    <span className="mpp-activity-label">Favorite Category</span>
                    <span className="mpp-activity-value">{member.stats.favoriteCategory}</span>
                  </div>
                  <div className="mpp-activity-item">
                    <span className="mpp-activity-label">Total Purchases</span>
                    <span className="mpp-activity-value">{member.stats.totalPurchases}</span>
                  </div>
                  <div className="mpp-activity-item">
                    <span className="mpp-activity-label">Messages Sent</span>
                    <span className="mpp-activity-value">{member.stats.totalMessages}</span>
                  </div>
                </div>
              </div>

              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <Shield size={18} />
                  Account Security
                </h3>
                <div className="mpp-security-list">
                  <button className="mpp-security-item">
                    <span>Change Password</span>
                    <ChevronRight size={18} />
                  </button>
                  <button className="mpp-security-item">
                    <span>Two-Factor Authentication</span>
                    <ChevronRight size={18} />
                  </button>
                  <button className="mpp-security-item">
                    <span>Login History</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="mpp-favorites-tab">
              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <Heart size={18} />
                  Favorite Creators
                </h3>
                <div className="mpp-favorites-list">
                  <div className="mpp-favorite-item">
                    <div className="mpp-favorite-info">
                      <h4>AlexisStyles</h4>
                      <p className="mpp-favorite-category">Fashion & Lifestyle</p>
                    </div>
                    <button className="mpp-view-creator-btn">View Profile</button>
                  </div>
                  <div className="mpp-favorite-item">
                    <div className="mpp-favorite-info">
                      <h4>FitnessQueen</h4>
                      <p className="mpp-favorite-category">Health & Fitness</p>
                    </div>
                    <button className="mpp-view-creator-btn">View Profile</button>
                  </div>
                  <div className="mpp-favorite-item">
                    <div className="mpp-favorite-info">
                      <h4>TravelDreams</h4>
                      <p className="mpp-favorite-category">Travel & Adventure</p>
                    </div>
                    <button className="mpp-view-creator-btn">View Profile</button>
                  </div>
                </div>
              </div>

              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <Bookmark size={18} />
                  Saved Content
                </h3>
                <div className="mpp-saved-content">
                  <p className="mpp-empty-state">No saved content yet. Start exploring and save your favorites!</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="mpp-purchases-tab">
              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <Package size={18} />
                  Recent Purchases
                </h3>
                <div className="mpp-purchases-list">
                  {member.recentPurchases.map(purchase => (
                    <div key={purchase.id} className="mpp-purchase-item">
                      <div className="mpp-purchase-info">
                        <h4>{purchase.title}</h4>
                        <p className="mpp-purchase-creator">by {purchase.creatorName}</p>
                        <p className="mpp-purchase-date">
                          {new Date(purchase.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mpp-purchase-price">
                        ${purchase.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="mpp-settings-tab">
              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <Sliders size={18} />
                  Browse Preferences
                </h3>
                <div className="mpp-settings-list">
                  <button 
                    className="mpp-security-item"
                    onClick={() => navigate('/member/filters')}
                  >
                    <span>Customize Browse Filters</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <Bell size={18} />
                  Notification Preferences
                </h3>
                <div className="mpp-settings-list">
                  <div className="mpp-setting-item">
                    <div className="mpp-setting-info">
                      <span className="mpp-setting-label">New Content Alerts</span>
                      <span className="mpp-setting-description">Get notified when creators post</span>
                    </div>
                    <button 
                      className={`mpp-toggle-switch ${notifications.newContent ? 'mpp-active' : ''}`}
                      onClick={() => handleNotificationToggle('newContent')}
                      aria-label="Toggle new content alerts"
                    >
                      <div className="mpp-toggle-handle"></div>
                    </button>
                  </div>

                  <div className="mpp-setting-item">
                    <div className="mpp-setting-info">
                      <span className="mpp-setting-label">Messages</span>
                      <span className="mpp-setting-description">Receive message notifications</span>
                    </div>
                    <button 
                      className={`mpp-toggle-switch ${notifications.messages ? 'mpp-active' : ''}`}
                      onClick={() => handleNotificationToggle('messages')}
                      aria-label="Toggle message notifications"
                    >
                      <div className="mpp-toggle-handle"></div>
                    </button>
                  </div>

                  <div className="mpp-setting-item">
                    <div className="mpp-setting-info">
                      <span className="mpp-setting-label">Special Offers</span>
                      <span className="mpp-setting-description">Get exclusive deals and discounts</span>
                    </div>
                    <button 
                      className={`mpp-toggle-switch ${notifications.specialOffers ? 'mpp-active' : ''}`}
                      onClick={() => handleNotificationToggle('specialOffers')}
                      aria-label="Toggle special offers"
                    >
                      <div className="mpp-toggle-handle"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mpp-section-card">
                <h3 className="mpp-section-title">
                  <CreditCard size={18} />
                  Payment Methods
                </h3>
                <div className="mpp-payment-methods">
                  {member.paymentMethods.map(method => (
                    <div key={method.id} className="mpp-payment-method">
                      <div className="mpp-payment-icon">💳</div>
                      <div className="mpp-payment-info">
                        <span className="mpp-payment-brand">{method.brand}</span>
                        <span className="mpp-payment-last4">•••• {method.last4}</span>
                      </div>
                      {method.isDefault && (
                        <span className="mpp-default-badge">Default</span>
                      )}
                      <button className="mpp-edit-payment-btn" aria-label="Edit payment method">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button className="mpp-add-payment-btn">
                    + Add Payment Method
                  </button>
                </div>
              </div>

              <div className="mpp-section-card mpp-danger-zone">
                <h3 className="mpp-section-title">
                  <AlertCircle size={18} />
                  Danger Zone
                </h3>
                <button className="mpp-logout-btn">
                  <LogOut size={18} />
                  Log Out
                </button>
                <button className="mpp-delete-account-btn">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfilePage;