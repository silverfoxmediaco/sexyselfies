import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, DollarSign, TrendingUp, Filter, Search,
  Calendar, Activity, Heart, MessageCircle, Gift,
  Star, Eye, Clock, MapPin, ChevronRight, Info,
  Package, Zap, Shield, RefreshCw, X, AlertCircle,
  HandHeart, Send, CreditCard, Sparkles, Crown,
  Flame, Diamond, Trophy, Target, BarChart3
} from 'lucide-react';
import api from '../services/api.config';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
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
    topSpendingCategory: 'Photos'
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
    sortBy: 'last-active'
  });
  
  // Action states
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkMessageModal, setBulkMessageModal] = useState(false);
  const [specialOfferModal, setSpecialOfferModal] = useState(false);


  // Fetch members from API (production only)
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the discover endpoint which returns high-value members
      console.log('🔍 Fetching members from /creator/members/discover');
      const response = await api.get('/creator/members/discover');
      
      console.log('📊 API Response:', response);
      console.log('✅ Success:', response.success);
      console.log('👥 Members:', response.members);
      
      if (response.success) {
        const membersData = response.members || [];
        console.log(`📈 Found ${membersData.length} members`);
        setMembers(membersData);
        setFilteredMembers(membersData);
        calculateAnalytics(membersData);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      console.log('Error details:', err.response?.data);
      
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
  const calculateAnalytics = (memberList) => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    
    const activeToday = memberList.filter(m => 
      new Date(m.lastActive) >= today
    ).length;
    
    const highSpenders = memberList.filter(m => 
      m.spendingTier === 'whale' || m.spendingTier === 'high'
    ).length;
    
    const newThisWeek = memberList.filter(m => 
      new Date(m.joinDate) >= weekAgo
    ).length;
    
    const totalSpending = memberList.reduce((sum, m) => 
      sum + (m.stats?.totalSpent || 0), 0
    );
    
    setAnalytics({
      totalMembers: memberList.length,
      activeToday,
      highSpenders,
      newThisWeek,
      avgSpending: memberList.length > 0 ? (totalSpending / memberList.length).toFixed(2) : 0,
      topSpendingCategory: 'Photos'
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
      filtered = filtered.filter(m => 
        m.activity?.engagementLevel === filters.activityLevel
      );
    }
    
    if (filters.lastActive !== 'all') {
      const now = new Date();
      let cutoff;
      
      switch(filters.lastActive) {
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
      filtered = filtered.filter(m => m.activity?.hasSubscribed === hasSubscribed);
    }
    
    filtered.sort((a, b) => {
      switch(filters.sortBy) {
        case 'spending':
          return (b.stats?.totalSpent || 0) - (a.stats?.totalSpent || 0);
        case 'last-active':
          return new Date(b.lastActive) - new Date(a.lastActive);
        case 'join-date':
          return new Date(b.joinDate) - new Date(a.joinDate);
        case 'engagement':
          return (b.stats?.messagesExchanged || 0) - (a.stats?.messagesExchanged || 0);
        default:
          return 0;
      }
    });
    
    setFilteredMembers(filtered);
  }, [members, filters, searchQuery]);

  // Get spending tier details
  const getSpendingTierInfo = (tier) => {
    switch(tier) {
      case 'whale':
        return { 
          label: 'Whale', 
          color: '#FFD700', 
          icon: <Diamond size={16} />,
          description: 'Top spender'
        };
      case 'high':
        return { 
          label: 'VIP', 
          color: '#8B5CF6', 
          icon: <Crown size={16} />,
          description: 'High value'
        };
      case 'medium':
        return { 
          label: 'Regular', 
          color: '#3B82F6', 
          icon: <Star size={16} />,
          description: 'Consistent'
        };
      case 'low':
        return { 
          label: 'Explorer', 
          color: '#10B981', 
          icon: <Zap size={16} />,
          description: 'Browsing'
        };
      default:
        return { 
          label: 'New', 
          color: '#6B7280', 
          icon: <Users size={16} />,
          description: 'Just joined'
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
  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setShowMemberProfile(true);
  };

  // Handle bulk selection
  const toggleMemberSelection = (memberId) => {
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
      await api.post('/creator/messages', {
        recipientId: memberId,
        message: message,
        type: 'personal'
      });
      
      alert('Message sent successfully!');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };


  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, applyFilters]);

  // Initial load
  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="browse-members-page">
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      <div className="discovery-container">
        {/* Analytics Cards */}
        <div className="analytics-cards">
          <div className="analytics-card">
            <div className="analytics-icon">
              <Users size={20} />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.totalMembers}</div>
              <div className="analytics-label">Total Members</div>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon active">
              <Activity size={20} />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.activeToday}</div>
              <div className="analytics-label">Active Today</div>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon premium">
              <Diamond size={20} />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.highSpenders}</div>
              <div className="analytics-label">High Spenders</div>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon new">
              <Sparkles size={20} />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{analytics.newThisWeek}</div>
              <div className="analytics-label">New This Week</div>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon money">
              <DollarSign size={20} />
            </div>
            <div className="analytics-content">
              <div className="analytics-value">${analytics.avgSpending}</div>
              <div className="analytics-label">Avg Spending</div>
            </div>
          </div>
        </div>
        
        {/* Search and Actions Bar */}
        <div className="search-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search members by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="action-buttons-row">
            <button 
              className="view-toggle-btn"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
            
            <button 
              className="filter-btn"
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
              }) && (
                <span className="filter-badge">Active</span>
              )}
            </button>
          </div>
          
          {selectedMembers.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedMembers.length} selected</span>
              <button 
                className="bulk-message-btn"
                onClick={() => setBulkMessageModal(true)}
              >
                <MessageCircle size={16} />
                <span>Send Bulk Message</span>
              </button>
              <button 
                className="bulk-offer-btn"
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
              className="filters-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Spending Tier</label>
                  <select 
                    value={filters.spendingTier}
                    onChange={(e) => setFilters({...filters, spendingTier: e.target.value})}
                  >
                    <option value="all">All Tiers</option>
                    <option value="whale">Whale ($500+/mo)</option>
                    <option value="high">VIP ($200-500/mo)</option>
                    <option value="medium">Regular ($50-200/mo)</option>
                    <option value="low">Explorer (&lt;$50/mo)</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Activity Level</label>
                  <select 
                    value={filters.activityLevel}
                    onChange={(e) => setFilters({...filters, activityLevel: e.target.value})}
                  >
                    <option value="all">All Levels</option>
                    <option value="very-active">Very Active</option>
                    <option value="active">Active</option>
                    <option value="moderate">Moderate</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Last Active</label>
                  <select 
                    value={filters.lastActive}
                    onChange={(e) => setFilters({...filters, lastActive: e.target.value})}
                  >
                    <option value="all">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Subscription Status</label>
                  <select 
                    value={filters.hasSubscribed}
                    onChange={(e) => setFilters({...filters, hasSubscribed: e.target.value})}
                  >
                    <option value="all">All Members</option>
                    <option value="yes">Subscribed</option>
                    <option value="no">Not Subscribed</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Sort By</label>
                  <select 
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  >
                    <option value="last-active">Last Active</option>
                    <option value="spending">Total Spending</option>
                    <option value="join-date">Join Date</option>
                    <option value="engagement">Engagement</option>
                  </select>
                </div>
                
                <button 
                  className="reset-filters-btn"
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
                      sortBy: 'last-active'
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
        <div className="members-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading members...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={48} />
              <h3>Error loading members</h3>
              <p>{error}</p>
              <button onClick={fetchMembers}>Try Again</button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No members found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <div className={`members-${viewMode}`}>
              {filteredMembers.map((member) => {
                const tierInfo = getSpendingTierInfo(member.spendingTier);
                const activityStatus = getActivityStatus(member.lastActive, member.isOnline);
                
                return (
                  <motion.div 
                    key={member.id}
                    className="member-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleSelectMember(member)}
                  >
                    {/* Selection Checkbox */}
                    <div 
                      className="selection-checkbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMemberSelection(member.id);
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => {}}
                      />
                    </div>
                    
                    {/* Member Header - NO AVATAR */}
                    <div className="member-header">
                      <div className="member-identity">
                        <h3 className="member-username">
                          {member.username}
                          {member.isOnline && <span className="online-indicator pulse"></span>}
                        </h3>
                        <div className="member-status">
                          <span 
                            className="activity-status"
                            style={{ color: activityStatus.color }}
                          >
                            {activityStatus.text}
                          </span>
                        </div>
                      </div>
                      
                      <div className="member-tier" style={{ color: tierInfo.color }}>
                        {tierInfo.icon}
                        <span>{tierInfo.label}</span>
                      </div>
                    </div>
                    
                    {/* Member Stats */}
                    <div className="member-stats">
                      <div className="stat-row">
                        <div className="stat">
                          <DollarSign size={14} />
                          <span className="stat-label">30d:</span>
                          <span className="stat-value">${member.stats.last30DaySpend}</span>
                        </div>
                        <div className="stat">
                          <Package size={14} />
                          <span className="stat-label">Total:</span>
                          <span className="stat-value">{member.stats.contentPurchases}</span>
                        </div>
                      </div>
                      
                      <div className="stat-row">
                        <div className="stat">
                          <MessageCircle size={14} />
                          <span className="stat-label">Messages:</span>
                          <span className="stat-value">{member.stats.messagesExchanged}</span>
                        </div>
                        <div className="stat">
                          <Gift size={14} />
                          <span className="stat-label">Tips:</span>
                          <span className="stat-value">{member.stats.tipsGiven}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Member Badges */}
                    {member.badges && member.badges.length > 0 && (
                      <div className="member-badges">
                        {member.badges.map((badge, index) => (
                          <span key={index} className={`member-badge member-badge-${badge}`}>
                            {badge === 'whale' && <Diamond size={12} />}
                            {badge === 'vip' && <Crown size={12} />}
                            {badge === 'loyal-fan' && <Heart size={12} />}
                            {badge === 'big-spender' && <DollarSign size={12} />}
                            {badge === 'top-supporter' && <Trophy size={12} />}
                            {badge === 'newcomer' && <Sparkles size={12} />}
                            {badge === 'supporter' && <Star size={12} />}
                            {badge === 'engaged' && <Zap size={12} />}
                            {badge === 'night-owl' && <Flame size={12} />}
                            {badge === 'regular' && <Shield size={12} />}
                            <span>{badge.replace('-', ' ')}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="member-actions">
                      <button 
                        className="action-btn message-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendMessageToMember(member.id, 'Hi! Thanks for being an amazing supporter! 💕');
                        }}
                      >
                        <MessageCircle size={16} />
                        <span>Message</span>
                      </button>
                      
                      <button 
                        className="action-btn offer-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open special offer modal for this member
                        }}
                      >
                        <Gift size={16} />
                        <span>Offer</span>
                      </button>
                      
                      <button 
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMember(member);
                        }}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </div>
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
              className="member-profile-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMemberProfile(false)}
            >
              <motion.div 
                className="member-profile-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Member Profile</h2>
                  <button onClick={() => setShowMemberProfile(false)}>
                    <X size={24} />
                  </button>
                </div>
                
                <div className="modal-content">
                  <div className="profile-section">
                    <h3>{selectedMember.username}</h3>
                    <div className="profile-tier">
                      {getSpendingTierInfo(selectedMember.spendingTier).icon}
                      <span>{getSpendingTierInfo(selectedMember.spendingTier).label} Member</span>
                    </div>
                  </div>
                  
                  <div className="profile-stats-detailed">
                    <h4>Spending Analytics</h4>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">Total Spent</span>
                        <span className="stat-value">${selectedMember.stats.totalSpent}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Last 30 Days</span>
                        <span className="stat-value">${selectedMember.stats.last30DaySpend}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Average Purchase</span>
                        <span className="stat-value">${selectedMember.stats.averagePurchase}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Content Purchases</span>
                        <span className="stat-value">{selectedMember.stats.contentPurchases}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="profile-preferences">
                    <h4>Preferences</h4>
                  </div>
                  
                  <div className="profile-activity">
                    <h4>Activity</h4>
                    <div className="activity-items">
                      <div className="activity-item">
                        <Clock size={16} />
                        <span>Last Purchase: {new Date(selectedMember.activity.lastPurchase).toLocaleDateString()}</span>
                      </div>
                      <div className="activity-item">
                        <TrendingUp size={16} />
                        <span>Purchase Frequency: {selectedMember.activity.purchaseFrequency}</span>
                      </div>
                      <div className="activity-item">
                        <Activity size={16} />
                        <span>Engagement: {selectedMember.activity.engagementLevel}</span>
                      </div>
                      {selectedMember.activity.hasSubscribed && (
                        <div className="activity-item">
                          <Star size={16} />
                          <span>Subscription: {selectedMember.activity.subscriptionTier}</span>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="send-message-btn">
                    <MessageCircle size={18} />
                    <span>Send Personal Message</span>
                  </button>
                  <button className="special-offer-btn">
                    <Gift size={18} />
                    <span>Create Special Offer</span>
                  </button>
                  <button className="view-history-btn">
                    <Clock size={18} />
                    <span>View Purchase History</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default BrowseMembers;