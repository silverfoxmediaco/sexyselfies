// MemberGifts.jsx - Member gift inbox page
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Eye,
  Clock,
  User,
  DollarSign,
  Heart,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  Package,
  Sparkles,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getMemberGifts, viewGift, trackGiftClickThrough, formatGiftForDisplay } from '../services/gift.service';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import GiftViewingModal from '../components/GiftViewingModal';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './MemberGifts.css';

const MemberGifts = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  // Core states
  const [gifts, setGifts] = useState([]);
  const [filteredGifts, setFilteredGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal states
  const [selectedGift, setSelectedGift] = useState(null);
  const [viewingGift, setViewingGift] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Analytics
  const [giftStats, setGiftStats] = useState({
    total: 0,
    unviewed: 0,
    viewed: 0,
    totalValue: 0,
  });

  // Load gifts from API
  const loadGifts = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    setError(null);

    try {
      const response = await getMemberGifts({
        page,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      const formattedGifts = response.gifts.map(formatGiftForDisplay);

      if (append && page > 1) {
        setGifts(prev => [...prev, ...formattedGifts]);
      } else {
        setGifts(formattedGifts);
      }

      setTotalPages(response.pagination?.pages || 1);
      setCurrentPage(page);

      // Calculate stats
      const stats = {
        total: response.pagination?.total || formattedGifts.length,
        unviewed: formattedGifts.filter(g => !g.isViewed).length,
        viewed: formattedGifts.filter(g => g.isViewed).length,
        totalValue: formattedGifts.reduce((sum, g) => sum + g.originalPrice, 0),
      };
      setGiftStats(stats);

    } catch (err) {
      console.error('Failed to load gifts:', err);
      setError('Failed to load your gifts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  // Refresh gifts
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGifts(1);
  };

  // Load more gifts (infinite scroll)
  const loadMoreGifts = async () => {
    if (currentPage < totalPages) {
      await loadGifts(currentPage + 1, true);
    }
  };

  // View a gift
  const handleViewGift = async (gift) => {
    try {
      setSelectedGift(gift);
      setViewingGift(true);

      // If not already viewed, mark as viewed
      if (!gift.isViewed) {
        const response = await viewGift(gift.id);

        // Update the gift in our list
        setGifts(prev => prev.map(g =>
          g.id === gift.id
            ? { ...g, isViewed: true, viewedAt: new Date() }
            : g
        ));

        // Update stats
        setGiftStats(prev => ({
          ...prev,
          unviewed: prev.unviewed - 1,
          viewed: prev.viewed + 1,
        }));

        // Update selected gift
        setSelectedGift(prev => ({
          ...prev,
          isViewed: true,
          viewedAt: new Date(),
          content: { ...prev.content, fileUrl: response.gift.content.fileUrl }
        }));
      }
    } catch (err) {
      console.error('Failed to view gift:', err);
      alert('Failed to open gift. Please try again.');
    }
  };

  // Track click-through to creator
  const handleCreatorClick = async (gift) => {
    try {
      await trackGiftClickThrough(gift.id);
      // Could navigate to creator profile here
      console.log('Navigating to creator:', gift.creator.username);
    } catch (err) {
      console.error('Failed to track click-through:', err);
    }
  };

  // Apply filters and search
  const applyFilters = useCallback(() => {
    let filtered = [...gifts];

    // Search by creator username or content title
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g =>
        g.creator.username.toLowerCase().includes(query) ||
        g.content.title.toLowerCase().includes(query)
      );
    }

    // Sort gifts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.giftedAt) - new Date(a.giftedAt);
        case 'oldest':
          return new Date(a.giftedAt) - new Date(b.giftedAt);
        case 'highest-value':
          return b.originalPrice - a.originalPrice;
        case 'creator-name':
          return a.creator.username.localeCompare(b.creator.username);
        default:
          return 0;
      }
    });

    setFilteredGifts(filtered);
  }, [gifts, searchQuery, sortBy]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Initial load
  useEffect(() => {
    loadGifts(1);
  }, [loadGifts]);

  return (
    <div className='MemberGifts-page'>
      {/* Header */}
      {isDesktop ? <MainHeader /> : null}

      <div className='MemberGifts-container'>
        {/* Page Header */}
        <div className='MemberGifts-header'>
          <div className='MemberGifts-title'>
            <Gift size={24} />
            <h1>My Gifts</h1>
            <button
              className='MemberGifts-refresh'
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={20} className={refreshing ? 'spinning' : ''} />
            </button>
          </div>

          {/* Gift Stats */}
          <div className='MemberGifts-stats'>
            <div className='MemberGifts-stat'>
              <Package size={16} />
              <span className='stat-label'>Total</span>
              <span className='stat-value'>{giftStats.total}</span>
            </div>
            <div className='MemberGifts-stat'>
              <Eye size={16} />
              <span className='stat-label'>Viewed</span>
              <span className='stat-value'>{giftStats.viewed}</span>
            </div>
            <div className='MemberGifts-stat unviewed'>
              <Sparkles size={16} />
              <span className='stat-label'>New</span>
              <span className='stat-value'>{giftStats.unviewed}</span>
            </div>
            <div className='MemberGifts-stat'>
              <DollarSign size={16} />
              <span className='stat-label'>Value</span>
              <span className='stat-value'>${giftStats.totalValue}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className='MemberGifts-controls'>
          <div className='MemberGifts-search'>
            <Search size={20} />
            <input
              type='text'
              placeholder='Search by creator or content...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className='MemberGifts-filters'>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value='all'>All Gifts</option>
              <option value='sent'>Unviewed</option>
              <option value='viewed'>Viewed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value='newest'>Newest First</option>
              <option value='oldest'>Oldest First</option>
              <option value='highest-value'>Highest Value</option>
              <option value='creator-name'>Creator Name</option>
            </select>
          </div>
        </div>

        {/* Gift List */}
        <div className='MemberGifts-content'>
          {loading ? (
            <div className='MemberGifts-loading'>
              <div className='loading-spinner'></div>
              <p>Loading your gifts...</p>
            </div>
          ) : error ? (
            <div className='MemberGifts-error'>
              <AlertCircle size={48} />
              <h3>Error loading gifts</h3>
              <p>{error}</p>
              <button onClick={() => loadGifts(1)}>Try Again</button>
            </div>
          ) : filteredGifts.length === 0 ? (
            <div className='MemberGifts-empty'>
              <Gift size={48} />
              <h3>No gifts yet</h3>
              <p>When creators send you gifts, they'll appear here!</p>
            </div>
          ) : (
            <div className='MemberGifts-list'>
              {filteredGifts.map((gift) => (
                <motion.div
                  key={gift.id}
                  className={`MemberGifts-item ${!gift.isViewed ? 'unviewed' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleViewGift(gift)}
                >
                  {/* Gift Status */}
                  {!gift.isViewed && (
                    <div className='MemberGifts-badge'>
                      <Sparkles size={12} />
                      NEW
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className='MemberGifts-preview'>
                    {gift.content.thumbnailUrl ? (
                      <img
                        src={gift.content.thumbnailUrl}
                        alt={gift.content.title}
                        className='MemberGifts-thumbnail'
                      />
                    ) : (
                      <div className='MemberGifts-placeholder'>
                        {gift.content.type === 'video' ? '🎥' : '📸'}
                      </div>
                    )}
                  </div>

                  {/* Gift Details */}
                  <div className='MemberGifts-details'>
                    <div className='MemberGifts-creator'>
                      <User size={16} />
                      <span
                        className='creator-name'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreatorClick(gift);
                        }}
                      >
                        @{gift.creator.username}
                      </span>
                      <ExternalLink size={14} />
                    </div>

                    <h3 className='MemberGifts-content-title'>
                      {gift.content.title}
                    </h3>

                    <p className='MemberGifts-message'>
                      "{gift.message}"
                    </p>

                    <div className='MemberGifts-meta'>
                      <div className='MemberGifts-value'>
                        <DollarSign size={14} />
                        ${gift.originalPrice} value
                      </div>
                      <div className='MemberGifts-time'>
                        <Clock size={14} />
                        {gift.timeAgo}
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <button className='MemberGifts-view-btn'>
                    <Eye size={18} />
                    {gift.isViewed ? 'View Again' : 'Open Gift'}
                  </button>
                </motion.div>
              ))}

              {/* Load More Button */}
              {currentPage < totalPages && (
                <button
                  className='MemberGifts-load-more'
                  onClick={loadMoreGifts}
                >
                  <ChevronDown size={20} />
                  Load More Gifts
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gift Viewing Modal */}
      <GiftViewingModal
        gift={selectedGift}
        isOpen={viewingGift}
        onClose={() => setViewingGift(false)}
        onCreatorClick={handleCreatorClick}
      />

      {/* Footer */}
      {isDesktop ? <MainFooter /> : null}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default MemberGifts;