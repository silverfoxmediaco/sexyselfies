import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Search,
  Filter,
  Star,
  Heart,
  Clock,
  ChevronRight,
  Eye,
  Gift,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Camera,
  MoreHorizontal,
} from 'lucide-react';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import api from '../services/api.config';
import './CreatorConnections.css';

const CreatorConnections = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [connections, setConnections] = useState([]);
  const [stats, setStats] = useState({
    totalConnections: 0,
    activeChats: 0,
    totalEarnings: 0,
    avgResponse: 0,
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'All Connections', icon: Users },
    { id: 'active', label: 'Active Chats', icon: MessageCircle },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'recent', label: 'Recent', icon: Clock },
  ];

  useEffect(() => {
    loadConnections();
  }, [activeTab]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      try {
        const response = await api.get('/creator/connections');
        if (response.success) {
          setStats(
            response.stats || {
              totalConnections: 0,
              activeChats: 0,
              totalEarnings: 0,
              avgResponse: 0,
            }
          );
          setConnections(response.connections || []);
        } else {
          // Handle API error - set empty state
          setStats({
            totalConnections: 0,
            activeChats: 0,
            totalEarnings: 0,
            avgResponse: 0,
          });
          setConnections([]);
        }
      } catch (error) {
        console.error('Error loading connections:', error);
        // Set empty state on error
        setStats({
          totalConnections: 0,
          activeChats: 0,
          totalEarnings: 0,
          avgResponse: 0,
        });
        setConnections([]);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      // Fallback to empty state
      setConnections([]);
      setStats({
        totalConnections: 0,
        activeChats: 0,
        totalEarnings: 0,
        avgResponse: 0,
      });
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'all' ||
      connection.status === activeTab ||
      (activeTab === 'active' && connection.hasUnread);
    return matchesSearch && matchesTab;
  });

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTimeAgo = timeString => {
    return timeString; // In real app, would parse and format relative time
  };

  const getRatingStars = rating => {
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
      <div className='connections-loading'>
        <div className='loading-spinner'></div>
        <p>Loading your connections...</p>
      </div>
    );
  }

  return (
    <div className='creator-connections'>
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}

      {/* Header */}
      <div className='connections-header'>
        <div className='connections-header-content'>
          <h1>
            <Users size={24} />
            My Connections
          </h1>
          <div className='connections-header-actions'>
            <button
              className='connections-filter-btn'
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='connections-overview'>
        <div className='connections-stats-grid'>
          <motion.div
            className='connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='connections-stat-icon matches'>
              <Users size={20} />
            </div>
            <div className='connections-stat-content'>
              <span className='connections-stat-value'>
                {stats.totalConnections}
              </span>
              <span className='connections-stat-label'>Total Connections</span>
            </div>
          </motion.div>

          <motion.div
            className='connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='connections-stat-icon chats'>
              <MessageCircle size={20} />
            </div>
            <div className='connections-stat-content'>
              <span className='connections-stat-value'>
                {stats.activeChats}
              </span>
              <span className='connections-stat-label'>Active Chats</span>
            </div>
          </motion.div>

          <motion.div
            className='connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='connections-stat-icon earnings'>
              <DollarSign size={20} />
            </div>
            <div className='connections-stat-content'>
              <span className='connections-stat-value'>
                {formatCurrency(stats.totalEarnings)}
              </span>
              <span className='connections-stat-label'>From Connections</span>
            </div>
          </motion.div>

          <motion.div
            className='connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className='connections-stat-icon response'>
              <Clock size={20} />
            </div>
            <div className='connections-stat-content'>
              <span className='connections-stat-value'>
                {stats.avgResponse}min
              </span>
              <span className='connections-stat-label'>Avg Response</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='connections-controls'>
        <div className='connections-search-bar'>
          <Search size={20} />
          <input
            type='text'
            placeholder='Search connections...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='connections-tabs'>
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
      <div className='connections-list'>
        {filteredConnections.length === 0 ? (
          <div className='connections-empty'>
            <Users size={64} />
            <h3>No connections found</h3>
            <p>Start connecting with members who love your content!</p>
          </div>
        ) : (
          filteredConnections.map((connection, index) => (
            <motion.div
              key={connection.id}
              className='connections-item'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/creator/chat/${connection.id}`)}
            >
              <div className='connections-avatar'>
                {connection.avatar ? (
                  <img src={connection.avatar} alt={connection.name} />
                ) : (
                  <div className='connections-avatar-placeholder'>
                    {connection.name.charAt(0)}
                  </div>
                )}
                {connection.isOnline && (
                  <div className='connections-online-indicator'></div>
                )}
                {connection.isPremium && (
                  <div className='connections-premium-badge'>
                    <Star size={12} />
                  </div>
                )}
              </div>

              <div className='connections-info'>
                <div className='connections-main-info'>
                  <div className='connections-name-section'>
                    <h3>{connection.name}</h3>
                    <div className='connections-rating'>
                      {getRatingStars(connection.rating)}
                    </div>
                  </div>
                  <div className='connections-meta'>
                    <span className='connections-age'>{connection.age}</span>
                    <span className='connections-location'>
                      <MapPin size={12} />
                      {connection.location}
                    </span>
                  </div>
                </div>

                <div className='connections-message'>
                  <p>{connection.lastMessage}</p>
                  <span className='connections-message-time'>
                    {formatTimeAgo(connection.lastMessageTime)}
                  </span>
                </div>

                <div className='connections-stats-row'>
                  <div className='connections-spent'>
                    <DollarSign size={14} />
                    <span>{formatCurrency(connection.totalSpent)}</span>
                  </div>
                  <div className='connections-match-date'>
                    <Calendar size={14} />
                    <span>Matched {connection.matchedAt}</span>
                  </div>
                </div>
              </div>

              <div className='connections-actions'>
                {connection.hasUnread && (
                  <div className='connections-unread-badge'>
                    {connection.unreadCount}
                  </div>
                )}
                <button
                  className='connections-action-btn'
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/creator/chat/${connection.id}`);
                  }}
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  className='connections-action-btn'
                  onClick={e => {
                    e.stopPropagation();
                    // Handle more actions
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>
                <ChevronRight size={20} className='connections-chevron' />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className='connections-quick-actions'>
        <h3>Quick Actions</h3>
        <div className='connections-actions-grid'>
          <motion.button
            className='connections-quick-action-btn'
            onClick={() => navigate('/creator/analytics')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <TrendingUp size={20} />
            <span>View Analytics</span>
          </motion.button>

          <motion.button
            className='connections-quick-action-btn'
            onClick={() => navigate('/creator/content-upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Camera size={20} />
            <span>Upload Content</span>
          </motion.button>

          <motion.button
            className='connections-quick-action-btn'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Gift size={20} />
            <span>Send Offers</span>
          </motion.button>

          <motion.button
            className='connections-quick-action-btn'
            onClick={() => navigate('/creator/profile')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye size={20} />
            <span>View Profile</span>
          </motion.button>
        </div>
      </div>

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorConnections;
