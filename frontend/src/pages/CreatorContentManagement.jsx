import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, Filter, Grid, List, 
  Eye, Edit, Trash2, Download, Share2, 
  Image, Video, Calendar, DollarSign,
  TrendingUp, Users, Heart, MessageSquare,
  Settings, MoreVertical, Upload, AlertCircle
} from 'lucide-react';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsDesktop, useIsMobile, getUserRole } from '../utils/mobileDetection';
import creatorService from '../services/creator.service';
import './CreatorContentManagement.css';

const CreatorContentManagement = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  
  // State management
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filterType, setFilterType] = useState('all'); // all, photo, video, free, paid
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular, earnings
  const [editingContent, setEditingContent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0
  });
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalContent: 0,
    totalViews: 0,
    totalEarnings: 0,
    totalConnections: 0,
    photoCount: 0,
    videoCount: 0,
    freeContent: 0,
    paidContent: 0
  });

  useEffect(() => {
    fetchContent();
  }, []);

  // Fetch analytics after content is loaded
  useEffect(() => {
    if (content.length > 0) {
      fetchAnalytics();
    }
  }, [content]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await creatorService.getContent();
      // Content loaded successfully
      setContent(data.content || []);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      // Show user-friendly message for 404 errors
      if (err.response && err.response.status === 404) {
        // Expected for new creators with no content yet
      }
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    // Calculate analytics from loaded content data since backend analytics endpoints don't exist yet
    setAnalytics({
      totalContent: content.length,
      totalViews: content.reduce((sum, item) => sum + (item.views || 0), 0),
      totalEarnings: content.reduce((sum, item) => sum + (item.earnings || 0), 0),
      totalConnections: 0, // Will be implemented when connections API is ready
      photoCount: content.filter(item => item.type === 'photo').length,
      videoCount: content.filter(item => item.type === 'video').length,
      freeContent: content.filter(item => item.price === 0).length,
      paidContent: content.filter(item => item.price > 0).length
    });
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      await creatorService.deleteContent(contentId);
      setContent(content.filter(item => item._id !== contentId));
      setSelectedItems(selectedItems.filter(id => id !== contentId));
    } catch (err) {
      console.error('Failed to delete content:', err);
      alert('Failed to delete content. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(selectedItems.map(id => creatorService.deleteContent(id)));
      setContent(content.filter(item => !selectedItems.includes(item._id)));
      setSelectedItems([]);
    } catch (err) {
      console.error('Failed to delete content:', err);
      alert('Failed to delete some items. Please try again.');
    }
  };

  const handleEditContent = (item) => {
    setEditingContent(item);
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      price: item.price || 0
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingContent) return;

    try {
      // Update price if changed
      if (editForm.price !== editingContent.price) {
        await creatorService.updateContentPrice(editingContent._id, editForm.price);
      }

      // Update other details if they exist (basic implementation)
      if (editForm.title !== editingContent.title || editForm.description !== editingContent.description) {
        await creatorService.updateContent(editingContent._id, {
          title: editForm.title,
          description: editForm.description
        });
      }

      // Update local state
      setContent(content.map(item => 
        item._id === editingContent._id 
          ? { ...item, title: editForm.title, description: editForm.description, price: editForm.price }
          : item
      ));

      setShowEditModal(false);
      setEditingContent(null);
    } catch (err) {
      console.error('Failed to update content:', err);
      alert('Failed to update content. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingContent(null);
    setEditForm({ title: '', description: '', price: 0 });
  };

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredAndSortedContent.map(item => item._id);
    setSelectedItems(visibleIds);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const getTypeIcon = (type) => {
    return type === 'photo' ? <Image size={16} /> : <Video size={16} />;
  };

  const getTypeLabel = (type) => {
    return type === 'photo' ? 'Photo Set' : 'Video';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  // Filter and sort content
  const filteredAndSortedContent = content
    .filter(item => {
      const matchesType = filterType === 'all' || 
        (filterType === 'photo' && item.type === 'photo') ||
        (filterType === 'video' && item.type === 'video') ||
        (filterType === 'free' && item.price === 0) ||
        (filterType === 'paid' && item.price > 0);
      
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'earnings':
          return (b.earnings || 0) - (a.earnings || 0);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="content-mgmt-container">
        <div className="content-mgmt-loading">
          <div className="content-mgmt-loading-spinner"></div>
          <p>Loading your content...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CreatorMainHeader />
      
      <div className="content-mgmt-container">
        {/* Header */}
        <header className="content-mgmt-header">
          <div className="content-mgmt-header-content">
            <button className="content-mgmt-back-btn" onClick={() => navigate('/creator/dashboard')}>
              <ArrowLeft size={20} />
            </button>
            <h1>Content Management</h1>
            <button className="content-mgmt-upload-btn" onClick={() => navigate('/creator/content/upload')}>
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* Analytics Summary */}
        <div className="content-mgmt-analytics">
          <div className="content-mgmt-stat-card">
            <div className="content-mgmt-stat-icon">
              <Upload size={24} />
            </div>
            <div className="content-mgmt-stat-info">
              <span className="content-mgmt-stat-value">{analytics.totalContent}</span>
              <span className="content-mgmt-stat-label">Total Content</span>
            </div>
          </div>
          
          <div className="content-mgmt-stat-card">
            <div className="content-mgmt-stat-icon">
              <Eye size={24} />
            </div>
            <div className="content-mgmt-stat-info">
              <span className="content-mgmt-stat-value">{analytics.totalViews.toLocaleString()}</span>
              <span className="content-mgmt-stat-label">Total Views</span>
            </div>
          </div>
          
          <div className="content-mgmt-stat-card">
            <div className="content-mgmt-stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="content-mgmt-stat-info">
              <span className="content-mgmt-stat-value">${analytics.totalEarnings.toFixed(2)}</span>
              <span className="content-mgmt-stat-label">Total Earnings</span>
            </div>
          </div>
          
          <div className="content-mgmt-stat-card">
            <div className="content-mgmt-stat-icon">
              <Users size={24} />
            </div>
            <div className="content-mgmt-stat-info">
              <span className="content-mgmt-stat-value">{analytics.totalConnections}</span>
              <span className="content-mgmt-stat-label">Connections</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="content-mgmt-controls">
          <div className="content-mgmt-search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="content-mgmt-filter-controls">
            <div className="content-mgmt-filter-chips">
              <button 
                className={`content-mgmt-chip ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All
              </button>
              <button 
                className={`content-mgmt-chip ${filterType === 'photo' ? 'active' : ''}`}
                onClick={() => setFilterType('photo')}
              >
                <Image size={14} />
                Photos
              </button>
              <button 
                className={`content-mgmt-chip ${filterType === 'video' ? 'active' : ''}`}
                onClick={() => setFilterType('video')}
              >
                <Video size={14} />
                Videos
              </button>
              <button 
                className={`content-mgmt-chip ${filterType === 'free' ? 'active' : ''}`}
                onClick={() => setFilterType('free')}
              >
                Free
              </button>
              <button 
                className={`content-mgmt-chip ${filterType === 'paid' ? 'active' : ''}`}
                onClick={() => setFilterType('paid')}
              >
                Paid
              </button>
            </div>

            <div className="content-mgmt-view-controls">
              <select 
                className="content-mgmt-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
                <option value="earnings">Highest Earnings</option>
              </select>

              <div className="content-mgmt-view-toggle">
                <button 
                  className={`content-mgmt-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
                <button 
                  className={`content-mgmt-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        {selectedItems.length > 0 && (
          <div className="content-mgmt-selection-bar">
            <span>{selectedItems.length} selected</span>
            <div className="content-mgmt-selection-actions">
              <button onClick={selectAllVisible}>
                Select All Visible
              </button>
              <button onClick={handleBulkDelete} className="content-mgmt-delete-btn">
                <Trash2 size={16} />
                Delete Selected
              </button>
              <button onClick={clearSelection}>
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Content Grid/List */}
        <div className={`content-mgmt-content ${viewMode}`}>
          {filteredAndSortedContent.length === 0 ? (
            <div className="content-mgmt-empty-state">
              <Upload size={48} />
              <h3>{content.length === 0 ? 'No content uploaded yet' : 'No content found'}</h3>
              <p>
                {content.length === 0 
                  ? 'Start creating content to build your audience and earn money'
                  : 'Try adjusting your filters or search term'
                }
              </p>
              {content.length === 0 && (
                <button 
                  className="content-mgmt-upload-first-btn"
                  onClick={() => navigate('/creator/content/upload')}
                >
                  <Plus size={20} />
                  Upload Your First Content
                </button>
              )}
            </div>
          ) : (
            <div className={`content-mgmt-items-${viewMode}`}>
              {filteredAndSortedContent.map(item => (
                <div key={item._id} className={`content-mgmt-item ${selectedItems.includes(item._id) ? 'selected' : ''}`}>
                  <div className="content-mgmt-item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item._id)}
                      onChange={() => toggleItemSelection(item._id)}
                    />
                  </div>

                  <div className="content-mgmt-item-thumbnail">
                    {item.thumbnail || (item.media && item.media[0]?.url) ? (
                      <img 
                        src={item.thumbnail || item.media[0]?.url} 
                        alt={item.title || 'Content thumbnail'}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="content-mgmt-item-placeholder" 
                      style={{
                        display: (item.thumbnail || (item.media && item.media[0]?.url)) ? 'none' : 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        backgroundColor: 'var(--surface-700)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {item.type === 'photo' ? <Image size={32} /> : <Video size={32} />}
                      <span style={{ marginTop: '8px', fontSize: '0.75rem' }}>No Preview</span>
                    </div>
                    <div className="content-mgmt-item-type">
                      {getTypeIcon(item.type)}
                    </div>
                    {item.type === 'video' && item.duration && (
                      <div className="content-mgmt-item-duration">{item.duration}</div>
                    )}
                    <div className="content-mgmt-item-price-badge">
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  <div className="content-mgmt-item-info">
                    <h3>{item.title}</h3>
                    <p className="content-mgmt-item-description">
                      {item.description && item.description.length > 100 
                        ? `${item.description.substring(0, 100)}...`
                        : item.description || 'No description'
                      }
                    </p>
                    
                    <div className="content-mgmt-item-meta">
                      <span className="content-mgmt-item-date">
                        <Calendar size={12} />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="content-mgmt-item-type-label">
                        {getTypeLabel(item.type)}
                      </span>
                    </div>

                    <div className="content-mgmt-item-stats">
                      <span className="content-mgmt-stat">
                        <Eye size={12} />
                        {item.views || 0} views
                      </span>
                      <span className="content-mgmt-stat">
                        <Heart size={12} />
                        {item.likes || 0} likes
                      </span>
                      <span className="content-mgmt-stat">
                        <DollarSign size={12} />
                        ${(item.earnings || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="content-mgmt-item-actions">
                    <button 
                      className="content-mgmt-action-btn"
                      onClick={() => handleEditContent(item)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    
                    <button 
                      className="content-mgmt-action-btn"
                      onClick={() => window.open(`/content/${item._id}`, '_blank')}
                      title="View"
                    >
                      <Eye size={18} />
                    </button>

                    <button 
                      className="content-mgmt-action-btn"
                      title="Share"
                    >
                      <Share2 size={18} />
                    </button>

                    <button 
                      className="content-mgmt-action-btn content-mgmt-delete-btn"
                      onClick={() => handleDeleteContent(item._id)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="content-mgmt-modal-overlay" onClick={handleCancelEdit}>
          <div className="content-mgmt-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="content-mgmt-modal-header">
              <h3>Edit Content</h3>
              <button className="content-mgmt-modal-close" onClick={handleCancelEdit}>
                <X size={20} />
              </button>
            </div>
            
            <div className="content-mgmt-modal-content">
              <div className="content-mgmt-form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  placeholder="Enter content title"
                  maxLength="100"
                />
              </div>
              
              <div className="content-mgmt-form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Enter content description"
                  maxLength="500"
                  rows="3"
                />
              </div>
              
              <div className="content-mgmt-form-group">
                <label htmlFor="edit-price">Price ($)</label>
                <input
                  id="edit-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                  min="0"
                  max="99.99"
                  step="0.01"
                />
                <small>Set to $0.00 to make content free</small>
              </div>
            </div>
            
            <div className="content-mgmt-modal-actions">
              <button 
                className="content-mgmt-btn content-mgmt-btn-secondary" 
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button 
                className="content-mgmt-btn content-mgmt-btn-primary" 
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {isDesktop && <CreatorMainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default CreatorContentManagement;