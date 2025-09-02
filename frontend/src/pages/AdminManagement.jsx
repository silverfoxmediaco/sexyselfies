import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import AdminHeader from '../components/AdminHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './AdminManagement.css';

const AdminManagement = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullToRefreshRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  
  const adminsPerPage = 10;
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'moderator'
  });
  
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
  const [editData, setEditData] = useState({
    role: '',
    isActive: true
  });

  useEffect(() => {
    fetchAdmins();
    
    // Add pull-to-refresh for mobile
    if (window.innerWidth <= 768) {
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setTouchStart(e.targetTouches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientY;
    const diff = currentTouch - touchStart;
    
    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff, 100));
      
      if (pullToRefreshRef.current) {
        pullToRefreshRef.current.style.transform = `translateY(${Math.min(diff / 2, 50)}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      handleRefresh();
    }
    
    setPullDistance(0);
    setTouchStart(null);
    
    if (pullToRefreshRef.current) {
      pullToRefreshRef.current.style.transform = 'translateY(0)';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdmins();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/v1/admin/auth/list`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setAdmins(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      const currentAdmin = JSON.parse(localStorage.getItem('adminData'));
      setAdmins([
        {
          _id: currentAdmin?.id || '1',
          email: currentAdmin?.email || 'admin@sexyselfies.com',
          name: currentAdmin?.name || 'Super Admin',
          role: currentAdmin?.role || 'superAdmin',
          isActive: true,
          createdAt: new Date('2024-01-01').toISOString(),
          lastLogin: new Date().toISOString(),
          loginCount: 45,
          actionsCount: 127
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAdmin = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/v1/admin/auth/create`,
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'moderator'
      });
      setFormErrors({});
      fetchAdmins();
    } catch (error) {
      console.error('Failed to create admin:', error);
      setFormErrors({ 
        email: error.response?.data?.error || 'Failed to create admin' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/v1/admin/auth/${selectedAdmin._id}/status`,
        { isActive: editData.isActive },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setShowEditModal(false);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to update admin:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/v1/admin/auth/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSwipeAction = (adminId, direction) => {
    if (direction === 'left') {
      handleDeleteAdmin(adminId);
    } else if (direction === 'right') {
      const admin = admins.find(a => a._id === adminId);
      setSelectedAdmin(admin);
      setEditData({
        role: admin.role,
        isActive: admin.isActive
      });
      setShowEditModal(true);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'superAdmin': return 'admin-management-role-super';
      case 'moderator': return 'admin-management-role-moderator';
      case 'verificationStaff': return 'admin-management-role-verification';
      default: return '';
    }
  };

  const getPermissionsList = (role) => {
    switch(role) {
      case 'superAdmin':
        return ['All Permissions'];
      case 'moderator':
        return ['Review Content', 'Suspend Users', 'Remove Content'];
      case 'verificationStaff':
        return ['Approve IDs Only'];
      default:
        return [];
    }
  };

  // Pagination
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentAdmins = admins.slice(indexOfFirstAdmin, indexOfLastAdmin);
  const totalPages = Math.ceil(admins.length / adminsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="admin-management-admins-loading">
          <div className="admin-management-spinner"></div>
          <p>Loading admins...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      
      <div className="admin-management-container">
        {/* Pull to refresh indicator */}
        {isRefreshing && (
          <div className="admin-management-refresh-indicator">
            <div className="admin-management-refresh-spinner"></div>
          </div>
        )}

        {/* Content Actions Bar */}
        <div className="admin-management-content-actions-bar">
          <button 
            className="admin-management-create-btn"
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new admin"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            <span className="admin-management-btn-text">Create Admin</span>
          </button>
          
          <button 
            className="admin-management-refresh-btn" 
            onClick={handleRefresh}
            aria-label="Refresh admin list"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>

        {/* Admins Grid */}
        <div className="admin-management-admins-grid">
          {currentAdmins.map(admin => (
            <div key={admin._id} className="admin-management-admin-card">
              <div className="admin-management-admin-card-header">
                <div className="admin-management-admin-avatar">
                  {admin.name?.charAt(0).toUpperCase() || admin.email.charAt(0).toUpperCase()}
                </div>
                <div className="admin-management-admin-info">
                  <h3>{admin.name}</h3>
                  <p>{admin.email}</p>
                </div>
                <button 
                  className="admin-management-expand-btn"
                  onClick={() => setExpandedCard(expandedCard === admin._id ? null : admin._id)}
                  aria-label={expandedCard === admin._id ? 'Collapse' : 'Expand'}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d={expandedCard === admin._id 
                      ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    } clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              <div className="admin-management-admin-role">
                <span className={`admin-management-role-badge ${getRoleBadgeClass(admin.role)}`}>
                  {admin.role.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`admin-management-status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                  {admin.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className={`admin-management-admin-details ${expandedCard === admin._id ? 'expanded' : ''}`}>
                <div className="admin-management-admin-stats">
                  <div className="admin-management-stat">
                    <span className="admin-management-stat-label">Created</span>
                    <span className="admin-management-stat-value">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="admin-management-stat">
                    <span className="admin-management-stat-label">Last Login</span>
                    <span className="admin-management-stat-value">
                      {admin.lastLogin 
                        ? new Date(admin.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="admin-management-stat">
                    <span className="admin-management-stat-label">Logins</span>
                    <span className="admin-management-stat-value">{admin.loginCount || 0}</span>
                  </div>
                  <div className="admin-management-stat">
                    <span className="admin-management-stat-label">Actions</span>
                    <span className="admin-management-stat-value">{admin.actionsCount || 0}</span>
                  </div>
                </div>

                <div className="admin-management-permissions-section">
                  <h4>Permissions</h4>
                  <div className="admin-management-permissions-list">
                    {getPermissionsList(admin.role).map((permission, index) => (
                      <span key={index} className="admin-management-permission-tag">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                {admin.role !== 'superAdmin' && (
                  <div className="admin-management-admin-actions">
                    <button 
                      className="admin-management-action-btn edit"
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setEditData({
                          role: admin.role,
                          isActive: admin.isActive
                        });
                        setShowEditModal(true);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.013 2.513a1.75 1.75 0 012.475 2.475L6.226 12.25a2.751 2.751 0 01-.892.596l-2.047.848a.75.75 0 01-.98-.98l.848-2.047a2.751 2.751 0 01.596-.892l7.262-7.262z"/>
                      </svg>
                      Edit
                    </button>
                    <button 
                      className="admin-management-action-btn delete"
                      onClick={() => handleDeleteAdmin(admin._id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1z"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-management-pagination">
            <button 
              className="admin-management-page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </button>
            
            <div className="admin-management-page-numbers">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  className={`admin-management-page-number ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button 
              className="admin-management-page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        )}

        {/* Create Admin Modal */}
        {showCreateModal && (
          <div className="admin-management-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="admin-management-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-management-modal-header">
                <h2>Create New Admin</h2>
                <button 
                  className="admin-management-modal-close"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close modal"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
              
              <div className="admin-management-form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFormErrors({ ...formErrors, name: '' });
                  }}
                  placeholder="Enter full name"
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && <span className="admin-management-error-message">{formErrors.name}</span>}
              </div>
              
              <div className="admin-management-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFormErrors({ ...formErrors, email: '' });
                  }}
                  placeholder="admin@example.com"
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="admin-management-error-message">{formErrors.email}</span>}
              </div>
              
              <div className="admin-management-form-group">
                <label htmlFor="password">Password</label>
                <div className="admin-management-password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setFormErrors({ ...formErrors, password: '' });
                    }}
                    placeholder="Minimum 8 characters"
                    className={formErrors.password ? 'error' : ''}
                  />
                  <button 
                    type="button"
                    className="admin-management-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      {showPassword ? (
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z M10 4C4.5 4 1 10 1 10s3.5 6 9 6 9-6 9-6-3.5-6-9-6z"/>
                      ) : (
                        <path d="M12.81 4.36l-1.77 1.78a4 4 0 00-4.9 4.9l-2.76 2.75C2.06 12.79.96 11.49.2 10a11 11 0 0118.65-1.64l-1.58 1.58a4 4 0 00-4.46 0z M2 2l16 16"/>
                      )}
                    </svg>
                  </button>
                </div>
                {formErrors.password && <span className="admin-management-error-message">{formErrors.password}</span>}
              </div>
              
              <div className="admin-management-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="admin-management-password-input">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      setFormErrors({ ...formErrors, confirmPassword: '' });
                    }}
                    placeholder="Re-enter password"
                    className={formErrors.confirmPassword ? 'error' : ''}
                  />
                  <button 
                    type="button"
                    className="admin-management-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      {showConfirmPassword ? (
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z M10 4C4.5 4 1 10 1 10s3.5 6 9 6 9-6 9-6-3.5-6-9-6z"/>
                      ) : (
                        <path d="M12.81 4.36l-1.77 1.78a4 4 0 00-4.9 4.9l-2.76 2.75C2.06 12.79.96 11.49.2 10a11 11 0 0118.65-1.64l-1.58 1.58a4 4 0 00-4.46 0z M2 2l16 16"/>
                      )}
                    </svg>
                  </button>
                </div>
                {formErrors.confirmPassword && <span className="admin-management-error-message">{formErrors.confirmPassword}</span>}
              </div>
              
              <div className="admin-management-form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="moderator">Moderator</option>
                  <option value="verificationStaff">Verification Staff</option>
                  <option value="superAdmin">Super Admin</option>
                </select>
              </div>

              <div className="admin-management-role-description">
                {formData.role === 'moderator' && (
                  <p>Can review content, manage reports, suspend users, and remove content.</p>
                )}
                {formData.role === 'verificationStaff' && (
                  <p>Can only review and approve/reject ID verifications.</p>
                )}
                {formData.role === 'superAdmin' && (
                  <p>Full system access including managing other admins and all moderation tools.</p>
                )}
              </div>
              
              <div className="admin-management-modal-actions">
                <button 
                  className="admin-management-modal-btn cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="admin-management-modal-btn confirm"
                  onClick={handleCreateAdmin}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="admin-management-btn-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Admin'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Admin Modal */}
        {showEditModal && selectedAdmin && (
          <div className="admin-management-modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="admin-management-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-management-modal-header">
                <h2>Edit Admin</h2>
                <button 
                  className="admin-management-modal-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close modal"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
              
              <p className="admin-management-edit-info">Editing: {selectedAdmin.name} ({selectedAdmin.email})</p>
              
              <div className="admin-management-form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={editData.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="admin-management-status-description">
                {editData.isActive ? (
                  <p className="admin-management-status-active">Admin will be able to login and perform actions.</p>
                ) : (
                  <p className="admin-management-status-inactive">Admin will be unable to login or perform any actions.</p>
                )}
              </div>
              
              <div className="admin-management-modal-actions">
                <button 
                  className="admin-management-modal-btn cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="admin-management-modal-btn confirm"
                  onClick={handleUpdateAdmin}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="admin-management-btn-spinner"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Admin'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default AdminManagement;