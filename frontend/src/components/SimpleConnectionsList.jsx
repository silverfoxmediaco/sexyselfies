import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Clock, User } from 'lucide-react';
import api from '../services/api.config';
import './SimpleConnectionsList.css';

const SimpleConnectionsList = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connections from API
  const fetchConnections = async () => {
    try {
      const response = await api.get('/connections');

      if (response.connections && Array.isArray(response.connections)) {
        const transformedConnections = response.connections.map(conn => {
          const otherUser = conn.otherUser || conn.member || conn.creator;
          return {
            id: conn._id || conn.id,
            avatar: otherUser?.profileImage || null,
            name: otherUser?.displayName || otherUser?.username || 'Unknown User',
            username: otherUser?.username || '',
            lastMessage: conn.lastMessage?.content || 'No messages yet',
            messageTime: conn.lastMessage?.createdAt || conn.lastInteraction || conn.createdAt,
            status: conn.status,
            isConnected: conn.status === 'connected'
          };
        });
        setConnections(transformedConnections);
      } else {
        setConnections([]);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Unable to load connections. Please try again.');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  // Load connections once on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  // Navigate to chat
  const handleConnectionClick = (connection) => {
    navigate(`/member/chat/${connection.id}`);
  };

  // Format time display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="SimpleConnectionsList-container">
        <div className="SimpleConnectionsList-loading">
          <div className="SimpleConnectionsList-spinner"></div>
          <span>Loading connections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="SimpleConnectionsList-container">
        <div className="SimpleConnectionsList-error">
          <span>{error}</span>
          <button onClick={fetchConnections} className="SimpleConnectionsList-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="SimpleConnectionsList-container">
        <div className="SimpleConnectionsList-empty">
          <User size={48} className="SimpleConnectionsList-empty-icon" />
          <h3>No connections yet</h3>
          <p>Start connecting with creators!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="SimpleConnectionsList-container">
      <div className="SimpleConnectionsList-list">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="SimpleConnectionsList-item"
            onClick={() => handleConnectionClick(connection)}
          >
            <div className="SimpleConnectionsList-avatar">
              {connection.avatar ? (
                <img
                  src={connection.avatar}
                  alt={connection.name}
                  className="SimpleConnectionsList-avatar-img"
                />
              ) : (
                <div className="SimpleConnectionsList-avatar-placeholder">
                  <User size={24} />
                </div>
              )}
              {connection.isConnected && (
                <div className="SimpleConnectionsList-status-indicator"></div>
              )}
            </div>

            <div className="SimpleConnectionsList-content">
              <div className="SimpleConnectionsList-header">
                <h4 className="SimpleConnectionsList-name">{connection.name}</h4>
                <span className="SimpleConnectionsList-time">
                  {formatTime(connection.messageTime)}
                </span>
              </div>

              <div className="SimpleConnectionsList-footer">
                <div className="SimpleConnectionsList-message">
                  <MessageCircle size={14} />
                  <span>{connection.lastMessage}</span>
                </div>
                <div className="SimpleConnectionsList-username">
                  @{connection.username}
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