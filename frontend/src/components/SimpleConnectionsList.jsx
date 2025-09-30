import React, { useState, useEffect } from 'react';
import { Trash2, MessageCircle, Clock, User } from 'lucide-react';
import api from '../services/api.config';

const SimpleConnectionsList = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connections from API
  const fetchConnections = async () => {
    console.log('🔄 SimpleConnectionsList: Starting to fetch connections...');
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/connections');
      console.log('✅ SimpleConnectionsList: API response received:', response);

      if (response.connections) {
        // Transform connections to expected format
        const transformedConnections = response.connections.map(conn => {
          const otherUser = conn.otherUser || conn.member || conn.creator;
          return {
            id: conn._id || conn.id,
            avatar: otherUser?.profileImage || null,
            name: otherUser?.displayName || otherUser?.username || 'Unknown User',
            username: otherUser?.username || '',
            connectionType: getConnectionTypeCode(conn.connectionType || 'standard'),
            connectionTypeColor: getConnectionTypeColor(conn.connectionType || 'standard'),
            lastMessage: conn.lastMessage?.content || 'No messages yet',
            messageTime: conn.lastMessage?.createdAt || conn.lastInteraction || conn.createdAt,
            isConnected: conn.status === 'connected'
          };
        });

        setConnections(transformedConnections);
        console.log('✅ SimpleConnectionsList: Set connections:', transformedConnections.length);
      } else {
        setConnections([]);
        console.log('ℹ️ SimpleConnectionsList: No connections in response');
      }
    } catch (err) {
      console.error('❌ SimpleConnectionsList: Error fetching connections:', err);
      setError('Unable to load connections. Please try again.');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete connection
  const handleDeleteConnection = async (connectionId, connectionName) => {
    const confirmed = window.confirm(`Are you sure you want to delete your connection with ${connectionName}?`);

    if (!confirmed) return;

    try {
      await api.delete(`/connections/${connectionId}`);

      // Remove from local state
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (err) {
      console.error('Error deleting connection:', err);
      alert('Failed to delete connection. Please try again.');
    }
  };

  // Format timestamp
  const formatTime = (timeString) => {
    if (!timeString) return '';

    const messageDate = new Date(timeString);
    const now = new Date();
    const diffInSeconds = (now - messageDate) / 1000;
    const diffInMinutes = diffInSeconds / 60;
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 2) {
      return 'Yesterday';
    } else if (diffInDays < 365) {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return messageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // Get connection type code
  const getConnectionTypeCode = (connectionType) => {
    const typeMap = {
      'standard': 'C',
      'subscriber': 'S',
      'member': 'M',
      'fan': 'F',
      'premium': 'P',
      'vip': 'V'
    };
    return typeMap[connectionType] || 'C';
  };

  // Get connection type color
  const getConnectionTypeColor = (connectionType) => {
    const colorMap = {
      'standard': '#10b981',
      'subscriber': '#8e8e93',
      'member': '#3b82f6',
      'fan': '#f59e0b',
      'premium': '#8b5cf6',
      'vip': '#ef4444'
    };
    return colorMap[connectionType] || '#10b981';
  };

  // Load connections on mount - only once
  useEffect(() => {
    fetchConnections();
  }, []); // Empty dependency array - runs only once on mount

  // Styles
  const styles = {
    container: {
      padding: '16px',
      maxWidth: '100%'
    },
    connectionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    connectionCard: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: '#1c1c1e',
      borderRadius: '12px',
      border: '1px solid #2a2a2c',
      gap: '12px'
    },
    avatar: {
      position: 'relative',
      flexShrink: 0
    },
    avatarImage: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    avatarFallback: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#2a2a2c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#8e8e93'
    },
    badge: {
      position: 'absolute',
      bottom: '-2px',
      right: '-2px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
      color: 'white',
      border: '2px solid #1c1c1e'
    },
    connectionInfo: {
      flex: 1,
      minWidth: 0
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px'
    },
    names: {
      minWidth: 0,
      flex: 1
    },
    name: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    username: {
      fontSize: '14px',
      color: '#8e8e93',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    deleteBtn: {
      background: 'none',
      border: 'none',
      padding: '8px',
      borderRadius: '8px',
      color: '#8e8e93',
      cursor: 'pointer',
      flexShrink: 0,
      minWidth: '44px',
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    message: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#c7c7cc'
    },
    messageTime: {
      fontSize: '12px',
      color: '#8e8e93',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginLeft: 'auto',
      flexShrink: 0
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: '#8e8e93'
    },
    error: {
      textAlign: 'center',
      padding: '40px',
      color: '#ef4444'
    },
    empty: {
      textAlign: 'center',
      padding: '40px',
      color: '#8e8e93'
    },
    emptyIcon: {
      marginBottom: '16px',
      color: '#8e8e93'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading connections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          {error}
          <br />
          <button
            onClick={fetchConnections}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#17d2c2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <User size={48} style={styles.emptyIcon} />
          <br />
          No connections yet
          <br />
          <small>Start connecting with creators!</small>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.connectionsList}>
        {connections.map((connection) => (
          <div key={connection.id} style={styles.connectionCard}>
            {/* Avatar */}
            <div style={styles.avatar}>
              {connection.avatar ? (
                <img
                  src={connection.avatar}
                  alt={`${connection.name}'s avatar`}
                  style={styles.avatarImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                style={{
                  ...styles.avatarFallback,
                  display: connection.avatar ? 'none' : 'flex'
                }}
              >
                <User size={24} />
              </div>

              {/* Connection type badge */}
              <div style={{
                ...styles.badge,
                backgroundColor: connection.connectionTypeColor
              }}>
                {connection.connectionType}
              </div>
            </div>

            {/* Connection Info */}
            <div style={styles.connectionInfo}>
              <div style={styles.header}>
                <div style={styles.names}>
                  <h3 style={styles.name}>{connection.name}</h3>
                  {connection.username && (
                    <div style={styles.username}>@{connection.username}</div>
                  )}
                </div>

                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDeleteConnection(connection.id, connection.name)}
                  title={`Delete connection with ${connection.name}`}
                  onMouseOver={(e) => e.target.style.color = '#ef4444'}
                  onMouseOut={(e) => e.target.style.color = '#8e8e93'}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={styles.message}>
                <MessageCircle size={14} style={{ color: '#8e8e93', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {connection.lastMessage}
                </span>
                <div style={styles.messageTime}>
                  <Clock size={12} />
                  {formatTime(connection.messageTime)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleConnectionsList;