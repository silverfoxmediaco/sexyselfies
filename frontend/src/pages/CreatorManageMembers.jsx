import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Search, Filter, Star, DollarSign, Calendar,
  MapPin, Eye, MessageCircle, Gift, MoreHorizontal,
  TrendingUp, Clock, Award, Zap, SortAsc, SortDesc,
  UserPlus, ChevronRight, Activity, Crown, Heart
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import api from '../services/api.config';
import './CreatorManageMembers.css';

const CreatorManageMembers = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    avgSpending: 0
  });
  const [loading, setLoading] = useState(true);

  const filterOptions = [
    { value: 'all', label: 'All Members' },
    { value: 'premium', label: 'Premium' },
    { value: 'active', label: 'Active' },
    { value: 'high-spenders', label: 'High Spenders' },
    { value: 'recent', label: 'Recently Joined' }
  ];

  const sortOptions = [
    { value: 'totalSpent', label: 'Total Spent' },
    { value: 'lastActive', label: 'Last Active' },
    { value: 'joinedDate', label: 'Join Date' },
    { value: 'name', label: 'Name' }
  ];

  useEffect(() => {
    loadMembers();
  }, [sortBy, sortOrder, filterBy]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const isDevelopment = import.meta.env.DEV || localStorage.getItem('token') === 'dev-token-12345';
      
      if (isDevelopment) {
        // Mock data for member management
        const mockStats = {
          totalMembers: 347,
          activeMembers: 89,
          totalRevenue: 12450.75,
          avgSpending: 35.85
        };

        const mockMembers = [
          {
            id: 1,
            name: 'Sarah Williams',
            avatar: null,
            age: 28,
            location: 'New York, NY',
            joinedDate: '2024-01-15',
            lastActive: '5 min ago',
            isOnline: true,
            isPremium: true,
            totalSpent: 1245.50,
            purchasesCount: 23,
            rating: 5,
            tier: 'VIP',
            favoriteContent: 'Photos',
            lastPurchase: '2 hours ago',
            status: 'active'
          },
          {
            id: 2,
            name: 'Michael Chen',
            avatar: null,
            age: 32,
            location: 'Los Angeles, CA',
            joinedDate: '2024-01-12',
            lastActive: '2 hours ago',
            isOnline: false,
            isPremium: false,
            totalSpent: 567.25,
            purchasesCount: 12,
            rating: 4,
            tier: 'Regular',
            favoriteContent: 'Videos',
            lastPurchase: '1 day ago',
            status: 'active'
          },
          {
            id: 3,
            name: 'Jessica Taylor',
            avatar: null,
            age: 26,
            location: 'Chicago, IL',
            joinedDate: '2024-01-10',
            lastActive: '1 day ago',
            isOnline: false,
            isPremium: true,
            totalSpent: 2340.00,
            purchasesCount: 45,
            rating: 5,
            tier: 'VIP',
            favoriteContent: 'Custom Content',
            lastPurchase: '3 hours ago',
            status: 'active'
          },
          {
            id: 4,
            name: 'David Rodriguez',
            avatar: null,
            age: 35,
            location: 'Miami, FL',
            joinedDate: '2024-01-08',
            lastActive: '3 days ago',
            isOnline: false,
            isPremium: false,
            totalSpent: 89.75,
            purchasesCount: 3,
            rating: 3,
            tier: 'New',
            favoriteContent: 'Messages',
            lastPurchase: '1 week ago',
            status: 'inactive'
          },
          {
            id: 5,
            name: 'Emma Johnson',
            avatar: null,
            age: 29,
            location: 'Seattle, WA',
            joinedDate: '2024-01-05',
            lastActive: '1 hour ago',
            isOnline: true,
            isPremium: true,
            totalSpent: 890.25,
            purchasesCount: 18,
            rating: 5,
            tier: 'Premium',
            favoriteContent: 'Live Shows',
            lastPurchase: '30 min ago',
            status: 'active'
          },
          {
            id: 6,
            name: 'James Wilson',
            avatar: null,
            age: 31,
            location: 'Austin, TX',
            joinedDate: '2024-01-03',
            lastActive: '12 hours ago',
            isOnline: false,
            isPremium: true,
            totalSpent: 1567.50,
            purchasesCount: 31,
            rating: 4,
            tier: 'VIP',
            favoriteContent: 'Photos',
            lastPurchase: '4 hours ago',
            status: 'active'
          }
        ];

        setTimeout(() => {
          setStats(mockStats);
          setMembers(mockMembers);
          setLoading(false);
          console.log('DEV MODE: Using mock members data');
        }, 800);
      } else {
        const response = await api.get('/creator/members');
        setStats(response.stats);
        setMembers(response.members);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setLoading(false);
    }
  };

  const filteredAndSortedMembers = members
    .filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'premium' && member.isPremium) ||
                           (filterBy === 'active' && member.status === 'active') ||
                           (filterBy === 'high-spenders' && member.totalSpent > 500) ||
                           (filterBy === 'recent' && new Date(member.joinedDate) > new Date('2024-01-10'));
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'totalSpent':
          comparison = a.totalSpent - b.totalSpent;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'joinedDate':
          comparison = new Date(a.joinedDate) - new Date(b.joinedDate);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'VIP': return 'tier-vip';
      case 'Premium': return 'tier-premium';
      case 'Regular': return 'tier-regular';
      case 'New': return 'tier-new';
      default: return 'tier-regular';
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="members-loading">
        <div className="loading-spinner"></div>
        <p>Loading your members...</p>
      </div>
    );
  }

  return (
    <div className="creator-manage-members">
      {/* Header */}
      <div className="members-header">
        <div className="members-header-content">
          <h1>
            <Users size={24} />
            Manage Members
          </h1>
          <div className="members-header-actions">
            <button
              className="members-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="members-overview">
        <div className="members-stats-grid">
          <motion.div 
            className="members-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="members-stat-icon total">
              <Users size={20} />
            </div>
            <div className="members-stat-content">
              <span className="members-stat-value">{stats.totalMembers}</span>
              <span className="members-stat-label">Total Members</span>
            </div>
          </motion.div>

          <motion.div 
            className="members-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="members-stat-icon active">
              <Activity size={20} />
            </div>
            <div className="members-stat-content">
              <span className="members-stat-value">{stats.activeMembers}</span>
              <span className="members-stat-label">Active Members</span>
            </div>
          </motion.div>

          <motion.div 
            className="members-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="members-stat-icon revenue">
              <DollarSign size={20} />
            </div>
            <div className="members-stat-content">
              <span className="members-stat-value">{formatCurrency(stats.totalRevenue)}</span>
              <span className="members-stat-label">Total Revenue</span>
            </div>
          </motion.div>

          <motion.div 
            className="members-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="members-stat-icon average">
              <TrendingUp size={20} />
            </div>
            <div className="members-stat-content">
              <span className="members-stat-value">{formatCurrency(stats.avgSpending)}</span>
              <span className="members-stat-label">Avg Spending</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="members-controls">
        <div className="members-search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="members-filters">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="members-filter-select"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="members-sort-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                Sort by {option.label}
              </option>
            ))}
          </select>

          <button
            className="members-sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="members-list">
        {filteredAndSortedMembers.length === 0 ? (
          <div className="members-empty">
            <Users size={64} />
            <h3>No members found</h3>
            <p>Start connecting with members to see them here!</p>
          </div>
        ) : (
          filteredAndSortedMembers.map((member, index) => (
            <motion.div
              key={member.id}
              className="members-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/creator/member/${member.id}`)}
            >
              <div className="members-avatar">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} />
                ) : (
                  <div className="members-avatar-placeholder">
                    {member.name.charAt(0)}
                  </div>
                )}
                {member.isOnline && <div className="members-online-indicator"></div>}
                {member.isPremium && (
                  <div className="members-premium-badge">
                    <Crown size={12} />
                  </div>
                )}
              </div>

              <div className="members-info">
                <div className="members-main-info">
                  <div className="members-name-section">
                    <h3>{member.name}</h3>
                    <div className={`members-tier-badge ${getTierBadgeClass(member.tier)}`}>
                      {member.tier}
                    </div>
                    <div className="members-rating">
                      {getRatingStars(member.rating)}
                    </div>
                  </div>
                  <div className="members-meta">
                    <span className="members-age">{member.age}</span>
                    <span className="members-location">
                      <MapPin size={12} />
                      {member.location}
                    </span>
                  </div>
                </div>

                <div className="members-stats-row">
                  <div className="members-spent">
                    <DollarSign size={14} />
                    <span className="amount">{formatCurrency(member.totalSpent)}</span>
                    <span className="count">({member.purchasesCount} purchases)</span>
                  </div>
                  <div className="members-activity">
                    <Clock size={14} />
                    <span>Last active: {member.lastActive}</span>
                  </div>
                </div>

                <div className="members-details-row">
                  <div className="members-joined">
                    <Calendar size={14} />
                    <span>Joined {member.joinedDate}</span>
                  </div>
                  <div className="members-favorite">
                    <Heart size={14} />
                    <span>Loves: {member.favoriteContent}</span>
                  </div>
                </div>
              </div>

              <div className="members-actions">
                <button 
                  className="members-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/creator/chat/${member.id}`);
                  }}
                >
                  <MessageCircle size={18} />
                </button>
                <button 
                  className="members-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle send offer
                  }}
                >
                  <Gift size={18} />
                </button>
                <button 
                  className="members-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle more actions
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>
                <ChevronRight size={20} className="members-chevron" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="members-quick-actions">
        <h3>Quick Actions</h3>
        <div className="members-actions-grid">
          <motion.button
            className="members-quick-action-btn"
            onClick={() => navigate('/creator/analytics')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <TrendingUp size={20} />
            <span>View Analytics</span>
          </motion.button>

          <motion.button
            className="members-quick-action-btn"
            onClick={() => navigate('/creator/content-upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus size={20} />
            <span>Invite Members</span>
          </motion.button>

          <motion.button
            className="members-quick-action-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Award size={20} />
            <span>Member Rewards</span>
          </motion.button>

          <motion.button
            className="members-quick-action-btn"
            onClick={() => navigate('/creator/earnings')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap size={20} />
            <span>Boost Earnings</span>
          </motion.button>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorManageMembers;