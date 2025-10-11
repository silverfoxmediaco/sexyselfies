import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Calendar,
  Activity,
  Heart,
  MessageCircle,
  Gift,
  Star,
  Eye,
  Clock,
  MapPin,
  ChevronRight,
  Info,
  Package,
  Zap,
  Shield,
  RefreshCw,
  X,
  AlertCircle,
  HandHeart,
  Send,
  CreditCard,
  Sparkles,
  Crown,
  Flame,
  Diamond,
  Trophy,
  Target,
  BarChart3,
} from 'lucide-react';
import api from '../services/api.config';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import GiftContentModal from '../components/GiftContentModal';
import MemberCard from '../components/MemberCard';
import AnalyticsCards from '../components/AnalyticsCards';
import './BrowseMembers.css';

const BrowseMembers = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  // Core states for member discovery
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and view states
  const [viewMode, setViewMode] = useState('grid'); // grid, list, analytics
  const [showFilters, setShowFilters] = useState(false);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeToday: 0,
    highSpenders: 0,
    newThisWeek: 0,
    avgSpending: 0,
    topSpendingCategory: 'Photos',
  });

  // Filter configuration
  const [filters, setFilters] = useState({
    spendingTier: 'all',
    activityLevel: 'all',
    lastActive: 'all',
    hasSubscribed: 'all',
    contentPreference: 'all',
    joinedWithin: 'all',
    location: 'all',
    ageRange: [18, 65],
    sortBy: 'last-active',
  });

  // Action states
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkMessageModal, setBulkMessageModal] = useState(false);
  const [specialOfferModal, setSpecialOfferModal] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedMemberForGift, setSelectedMemberForGift] = useState(null);

  // Fetch members from API (production only)
  const fetchMembers = useCallback(async () => {
    console.log('🚀 [BrowseMembers] fetchMembers function started');
    console.log('   API object exists:', !!api);
    console.log('   API base URL:', api?.defaults?.baseURL);

    setLoading(true);
    setError(null);

    try {
      // Use the discover endpoint which returns high-value members
      const endpoint = '/creator/members/discover';
      console.log('🔍 [BrowseMembers] About to call API endpoint:', endpoint);
      console.log('   Full URL will be:', `${api?.defaults?.baseURL}${endpoint}`);
      console.log('   Auth token present:', !!localStorage.getItem('creatorToken'));
      console.log('   User role:', localStorage.getItem('userRole'));

      const response = await api.get(endpoint);

      console.log('📊 [BrowseMembers] Raw API response received:');
      console.log('   Response type:', typeof response);
      console.log('   Response keys:', Object.keys(response || {}));
      console.log('   Full response:', response);
      console.log('✅ Success property:', response?.success);
      console.log('👥 Members property:', response?.members);
      console.log('   Members array length:', response?.members?.length);

      if (response && response.success) {
        const membersData = response.members || [];
        console.log(`📈 [BrowseMembers] Processing ${membersData.length} members`);
        console.log('   First member sample:', membersData[0]);
        setMembers(membersData);
        setFilteredMembers(membersData);
        calculateAnalytics(membersData);
      } else {
        console.warn('⚠️ [BrowseMembers] API response success was false or missing');
        console.warn('   Full response structure:', response);
      }
    } catch (err) {
      console.error('❌ [BrowseMembers] Error in fetchMembers:');
      console.error('   Error type:', typeof err);
      console.error('   Error message:', err?.message);
      console.error('   Has response:', !!err?.response);
      console.error('   Response status:', err?.response?.status);
      console.error('   Response data:', err?.response?.data);
      console.error('   Full error object:', err);

      // Provide more specific error messages
      if (err.response?.status === 403) {
        setError('Creator verification required to browse members.');
      } else if (err.response?.status === 404) {
        setError('Members endpoint not found. Please check API configuration.');
      } else {
        setError('Failed to load members. Please try again.');
      }

      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate analytics from member data
  const calculateAnalytics = memberList => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.setDate(now.getDate() - 7));

    const activeToday = memberList.filter(
      m => new Date(m.lastActive) >= today
    ).length;

    const highSpenders = memberList.filter(
      m => m.spendingTier === 'whale' || m.spendingTier === 'high'
    ).length;

    const newThisWeek = memberList.filter(
      m => new Date(m.joinDate) >= weekAgo
    ).length;

    const totalSpending = memberList.reduce(
      (sum, m) => sum + (m.stats?.totalSpent || 0),
      0
    );

    setAnalytics({
      totalMembers: memberList.length,
      activeToday,
      highSpenders,
      newThisWeek,
      avgSpending:
        memberList.length > 0
          ? (totalSpending / memberList.length).toFixed(2)
          : 0,
      topSpendingCategory: 'Photos',
    });
  };

  // Apply filters to members
  const applyFilters = useCallback(() => {
    let filtered = [...members];

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.spendingTier !== 'all') {
      filtered = filtered.filter(m => m.spendingTier === filters.spendingTier);
    }

    if (filters.activityLevel !== 'all') {
      filtered = filtered.filter(
        m => m.activity?.engagementLevel === filters.activityLevel
      );
    }

    if (filters.lastActive !== 'all') {
      const now = new Date();
      let cutoff;

      switch (filters.lastActive) {
        case 'today':
          cutoff = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoff = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      if (cutoff) {
        filtered = filtered.filter(m => new Date(m.lastActive) >= cutoff);
      }
    }

    if (filters.hasSubscribed !== 'all') {
      const hasSubscribed = filters.hasSubscribed === 'yes';
      filtered = filtered.filter(
        m => m.activity?.hasSubscribed === hasSubscribed
      );
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'spending':
          return (b.stats?.totalSpent || 0) - (a.stats?.totalSpent || 0);
        case 'last-active':
          return new Date(b.lastActive) - new Date(a.lastActive);
        case 'join-date':
          return new Date(b.joinDate) - new Date(a.joinDate);
        case 'engagement':
          return (
            (b.stats?.messagesExchanged || 0) -
            (a.stats?.messagesExchanged || 0)
          );
        default:
          return 0;
      }
    });

    setFilteredMembers(filtered);
  }, [members, filters, searchQuery]);

  // Get spending tier details
  const getSpendingTierInfo = tier => {
    switch (tier) {
      case 'whale':
        return {
          label: 'Whale',
          color: '#FFD700',
          icon: <Diamond size={16} />,
          description: 'Top spender',
        };
      case 'high':
        return {
          label: 'VIP',
          color: '#8B5CF6',
          icon: <Crown size={16} />,
          description: 'High value',
        };
      case 'medium':
        return {
          label: 'Regular',
          color: '#3B82F6',
          icon: <Star size={16} />,
          description: 'Consistent',
        };
      case 'low':
        return {
          label: 'Explorer',
          color: '#10B981',
          icon: <Zap size={16} />,
          description: 'Browsing',
        };
      default:
        return {
          label: 'New',
          color: '#6B7280',
          icon: <Users size={16} />,
          description: 'Just joined',
        };
    }
  };

  // Get activity status
  const getActivityStatus = (lastActive, isOnline) => {
    if (isOnline) return { text: 'Online now', color: '#10B981', pulse: true };

    const now = new Date();
    const active = new Date(lastActive);
    const diffMs = now - active;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return { text: `${diffMins}m ago`, color: '#10B981' };
    if (diffHours < 24) return { text: `${diffHours}h ago`, color: '#F59E0B' };
    if (diffDays < 7) return { text: `${diffDays}d ago`, color: '#6B7280' };
    return { text: `${diffDays}d ago`, color: '#6B7280' };
  };

  // Handle member selection
  const handleSelectMember = member => {
    setSelectedMember(member);
    setShowMemberProfile(true);
  };

  // Handle bulk selection
  const toggleMemberSelection = memberId => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  // Send message to member
  const sendMessageToMember = async (memberId, message) => {
    setSendingMessage(true);
    try {
      console.log('🔧 [sendMessageToMember] Starting message send process:', { memberId, message });

      // Step 1: Find or create connection
      console.log('📝 [sendMessageToMember] Step 1: Find or create connection');
      const connectionResponse = await api.post('/creator/connections/find-or-create', {
        memberId: memberId
      });

      if (!connectionResponse.success || !connectionResponse.connection) {
        throw new Error('Failed to create connection');
      }

      const connectionId = connectionResponse.connection.id;
      console.log('✅ [sendMessageToMember] Connection ready:', connectionId);

      // Step 2: Send message using the connection
      console.log('💬 [sendMessageToMember] Step 2: Sending message with connection');
      const messageResponse = await api.post('/creator/messages', {
        connectionId: connectionId,
        content: message,
        mediaType: null,
        mediaUrl: null,
        price: 0
      });

      if (messageResponse.success) {
        console.log('✅ [sendMessageToMember] Message sent successfully');
        alert('Message sent successfully!');
      } else {
        throw new Error('Failed to send message');
      }

    } catch (err) {
      console.error('Error sending message:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle gift modal open
  const handleOpenGiftModal = (member) => {
    setSelectedMemberForGift(member);
    setGiftModalOpen(true);
  };

  // Handle gift sent successfully
  const handleGiftSent = (giftData) => {
    console.log('Gift sent successfully:', giftData);
    // Show success message
    alert(`🎁 Gift sent successfully to @${giftData.member.username}!`);
    // Could also update member stats here if needed
  };

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, applyFilters]);

  // Initial load
  useEffect(() => {
    console.log('🎯 [BrowseMembers] useEffect running - calling fetchMembers');
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div className='browse-members-page'>
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      <div className='discovery-container'>
        {/* Analytics Cards */}
        <AnalyticsCards
          stats={{
            totalMembers: analytics.totalMembers,
            activeToday: analytics.activeToday,
            highSpenders: analytics.highSpenders,
            newThisWeek: analytics.newThisWeek,
            avgSpending: analytics.avgSpending
          }}
          loading={loading}
          onCardClick={(cardId, cardData) => {
            console.log('Analytics card clicked:', cardId, cardData);
            // Handle card click for drill-down functionality
          }}
        />

        {/* Search and Actions Bar */}
        <div className='search-section'>
          <div className='search-bar'>
            <Search size={20} />
            <input
              type='text'
              placeholder='Search members by username...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className='action-buttons-row'>
            <button
              className='view-toggle-btn'
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>

            <button
              className='filter-btn'
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              <span>Filters</span>
              {Object.entries(filters).some(([key, value]) => {
                if (key === 'ageRange') {
                  return value[0] !== 18 || value[1] !== 65;
                }
                if (key === 'sortBy') {
                  return value !== 'last-active';
                }
                return value !== 'all';
              }) && <span className='filter-badge'>Active</span>}
            </button>
          </div>

          {selectedMembers.length > 0 && (
            <div className='bulk-actions'>
              <span>{selectedMembers.length} selected</span>
              <button
                className='bulk-message-btn'
                onClick={() => setBulkMessageModal(true)}
              >
                <MessageCircle size={16} />
                <span>Send Bulk Message</span>
              </button>
              <button
                className='bulk-offer-btn'
                onClick={() => setSpecialOfferModal(true)}
              >
                <Gift size={16} />
                <span>Special Offer</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className='filters-panel'
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className='filters-grid'>
                <div className='filter-group'>
                  <label>Spending Tier</label>
                  <select
                    value={filters.spendingTier}
                    onChange={e =>
                      setFilters({ ...filters, spendingTier: e.target.value })
                    }
                  >
                    <option value='all'>All Tiers</option>
                    <option value='whale'>Whale ($500+/mo)</option>
                    <option value='high'>VIP ($200-500/mo)</option>
                    <option value='medium'>Regular ($50-200/mo)</option>
                    <option value='low'>Explorer (&lt;$50/mo)</option>
                  </select>
                </div>

                <div className='filter-group'>
                  <label>Activity Level</label>
                  <select
                    value={filters.activityLevel}
                    onChange={e =>
                      setFilters({ ...filters, activityLevel: e.target.value })
                    }
                  >
                    <option value='all'>All Levels</option>
                    <option value='very-active'>Very Active</option>
                    <option value='active'>Active</option>
                    <option value='moderate'>Moderate</option>
                    <option value='inactive'>Inactive</option>
                  </select>
                </div>

                <div className='filter-group'>
                  <label>Last Active</label>
                  <select
                    value={filters.lastActive}
                    onChange={e =>
                      setFilters({ ...filters, lastActive: e.target.value })
                    }
                  >
                    <option value='all'>Any Time</option>
                    <option value='today'>Today</option>
                    <option value='week'>This Week</option>
                    <option value='month'>This Month</option>
                  </select>
                </div>

                <div className='filter-group'>
                  <label>Subscription Status</label>
                  <select
                    value={filters.hasSubscribed}
                    onChange={e =>
                      setFilters({ ...filters, hasSubscribed: e.target.value })
                    }
                  >
                    <option value='all'>All Members</option>
                    <option value='yes'>Subscribed</option>
                    <option value='no'>Not Subscribed</option>
                  </select>
                </div>

                <div className='filter-group'>
                  <label>Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={e =>
                      setFilters({ ...filters, sortBy: e.target.value })
                    }
                  >
                    <option value='last-active'>Last Active</option>
                    <option value='spending'>Total Spending</option>
                    <option value='join-date'>Join Date</option>
                    <option value='engagement'>Engagement</option>
                  </select>
                </div>

                <button
                  className='reset-filters-btn'
                  onClick={() => {
                    setFilters({
                      spendingTier: 'all',
                      activityLevel: 'all',
                      lastActive: 'all',
                      hasSubscribed: 'all',
                      contentPreference: 'all',
                      joinedWithin: 'all',
                      location: 'all',
                      ageRange: [18, 65],
                      sortBy: 'last-active',
                    });
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members Grid/List */}
        <div className='members-content'>
          {loading ? (
            <div className='loading-state'>
              <div className='loading-spinner'></div>
              <p>Loading members...</p>
            </div>
          ) : error ? (
            <div className='error-state'>
              <AlertCircle size={48} />
              <h3>Error loading members</h3>
              <p>{error}</p>
              <button onClick={fetchMembers}>Try Again</button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className='empty-state'>
              <Users size={48} />
              <h3>No members found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <div className={`members-${viewMode}`}>
              {filteredMembers.map(member => {
                // Transform member data to match MemberCard expected structure
                const transformedMember = {
                  id: member.id,
                  username: member.username,
                  lastActive: member.lastActive,
                  tier: getSpendingTierInfo(member.spendingTier).label,
                  isNew: member.badges?.includes('newcomer') || false,
                  stats: {
                    monthlySpend: member.stats?.last30DaySpend || 0,
                    totalPurchases: member.stats?.contentPurchases || 0,
                    messageCount: member.stats?.messagesExchanged || 0,
                    tipTotal: member.stats?.tipsGiven || 0
                  },
                  badges: member.badges || []
                };

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MemberCard
                      member={transformedMember}
                      isSelected={selectedMembers.includes(member.id)}
                      onSelect={() => toggleMemberSelection(member.id)}
                      onMessage={(memberData) => {
                        sendMessageToMember(
                          memberData.id,
                          'Hi! Thanks for being an amazing supporter! 💕'
                        );
                      }}
                      onGift={(memberData) => {
                        handleOpenGiftModal(member);
                      }}
                      onView={(memberData) => {
                        handleSelectMember(member);
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Member Profile Modal */}
        <AnimatePresence>
          {showMemberProfile && selectedMember && (
            <motion.div
              className='member-profile-modal-overlay'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMemberProfile(false)}
            >
              <motion.div
                className='member-profile-modal'
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className='modal-header'>
                  <h2>Member Profile</h2>
                  <button onClick={() => setShowMemberProfile(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className='modal-content'>
                  <div className='profile-section'>
                    <h3>{selectedMember.username}</h3>
                    <div className='profile-tier'>
                      {getSpendingTierInfo(selectedMember.spendingTier).icon}
                      <span>
                        {getSpendingTierInfo(selectedMember.spendingTier).label}{' '}
                        Member
                      </span>
                    </div>
                  </div>

                  <div className='profile-stats-detailed'>
                    <h4>Spending Analytics</h4>
                    <div className='stats-grid'>
                      <div className='stat-item'>
                        <span className='stat-label'>Total Spent</span>
                        <span className='stat-value'>
                          ${selectedMember.stats.totalSpent}
                        </span>
                      </div>
                      <div className='stat-item'>
                        <span className='stat-label'>Last 30 Days</span>
                        <span className='stat-value'>
                          ${selectedMember.stats.last30DaySpend}
                        </span>
                      </div>
                      <div className='stat-item'>
                        <span className='stat-label'>Average Purchase</span>
                        <span className='stat-value'>
                          ${selectedMember.stats.averagePurchase}
                        </span>
                      </div>
                      <div className='stat-item'>
                        <span className='stat-label'>Content Purchases</span>
                        <span className='stat-value'>
                          {selectedMember.stats.contentPurchases}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='profile-preferences'>
                    <h4>Preferences</h4>
                  </div>

                  <div className='profile-activity'>
                    <h4>Activity</h4>
                    <div className='activity-items'>
                      <div className='activity-item'>
                        <Clock size={16} />
                        <span>
                          Last Purchase:{' '}
                          {new Date(
                            selectedMember.activity.lastPurchase
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='activity-item'>
                        <TrendingUp size={16} />
                        <span>
                          Purchase Frequency:{' '}
                          {selectedMember.activity.purchaseFrequency}
                        </span>
                      </div>
                      <div className='activity-item'>
                        <Activity size={16} />
                        <span>
                          Engagement: {selectedMember.activity.engagementLevel}
                        </span>
                      </div>
                      {selectedMember.activity.hasSubscribed && (
                        <div className='activity-item'>
                          <Star size={16} />
                          <span>
                            Subscription:{' '}
                            {selectedMember.activity.subscriptionTier}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className='modal-actions'>
                  <button className='send-message-btn'>
                    <MessageCircle size={18} />
                    <span>Send Personal Message</span>
                  </button>
                  <button
                    className='special-offer-btn'
                    onClick={() => handleOpenGiftModal(selectedMember)}
                  >
                    <Gift size={18} />
                    <span>Send Gift</span>
                  </button>
                  <button className='view-history-btn'>
                    <Clock size={18} />
                    <span>View Purchase History</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift Content Modal */}
        <GiftContentModal
          isOpen={giftModalOpen}
          onClose={() => {
            setGiftModalOpen(false);
            setSelectedMemberForGift(null);
          }}
          member={selectedMemberForGift}
          onGiftSent={handleGiftSent}
        />
      </div>

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default BrowseMembers;
