import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import BottomQuickActions from '../components/BottomQuickActions';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import api from '../services/api.config';
import './CreatorConnections.css';

const CreatorConnections = () => {
  const navigate = useNavigate();
  const { creatorId } = useParams();
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

  // Quick Actions data for connections page
  const quickActionsData = [
    {
      id: 'analytics',
      icon: <TrendingUp size={24} />,
      label: 'View Analytics',
      path: '/creator/analytics',
      color: 'orange',
      description: 'See your performance metrics'
    },
    {
      id: 'upload',
      icon: <Camera size={24} />,
      label: 'Upload Content',
      path: '/creator/content-upload',
      color: 'teal',
      description: 'Add new photos and videos'
    },
    {
      id: 'offers',
      icon: <Gift size={24} />,
      label: 'Send Offers',
      path: '/creator/offers',
      color: 'purple',
      description: 'Create special offers for members'
    },
    {
      id: 'profile',
      icon: <Eye size={24} />,
      label: 'View Profile',
      path: '/creator/profile',
      color: 'blue',
      description: 'Check your public profile'
    }
  ];

  const handleQuickActionClick = (action) => {
    navigate(action.path);
  };

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
        // Map backend stats to frontend expected format
        const backendStats = response.stats || {};
        setStats({
          totalConnections: backendStats.total || 0,
          activeChats: backendStats.connected || 0,
          pending: backendStats.pending || 0,
          expired: 0, // Can be added later
          totalEarnings: 0, // Can be calculated from connections
          avgResponse: 0, // Can be calculated from response times
        });

        // Process connections data for frontend display
        const processedConnections = (response.data || response.connections || []).map(conn => {
          // Handle different response structures from backend
          if (conn.otherUser) {
            // New format from ConnectionService
            return {
              _id: conn.id,
              id: conn.id,
              status: conn.status,
              member: conn.otherUser, // For creators, otherUser is the member
              lastMessage: 'No messages yet',
              lastMessageTime: conn.lastInteraction,
              createdAt: conn.connectedAt || new Date(),
              totalSpent: conn.engagement?.totalSpent || 0,
            };
          } else {
            // Legacy format - keep as is
            return conn;
          }
        });

        setConnections(processedConnections);
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
  };

  const filteredConnections = connections.filter(connection => {
    const memberData = connection.member || connection.otherUser;
    const searchableText = `${memberData?.displayName || memberData?.username || ''}`;
    const matchesSearch = searchableText
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    let matchesTab = false;
    if (activeTab === 'all') {
      matchesTab = true;
    } else if (activeTab === 'pending') {
      matchesTab = connection.status === 'pending';
    } else if (activeTab === 'active') {
      // Active tab shows all established connections (connected, not pending/expired)
      matchesTab = connection.status === 'connected' || connection.status === 'active' || connection.isConnected;
    } else if (activeTab === 'expired') {
      matchesTab = connection.status === 'expired';
    } else {
      matchesTab = connection.status === activeTab;
    }

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

  const handleAcceptConnection = async (connectionId, event) => {
    event.stopPropagation();
    try {
      await api.post(`/connections/${connectionId}/accept`);

      // Refresh connections list
      loadConnections();
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleDeclineConnection = async (connectionId, event) => {
    event.stopPropagation();
    try {
      await api.post(`/connections/${connectionId}/decline`);

      // Refresh connections list
      loadConnections();
    } catch (error) {
      console.error('Error declining connection:', error);
    }
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
              <span className='connections-stat-label'>Active Connections</span>
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

      {/* Simple Stats Bar */}
      <div className='connections-stats'>
        <div className='stat-item'>
          <span className='stat-value'>{stats.totalConnections || 0}</span>
          <span className='stat-label'>Total</span>
        </div>
        <div className='stat-item'>
          <span className='stat-value' style={{ color: 'rgb(34, 197, 94)' }}>
            {stats.activeChats || 0}
          </span>
          <span className='stat-label'>Active</span>
        </div>
        <div className='stat-item'>
          <span className='stat-value' style={{ color: 'rgb(245, 158, 11)' }}>
            {stats.pending || 0}
          </span>
          <span className='stat-label'>Pending</span>
        </div>
        <div className='stat-item'>
          <span className='stat-value' style={{ color: 'rgb(239, 68, 68)' }}>
            {stats.expired || 0}
          </span>
          <span className='stat-label'>Expired</span>
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
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            {stats.pending > 0 && (
              <span className='tab-badge pending'>{stats.pending}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Expired
          </button>
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
            <div
              key={connection._id || connection.id}
              className={`connection-card ${connection.status || 'pending'}`}
              onClick={() => {
                // Navigate to member's profile page
                const memberData = connection.member || connection.otherUser;
                const memberId = memberData?._id || memberData?.id;
                if (memberId) {
                  navigate(`/creator/members/${memberId}`);
                }
              }}
            >
              <div className='connection-select'>
                <input
                  type='checkbox'
                  onClick={e => e.stopPropagation()}
                />
              </div>

              <div className='connection-info'>
                <div className='connection-header'>
                  <div className='connection-names'>
                    {(() => {
                      const memberData = connection.member || connection.otherUser;
                      return (
                        <h3>@{memberData?.username || 'member'}</h3>
                      );
                    })()}
                  </div>
                </div>

                <div className='connection-stats'>
                  <div className='member-spend'>
                    <span className='stat-label'>Total Spend:</span>
                    <span className='stat-value'>{formatCurrency(connection.totalSpent || connection.engagement?.totalSpent || 0)}</span>
                  </div>
                  <div className='member-purchases'>
                    <span className='stat-label'>Purchases:</span>
                    <span className='stat-value'>{connection.contentUnlocked || connection.engagement?.contentUnlocked || 0}</span>
                  </div>
                </div>

                {connection.status === 'pending' && (
                  <div className='pending-actions' onClick={e => e.stopPropagation()}>
                    <button
                      className='accept-btn'
                      onClick={e => handleAcceptConnection(connection._id || connection.id, e)}
                    >
                      Accept
                    </button>
                    <button
                      className='decline-btn'
                      onClick={e => handleDeclineConnection(connection._id || connection.id, e)}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <BottomQuickActions
        actions={quickActionsData}
        onActionClick={handleQuickActionClick}
        showHeader={true}
        title="Quick Actions"
        loading={loading}
      />

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorConnections;
