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
  CreditCard,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Camera,
  MoreHorizontal,
} from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import api from '../services/api.config';
import './MemberConnections.css';

const MemberConnections = () => {
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
    totalSpent: 0,
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
  }, [activeTab, searchQuery]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await api.get(`/connections?${params}`);

      if (response.success) {
        setStats(
          response.stats || {
            totalConnections: 0,
            activeChats: 0,
            totalSpent: 0,
            avgResponse: 0,
          }
        );
        setConnections(response.connections || []);
      } else {
        // Handle API error - set empty state
        setStats({
          totalConnections: 0,
          activeChats: 0,
          totalSpent: 0,
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
        totalSpent: 0,
        avgResponse: 0,
      });
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(connection => {
    const searchableText = `${connection.creator?.displayName || ''} ${connection.creator?.username || ''}`;
    const matchesSearch = searchableText
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
        className={i < rating ? 'member-connections-star-filled' : 'member-connections-star-empty'}
      />
    ));
  };

  if (loading) {
    return (
      <div className='member-connections-loading'>
        <div className='member-connections-loading-spinner'></div>
        <p>Loading your connections...</p>
      </div>
    );
  }

  return (
    <div className='member-connections'>
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Header */}
      <div className='member-connections-header'>
        <div className='member-connections-header-content'>
          <h1>
            <Users size={24} />
            My Connections
          </h1>
          <div className='member-connections-header-actions'>
            <button
              className='member-connections-filter-btn'
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='member-connections-overview'>
        <div className='member-connections-stats-grid'>
          <motion.div
            className='member-connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='member-connections-stat-icon connections'>
              <Users size={20} />
            </div>
            <div className='member-connections-stat-content'>
              <span className='member-connections-stat-value'>
                {stats.totalConnections}
              </span>
              <span className='member-connections-stat-label'>Total Connections</span>
            </div>
          </motion.div>

          <motion.div
            className='member-connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='member-connections-stat-icon chats'>
              <MessageCircle size={20} />
            </div>
            <div className='member-connections-stat-content'>
              <span className='member-connections-stat-value'>
                {stats.activeChats}
              </span>
              <span className='member-connections-stat-label'>Active Chats</span>
            </div>
          </motion.div>

          <motion.div
            className='member-connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='member-connections-stat-icon spent'>
              <DollarSign size={20} />
            </div>
            <div className='member-connections-stat-content'>
              <span className='member-connections-stat-value'>
                {formatCurrency(stats.totalSpent)}
              </span>
              <span className='member-connections-stat-label'>Total Spent</span>
            </div>
          </motion.div>

          <motion.div
            className='member-connections-stat-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className='member-connections-stat-icon response'>
              <Clock size={20} />
            </div>
            <div className='member-connections-stat-content'>
              <span className='member-connections-stat-value'>
                {stats.avgResponse}min
              </span>
              <span className='member-connections-stat-label'>Avg Response</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='member-connections-controls'>
        <div className='member-connections-search-bar'>
          <Search size={20} />
          <input
            type='text'
            placeholder='Search creators...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='member-connections-tabs'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`member-connections-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Connections List */}
      <div className='member-connections-list'>
        {filteredConnections.length === 0 ? (
          <div className='member-connections-empty'>
            <Users size={64} />
            <h3>No connections found</h3>
            <p>Start swiping to connect with amazing creators!</p>
            <button
              className='member-connections-browse-btn'
              onClick={() => navigate('/browse-creators')}
            >
              Browse Creators
            </button>
          </div>
        ) : (
          filteredConnections.map((connection, index) => (
            <motion.div
              key={connection._id || connection.id}
              className='member-connections-item'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/chat/${connection._id || connection.id}`)}
            >
              <div className='member-connections-avatar'>
                {connection.creator?.profileImage ? (
                  <img src={connection.creator.profileImage} alt={connection.creator.displayName} />
                ) : (
                  <div className='member-connections-avatar-placeholder'>
                    {(connection.creator?.displayName || connection.creator?.username || 'U').charAt(0)}
                  </div>
                )}
                {connection.creator?.isOnline && (
                  <div className='member-connections-online-indicator'></div>
                )}
                {connection.creator?.isVerified && (
                  <div className='member-connections-verified-badge'>
                    <Star size={12} />
                  </div>
                )}
              </div>

              <div className='member-connections-info'>
                <div className='member-connections-main-info'>
                  <div className='member-connections-name-section'>
                    <h3>{connection.creator?.displayName || connection.creator?.username}</h3>
                    <div className='member-connections-rating'>
                      {getRatingStars(connection.creator?.rating || 0)}
                    </div>
                  </div>
                  <div className='member-connections-meta'>
                    <span className='member-connections-age'>{connection.creator?.age}</span>
                    <span className='member-connections-location'>
                      <MapPin size={12} />
                      {connection.creator?.location?.city || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className='member-connections-message'>
                  <p>{connection.lastMessage || 'No messages yet'}</p>
                  <span className='member-connections-message-time'>
                    {formatTimeAgo(connection.lastMessageTime || connection.createdAt)}
                  </span>
                </div>

                <div className='member-connections-stats-row'>
                  <div className='member-connections-spent'>
                    <DollarSign size={14} />
                    <span>{formatCurrency(connection.totalSpent || 0)}</span>
                  </div>
                  <div className='member-connections-connect-date'>
                    <Calendar size={14} />
                    <span>Connected {formatTimeAgo(connection.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className='member-connections-actions'>
                {connection.hasUnread && (
                  <div className='member-connections-unread-badge'>
                    {connection.unreadCount}
                  </div>
                )}
                <button
                  className='member-connections-action-btn'
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/chat/${connection._id || connection.id}`);
                  }}
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  className='member-connections-action-btn'
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/creator-profile/${connection.creator?._id || connection.creator?.id}`);
                  }}
                >
                  <Eye size={18} />
                </button>
                <button
                  className='member-connections-action-btn'
                  onClick={e => {
                    e.stopPropagation();
                    // Handle more actions
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>
                <ChevronRight size={20} className='member-connections-chevron' />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className='member-connections-quick-actions'>
        <h3>Quick Actions</h3>
        <div className='member-connections-actions-grid'>
          <motion.button
            className='member-connections-quick-action-btn'
            onClick={() => navigate('/browse-creators')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <TrendingUp size={20} />
            <span>Browse Creators</span>
          </motion.button>

          <motion.button
            className='member-connections-quick-action-btn'
            onClick={() => navigate('/trending-creators')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Star size={20} />
            <span>Trending</span>
          </motion.button>

          <motion.button
            className='member-connections-quick-action-btn'
            onClick={() => navigate('/favorites')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart size={20} />
            <span>Favorites</span>
          </motion.button>

          <motion.button
            className='member-connections-quick-action-btn'
            onClick={() => navigate('/member/profile')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye size={20} />
            <span>My Profile</span>
          </motion.button>
        </div>
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default MemberConnections;