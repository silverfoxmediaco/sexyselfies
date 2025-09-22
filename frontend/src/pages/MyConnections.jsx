import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import api from '../services/api.config';
import './MyConnections.css';

const MyConnections = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [activeTab, setActiveTab] = useState('active');
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-lastInteraction');
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [connectionType, setConnectionType] = useState('all');

  // Stats for header
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
  });

  useEffect(() => {
    fetchConnections();
    fetchStats();
  }, [activeTab, sortBy, connectionType]);

  const fetchStats = async () => {
    try {
      const data = await api.get('/connections/stats');

      setStats(
        data.stats || data.data || {
          total: 0,
          active: 0,
          pending: 0,
          expired: 0,
        }
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use zeros for new members - real stats will appear when they make connections
      setStats({
        total: 0,
        active: 0,
        pending: 0,
        expired: 0,
      });
    }
  };

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (connectionType !== 'all') {
        params.append('type', connectionType);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('sort', sortBy);

      const response = await api.get(`/connections?${params}`);

      if (response.success) {
        // Transform API response to match component structure
        const transformedConnections = (response.connections || response.data || []).map(conn => ({
          id: conn._id || conn.id,
          creatorName: conn.creator?.displayName || conn.connectionData?.creatorName || 'Unknown Creator',
          creatorUsername: conn.creator?.username || conn.connectionData?.creatorUsername || '',
          avatar: conn.creator?.profileImage || conn.connectionData?.avatar || '/placeholders/beautifulbrunette2.png',
          connectionType: conn.connectionType || 'basic',
          status: conn.status,
          memberLiked: conn.memberLiked !== undefined ? conn.memberLiked : (conn.swipeData?.memberSwiped?.direction === 'right'),
          creatorLiked: conn.creatorLiked !== undefined ? conn.creatorLiked : (conn.swipeData?.creatorSwiped?.direction === 'right'),
          lastMessage: conn.lastMessage || 'No messages yet',
          lastMessageTime: conn.lastMessageTime || conn.createdAt,
          unreadCount: conn.unreadCount || 0,
          isOnline: conn.creator?.isOnline || conn.connectionData?.isOnline || false,
          isPinned: conn.isPinned || false,
          subscriptionAmount: conn.subscriptionAmount || 0,
          totalSpent: conn.totalSpent || 0,
          connectedSince: conn.connectedSince || conn.createdAt,
          messageCount: conn.messageCount || 0,
          contentUnlocked: conn.contentUnlocked || 0,
          specialOffers: conn.specialOffers || 0,
        }));

        setConnections(transformedConnections);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      // Empty array for new members - real connections will appear when they connect with creators
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionClick = connection => {
    if (connection.status === 'active') {
      navigate(`/member/chat/${connection.id}`);
    } else if (connection.status === 'pending') {
      // For pending connections, navigate to creator profile to view details
      // Use hybrid approach: prefer username, fallback to creator name or ID
      const identifier =
        connection.creatorUsername || connection.creatorName || connection.id;
      // Remove @ symbol if present
      const cleanIdentifier = identifier.replace('@', '');
      navigate(`/creator/${cleanIdentifier}`);
    }
  };

  const handleAcceptConnection = async (connectionId, event) => {
    event.stopPropagation();
    try {
      await api.post(`/connections/${connectionId}/accept`);

      // Refresh connections list
      fetchConnections();
      fetchStats();
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleDeclineConnection = async (connectionId, event) => {
    event.stopPropagation();
    try {
      await api.post(`/connections/${connectionId}/decline`);

      // Refresh connections list
      fetchConnections();
      fetchStats();
    } catch (error) {
      console.error('Error declining connection:', error);
    }
  };

  const handlePinConnection = async (connectionId, event) => {
    event.stopPropagation();
    try {
      await api.put(`/connections/${connectionId}/pin`);

      // Refresh connections list
      fetchConnections();
    } catch (error) {
      console.error('Error pinning connection:', error);
    }
  };

  const handleSearch = query => {
    setSearchQuery(query);
  };

  const handleSort = sortType => {
    setSortBy(sortType);
  };

  const toggleConnectionSelection = id => {
    setSelectedConnections(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async action => {
    try {
      await api.post('/connections/bulk', {
        connectionIds: selectedConnections,
        action,
      });

      // Refresh connections list
      fetchConnections();
      setSelectedConnections([]);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const getConnectionTypeColor = type => {
    switch (type) {
      case 'premium':
        return '#FFD700';
      case 'verified':
        return '#17D2C2';
      case 'basic':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not connected';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {isDesktop && <MainHeader />}
      <div className='my-connections-container'>
        {/* Header */}
        <div className='connections-header'>
          <div className='header-top'>
            <h1>My Connections</h1>
            <button
              className='filter-toggle'
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path d='M5 10a2 2 0 114 0 2 2 0 01-4 0zm7 0a2 2 0 114 0 2 2 0 01-4 0z' />
              </svg>
            </button>
          </div>

          {/* Stats Bar */}
          <div className='connections-stats'>
            <div className='stat-item'>
              <span className='stat-value'>{stats.total}</span>
              <span className='stat-label'>Total</span>
            </div>
            <div className='stat-item'>
              <span className='stat-value' style={{ color: '#22C55E' }}>
                {stats.active}
              </span>
              <span className='stat-label'>Active</span>
            </div>
            <div className='stat-item'>
              <span className='stat-value' style={{ color: '#F59E0B' }}>
                {stats.pending}
              </span>
              <span className='stat-label'>Pending</span>
            </div>
            <div className='stat-item'>
              <span className='stat-value' style={{ color: '#EF4444' }}>
                {stats.expired}
              </span>
              <span className='stat-label'>Expired</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className='connections-search'>
          <div className='search-input-wrapper'>
            <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
              <path
                d='M9 17A8 8 0 109 1a8 8 0 000 16zm8-8h3m-1 0l-2 2'
                stroke='currentColor'
                strokeWidth='2'
              />
            </svg>
            <input
              type='text'
              placeholder='Search connections...'
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button className='clear-search' onClick={() => handleSearch('')}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
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
            {stats.active > 0 && (
              <span className='tab-badge'>{stats.active}</span>
            )}
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

        {/* Filters (collapsible) */}
        {showFilters && (
          <div className='connections-filters'>
            <div className='filter-group'>
              <label>Sort by</label>
              <select value={sortBy} onChange={e => handleSort(e.target.value)}>
                <option value='-lastInteraction'>Most Recent</option>
                <option value='-unreadCount.member'>Unread First</option>
                <option value='-totalSpent'>Highest Spent</option>
                <option value='-messageCount'>Most Messages</option>
                <option value='isPinned,-lastInteraction'>Pinned First</option>
              </select>
            </div>
            <div className='filter-group'>
              <label>Connection Type</label>
              <div className='type-filters'>
                <button
                  className={`type-filter ${connectionType === 'all' ? 'active' : ''}`}
                  onClick={() => setConnectionType('all')}
                >
                  All
                </button>
                <button
                  className={`type-filter premium ${connectionType === 'premium' ? 'active' : ''}`}
                  onClick={() => setConnectionType('premium')}
                >
                  Premium
                </button>
                <button
                  className={`type-filter verified ${connectionType === 'verified' ? 'active' : ''}`}
                  onClick={() => setConnectionType('verified')}
                >
                  Verified
                </button>
                <button
                  className={`type-filter basic ${connectionType === 'basic' ? 'active' : ''}`}
                  onClick={() => setConnectionType('basic')}
                >
                  Basic
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedConnections.length > 0 && (
          <div className='bulk-actions'>
            <span>{selectedConnections.length} selected</span>
            <div className='bulk-buttons'>
              <button onClick={() => handleBulkAction('archive')}>
                Archive
              </button>
              <button onClick={() => handleBulkAction('mute')}>Mute</button>
              <button onClick={() => setSelectedConnections([])}>Cancel</button>
            </div>
          </div>
        )}

        {/* Connections List */}
        <div className='connections-list'>
          {isLoading ? (
            <div className='loading-state'>
              <div className='loading-spinner'></div>
              <p>Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className='empty-state'>
              <svg width='80' height='80' viewBox='0 0 80 80' fill='none'>
                <circle
                  cx='40'
                  cy='40'
                  r='30'
                  stroke='currentColor'
                  strokeWidth='2'
                  opacity='0.2'
                />
                <path
                  d='M30 35c0-2.761 2.239-5 5-5s5 2.239 5 5m5 0c0-2.761 2.239-5 5-5s5 2.239 5 5'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <path
                  d='M35 50c2.5 2 5 3 10 3s7.5-1 10-3'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
              <h3>No connections yet</h3>
              <p>Start exploring and connect with creators!</p>
              <button
                className='explore-btn'
                onClick={() => navigate('/member/browse-creators')}
              >
                Explore Creators
              </button>
            </div>
          ) : (
            connections.map(connection => (
              <div
                key={connection.id}
                className={`connection-card ${connection.status}`}
                onClick={() => handleConnectionClick(connection)}
              >
                {/* Selection Checkbox */}
                <div className='connection-select'>
                  <input
                    type='checkbox'
                    checked={selectedConnections.includes(connection.id)}
                    onChange={e => {
                      e.stopPropagation();
                      toggleConnectionSelection(connection.id);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>

                {/* Avatar Section */}
                <div className='connection-avatar'>
                  <img src={connection.avatar} alt={connection.creatorName} />
                  {connection.isOnline && (
                    <span className='online-indicator'></span>
                  )}
                  <span
                    className='connection-type-badge'
                    style={{
                      backgroundColor: getConnectionTypeColor(
                        connection.connectionType
                      ),
                    }}
                  >
                    {connection.connectionType[0].toUpperCase()}
                  </span>
                </div>

                {/* Info Section */}
                <div className='connection-info'>
                  <div className='connection-header'>
                    <div className='connection-names'>
                      <h3>{connection.creatorName}</h3>
                      <span className='username'>
                        {connection.creatorUsername}
                      </span>
                    </div>
                    {connection.isPinned && (
                      <button
                        className='pin-btn pinned'
                        onClick={e => handlePinConnection(connection.id, e)}
                      >
                        <svg
                          className='pinned-icon'
                          width='16'
                          height='16'
                          fill='currentColor'
                        >
                          <path d='M8 2L6 8l-4 1 4 1 2 6 2-6 4-1-4-1L8 2z' />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className='connection-message'>
                    <p>{connection.lastMessage}</p>
                    <span className='message-time'>
                      {connection.lastMessageTime}
                    </span>
                  </div>

                  {connection.status === 'active' && (
                    <div className='connection-stats'>
                      <span className='stat'>
                        <svg width='12' height='12' fill='currentColor'>
                          <path d='M1 6h10m-5-5v10' />
                        </svg>
                        ${connection.totalSpent.toFixed(2)}
                      </span>
                      <span className='stat'>
                        <svg width='12' height='12' fill='currentColor'>
                          <path d='M2 2l8 8m0-8L2 10' />
                        </svg>
                        {connection.messageCount}
                      </span>
                      <span className='stat'>
                        <svg width='12' height='12' fill='currentColor'>
                          <path d='M6 1L4 7H1l3 2-1 4 3-3 3 3-1-4 3-2h-3L6 1z' />
                        </svg>
                        {connection.contentUnlocked}
                      </span>
                      {connection.specialOffers > 0 && (
                        <span className='stat special-offer'>
                          {connection.specialOffers} offers
                        </span>
                      )}
                    </div>
                  )}

                  {connection.status === 'pending' && (
                    <>
                      {/* Show Accept/Decline only for incoming connections (creator liked member) */}
                      {connection.creatorLiked && !connection.memberLiked ? (
                        <div
                          className='pending-actions'
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className='accept-btn'
                            onClick={e =>
                              handleAcceptConnection(connection.id, e)
                            }
                          >
                            Accept
                          </button>
                          <button
                            className='decline-btn'
                            onClick={e =>
                              handleDeclineConnection(connection.id, e)
                            }
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        /* Show waiting message for outgoing connections (member liked creator) */
                        <div className='pending-status'>
                          <span className='waiting-response'>
                            Waiting for response...
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Unread Badge */}
                {connection.unreadCount > 0 && (
                  <div className='unread-badge'>{connection.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Navigation - Mobile Only */}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </div>
      {isDesktop && <MainFooter />}
    </>
  );
};

export default MyConnections;
