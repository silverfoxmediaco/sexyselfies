import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Filter, MoreVertical } from 'lucide-react';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import notificationService from '../services/notification.service';
import './CreatorNotifications.css';

const CreatorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  // Mock data for testing until backend is ready
  const mockNotifications = [
    {
      id: '1',
      type: 'connection',
      title: 'New Connection',
      message: 'Sarah connected with you',
      from: {
        userId: 'user1',
        name: 'Sarah',
        avatar: '/placeholders/creator1.jpg'
      },
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      actionUrl: '/creator/connections'
    },
    {
      id: '2',
      type: 'tip',
      title: 'New Tip Received!',
      message: 'Mike sent you a tip',
      from: {
        userId: 'user2',
        name: 'Mike',
        avatar: '/placeholders/creator2.jpg'
      },
      amount: 5.99,
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      actionUrl: '/creator/earnings'
    },
    {
      id: '3',
      type: 'purchase',
      title: 'Content Purchased!',
      message: 'Emma purchased "Beach Vibes"',
      from: {
        userId: 'user3',
        name: 'Emma',
        avatar: '/placeholders/creator3.jpg'
      },
      amount: 9.99,
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      actionUrl: '/creator/earnings'
    },
    {
      id: '4',
      type: 'message',
      title: 'New Message',
      message: 'Alex: Hey! Love your content...',
      from: {
        userId: 'user4',
        name: 'Alex',
        avatar: '/placeholders/creator4.jpg'
      },
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      actionUrl: '/creator/messages'
    },
    {
      id: '5',
      type: 'system',
      title: 'Weekly Payout Processed',
      message: 'Your earnings of $127.50 have been sent to your PayPal',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
      actionUrl: '/creator/earnings'
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        // For now, use mock data
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
        setLoading(false);
      } catch (err) {
        setError('Failed to load notifications');
        setLoading(false);
      }
    };

    loadNotifications();
  }, [filter]);

  // Filter notifications based on selected filter
  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'connections':
        return notifications.filter(n => n.type === 'connection');
      case 'earnings':
        return notifications.filter(n => n.type === 'tip' || n.type === 'purchase');
      case 'messages':
        return notifications.filter(n => n.type === 'message');
      default:
        return notifications;
    }
  };

  // Group notifications by time period
  const groupNotificationsByTime = (notificationList) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notificationList.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);

      if (notificationDate >= today) {
        groups.today.push(notification);
      } else if (notificationDate >= yesterday) {
        groups.yesterday.push(notification);
      } else if (notificationDate >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        await markAsRead(notification.id);
      }

      // Navigate if actionUrl exists
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Update local state immediately
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // TODO: Call API when backend is ready
      // await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      // TODO: Call API when backend is ready
      // await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );

      // TODO: Call API when backend is ready
      // await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection':
        return '🤝';
      case 'message':
        return '💬';
      case 'tip':
        return '💰';
      case 'purchase':
        return '🛒';
      case 'content':
        return '📷';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByTime(filteredNotifications);

  if (loading) {
    return (
      <div className="CreatorNotifications">
        {!isDesktop && <CreatorMainHeader />}
        <div className="CreatorNotifications-container">
          <div className="CreatorNotifications-header">
            <h1 className="CreatorNotifications-title">Notifications</h1>
          </div>
          <div className="CreatorNotifications-loading">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="CreatorNotifications-skeleton">
                <div className="CreatorNotifications-skeleton-avatar"></div>
                <div className="CreatorNotifications-skeleton-content">
                  <div className="CreatorNotifications-skeleton-title"></div>
                  <div className="CreatorNotifications-skeleton-message"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {!isDesktop && <BottomNavigation />}
      </div>
    );
  }

  return (
    <div className="CreatorNotifications">
      {!isDesktop && <CreatorMainHeader />}

      <div className="CreatorNotifications-container">
        {/* Header */}
        <div className="CreatorNotifications-header">
          <div className="CreatorNotifications-title-section">
            <h1 className="CreatorNotifications-title">
              <Bell className="CreatorNotifications-title-icon" />
              Notifications
              {unreadCount > 0 && (
                <span className="CreatorNotifications-badge">{unreadCount}</span>
              )}
            </h1>
          </div>

          {notifications.length > 0 && (
            <div className="CreatorNotifications-actions">
              {unreadCount > 0 && (
                <button
                  className="CreatorNotifications-action-btn"
                  onClick={markAllAsRead}
                >
                  <Check size={18} />
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="CreatorNotifications-filters">
          {['all', 'unread', 'connections', 'earnings', 'messages'].map(filterType => (
            <button
              key={filterType}
              className={`CreatorNotifications-filter ${
                filter === filterType ? 'active' : ''
              }`}
              onClick={() => setFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType === 'unread' && unreadCount > 0 && (
                <span className="CreatorNotifications-filter-badge">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="CreatorNotifications-content">
          {filteredNotifications.length === 0 ? (
            <div className="CreatorNotifications-empty">
              <Bell className="CreatorNotifications-empty-icon" />
              <h3 className="CreatorNotifications-empty-title">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="CreatorNotifications-empty-message">
                {filter === 'unread'
                  ? "You're all caught up! Check back later for new updates."
                  : "When you receive notifications, they'll appear here."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Today */}
              {groupedNotifications.today.length > 0 && (
                <div className="CreatorNotifications-group">
                  <h2 className="CreatorNotifications-group-title">Today</h2>
                  <div className="CreatorNotifications-list">
                    {groupedNotifications.today.map(notification => (
                      <div
                        key={notification.id}
                        className={`CreatorNotifications-item ${
                          !notification.read ? 'unread' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="CreatorNotifications-item-icon">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="CreatorNotifications-item-content">
                          <div className="CreatorNotifications-item-header">
                            <h3 className="CreatorNotifications-item-title">
                              {notification.title}
                            </h3>
                            <span className="CreatorNotifications-item-time">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>

                          <p className="CreatorNotifications-item-message">
                            {notification.message}
                          </p>

                          {notification.amount && (
                            <div className="CreatorNotifications-item-amount">
                              ${notification.amount.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="CreatorNotifications-item-actions">
                          <button
                            className="CreatorNotifications-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday */}
              {groupedNotifications.yesterday.length > 0 && (
                <div className="CreatorNotifications-group">
                  <h2 className="CreatorNotifications-group-title">Yesterday</h2>
                  <div className="CreatorNotifications-list">
                    {groupedNotifications.yesterday.map(notification => (
                      <div
                        key={notification.id}
                        className={`CreatorNotifications-item ${
                          !notification.read ? 'unread' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="CreatorNotifications-item-icon">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="CreatorNotifications-item-content">
                          <div className="CreatorNotifications-item-header">
                            <h3 className="CreatorNotifications-item-title">
                              {notification.title}
                            </h3>
                            <span className="CreatorNotifications-item-time">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>

                          <p className="CreatorNotifications-item-message">
                            {notification.message}
                          </p>

                          {notification.amount && (
                            <div className="CreatorNotifications-item-amount">
                              ${notification.amount.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="CreatorNotifications-item-actions">
                          <button
                            className="CreatorNotifications-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* This Week */}
              {groupedNotifications.thisWeek.length > 0 && (
                <div className="CreatorNotifications-group">
                  <h2 className="CreatorNotifications-group-title">This Week</h2>
                  <div className="CreatorNotifications-list">
                    {groupedNotifications.thisWeek.map(notification => (
                      <div
                        key={notification.id}
                        className={`CreatorNotifications-item ${
                          !notification.read ? 'unread' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="CreatorNotifications-item-icon">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="CreatorNotifications-item-content">
                          <div className="CreatorNotifications-item-header">
                            <h3 className="CreatorNotifications-item-title">
                              {notification.title}
                            </h3>
                            <span className="CreatorNotifications-item-time">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>

                          <p className="CreatorNotifications-item-message">
                            {notification.message}
                          </p>

                          {notification.amount && (
                            <div className="CreatorNotifications-item-amount">
                              ${notification.amount.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="CreatorNotifications-item-actions">
                          <button
                            className="CreatorNotifications-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Older */}
              {groupedNotifications.older.length > 0 && (
                <div className="CreatorNotifications-group">
                  <h2 className="CreatorNotifications-group-title">Older</h2>
                  <div className="CreatorNotifications-list">
                    {groupedNotifications.older.map(notification => (
                      <div
                        key={notification.id}
                        className={`CreatorNotifications-item ${
                          !notification.read ? 'unread' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="CreatorNotifications-item-icon">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="CreatorNotifications-item-content">
                          <div className="CreatorNotifications-item-header">
                            <h3 className="CreatorNotifications-item-title">
                              {notification.title}
                            </h3>
                            <span className="CreatorNotifications-item-time">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>

                          <p className="CreatorNotifications-item-message">
                            {notification.message}
                          </p>

                          {notification.amount && (
                            <div className="CreatorNotifications-item-amount">
                              ${notification.amount.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="CreatorNotifications-item-actions">
                          <button
                            className="CreatorNotifications-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!isDesktop && <BottomNavigation />}
      {isDesktop && <CreatorMainFooter />}
    </div>
  );
};

export default CreatorNotifications;