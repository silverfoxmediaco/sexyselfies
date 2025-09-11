import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Star, ArrowLeft, Grid3x3, List, Loader, AlertCircle,
  MapPin, MessageCircle, Calendar, Filter, X, Search, Download,
  Heart, Play, Image, Video, DollarSign, Clock, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import memberService from '../services/member.service';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './PurchasedContent.css';

const PurchasedContent = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  
  // State management
  const [purchasedContent, setPurchasedContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'all', // all, photos, videos, messages
    creator: '',
    dateRange: 'all' // all, week, month, year
  });

  // Filtered content based on search and filters
  const [filteredContent, setFilteredContent] = useState([]);

  // Load purchased content on component mount
  useEffect(() => {
    loadPurchasedContent();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [purchasedContent, searchQuery, activeFilters, sortBy]);

  const loadPurchasedContent = async () => {
    try {
      setIsLoading(true);
      setLoadingError(null);
      
      const response = await memberService.getPurchasedContent({
        type: 'all',
        sort: sortBy,
        limit: 50
      });
      
      if (response.success) {
        setPurchasedContent(response.data || []);
      } else {
        setLoadingError('Failed to load purchased content');
      }
    } catch (error) {
      console.error('Error loading purchased content:', error);
      setLoadingError('Failed to load purchased content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...purchasedContent];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.creator?.displayName?.toLowerCase().includes(query) ||
        item.creator?.username?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (activeFilters.type !== 'all') {
      filtered = filtered.filter(item => {
        if (activeFilters.type === 'photos') return item.type === 'photo';
        if (activeFilters.type === 'videos') return item.type === 'video';
        if (activeFilters.type === 'messages') return item.type === 'message';
        return true;
      });
    }

    // Apply creator filter
    if (activeFilters.creator) {
      const creatorQuery = activeFilters.creator.toLowerCase();
      filtered = filtered.filter(item =>
        item.creator?.displayName?.toLowerCase().includes(creatorQuery) ||
        item.creator?.username?.toLowerCase().includes(creatorQuery)
      );
    }

    // Apply date range filter
    if (activeFilters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (activeFilters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(item => 
        new Date(item.purchaseDate || item.createdAt) >= cutoffDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.purchaseDate || b.createdAt) - new Date(a.purchaseDate || a.createdAt);
        case 'oldest':
          return new Date(a.purchaseDate || a.createdAt) - new Date(b.purchaseDate || b.createdAt);
        case 'creator':
          return (a.creator?.displayName || a.creator?.username || '').localeCompare(
            b.creator?.displayName || b.creator?.username || ''
          );
        case 'price':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    setFilteredContent(filtered);
  };

  const clearFilters = () => {
    setActiveFilters({
      type: 'all',
      creator: '',
      dateRange: 'all'
    });
    setSearchQuery('');
  };

  const handleContentView = (contentId) => {
    navigate(`/content/${contentId}`);
  };

  const handleCreatorView = (creatorId) => {
    navigate(`/creator/${creatorId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'photo': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'message': return <MessageCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="purchased-content-container">
        {isDesktop && <MainHeader />}
        <div className="purchased-content-loading">
          <Loader className="purchased-content-spinner" size={32} />
          <p>Loading your purchased content...</p>
        </div>
        {isDesktop && <MainFooter />}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="purchased-content-container">
        {isDesktop && <MainHeader />}
        <div className="purchased-content-error">
          <AlertCircle size={32} />
          <h3>Unable to Load Content</h3>
          <p>{loadingError}</p>
          <button 
            className="purchased-content-retry-btn"
            onClick={loadPurchasedContent}
          >
            Try Again
          </button>
        </div>
        {isDesktop && <MainFooter />}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </div>
    );
  }

  return (
    <>
      {isDesktop && <MainHeader />}
      
      <div className="purchased-content-container">
        {/* Header */}
        <header className="purchased-content-header">
          <div className="purchased-content-header-content">
            <button 
              className="purchased-content-back-btn"
              onClick={() => navigate('/member/profile')}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="purchased-content-header-info">
              <h1>My Purchases</h1>
              <p>{filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''}</p>
            </div>
            <button 
              className="purchased-content-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="purchased-content-search">
          <div className="purchased-content-search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search content or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="purchased-content-filters"
            >
              <div className="purchased-content-filters-content">
                {/* Content Type Filter */}
                <div className="purchased-content-filter-group">
                  <label>Content Type</label>
                  <select
                    value={activeFilters.type}
                    onChange={(e) => setActiveFilters({...activeFilters, type: e.target.value})}
                  >
                    <option value="all">All Types</option>
                    <option value="photos">Photos</option>
                    <option value="videos">Videos</option>
                    <option value="messages">Messages</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="purchased-content-filter-group">
                  <label>Date Range</label>
                  <select
                    value={activeFilters.dateRange}
                    onChange={(e) => setActiveFilters({...activeFilters, dateRange: e.target.value})}
                  >
                    <option value="all">All Time</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="year">Past Year</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="purchased-content-filter-group">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Most Recent</option>
                    <option value="oldest">Oldest First</option>
                    <option value="creator">By Creator</option>
                    <option value="price">By Price</option>
                  </select>
                </div>

                <button 
                  className="purchased-content-clear-filters"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Mode Controls */}
        <div className="purchased-content-controls">
          <div className="purchased-content-view-controls">
            <button
              className={`purchased-content-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              className={`purchased-content-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Content Display */}
        <div className="purchased-content-main">
          {filteredContent.length === 0 ? (
            <div className="purchased-content-empty">
              <Package size={48} />
              <h3>
                {purchasedContent.length === 0 
                  ? "No purchases yet" 
                  : "No content matches your filters"
                }
              </h3>
              <p>
                {purchasedContent.length === 0
                  ? "Start exploring creators and unlock exclusive content!"
                  : "Try adjusting your search or filters to find what you're looking for."
                }
              </p>
              {purchasedContent.length === 0 ? (
                <button 
                  className="purchased-content-browse-btn"
                  onClick={() => navigate('/member/browse-creators')}
                >
                  Browse Creators
                </button>
              ) : (
                <button 
                  className="purchased-content-clear-btn"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className={`purchased-content-grid ${viewMode}`}>
              {filteredContent.map((item) => (
                <motion.div
                  key={item._id || item.id}
                  className="purchased-content-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="purchased-content-thumbnail">
                    <img
                      src={item.thumbnail || '/placeholders/content-placeholder.jpg'}
                      alt={item.title || 'Content'}
                      onError={(e) => { e.target.src = '/placeholders/content-placeholder.jpg'; }}
                    />
                    <div className="purchased-content-overlay">
                      <button 
                        className="purchased-content-view-btn"
                        onClick={() => handleContentView(item._id || item.id)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </div>
                    <div className="purchased-content-type-badge">
                      {getContentIcon(item.type)}
                    </div>
                  </div>
                  
                  <div className="purchased-content-info">
                    <div className="purchased-content-creator">
                      <button 
                        className="purchased-content-creator-link"
                        onClick={() => handleCreatorView(item.creator?._id || item.creator?.id)}
                      >
                        {item.creator?.displayName || item.creator?.username || 'Unknown Creator'}
                      </button>
                    </div>
                    
                    {item.title && (
                      <h4 className="purchased-content-title">{item.title}</h4>
                    )}
                    
                    <div className="purchased-content-meta">
                      <span className="purchased-content-price">
                        <DollarSign size={12} />
                        {item.price?.toFixed(2) || '0.00'}
                      </span>
                      <span className="purchased-content-date">
                        <Clock size={12} />
                        {formatDate(item.purchaseDate || item.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isDesktop && <MainFooter />}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default PurchasedContent;