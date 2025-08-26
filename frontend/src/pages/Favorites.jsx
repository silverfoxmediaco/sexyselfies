import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Star, ArrowLeft, Grid3x3, List, Loader, AlertCircle,
  MapPin, MessageCircle, Calendar, Filter, X, Search, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './Favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  
  // State management
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('recent'); // recent, name, rating, added
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    verified: false,
    online: false,
    categories: [],
    dateRange: 'all' // all, week, month, year
  });

  // Filtered favorites based on search and filters
  const [filteredFavorites, setFilteredFavorites] = useState([]);

  // Load favorites on component mount
  useEffect(() => {
    loadFavorites();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [favorites, searchQuery, activeFilters, sortBy]);

  // Load favorites from API
  const loadFavorites = async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    // For development, skip API call and use mock data directly
    const isDevelopment = import.meta.env.DEV || localStorage.getItem('token') === 'dev-token-12345';
    
    if (isDevelopment) {
      console.log('DEV MODE: Using mock favorites data');
      
      // Simulate loading delay
      setTimeout(() => {
        const mockFavorites = [
          {
            _id: '1',
            profileImage: '/placeholders/beaufitulbrunette1.png',
            displayName: 'Sophia',
            username: 'sophia_fit',
            age: 24,
            verified: true,
            isOnline: true,
            location: { city: 'Los Angeles', state: 'CA' },
            stats: {
              rating: 4.9,
              followers: 125000
            },
            bio: 'Fitness enthusiast & lifestyle creator =�(',
            categories: ['fitness', 'lifestyle'],
            addedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
            lastActive: new Date()
          },
          {
            _id: '2',
            profileImage: '/placeholders/beautifulbrunette2.png',
            displayName: 'Isabella',
            username: 'bella_vibes',
            age: 22,
            verified: true,
            isOnline: false,
            location: { city: 'Miami', state: 'FL' },
            stats: {
              rating: 4.8,
              followers: 89000
            },
            bio: 'Art & beauty content creator <�=�',
            categories: ['art', 'beauty'],
            addedAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
            lastActive: new Date(Date.now() - 3600000)
          },
          {
            _id: '3',
            profileImage: '/placeholders/beautifulbrunette4.png',
            displayName: 'Emma',
            username: 'emma_lifestyle',
            age: 26,
            verified: true,
            isOnline: true,
            location: { city: 'New York', state: 'NY' },
            stats: {
              rating: 4.7,
              followers: 156000
            },
            bio: 'NYC lifestyle & fashion =�=W',
            categories: ['fashion', 'lifestyle'],
            addedAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
            lastActive: new Date()
          },
          {
            _id: '4',
            profileImage: '/placeholders/cuteblondeselfie1.png',
            displayName: 'Ashley',
            username: 'ashley_gaming',
            age: 23,
            verified: false,
            isOnline: true,
            location: { city: 'San Francisco', state: 'CA' },
            stats: {
              rating: 4.6,
              followers: 67000
            },
            bio: 'Gaming & tech content <��',
            categories: ['gaming', 'tech'],
            addedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
            lastActive: new Date()
          }
        ];
        
        setFavorites(mockFavorites);
        setIsLoading(false);
      }, 1000);
      return;
    }

    // Production API call
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/members/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFavorites(response.data.favorites);
      } else {
        throw new Error(response.data.message || 'Failed to load favorites');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setLoadingError(error.response?.data?.message || 'Failed to load favorites');
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and search
  const applyFiltersAndSearch = () => {
    let filtered = [...favorites];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creator => 
        creator.displayName.toLowerCase().includes(query) ||
        creator.username.toLowerCase().includes(query) ||
        creator.bio.toLowerCase().includes(query) ||
        creator.categories.some(cat => cat.toLowerCase().includes(query))
      );
    }

    // Active filters
    if (activeFilters.verified) {
      filtered = filtered.filter(creator => creator.verified);
    }

    if (activeFilters.online) {
      filtered = filtered.filter(creator => creator.isOnline);
    }

    if (activeFilters.categories.length > 0) {
      filtered = filtered.filter(creator => 
        creator.categories.some(cat => activeFilters.categories.includes(cat))
      );
    }

    // Date range filter
    if (activeFilters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      switch (activeFilters.dateRange) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(creator => new Date(creator.addedAt) >= cutoffDate);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'rating':
          return (b.stats?.rating || 0) - (a.stats?.rating || 0);
        case 'added':
          return new Date(b.addedAt) - new Date(a.addedAt);
        case 'recent':
        default:
          return new Date(b.lastActive) - new Date(a.lastActive);
      }
    });

    setFilteredFavorites(filtered);
  };

  // Handle creator card click
  const handleCreatorClick = (creatorId) => {
    navigate(`/creator/${creatorId}`);
  };

  // Handle unfavorite creator
  const handleUnfavorite = async (creatorId, e) => {
    e.stopPropagation();
    
    try {
      // TODO: API call to unfavorite
      console.log('Unfavoriting creator:', creatorId);
      
      // Optimistic update
      const updatedFavorites = favorites.filter(creator => creator._id !== creatorId);
      setFavorites(updatedFavorites);
      
    } catch (error) {
      console.error('Error unfavoriting creator:', error);
      // Could show toast notification here
    }
  };

  // Handle message creator
  const handleMessageCreator = async (creatorId, e) => {
    e.stopPropagation();
    navigate(`/member/messages/${creatorId}`);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      verified: false,
      online: false,
      categories: [],
      dateRange: 'all'
    });
    setSearchQuery('');
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...activeFilters };
    
    if (filterType === 'categories') {
      const categories = [...newFilters.categories];
      if (categories.includes(value)) {
        newFilters.categories = categories.filter(c => c !== value);
      } else {
        newFilters.categories = [...categories, value];
      }
    } else {
      newFilters[filterType] = value;
    }
    
    setActiveFilters(newFilters);
  };

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="favorites-page">
        <div className="favorites-loading">
          <Loader className="spinner" size={32} />
          <span>Loading your favorites...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (loadingError) {
    return (
      <div className="favorites-page">
        <div className="favorites-error">
          <AlertCircle size={48} />
          <h3>Error Loading Favorites</h3>
          <p>{loadingError}</p>
          <button onClick={loadFavorites} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Header */}
      <div className="favorites-header">
        <button 
          className="favorites-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="favorites-title">
          <Heart className="favorites-icon" size={24} />
          <h1>My Favorites</h1>
          <span className="favorites-count">({favorites.length})</span>
        </div>
        
        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="favorites-search">
        <div className="search-input-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="search-clear-btn"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Controls & Stats */}
      <div className="favorites-controls">
        <div className="favorites-stats">
          <span>
            {filteredFavorites.length} favorite{filteredFavorites.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </span>
        </div>
        
        <div className="favorites-actions">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
          
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Recently Active</option>
            <option value="added">Recently Added</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="filter-content">
              <div className="filter-header">
                <h3>Filters</h3>
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear All
                </button>
              </div>
              
              <div className="filter-groups">
                {/* Quick Filters */}
                <div className="filter-group">
                  <label>Quick Filters</label>
                  <div className="quick-filters">
                    <label className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={activeFilters.verified}
                        onChange={(e) => handleFilterChange('verified', e.target.checked)}
                      />
                      <span>Verified Only</span>
                    </label>
                    <label className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={activeFilters.online}
                        onChange={(e) => handleFilterChange('online', e.target.checked)}
                      />
                      <span>Online Now</span>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div className="filter-group">
                  <label>Added</label>
                  <select
                    value={activeFilters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                
                {/* Categories */}
                <div className="filter-group">
                  <label>Categories</label>
                  <div className="category-filters">
                    {['fitness', 'lifestyle', 'gaming', 'art', 'music', 'travel', 'fashion', 'food'].map(category => (
                      <button
                        key={category}
                        className={`category-btn ${activeFilters.categories.includes(category) ? 'active' : ''}`}
                        onClick={() => handleFilterChange('categories', category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites List */}
      <div className="favorites-list">
        {filteredFavorites.length === 0 && !isLoading ? (
          <div className="favorites-empty">
            {searchQuery || Object.values(activeFilters).some(v => v !== false && v !== 'all' && (Array.isArray(v) ? v.length > 0 : true)) ? (
              <>
                <Search size={64} />
                <h2>No matches found</h2>
                <p>Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <Heart size={64} />
                <h2>No favorites yet</h2>
                <p>Start browsing creators to add them to your favorites</p>
                <button 
                  onClick={() => navigate('/member/browse-creators')}
                  className="browse-btn"
                >
                  Browse Creators
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={`favorites-grid ${viewMode}`}>
            {filteredFavorites.map((creator, index) => (
              <motion.div
                key={creator._id}
                className="favorite-creator-card"
                layoutId={creator._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCreatorClick(creator._id)}
              >
                <div className="creator-image">
                  <img
                    src={creator.profileImage}
                    alt={creator.displayName}
                  />
                  {creator.isOnline && <span className="online-indicator"></span>}
                  {creator.verified && (
                    <span className="verified-badge">
                      <Sparkles size={12} />
                    </span>
                  )}
                  
                  {/* Unfavorite Button */}
                  <button
                    className="unfavorite-btn"
                    onClick={(e) => handleUnfavorite(creator._id, e)}
                    aria-label="Remove from favorites"
                  >
                    <Heart size={16} fill="currentColor" />
                  </button>
                </div>
                
                <div className="creator-info">
                  <h4 className="creator-name">{creator.displayName}</h4>
                  <p className="creator-username">@{creator.username}</p>
                  
                  {viewMode === 'list' && (
                    <p className="creator-bio">{creator.bio}</p>
                  )}
                  
                  <div className="creator-meta">
                    <span className="creator-age">{creator.age}</span>
                    {creator.location && (
                      <span className="creator-location">
                        <MapPin size={12} />
                        {creator.location.city}
                      </span>
                    )}
                    {creator.stats?.rating && (
                      <span className="creator-rating">
                        <Star size={12} />
                        {creator.stats.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="creator-added">
                    <Calendar size={12} />
                    <span>Added {formatDate(creator.addedAt)}</span>
                  </div>
                  
                  <div className="creator-actions">
                    <button
                      className="action-btn message-btn"
                      onClick={(e) => handleMessageCreator(creator._id, e)}
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default Favorites;
