import React, { useState, useEffect } from 'react';
import { 
  User, DollarSign, Clock, Activity, Heart, 
  MessageCircle, Sparkles, TrendingUp, Calendar,
  ArrowLeft, Shield, Send, HandHeart, Star,
  Package, Eye, ChevronRight, Zap
} from 'lucide-react';
import './MemberProfile.css';

const MemberProfile = ({ memberId, onBack }) => {
  // Remove useParams and useNavigate since they're not available in artifacts
  // These would be passed as props in production
  
  // State management
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [specialOffer, setSpecialOffer] = useState('');
  
  // Track interactions
  const [hasPoked, setHasPoked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    fetchMemberProfile();
  }, [memberId]);

  const fetchMemberProfile = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockMember = {
        id: memberId,
        username: `LuxuryLover${Math.floor(Math.random() * 999)}`,
        avatar: '/api/placeholder/150/150',
        joinDate: '2024-08-15',
        lastActive: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        isOnline: Math.random() > 0.5,
        stats: {
          last30DaySpend: (Math.random() * 500 + 50).toFixed(2),
          totalSpend: (Math.random() * 2000 + 100).toFixed(2),
          averagePurchase: (Math.random() * 50 + 10).toFixed(2),
          contentPurchases: Math.floor(Math.random() * 50 + 5),
          favoriteCategory: ['Lifestyle', 'Fashion', 'Fitness'][Math.floor(Math.random() * 3)],
          activityLevel: ['Very Active', 'Active', 'Regular'][Math.floor(Math.random() * 3)],
          responseRate: Math.floor(Math.random() * 40 + 60),
          preferredContent: ['Photos', 'Videos', 'Live Shows'][Math.floor(Math.random() * 3)]
        },
        interactions: {
          previousPurchases: Math.floor(Math.random() * 10),
          lastPurchase: new Date(Date.now() - Math.random() * 604800000).toISOString(),
          hasSubscribed: Math.random() > 0.7,
          tipsGiven: Math.floor(Math.random() * 20)
        },
        badges: []
      };

      // Assign badges based on spending
      if (parseFloat(mockMember.stats.last30DaySpend) > 300) {
        mockMember.badges.push({ type: 'whale', label: 'Big Spender' });
      } else if (parseFloat(mockMember.stats.last30DaySpend) > 100) {
        mockMember.badges.push({ type: 'vip', label: 'VIP Member' });
      }
      
      if (mockMember.stats.activityLevel === 'Very Active') {
        mockMember.badges.push({ type: 'active', label: 'Super Active' });
      }

      // In production:
      // const response = await fetch(`/api/creator/members/${memberId}`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setMember(data);

      setMember(mockMember);
      setLoading(false);
    } catch (err) {
      setError('Failed to load member profile');
      setLoading(false);
    }
  };

  const getSpendingTier = (amount) => {
    const spend = parseFloat(amount);
    if (spend > 300) return { tier: 'whale', color: '#FFD700', icons: 5 };
    if (spend > 200) return { tier: 'high', color: '#8B5CF6', icons: 4 };
    if (spend > 100) return { tier: 'medium', color: '#3B82F6', icons: 3 };
    if (spend > 50) return { tier: 'regular', color: '#10B981', icons: 2 };
    return { tier: 'new', color: '#6B7280', icons: 1 };
  };

  const getActivityStatus = (lastActive) => {
    const now = new Date();
    const active = new Date(lastActive);
    const diffMs = now - active;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return { text: 'Online now', color: '#10B981' };
    if (diffMins < 60) return { text: `Active ${diffMins}m ago`, color: '#10B981' };
    if (diffHours < 24) return { text: `Active ${diffHours}h ago`, color: '#F59E0B' };
    if (diffDays < 7) return { text: `Active ${diffDays}d ago`, color: '#6B7280' };
    return { text: `Active ${diffDays}d ago`, color: '#6B7280' };
  };

  const handlePoke = async () => {
    if (hasPoked) return;
    
    setActionLoading(true);
    try {
      // API call to send poke
      // await fetch(`/api/creator/members/${memberId}/poke`, { method: 'POST' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setHasPoked(true);
      setActionLoading(false);
    } catch (err) {
      console.error('Failed to send poke:', err);
      setActionLoading(false);
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;
    
    setActionLoading(true);
    try {
      // API call to send like
      // await fetch(`/api/creator/members/${memberId}/like`, { method: 'POST' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setHasLiked(true);
      setActionLoading(false);
    } catch (err) {
      console.error('Failed to send like:', err);
      setActionLoading(false);
    }
  };

  const handleSayHi = () => {
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!specialOffer.trim()) return;
    
    setActionLoading(true);
    try {
      // API call to send message
      // await fetch(`/api/creator/members/${memberId}/message`, {
      //   method: 'POST',
      //   body: JSON.stringify({ message: specialOffer })
      // });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setHasSentMessage(true);
      setShowMessageModal(false);
      setSpecialOffer('');
      setActionLoading(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="member-profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="member-profile-page">
        <div className="error-container">
          <p>{error || 'Member not found'}</p>
          <button onClick={() => onBack?.()} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const spendingTier = getSpendingTier(member.stats.last30DaySpend);
  const activityStatus = getActivityStatus(member.lastActive);

  return (
    <div className="member-profile-page">
      <div className="member-profile-container">
        {/* Header */}
        <header className="profile-header">
          <button onClick={() => onBack?.()} className="back-nav-btn">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1>Member Profile</h1>
          <div className="header-spacer"></div>
        </header>

        {/* Profile Content Grid */}
        <div className="profile-content-grid">
          {/* Member Identity Card */}
          <div className="profile-card member-identity-card">
            <div className="member-avatar-section">
              <div className="avatar-wrapper">
                <img 
                  src={member.avatar} 
                  alt={member.username}
                  className="member-avatar"
                />
                {member.isOnline && <div className="online-indicator"></div>}
              </div>
              <div className="member-basic-info">
                <h2 className="member-username">{member.username}</h2>
                <div className="activity-status" style={{ color: activityStatus.color }}>
                  <Activity size={14} />
                  <span>{activityStatus.text}</span>
                </div>
              </div>
            </div>
            
            {/* Badges */}
            {member.badges.length > 0 && (
              <div className="member-badges">
                {member.badges.map((badge, index) => (
                  <div key={index} className={`badge badge-${badge.type}`}>
                    {badge.type === 'whale' && <DollarSign size={14} />}
                    {badge.type === 'vip' && <Star size={14} />}
                    {badge.type === 'active' && <Zap size={14} />}
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spending Stats Card */}
          <div className="profile-card spending-stats-card">
            <div className="card-header">
              <h3>
                <DollarSign size={18} />
                Spending Activity
              </h3>
            </div>
            
            <div className="spending-tier-display">
              <div className="tier-label">30-Day Spending Tier</div>
              <div className="tier-icons">
                {[...Array(5)].map((_, i) => (
                  <DollarSign 
                    key={i} 
                    size={20} 
                    className={`tier-icon ${i < spendingTier.icons ? 'active' : ''}`}
                    style={{ color: i < spendingTier.icons ? spendingTier.color : '#374151' }}
                  />
                ))}
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Last 30 Days</div>
                <div className="stat-value primary">${member.stats.last30DaySpend}</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Total Spent</div>
                <div className="stat-value">${member.stats.totalSpend}</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Avg Purchase</div>
                <div className="stat-value">${member.stats.averagePurchase}</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Total Purchases</div>
                <div className="stat-value">{member.stats.contentPurchases}</div>
              </div>
            </div>
          </div>

          {/* Activity & Preferences Card */}
          <div className="profile-card activity-card">
            <div className="card-header">
              <h3>
                <Activity size={18} />
                Activity & Preferences
              </h3>
            </div>
            
            <div className="activity-items">
              <div className="activity-item">
                <span className="item-label">Activity Level</span>
                <span className={`item-value activity-level-${member.stats.activityLevel.toLowerCase().replace(' ', '-')}`}>
                  {member.stats.activityLevel}
                </span>
              </div>
              
              <div className="activity-item">
                <span className="item-label">Response Rate</span>
                <span className="item-value">{member.stats.responseRate}%</span>
              </div>
              
              <div className="activity-item">
                <span className="item-label">Favorite Category</span>
                <span className="item-value category-tag">{member.stats.favoriteCategory}</span>
              </div>
              
              <div className="activity-item">
                <span className="item-label">Preferred Content</span>
                <span className="item-value">{member.stats.preferredContent}</span>
              </div>
              
              <div className="activity-item">
                <span className="item-label">Member Since</span>
                <span className="item-value">
                  {new Date(member.joinDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="activity-item">
                <span className="item-label">Tips Given</span>
                <span className="item-value">{member.interactions.tipsGiven}</span>
              </div>
            </div>
          </div>

          {/* Interaction History Card */}
          <div className="profile-card interaction-card">
            <div className="card-header">
              <h3>
                <Heart size={18} />
                Your Interactions
              </h3>
            </div>
            
            <div className="interaction-stats">
              <div className="interaction-item">
                <Package size={16} />
                <span>{member.interactions.previousPurchases} purchases from you</span>
              </div>
              
              {member.interactions.hasSubscribed && (
                <div className="interaction-item subscribed">
                  <Star size={16} />
                  <span>Subscribed to your content</span>
                </div>
              )}
              
              {member.interactions.lastPurchase && (
                <div className="interaction-item">
                  <Clock size={16} />
                  <span>Last purchase: {new Date(member.interactions.lastPurchase).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Card */}
          <div className="profile-card actions-card">
            <div className="card-header">
              <h3>
                <Sparkles size={18} />
                Quick Actions
              </h3>
            </div>
            
            <div className="action-buttons-grid">
              <button 
                className={`action-btn poke-btn ${hasPoked ? 'completed' : ''}`}
                onClick={handlePoke}
                disabled={hasPoked || actionLoading}
              >
                <HandHeart size={20} />
                <span>{hasPoked ? 'Poked!' : 'Poke'}</span>
              </button>
              
              <button 
                className={`action-btn like-btn ${hasLiked ? 'completed' : ''}`}
                onClick={handleLike}
                disabled={hasLiked || actionLoading}
              >
                <Heart size={20} />
                <span>{hasLiked ? 'Liked!' : 'Like'}</span>
              </button>
              
              <button 
                className={`action-btn message-btn ${hasSentMessage ? 'completed' : ''}`}
                onClick={handleSayHi}
                disabled={actionLoading}
              >
                <MessageCircle size={20} />
                <span>{hasSentMessage ? 'Message Sent!' : 'Say Hi'}</span>
              </button>
              
              <button 
                className="action-btn special-offer-btn"
                onClick={() => navigate(`/creator/special-offer/${memberId}`)}
              >
                <Send size={20} />
                <span>Send Special Offer</span>
              </button>
            </div>

            <div className="action-tip">
              <Eye size={14} />
              <span>Engaging with high-value members increases your visibility!</span>
            </div>
          </div>
        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
            <div className="message-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Send a Personal Message</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowMessageModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <p className="modal-description">
                  Send a personalized message to {member.username}. 
                  High-spenders appreciate personal attention!
                </p>
                
                <textarea
                  className="message-textarea"
                  placeholder="Hi! I noticed you've been enjoying my content. I'd love to create something special just for you..."
                  value={specialOffer}
                  onChange={(e) => setSpecialOffer(e.target.value)}
                  maxLength={500}
                />
                
                <div className="character-count">
                  {specialOffer.length}/500
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowMessageModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!specialOffer.trim() || actionLoading}
                >
                  {actionLoading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberProfile;