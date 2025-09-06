import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, X, ArrowLeft, SlidersHorizontal,
  MapPin, Star, Heart, MessageCircle, Users, Clock,
  Grid3x3, List, Loader, AlertCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import './SearchCreators.css';

const SearchCreators = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    age: { min: 18, max: 35 },
    location: '',
    verified: false,
    online: false,
    bodyType: '',
    ethnicity: '',
    orientation: '',
    categories: [],
    priceRange: { min: 0, max: 50 }
  });
  
  // Display state
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('relevance'); // relevance, newest, rating, price
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resultsPerPage] = useState(20);
  
  // Load initial search if query in URL
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);
  
  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const debouncedSearch = useCallback((query) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);
    
    setSearchTimeout(timeout);
  }, [searchTimeout]);
  
  // Perform search
  const performSearch = async (query = searchQuery, page = 1) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Update URL with search params
      const params = new URLSearchParams();
      params.set('q', query);
      if (page > 1) params.set('page', page.toString());
      setSearchParams(params);
      
      // Build search request
      const searchData = {
        query: query.trim(),
        page,
        limit: resultsPerPage,
        sortBy,
        filters: activeFilters
      };
      
      const response = await axios.post('/api/v1/search/creator', searchData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.results);
        setTotalPages(Math.ceil(response.data.total / resultsPerPage));
        setCurrentPage(page);
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error.response?.data?.message || 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchParams(new URLSearchParams());
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
    
    // Re-search with new filters
    if (hasSearched && searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      age: { min: 18, max: 35 },
      location: '',
      verified: false,
      online: false,
      bodyType: '',
      ethnicity: '',
      orientation: '',
      categories: [],
      priceRange: { min: 0, max: 50 }
    });
  };
  
  // Handle creator card click
  const handleCreatorClick = (creatorId) => {
    navigate(`/creator/${creatorId}`);
  };
  
  // Handle like creator
  const handleLikeCreator = async (creatorId, e) => {
    e.stopPropagation();
    // TODO: Implement like functionality
    console.log('Like creator:', creatorId);
  };
  
  // Handle message creator
  const handleMessageCreator = async (creatorId, e) => {
    e.stopPropagation();
    navigate(`/member/messages/${creatorId}`);
  };
  
  return (
    <div className="search-creators-page">
      {/* Header */}
      <div className="search-header">
        <button 
          className="search-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        
        {/* Search Bar */}
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={handleSearchChange}
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
        </form>
        
        {/* Filter Toggle */}
        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
        </button>
      </div>
      
      {/* Search Stats & Controls */}
      {hasSearched && (
        <div className="search-controls">
          <div className="search-stats">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>
                {searchResults.length} creator{searchResults.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </span>
            )}
          </div>
          
          <div className="search-actions">
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
              <option value="relevance">Most Relevant</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>
        </div>
      )}
      
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
                {/* Age Range */}
                <div className="filter-group">
                  <label>Age Range</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      min="18"
                      max="65"
                      value={activeFilters.age.min}
                      onChange={(e) => handleFilterChange('age', { ...activeFilters.age, min: parseInt(e.target.value) })}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min="18"
                      max="65"
                      value={activeFilters.age.max}
                      onChange={(e) => handleFilterChange('age', { ...activeFilters.age, max: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
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
      
      {/* Search Results */}
      <div className="search-results">
        {isSearching && (
          <div className="search-loading">
            <Loader className="spinner" size={32} />
            <span>Searching creators...</span>
          </div>
        )}
        
        {searchError && (
          <div className="search-error">
            <AlertCircle size={48} />
            <h3>Search Error</h3>
            <p>{searchError}</p>
            <button onClick={() => performSearch(searchQuery)} className="retry-btn">
              Try Again
            </button>
          </div>
        )}
        
        {hasSearched && !isSearching && !searchError && searchResults.length === 0 && (
          <div className="no-results">
            <Search size={48} />
            <h3>No creators found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className={`results-grid ${viewMode}`}>
            {searchResults.map((creator) => (
              <motion.div
                key={creator._id}
                className="creator-result-card"
                layoutId={creator._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleCreatorClick(creator._id)}
              >
                <div className="creator-image">
                  <img
                    src={creator.profileImage}
                    alt={creator.displayName}
                  />
                  {creator.isOnline && <span className="online-indicator"></span>}
                  {creator.isVerified && (
                    <span className="verified-badge">
                      <Sparkles size={12} />
                    </span>
                  )}
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
                  
                  <div className="creator-actions">
                    <button
                      className="action-btn like-btn"
                      onClick={(e) => handleLikeCreator(creator._id, e)}
                    >
                      <Heart size={16} />
                    </button>
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="search-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => performSearch(searchQuery, currentPage - 1)}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              disabled={currentPage === totalPages}
              onClick={() => performSearch(searchQuery, currentPage + 1)}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      {/* Default State - No Search Yet */}
      {!hasSearched && !isSearching && (
        <div className="search-empty-state">
          <Search size={64} />
          <h2>Search Creators</h2>
          <p>Find creators by name, location, interests, or any other criteria</p>
          
          <div className="search-suggestions">
            <h4>Popular searches:</h4>
            <div className="suggestion-tags">
              {['fitness', 'lifestyle', 'gaming', 'art', 'verified'].map(tag => (
                <button
                  key={tag}
                  className="suggestion-tag"
                  onClick={() => {
                    setSearchQuery(tag);
                    performSearch(tag);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default SearchCreators;