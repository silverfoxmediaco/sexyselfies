import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Star, RotateCcw, Info, Filter, Loader } from 'lucide-react';
import axios from 'axios';
import SwipeCard from '../components/SwipeCard';
import ConnectionModal from '../components/ConnectionModal';
import CreditPurchaseModal from '../components/Wallet/CreditPurchaseModal';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import memberService from '../services/member.service.js';
import paymentService from '../services/payment.service.js';
import api from '../services/api.config.js';
import './BrowseCreators.css';

const BrowseCreators = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [contentFeed, setContentFeed] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);

  // Filter states
  const [activeFilters, setActiveFilters] = useState({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Connection Modal States
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionType, setConnectionType] = useState(null);
  const [connectionData, setConnectionData] = useState(null);

  // Track connections and messages
  const [existingConnections, setExistingConnections] = useState({});
  const [existingMessages, setExistingMessages] = useState({});

  // Check authentication on mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Load data after authentication is confirmed
  useEffect(() => {
    if (isAuthenticated) {
      loadFilters();
      loadContentFeed();
      loadExistingConnections();
    }
  }, [isAuthenticated]);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersToContent();
  }, [contentFeed, activeFilters]);

  // Check if user is authenticated
  const checkAuthentication = () => {
    // Check for token in localStorage
    const token =
      localStorage.getItem('token') || localStorage.getItem('memberToken');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
      navigate('/member/login');
    } else if (userRole !== 'member') {
      navigate('/member/login');
    } else {
      setIsAuthenticated(true);
    }
  };

  // Load saved filters from localStorage
  const loadFilters = () => {
    console.log('📋 Loading filters...');
    try {
      const savedFilters = localStorage.getItem('browseFilters');
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        setActiveFilters(filters);
        console.log('📋 Filters loaded:', filters);

        // Check if any filters are active
        const hasFilters = Object.values(filters).some(value => {
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(
              v => v !== null && v !== undefined
            );
          }
          if (typeof value === 'boolean') return value;
          return false;
        });
        setHasActiveFilters(hasFilters);
      }
    } catch (error) {
      console.error('❌ Error loading filters:', error);
    }
  };

  // Load content feed from API
  const loadContentFeed = async (page = 1) => {
    console.log('🎯 Loading content feed...');
    setIsLoading(page === 1); // Only show loading for first page
    setLoadingError(null);

    try {
      const response = await memberService.getContentFeed({
        page,
        limit: 20
      });

      if (response && response.success && response.data) {
        const contentData = response.data || [];

        console.log('🎯 Raw content data from API:', contentData);

        // Transform content data for frontend
        const transformedContent = contentData.map(content => {
          console.log('🎯 Processing content:', content.title || 'Untitled', 'Creator:', content.creator?.displayName);
          return {
            id: content._id || content.id,
            _id: content._id || content.id,
            url: content.url,
            price: content.price || 0,
            isFree: content.isFree,
            isPaid: content.isPaid,
            type: content.type,
            title: content.title || '',
            description: content.description || '',
            createdAt: content.createdAt,
            // Creator info for attribution
            creator: {
              id: content.creator.id,
              _id: content.creator.id,
              displayName: content.creator.displayName,
              username: content.creator.username,
              profileImage: content.creator.profileImage || '/placeholders/beaufitulbrunette1.png',
              isVerified: content.creator.isVerified || false,
            }
          };
        });

        if (page === 1) {
          setContentFeed(transformedContent);
          setFilteredContent(transformedContent);
        } else {
          // Append to existing content for pagination
          setContentFeed(prev => [...prev, ...transformedContent]);
          setFilteredContent(prev => [...prev, ...transformedContent]);
        }

        setHasMoreContent(response.pagination?.hasMore || false);
        console.log('✅ Content feed loaded and transformed');
      } else {
        throw new Error(response?.message || 'No content found');
      }
    } catch (error) {
      console.error('❌ Error loading content feed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Check if it's an auth error
      if (error.response?.status === 401 || error.code === 'UNAUTHORIZED') {
        console.log('🔐 Authentication error, redirecting to login');
        navigate('/member/login');
      }

      setLoadingError(error.message || 'Failed to load content feed');

      // No content found or error loading
      if (page === 1) {
        setContentFeed([]);
        setFilteredContent([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing connections and messages
  const loadExistingConnections = async () => {
    try {
      const response = await api.get('/connections');

      if (response.success) {
        // Process connections into lookup objects
        const connections = {};
        const messages = {};

        response.data?.forEach(conn => {
          const creatorId = conn.creator?._id || conn.creator;
          connections[creatorId] = {
            hasPoked: conn.creatorLiked || false,
            hasLiked: conn.memberLiked || false,
            isConnected: conn.isConnected || false,
          };

          if (conn.lastMessagePreview) {
            messages[creatorId] = {
              hasMessage: true,
              messageCount: conn.messageCount || 0,
              lastMessage: conn.lastMessagePreview.content,
            };
          }
        });

        setExistingConnections(connections);
        setExistingMessages(messages);
        console.log('✅ Connections loaded');
      }
    } catch (error) {
      console.error('❌ Error loading connections:', error);
      // Don't fail silently, just continue without connection data
    }
  };

  // Apply filters to content
  const applyFiltersToContent = () => {
    console.log('🔍 Applying filters to content...');
    console.log('🔍 Active filters:', activeFilters);

    if (!contentFeed || contentFeed.length === 0) {
      console.log('🔍 No content to filter');
      setFilteredContent([]);
      return;
    }

    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      console.log('🔍 No filters active, showing all content');
      setFilteredContent(contentFeed);
      return;
    }

    let filteredOutCount = 0;
    const filterReasons = {};

    const filtered = contentFeed.filter(content => {
      let shouldInclude = true;
      const reasons = [];
      const creator = content.creator;

      // Price range filter (new for content)
      if (activeFilters.priceRange && activeFilters.priceRange.max) {
        if (content.price > activeFilters.priceRange.max) {
          shouldInclude = false;
          reasons.push(`price $${content.price} exceeds max $${activeFilters.priceRange.max}`);
        }
      }

      // Free content only filter (new for content)
      if (activeFilters.freeOnly && content.isPaid) {
        shouldInclude = false;
        reasons.push('paid content excluded');
      }

      // Verified creators only filter
      if (activeFilters.verifiedOnly && !creator.isVerified) {
        shouldInclude = false;
        reasons.push('creator not verified');
      }

      // Content type filter (new for content)
      if (activeFilters.contentTypes && activeFilters.contentTypes.length > 0) {
        if (!activeFilters.contentTypes.includes(content.type)) {
          shouldInclude = false;
          reasons.push(
            `contentType "${content.type}" not in [${activeFilters.contentTypes.join(', ')}]`
          );
        }
      }

      // New content filter (last 30 days)
      if (activeFilters.newContentOnly) {
        const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);
        const contentDate = new Date(content.createdAt);
        if (contentDate < thirtyDaysAgo) {
          shouldInclude = false;
          reasons.push('content older than 30 days');
        }
      }

      // Log filtering decisions
      if (!shouldInclude) {
        filteredOutCount++;
        filterReasons[`${creator.displayName} - ${content.title || 'Untitled'}`] = reasons;
        console.log(
          `🔍 Filtered out content from ${creator.displayName}:`,
          reasons.join(', ')
        );
      }

      return shouldInclude;
    });

    console.log(
      `🔍 Filtered ${contentFeed.length} content pieces to ${filtered.length}`
    );
    console.log(`🔍 Filtered out ${filteredOutCount} content pieces`);
    if (filteredOutCount > 0) {
      console.log('🔍 Filter reasons:', filterReasons);
    }

    setFilteredContent(filtered);

    // Reset current index if it's out of bounds
    if (currentIndex >= filtered.length && filtered.length > 0) {
      setCurrentIndex(0);
      // Remove key increment to prevent component remounting
    }
  };

  // Handle swipe from SwipeCard (Content Mode)
  const handleSwipe = async (direction, contentId) => {
    console.log(`👆 Swiping ${direction} on content ${contentId}`);
    const content = filteredContent[currentIndex];
    if (!content) return;

    try {
      // Handle swipe up - view creator profile
      if (direction === 'up') {
        handleViewCreatorProfile(content.creator);
        return;
      }

      // For content swiping, we don't need to make API calls
      // Just handle UI transitions (like/pass on individual content)
      console.log(`👆 Content ${direction === 'right' ? 'liked' : 'passed'}`);

      // Could add analytics tracking here:
      // await memberService.trackContentInteraction(contentId, direction);

    } catch (error) {
      console.error('❌ Error processing content swipe:', error);
      // Continue with UI updates even if tracking fails
    }

    // Add to history
    setSwipeHistory([...swipeHistory, { content, action: direction }]);

    // Move to next content after animation completes
    setTimeout(() => {
      if (currentIndex < filteredContent.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Remove key increment to prevent component remounting
      } else if (hasMoreContent) {
        // Load more content when reaching the end
        loadContentFeed(currentPage + 1);
        setCurrentPage(prev => prev + 1);
      }
    }, 300);
  };

  // Handle content purchase
  const handleContentPurchase = async (content) => {
    console.log('💰 Purchasing content:', content.title, 'for', content.price, 'credits');

    try {
      // Attempt to purchase content with credits
      const response = await memberService.purchaseContent(content._id, 'credits');

      if (response.success) {
        console.log('✅ Content purchased successfully!');
        // Refresh content to show unlocked state
        loadContentFeed();
      }

    } catch (error) {
      console.error('❌ Error purchasing content:', error);

      // Check if this is an insufficient funds error
      if (error.message && error.message.includes('Insufficient credits')) {
        console.log('💳 Insufficient credits, showing purchase modal');
        setPendingPurchase(content);
        setShowCreditPurchaseModal(true);
      } else {
        alert('Purchase failed. Please try again.');
      }
    }
  };

  // Handle successful credit purchase - retry content purchase
  const handleCreditPurchaseSuccess = async () => {
    setShowCreditPurchaseModal(false);

    if (pendingPurchase) {
      console.log('🔄 Retrying content purchase after credit top-up');
      // Wait a moment for payment to process
      setTimeout(async () => {
        try {
          const response = await memberService.purchaseContent(pendingPurchase._id, 'credits');
          if (response.success) {
            console.log('✅ Content purchased successfully after credit top-up!');
            loadContentFeed();
          }
        } catch (error) {
          console.error('❌ Error purchasing content after credit top-up:', error);
          alert('Purchase failed after adding credits. Please try again.');
        }
        setPendingPurchase(null);
      }, 1000);
    }
  };

  // Handle credit purchase modal close
  const handleCreditPurchaseClose = () => {
    setShowCreditPurchaseModal(false);
    setPendingPurchase(null);
  };

  // Handle modal state changes from SwipeCard
  const handleModalStateChange = (modalOpen) => {
    setIsModalOpen(modalOpen);
  };

  // Handle button clicks (Content Mode)
  const handleButtonSwipe = direction => {
    if (!filteredContent[currentIndex]) return;
    handleSwipe(direction, filteredContent[currentIndex]._id);
  };

  const handleRewind = () => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;

    const newHistory = [...swipeHistory];
    newHistory.pop();
    setSwipeHistory(newHistory);
    setCurrentIndex(Math.max(0, currentIndex - 1));
    // Remove key increment to prevent component remounting
  };

  const handleViewCreatorProfile = creator => {
    // Defensive check for creator and username
    if (!creator) {
      console.error('No creator provided to handleViewCreatorProfile');
      return;
    }

    // Use username if available, otherwise fall back to _id for backwards compatibility
    const identifier = creator.username || creator._id;

    if (!identifier) {
      console.error('Creator has no username or _id:', creator);
      return;
    }

    console.log('Navigating to creator profile:', identifier);
    navigate(`/creator/${identifier}`);
  };

  const handleResetFilters = async () => {
    try {
      // Define default filters (same as BrowseFilters.jsx)
      const defaultFilters = {
        ageRange: { min: 18, max: 99 },
        location: '',
        bodyTypes: [],
        onlineOnly: false,
        newMembersOnly: false,
      };

      // Clear localStorage
      localStorage.setItem('browseFilters', JSON.stringify(defaultFilters));

      // Update local state
      setActiveFilters(defaultFilters);
      setHasActiveFilters(false);

      // Clear filters on server
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.post(
            '/api/v1/members/browse/preferences',
            defaultFilters,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (apiError) {
          console.warn('Failed to reset filters on server:', apiError);
        }
      }

      // Reload content feed with default filters
      await loadContentFeed();
    } catch (error) {
      console.error('Error resetting filters:', error);
      // Fallback: just clear local state
      setActiveFilters({});
      setHasActiveFilters(false);
    }
  };

  const currentContent = filteredContent?.[currentIndex];

  // Add visual indicators for content (paid only)
  const getContentIndicators = content => {
    const indicators = [];

    if (content.isPaid) {
      indicators.push({
        type: 'paid',
        text: `$${content.price}`,
        color: '#17D2C2',
      });
    }

    return indicators;
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className='browse-creators-page'>
        <div className='browse-creators-loading'>
          <Loader size={60} className='loading-spinner' />
          <h2>Checking authentication...</h2>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className='browse-creators-page'>
        <div className='browse-creators-loading'>
          <Loader size={60} className='loading-spinner' />
          <h2>Loading content feed...</h2>
          <p>Getting the latest posts for you</p>
        </div>
      </div>
    );
  }

  // No content found (filters too restrictive)
  if (!currentContent && filteredContent.length === 0 && hasActiveFilters) {
    return (
      <div className='browse-creators-page'>
        {/* Desktop Header */}
        {isDesktop && <MainHeader />}
        <div className='browse-creators-no-results'>
          <Filter size={60} />
          <h2>No content matches your filters</h2>
          <p>Try adjusting your browse settings to see more posts</p>
          <button
            onClick={handleResetFilters}
            className='browse-reset-filters-btn'
          >
            Reset Filters
          </button>
        </div>
        {/* Desktop Footer */}
        {isDesktop && <MainFooter />}
        {/* Bottom Navigation - Mobile Only */}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </div>
    );
  }

  // No more content available
  if (!currentContent) {
    return (
      <div className='browse-creators-page'>
        {/* Desktop Header */}
        {isDesktop && <MainHeader />}
        <div className='browse-creators-no-more-cards'>
          <Star size={60} />
          <h2>No More Posts or Content</h2>
          <p>Check back later for new content</p>
          <button
            onClick={() => window.location.reload()}
            className='browse-refresh-btn'
          >
            Refresh
          </button>
        </div>
        {/* Desktop Footer */}
        {isDesktop && <MainFooter />}

        {/* Bottom Navigation - Mobile Only */}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </div>
    );
  }

  return (
    <div className='browse-creators-page'>
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Content Stack using SwipeCard component */}
      <div className='browse-creators-card-stack'>
        {filteredContent
          .slice(currentIndex, currentIndex + 3)
          .map((content, index) => (
            <div
              key={`${content._id}-${currentIndex + index}`}
              className='browse-creators-card-wrapper'
              style={{
                position: 'absolute',
                zIndex: 3 - index,
                transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
                opacity: index < 2 ? 1 : 0,
              }}
            >
              {/* Show content indicators (price, free, new) */}
              {index === 0 && getContentIndicators(content).length > 0 && (
                <div className='card-indicators'>
                  {getContentIndicators(content).map((indicator, i) => (
                    <div
                      key={i}
                      className='indicator-badge'
                      style={{ backgroundColor: indicator.color }}
                    >
                      {indicator.text}
                    </div>
                  ))}
                </div>
              )}

              <SwipeCard
                content={content}
                onSwipe={handleSwipe}
                onViewProfile={handleViewCreatorProfile}
                onPurchase={handleContentPurchase}
                onModalStateChange={handleModalStateChange}
                isTop={index === 0}
                dragEnabled={index === 0}
                showActions={true}
                minimalView={false}
              />
            </div>
          ))}
      </div>

      {/* Action Buttons - Hide when modal is open */}
      {!isModalOpen && !showCreditPurchaseModal && (
        <div className='browse-creators-action-buttons'>
        <button
          className='browse-creators-action-btn browse-creators-rewind'
          onClick={handleRewind}
          disabled={swipeHistory.length === 0}
          aria-label='Rewind'
        >
          <RotateCcw size={24} />
        </button>

        <button
          className='browse-creators-action-btn browse-creators-pass'
          onClick={() => handleButtonSwipe('left')}
          aria-label='Pass'
        >
          <X size={30} />
        </button>

        <button
          className='browse-creators-action-btn browse-creators-like'
          onClick={() => handleButtonSwipe('right')}
          aria-label='Like'
        >
          <Heart size={28} />
        </button>

        <button
          className='browse-creators-action-btn browse-creators-info'
          onClick={() => handleViewCreatorProfile(currentContent?.creator)}
          aria-label='View Creator Profile'
        >
          <Info size={24} />
        </button>
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && (
        <ConnectionModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
          connectionType={connectionType}
          connectionData={connectionData}
          userRole='member'
        />
      )}

      {/* Credit Purchase Modal - shown when insufficient credits for content purchase */}
      {showCreditPurchaseModal && (
        <CreditPurchaseModal
          isOpen={showCreditPurchaseModal}
          onClose={handleCreditPurchaseClose}
          onSuccess={handleCreditPurchaseSuccess}
          pendingPurchase={pendingPurchase}
        />
      )}

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default BrowseCreators;
