import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, MessageCircle, Search, Filter, Star, Heart,
  Clock, ChevronRight, Eye, Gift, DollarSign, Calendar,
  MapPin, TrendingUp, Camera, MoreHorizontal
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import api from '../services/api.config';
import './CreatorConnections.css';

const CreatorConnections = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [connections, setConnections] = useState([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    activeChats: 0,
    totalEarnings: 0,
    avgResponse: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'All Matches', icon: Users },
    { id: 'active', label: 'Active Chats', icon: MessageCircle },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'recent', label: 'Recent', icon: Clock }
  ];

  useEffect(() => {
    loadConnections();
  }, [activeTab]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const isDevelopment = import.meta.env.DEV || localStorage.getItem('token') === 'dev-token-12345';
      
      if (isDevelopment) {
        // Mock data for connections
        const mockStats = {
          totalMatches: 847,
          activeChats: 23,
          totalEarnings: 2450.75,
          avgResponse: 12
        };

        const mockConnections = [
          {
            id: 1,
            name: 'Sarah Williams',
            avatar: null,
            age: 28,
            location: 'New York, NY',
            lastMessage: 'Hey! I loved your latest photo set!',
            lastMessageTime: '2 min ago',
            isOnline: true,
            hasUnread: true,
            unreadCount: 3,
            totalSpent: 245.50,
            matchedAt: '2024-01-15',
            isPremium: true,
            rating: 5,
            status: 'active'
          },
          {
            id: 2,
            name: 'Michael Chen',
            avatar: null,
            age: 32,
            location: 'Los Angeles, CA',
            lastMessage: 'Would love to see more content like this!',
            lastMessageTime: '1 hour ago',
            isOnline: false,
            hasUnread: false,
            unreadCount: 0,
            totalSpent: 189.25,
            matchedAt: '2024-01-12',
            isPremium: false,
            rating: 4,
            status: 'active'
          },
          {
            id: 3,
            name: 'Jessica Taylor',
            avatar: null,
            age: 26,
            location: 'Chicago, IL',
            lastMessage: 'Thank you for the custom content!',
            lastMessageTime: '3 hours ago',
            isOnline: true,
            hasUnread: true,
            unreadCount: 1,
            totalSpent: 567.00,
            matchedAt: '2024-01-10',
            isPremium: true,
            rating: 5,
            status: 'favorite'
          },
          {
            id: 4,
            name: 'David Rodriguez',
            avatar: null,
            age: 35,
            location: 'Miami, FL',
            lastMessage: 'Looking forward to your next video!',
            lastMessageTime: '1 day ago',
            isOnline: false,
            hasUnread: false,
            unreadCount: 0,
            totalSpent: 98.75,
            matchedAt: '2024-01-08',
            isPremium: false,
            rating: 4,
            status: 'recent'
          },
          {
            id: 5,
            name: 'Emma Johnson',
            avatar: null,
            age: 29,
            location: 'Seattle, WA',
            lastMessage: 'Just sent you a tip! Keep up the amazing work',
            lastMessageTime: '2 days ago',
            isOnline: true,
            hasUnread: false,
            unreadCount: 0,
            totalSpent: 345.25,
            matchedAt: '2024-01-05',
            isPremium: true,
            rating: 5,
            status: 'active'
          }
        ];

        setTimeout(() => {
          setStats(mockStats);
          setConnections(mockConnections);
          setLoading(false);
          console.log('DEV MODE: Using mock connections data');
        }, 800);
      } else {
        const response = await api.get('/creator/connections');
        setStats(response.stats);
        setConnections(response.connections);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || connection.status === activeTab || 
                      (activeTab === 'active' && connection.hasUnread);
    return matchesSearch && matchesTab;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTimeAgo = (timeString) => {
    return timeString; // In real app, would parse and format relative time
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
      <div className="connections-loading">
        <div className="loading-spinner"></div>
        <p>Loading your connections...</p>
      </div>
    );
  }

  return (
    <div className="creator-connections">
      {/* Header */}
      <div className="connections-header">
        <div className="connections-header-content">
          <h1>
            <Users size={24} />
            My Connections
          </h1>
          <div className="connections-header-actions">
            <button
              className="connections-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="connections-overview">
        <div className="connections-stats-grid">
          <motion.div 
            className="connections-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="connections-stat-icon matches">
              <Users size={20} />
            </div>
            <div className="connections-stat-content">
              <span className="connections-stat-value">{stats.totalMatches}</span>
              <span className="connections-stat-label">Total Matches</span>
            </div>
          </motion.div>

          <motion.div 
            className="connections-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="connections-stat-icon chats">
              <MessageCircle size={20} />
            </div>
            <div className="connections-stat-content">
              <span className="connections-stat-value">{stats.activeChats}</span>
              <span className="connections-stat-label">Active Chats</span>
            </div>
          </motion.div>

          <motion.div 
            className="connections-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="connections-stat-icon earnings">
              <DollarSign size={20} />
            </div>
            <div className="connections-stat-content">
              <span className="connections-stat-value">{formatCurrency(stats.totalEarnings)}</span>
              <span className="connections-stat-label">From Connections</span>
            </div>
          </motion.div>

          <motion.div 
            className="connections-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="connections-stat-icon response">
              <Clock size={20} />
            </div>
            <div className="connections-stat-content">
              <span className="connections-stat-value">{stats.avgResponse}min</span>
              <span className="connections-stat-label">Avg Response</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="connections-controls">
        <div className="connections-search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="connections-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`connections-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Connections List */}
      <div className="connections-list">
        {filteredConnections.length === 0 ? (
          <div className="connections-empty">
            <Users size={64} />
            <h3>No connections found</h3>
            <p>Start connecting with members who love your content!</p>
          </div>
        ) : (
          filteredConnections.map((connection, index) => (
            <motion.div
              key={connection.id}
              className="connections-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/creator/chat/${connection.id}`)}
            >
              <div className="connections-avatar">
                {connection.avatar ? (
                  <img src={connection.avatar} alt={connection.name} />
                ) : (
                  <div className="connections-avatar-placeholder">
                    {connection.name.charAt(0)}
                  </div>
                )}
                {connection.isOnline && <div className="connections-online-indicator"></div>}
                {connection.isPremium && (
                  <div className="connections-premium-badge">
                    <Star size={12} />
                  </div>
                )}
              </div>

              <div className="connections-info">
                <div className="connections-main-info">
                  <div className="connections-name-section">
                    <h3>{connection.name}</h3>
                    <div className="connections-rating">
                      {getRatingStars(connection.rating)}
                    </div>
                  </div>
                  <div className="connections-meta">
                    <span className="connections-age">{connection.age}</span>
                    <span className="connections-location">
                      <MapPin size={12} />
                      {connection.location}
                    </span>
                  </div>
                </div>

                <div className="connections-message">
                  <p>{connection.lastMessage}</p>
                  <span className="connections-message-time">
                    {formatTimeAgo(connection.lastMessageTime)}
                  </span>
                </div>

                <div className="connections-stats-row">
                  <div className="connections-spent">
                    <DollarSign size={14} />
                    <span>{formatCurrency(connection.totalSpent)}</span>
                  </div>
                  <div className="connections-match-date">
                    <Calendar size={14} />
                    <span>Matched {connection.matchedAt}</span>
                  </div>
                </div>
              </div>

              <div className="connections-actions">
                {connection.hasUnread && (
                  <div className="connections-unread-badge">
                    {connection.unreadCount}
                  </div>
                )}
                <button 
                  className="connections-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/creator/chat/${connection.id}`);
                  }}
                >
                  <MessageCircle size={18} />
                </button>
                <button 
                  className="connections-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle more actions
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>
                <ChevronRight size={20} className="connections-chevron" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="connections-quick-actions">
        <h3>Quick Actions</h3>
        <div className="connections-actions-grid">
          <motion.button
            className="connections-quick-action-btn"
            onClick={() => navigate('/creator/analytics')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <TrendingUp size={20} />
            <span>View Analytics</span>
          </motion.button>

          <motion.button
            className="connections-quick-action-btn"
            onClick={() => navigate('/creator/content-upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Camera size={20} />
            <span>Upload Content</span>
          </motion.button>

          <motion.button
            className="connections-quick-action-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Gift size={20} />
            <span>Send Offers</span>
          </motion.button>

          <motion.button
            className="connections-quick-action-btn"
            onClick={() => navigate('/creator/profile')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye size={20} />
            <span>View Profile</span>
          </motion.button>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorConnections;