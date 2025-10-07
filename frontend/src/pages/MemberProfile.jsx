import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  DollarSign,
  Clock,
  Activity,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Shield,
  Send,
  HandHeart,
  Star,
  Package,
  Eye,
  ChevronRight,
  Zap,
} from 'lucide-react';
import api from '../services/api.config';
import messageService from '../services/message.service';
import BottomQuickActions from '../components/BottomQuickActions';
import './MemberProfile.css';

const MemberProfile = ({ memberId: propMemberId, onBack: propOnBack }) => {
  // Get memberId from URL params or props
  const params = useParams();
  const navigate = useNavigate();
  const memberId = propMemberId || params.memberId;
  const onBack = propOnBack || (() => navigate(-1));

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
      let memberData;

      if (memberId) {
        // Fetch specific member data from API (creator viewing member)
        const response = await api.get(`/creator/members/profile/${memberId}`);
        memberData = response.data || response;
      } else {
        // If no memberId provided, fetch current user data
        memberData = await api.get('/auth/me');
      }

      // Transform API data to component structure
      const transformedMember = {
        id: memberData._id || memberData.id || 'user-1',
        username: memberData.username || memberData.displayName || 'User',
        joinDate: memberData.createdAt || new Date().toISOString(),
        lastActive:
          memberData.lastActive ||
          memberData.updatedAt ||
          new Date().toISOString(),
        isOnline: memberData.isOnline || false,
        stats: {
          last30DaySpend: (
            memberData.purchasedContent?.reduce(
              (total, item) => total + (item.price || 0),
              0
            ) || 0
          ).toFixed(2),
          totalSpend: (
            memberData.allTimePurchases?.reduce(
              (total, item) => total + (item.price || 0),
              0
            ) || 0
          ).toFixed(2),
          averagePurchase: (memberData.purchasedContent?.length > 0
            ? memberData.purchasedContent.reduce(
                (total, item) => total + (item.price || 0),
                0
              ) / memberData.purchasedContent.length
            : 0
          ).toFixed(2),
          contentPurchases: memberData.purchasedContent?.length || 0,
          favoriteCategory:
            memberData.preferences?.favoriteCategory || 'Not set',
          activityLevel: memberData.activityLevel || 'Regular',
          responseRate: memberData.responseRate || 85,
          preferredContent:
            memberData.preferences?.preferredContent || 'Photos',
        },
        interactions: {
          previousPurchases: memberData.purchasedContent?.length || 0,
          lastPurchase:
            memberData.purchasedContent?.length > 0
              ? memberData.purchasedContent[
                  memberData.purchasedContent.length - 1
                ]?.createdAt
              : null,
          hasSubscribed: memberData.subscriptions?.length > 0 || false,
          tipsGiven: memberData.tipsGiven || 0,
        },
        badges: [],
      };

      // Assign badges based on real spending data
      if (parseFloat(transformedMember.stats.last30DaySpend) > 300) {
        transformedMember.badges.push({ type: 'whale', label: 'Big Spender' });
      } else if (parseFloat(transformedMember.stats.last30DaySpend) > 100) {
        transformedMember.badges.push({ type: 'vip', label: 'VIP Member' });
      }

      if (transformedMember.stats.activityLevel === 'Very Active') {
        transformedMember.badges.push({
          type: 'active',
          label: 'Super Active',
        });
      }

      if (memberData.isVerified) {
        transformedMember.badges.push({ type: 'verified', label: 'Verified' });
      }

      setMember(transformedMember);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching member profile:', err);
      setError('Failed to load member profile');

      // Fallback to current user data if member fetch fails
      try {
        const userData = await api.get('/auth/me');
        const fallbackMember = {
          id: userData._id || 'user-1',
          username: userData.username || 'User',
          joinDate: userData.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isOnline: true,
          stats: {
            last30DaySpend: '0.00',
            totalSpend: '0.00',
            averagePurchase: '0.00',
            contentPurchases: 0,
            favoriteCategory: 'Not set',
            activityLevel: 'Regular',
            responseRate: 85,
            preferredContent: 'Photos',
          },
          interactions: {
            previousPurchases: 0,
            lastPurchase: null,
            hasSubscribed: false,
            tipsGiven: 0,
          },
          badges: [],
        };
        setMember(fallbackMember);
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }

      setLoading(false);
    }
  };


  const getSpendingTier = amount => {
    const spend = parseFloat(amount);
    if (spend > 300) return { tier: 'whale', color: '#FFD700', icons: 5 };
    if (spend > 200) return { tier: 'high', color: '#8B5CF6', icons: 4 };
    if (spend > 100) return { tier: 'medium', color: '#3B82F6', icons: 3 };
    if (spend > 50) return { tier: 'regular', color: '#10B981', icons: 2 };
    return { tier: 'new', color: '#6B7280', icons: 1 };
  };

  const getActivityStatus = lastActive => {
    const now = new Date();
    const active = new Date(lastActive);
    const diffMs = now - active;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return { text: 'Online now', color: '#10B981' };
    if (diffMins < 60)
      return { text: `Active ${diffMins}m ago`, color: '#10B981' };
    if (diffHours < 24)
      return { text: `Active ${diffHours}h ago`, color: '#F59E0B' };
    if (diffDays < 7)
      return { text: `Active ${diffDays}d ago`, color: '#6B7280' };
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

  const handleOpenChat = async () => {
    setActionLoading(true);
    try {
      // Create or get conversation with this member
      const conversation = await messageService.createOrGetConversation(
        memberId,
        'Member',  // We're messaging a Member (creator messaging member)
        member.username
      );

      // Navigate to the chat page with this conversation
      const conversationId = conversation._id || conversation.id;
      navigate(`/creator/messages/${conversationId}`);
    } catch (err) {
      console.error('Failed to open chat:', err);
      alert('Failed to open chat. Please try again.');
    } finally {
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
      // Step 1: Create or get conversation with this member
      const conversation = await messageService.createOrGetConversation(
        memberId,
        'Member',  // We're messaging a Member (creator messaging member)
        member.username
      );

      // Step 2: Send the message to the conversation
      await messageService.sendMessage(
        conversation._id || conversation.id,
        specialOffer.trim(),
        null  // no media
      );

      // Success!
      setHasSentMessage(true);
      setShowMessageModal(false);
      setSpecialOffer('');

      // Optionally navigate to the conversation after sending
      // window.location.href = `/creator/messages/${conversation._id}`;

    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='member-profile-page'>
        <div className='member-profile-loading-container'>
          <div className='member-profile-loading-spinner'></div>
          <p>Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className='member-profile-page'>
        <div className='member-profile-error-container'>
          <p>{error || 'Member not found'}</p>
          <button
            onClick={() => onBack?.()}
            className='member-profile-back-button'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const spendingTier = getSpendingTier(member.stats.last30DaySpend);
  const activityStatus = getActivityStatus(member.lastActive);

  return (
    <div className='member-profile-page'>
      <div className='member-profile-container'>
        {/* Header */}
        <header className='member-profile-header'>
          <button
            onClick={() => onBack?.()}
            className='member-profile-back-nav-btn'
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1>Member Profile</h1>
          <div className='member-profile-header-spacer'></div>
        </header>

        {/* Profile Content Grid */}
        <div className='member-profile-content-grid'>
          {/* Member Identity Card */}
          <div className='member-profile-card member-profile-identity-card'>
            <div className='member-avatar-section'>
              <div className='member-basic-info'>
                <h2 className='member-username'>{member.username}</h2>
                <div
                  className='activity-status'
                  style={{ color: activityStatus.color }}
                >
                  <Activity size={14} />
                  <span>{activityStatus.text}</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            {member.badges.length > 0 && (
              <div className='member-badges'>
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
          <div className='member-profile-card member-profile-spending-stats-card'>
            <div className='member-profile-card-header'>
              <h3>
                <DollarSign size={18} />
                Spending Activity
              </h3>
            </div>

            <div className='spending-tier-display'>
              <div className='tier-label'>30-Day Spending Tier</div>
              <div className='tier-icons'>
                {[...Array(5)].map((_, i) => (
                  <DollarSign
                    key={i}
                    size={20}
                    className={`tier-icon ${i < spendingTier.icons ? 'active' : ''}`}
                    style={{
                      color:
                        i < spendingTier.icons ? spendingTier.color : '#374151',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className='stats-grid'>
              <div className='stat-item'>
                <div className='stat-label'>Last 30 Days</div>
                <div className='stat-value primary'>
                  ${member.stats.last30DaySpend}
                </div>
              </div>

              <div className='stat-item'>
                <div className='stat-label'>Total Spent</div>
                <div className='stat-value'>${member.stats.totalSpend}</div>
              </div>

              <div className='stat-item'>
                <div className='stat-label'>Avg Purchase</div>
                <div className='stat-value'>
                  ${member.stats.averagePurchase}
                </div>
              </div>

              <div className='stat-item'>
                <div className='stat-label'>Total Purchases</div>
                <div className='stat-value'>
                  {member.stats.contentPurchases}
                </div>
              </div>
            </div>
          </div>


          {/* Activity & Preferences Card */}
          <div className='member-profile-card member-profile-activity-card'>
            <div className='member-profile-card-header'>
              <h3>
                <Activity size={18} />
                Activity & Preferences
              </h3>
            </div>

            <div className='activity-items'>
              <div className='activity-item'>
                <span className='item-label'>Activity Level</span>
                <span
                  className={`item-value activity-level-${member.stats.activityLevel.toLowerCase().replace(' ', '-')}`}
                >
                  {member.stats.activityLevel}
                </span>
              </div>

              <div className='activity-item'>
                <span className='item-label'>Response Rate</span>
                <span className='item-value'>{member.stats.responseRate}%</span>
              </div>

              <div className='activity-item'>
                <span className='item-label'>Favorite Category</span>
                <span className='item-value category-tag'>
                  {member.stats.favoriteCategory}
                </span>
              </div>

              <div className='activity-item'>
                <span className='item-label'>Preferred Content</span>
                <span className='item-value'>
                  {member.stats.preferredContent}
                </span>
              </div>

              <div className='activity-item'>
                <span className='item-label'>Member Since</span>
                <span className='item-value'>
                  {new Date(member.joinDate).toLocaleDateString()}
                </span>
              </div>

              <div className='activity-item'>
                <span className='item-label'>Tips Given</span>
                <span className='item-value'>
                  {member.interactions.tipsGiven}
                </span>
              </div>
            </div>
          </div>

          {/* Interaction History Card */}
          <div className='member-profile-card member-profile-interaction-card'>
            <div className='member-profile-card-header'>
              <h3>
                <Heart size={18} />
                Your Interactions
              </h3>
            </div>

            <div className='interaction-stats'>
              <div className='interaction-item'>
                <Package size={16} />
                <span>
                  {member.interactions.previousPurchases} purchases from you
                </span>
              </div>

              {member.interactions.hasSubscribed && (
                <div className='interaction-item subscribed'>
                  <Star size={16} />
                  <span>Subscribed to your content</span>
                </div>
              )}

              {member.interactions.lastPurchase && (
                <div className='interaction-item'>
                  <Clock size={16} />
                  <span>
                    Last purchase:{' '}
                    {new Date(
                      member.interactions.lastPurchase
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <div
            className='member-profile-modal-overlay'
            onClick={() => setShowMessageModal(false)}
          >
            <div
              className='member-profile-message-modal'
              onClick={e => e.stopPropagation()}
            >
              <div className='member-profile-modal-header'>
                <h3>Send a Personal Message</h3>
                <button
                  className='member-profile-close-modal-btn'
                  onClick={() => setShowMessageModal(false)}
                >
                  ×
                </button>
              </div>

              <div className='member-profile-modal-content'>
                <p className='member-profile-modal-description'>
                  Send a personalized message to {member.username}.
                  High-spenders appreciate personal attention!
                </p>

                <textarea
                  className='member-profile-message-textarea'
                  placeholder="Hi! I noticed you've been enjoying my content. I'd love to create something special just for you..."
                  value={specialOffer}
                  onChange={e => setSpecialOffer(e.target.value)}
                  maxLength={500}
                />

                <div className='member-profile-character-count'>
                  {specialOffer.length}/500
                </div>
              </div>

              <div className='member-profile-modal-actions'>
                <button
                  className='member-profile-cancel-btn'
                  onClick={() => setShowMessageModal(false)}
                >
                  Cancel
                </button>
                <button
                  className='member-profile-send-btn'
                  onClick={sendMessage}
                  disabled={!specialOffer.trim() || actionLoading}
                >
                  {actionLoading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <BottomQuickActions
          actions={[
            {
              id: 'chat',
              icon: <MessageCircle size={24} />,
              label: 'Open Chat',
              color: 'teal',
              description: 'Start chatting with this member',
              disabled: actionLoading,
              onClick: handleOpenChat,
            },
            {
              id: 'message',
              icon: <Send size={24} />,
              label: hasSentMessage ? 'Message Sent!' : 'Send Message',
              color: 'blue',
              description: 'Send a personal message',
              disabled: actionLoading,
              onClick: handleSayHi,
            },
            {
              id: 'poke',
              icon: <HandHeart size={24} />,
              label: hasPoked ? 'Poked!' : 'Poke',
              color: 'pink',
              description: 'Send a friendly poke',
              disabled: hasPoked || actionLoading,
              onClick: handlePoke,
            },
            {
              id: 'like',
              icon: <Heart size={24} />,
              label: hasLiked ? 'Liked!' : 'Like',
              color: 'red',
              description: 'Show appreciation',
              disabled: hasLiked || actionLoading,
              onClick: handleLike,
            },
          ]}
          onActionClick={(action) => action.onClick && action.onClick()}
          showHeader={true}
          title="Quick Actions"
          loading={false}
        />
      </div>
    </div>
  );
};

export default MemberProfile;
