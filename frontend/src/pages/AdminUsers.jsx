import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminHeader from '../components/AdminHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './AdminUsers.css';

const AdminUsers = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, creators, members, suspended, banned
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(7);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = filter === 'suspended' || filter === 'banned' 
        ? '/api/admin/moderation/users/search'
        : '/api/users';
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: filter !== 'all' ? { role: filter } : {}
        }
      );
      
      // Set dummy data if no users exist
      if (!response.data.data || response.data.data.length === 0) {
        setUsers([
          {
            _id: '1',
            email: 'john.creator@example.com',
            role: 'creator',
            isVerified: true,
            createdAt: new Date().toISOString(),
            status: 'active',
            strikes: 0,
            earnings: 1250.00,
            contentCount: 45
          },
          {
            _id: '2',
            email: 'jane.member@example.com',
            role: 'member',
            createdAt: new Date().toISOString(),
            status: 'active',
            strikes: 0,
            spent: 89.99
          }
        ]);
      } else {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Set dummy data on error
      setUsers([
        {
          _id: '1',
          email: 'john.creator@example.com',
          role: 'creator',
          isVerified: true,
          createdAt: new Date().toISOString(),
          status: 'active',
          strikes: 0,
          earnings: 1250.00,
          contentCount: 45
        },
        {
          _id: '2',
          email: 'jane.member@example.com',
          role: 'member',
          createdAt: new Date().toISOString(),
          status: 'active',
          strikes: 0,
          spent: 89.99
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionReason.trim()) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      let endpoint = '';
      let payload = {
        userId: selectedUser._id,
        reason: actionReason
      };

      switch(actionType) {
        case 'ban':
          endpoint = '/api/admin/moderation/users/ban';
          break;
        case 'unban':
          endpoint = '/api/admin/moderation/users/unban';
          break;
        case 'suspend':
          endpoint = '/api/admin/moderation/users/suspend';
          payload.duration = suspensionDays;
          break;
        case 'remove_suspension':
          endpoint = '/api/admin/moderation/users/remove-suspension';
          break;
        case 'freeze_payouts':
          endpoint = '/api/admin/payouts/freeze';
          payload.duration = suspensionDays;
          break;
        default:
          return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}${endpoint}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh user list
      fetchUsers();
      setShowActionModal(false);
      setActionReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error(`Failed to ${actionType} user:`, error);
      alert(`Failed to ${actionType} user. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  const showAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowActionModal(true);
  };

  const getUserStatus = (user) => {
    if (user.isBanned) return 'banned';
    if (user.isSuspended) return 'suspended';
    if (user.isVerified === false && user.role === 'creator') return 'unverified';
    return 'active';
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'active': return 'admin-users-status-active';
      case 'suspended': return 'admin-users-status-suspended';
      case 'banned': return 'admin-users-status-banned';
      case 'unverified': return 'admin-users-status-unverified';
      default: return '';
    }
  };

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      return user.email.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (filter === 'all') return true;
    if (filter === 'creators') return user.role === 'creator';
    if (filter === 'members') return user.role === 'member';
    if (filter === 'suspended') return user.isSuspended;
    if (filter === 'banned') return user.isBanned;
    return true;
  });

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="admin-users-loading">
          <div className="admin-users-spinner"></div>
          <p>Loading users...</p>
        </div>
      </>
    );
  }

  return (
    <div className="admin-users-container">
      <AdminHeader />
      
      {/* Header */}
      <div className="admin-users-header">
        <div>
          <h2>User Management</h2>
          <p className="admin-users-subtitle">Manage and moderate all platform users</p>
        </div>
        
        <div className="admin-users-header-controls">
          <input
            type="text"
            className="admin-users-search-input"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className="admin-users-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="creators">Creators</option>
            <option value="members">Members</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
          
          <button 
            className="admin-users-refresh-btn"
            onClick={fetchUsers}
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.65 2.35a8 8 0 1 0 0 11.3"/>
              <path d="M14 0v5h-5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-users-content">
        {/* Users Table */}
        <div className="admin-users-table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Strikes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-users-empty-row">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const status = getUserStatus(user);
                  return (
                    <tr 
                      key={user._id}
                      className={selectedUser?._id === user._id ? 'selected' : ''}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td>
                        <div className="admin-users-email">
                          <span>{user.email}</span>
                          {user.isVerified && (
                            <svg className="admin-users-verified-icon" width="16" height="16" viewBox="0 0 16 16" fill="#17D2C2">
                              <path d="M8 0L9.5 1.5L11.5 1L12 3L14 3.5L14 5.5L15.5 6.5L14.5 8L15.5 9.5L14 10.5L14 12.5L12 13L11.5 15L9.5 14.5L8 16L6.5 14.5L4.5 15L4 13L2 12.5L2 10.5L0.5 9.5L1.5 8L0.5 6.5L2 5.5L2 3.5L4 3L4.5 1L6.5 1.5L8 0Z"/>
                              <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-users-role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-users-status-badge ${getStatusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={user.strikes >= 2 ? 'admin-users-strikes-warning' : ''}>
                          {user.strikes || 0}/3
                        </span>
                      </td>
                      <td>
                        <button 
                          className="admin-users-action-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="2" r="1.5"/>
                            <circle cx="8" cy="8" r="1.5"/>
                            <circle cx="8" cy="14" r="1.5"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* User Details Panel */}
        {selectedUser && (
          <div className="admin-users-details-panel">
            <div className="admin-users-panel-header">
              <h2>User Details</h2>
              <button 
                className="admin-users-close-btn"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-users-panel-content">
              {/* User Profile */}
              <div className="admin-users-profile">
                <div className="admin-users-profile-avatar">
                  {selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div className="admin-users-profile-info">
                  <h3>{selectedUser.email}</h3>
                  <div className="admin-users-profile-meta">
                    <span className={`admin-users-role-badge ${selectedUser.role}`}>
                      {selectedUser.role}
                    </span>
                    <span className={`admin-users-status-badge ${getStatusBadgeClass(getUserStatus(selectedUser))}`}>
                      {getUserStatus(selectedUser)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Stats */}
              <div className="admin-users-detail-section">
                <h3>Account Information</h3>
                <div className="admin-users-info-grid">
                  <div className="admin-users-info-item">
                    <label>User ID</label>
                    <p className="admin-users-monospace">{selectedUser._id}</p>
                  </div>
                  <div className="admin-users-info-item">
                    <label>Joined</label>
                    <p>{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="admin-users-info-item">
                    <label>Email Verified</label>
                    <p>{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="admin-users-info-item">
                    <label>ID Verified</label>
                    <p>{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="admin-users-info-item">
                    <label>Strikes</label>
                    <p className="admin-users-strikes-value">{selectedUser.strikes || 0}/3</p>
                  </div>
                  <div className="admin-users-info-item">
                    <label>Risk Score</label>
                    <p className="admin-users-risk-score">{selectedUser.riskScore || 0}/100</p>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              {selectedUser.role === 'creator' && (
                <div className="admin-users-detail-section">
                  <h3>Creator Statistics</h3>
                  <div className="admin-users-stats-grid">
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Content</span>
                      <span className="admin-users-stat-value">{selectedUser.contentCount || 0}</span>
                    </div>
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Earnings</span>
                      <span className="admin-users-stat-value">${selectedUser.earnings || 0}</span>
                    </div>
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Subscribers</span>
                      <span className="admin-users-stat-value">{selectedUser.subscriberCount || 0}</span>
                    </div>
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Avg Rating</span>
                      <span className="admin-users-stat-value">{selectedUser.avgRating || 0}/5</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.role === 'member' && (
                <div className="admin-users-detail-section">
                  <h3>Member Statistics</h3>
                  <div className="admin-users-stats-grid">
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Total Spent</span>
                      <span className="admin-users-stat-value">${selectedUser.spent || 0}</span>
                    </div>
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Subscriptions</span>
                      <span className="admin-users-stat-value">{selectedUser.subscriptionCount || 0}</span>
                    </div>
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Content Viewed</span>
                      <span className="admin-users-stat-value">{selectedUser.viewCount || 0}</span>
                    </div>
                    <div className="admin-users-stat-box">
                      <span className="admin-users-stat-label">Reports Filed</span>
                      <span className="admin-users-stat-value">{selectedUser.reportsCount || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Moderation Actions */}
              <div className="admin-users-detail-section">
                <h3>Moderation Actions</h3>
                <div className="admin-users-moderation-actions">
                  {getUserStatus(selectedUser) === 'banned' ? (
                    <button 
                      className="admin-users-mod-btn unban"
                      onClick={() => showAction(selectedUser, 'unban')}
                    >
                      Unban User
                    </button>
                  ) : (
                    <button 
                      className="admin-users-mod-btn ban"
                      onClick={() => showAction(selectedUser, 'ban')}
                    >
                      Ban User
                    </button>
                  )}

                  {getUserStatus(selectedUser) === 'suspended' ? (
                    <button 
                      className="admin-users-mod-btn remove-suspension"
                      onClick={() => showAction(selectedUser, 'remove_suspension')}
                    >
                      Remove Suspension
                    </button>
                  ) : getUserStatus(selectedUser) !== 'banned' && (
                    <button 
                      className="admin-users-mod-btn suspend"
                      onClick={() => showAction(selectedUser, 'suspend')}
                    >
                      Suspend User
                    </button>
                  )}

                  {selectedUser.role === 'creator' && (
                    <button 
                      className="admin-users-mod-btn freeze"
                      onClick={() => showAction(selectedUser, 'freeze_payouts')}
                    >
                      Freeze Payouts
                    </button>
                  )}
                </div>
              </div>

              {/* Action History */}
              <div className="admin-users-detail-section">
                <h3>Action History</h3>
                <div className="admin-users-action-history">
                  {(!selectedUser.actionHistory || selectedUser.actionHistory.length === 0) ? (
                    <p className="admin-users-no-history">No moderation actions taken</p>
                  ) : (
                    selectedUser.actionHistory.map((action, index) => (
                      <div key={index} className="admin-users-history-item">
                        <span className="admin-users-history-action">{action.action}</span>
                        <span className="admin-users-history-date">
                          {new Date(action.date).toLocaleDateString()}
                        </span>
                        <span className="admin-users-history-reason">{action.reason}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="admin-users-modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="admin-users-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Action</h2>
            <p>
              Are you sure you want to {actionType.replace('_', ' ')} this user?
              {actionType === 'ban' && ' This will permanently ban the user.'}
              {actionType === 'suspend' && ' This will temporarily suspend the user.'}
              {actionType === 'remove_suspension' && ' This will restore the user\'s access.'}
              {actionType === 'freeze_payouts' && ' This will temporarily freeze creator payouts.'}
            </p>

            {(actionType === 'suspend' || actionType === 'freeze_payouts') && (
              <div className="admin-users-suspension-duration">
                <label>Duration (days)</label>
                <input
                  type="number"
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(e.target.value)}
                  min="1"
                  max="365"
                />
              </div>
            )}
            
            <textarea
              className="admin-users-action-reason"
              placeholder="Enter reason for this action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows="4"
            />
            
            <div className="admin-users-modal-actions">
              <button 
                className="admin-users-modal-btn cancel"
                onClick={() => setShowActionModal(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-users-modal-btn confirm"
                onClick={handleAction}
                disabled={processing || !actionReason.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default AdminUsers;