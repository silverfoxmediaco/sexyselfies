import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, MessageCircle, Clock, User } from 'lucide-react';
import api from '../services/api.config';
import './SimpleConnectionsList.css';

const SimpleConnectionsList = () => {
  const navigate = useNavigate();
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
            lastMessage: conn.lastMessage?.content || 'No messages yet',
            messageTime: conn.lastMessage?.createdAt || conn.lastInteraction || conn.createdAt,
            status: conn.status, // Keep original status for filtering
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

  // Navigate to creator profile
  const handleConnectionClick = (connection) => {
    console.log('🔗 Navigating to creator profile:', connection.username);
    navigate(`/creator/${connection.username}`);
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



  // Load connections on mount - only once
  useEffect(() => {
    fetchConnections();
  }, []); // Empty dependency array - runs only once on mount


  if (loading) {
    return (
      <div className="simple-connections-list">
        <div className="simple-connections-loading">Loading connections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-connections-list">
        <div className="simple-connections-error">
          {error}
          <br />
          <button
            onClick={fetchConnections}
            className="simple-connections-retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (connections.length === 0 && !loading) {
    const getEmptyMessage = () => {
      if (connections.length === 0) {
        return {
          title: 'No connections yet',
          subtitle: 'Start connecting with creators!'
        };
      } else {
        switch (filterType) {
          case 'active':
            return {
              title: 'No active connections',
              subtitle: 'Active connections will appear here'
            };
          case 'pending':
            return {
              title: 'No pending connections',
              subtitle: 'Pending connections will appear here'
            };
          case 'expired':
            return {
              title: 'No expired connections',
              subtitle: 'Expired connections will appear here'
            };
          default:
            return {
              title: 'No connections',
              subtitle: 'No connections match this filter'
            };
        }
      }
    };

    const emptyMessage = {
      title: 'No connections yet',
      subtitle: 'Start connecting with creators!'
    };

    return (
      <div className="simple-connections-list">
        <div className="simple-connections-empty">
          <User size={48} className="simple-connections-empty-icon" />
          <br />
          {emptyMessage.title}
          <br />
          <small>{emptyMessage.subtitle}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-connections-list">
      <div className="simple-connections-connections-list">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="simple-connections-card"
            onClick={() => handleConnectionClick(connection)}
          >
            {/* Avatar */}
            <div className="simple-connections-avatar">
              {connection.avatar ? (
                <img
                  src={connection.avatar}
                  alt={`${connection.name}'s avatar`}
                  className="simple-connections-avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextSibling;
                    if (fallback) {
                      fallback.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div
                className={`simple-connections-avatar-fallback ${connection.avatar ? 'hidden' : ''}`}
              >
                <User size={24} />
              </div>

              {/* Connected indicator */}
              {connection.isConnected && (
                <div className="simple-connections-connected-indicator">
                  ✓
                </div>
              )}
            </div>

            {/* Connection Info */}
            <div className="simple-connections-info">
              <div className="simple-connections-header">
                <div className="simple-connections-names">
                  <h3 className="simple-connections-name">{connection.name}</h3>
                  {connection.username && (
                    <div className="simple-connections-username">@{connection.username}</div>
                  )}
                </div>

                <button
                  className="simple-connections-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleDeleteConnection(connection.id, connection.name);
                  }}
                  title={`Delete connection with ${connection.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="simple-connections-message">
                <MessageCircle size={14} className="simple-connections-message-icon" />
                <span className="simple-connections-message-text">
                  {connection.lastMessage}
                </span>
                <div className="simple-connections-message-time">
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