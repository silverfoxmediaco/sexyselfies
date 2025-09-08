import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Star, RotateCcw, Info, Filter, Loader } from 'lucide-react';
import SwipeCard from '../components/SwipeCard';
import ConnectionModal from '../components/ConnectionModal';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import memberService from '../services/member.service.js';
import api from '../services/api.config.js';
import './BrowseCreators.css';

const BrowseCreators = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [creators, setCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
      console.log('📱 User authenticated, loading data...');
      loadFilters();
      loadCreators();
      loadExistingConnections();
    }
  }, [isAuthenticated]);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersToCreators();
  }, [creators, activeFilters]);

  // Check if user is authenticated
  const checkAuthentication = () => {
    console.log('🔐 Checking authentication...');
    
    // Check for token in localStorage
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('memberToken');
    const userRole = localStorage.getItem('userRole');
    
    console.log('🔑 Token found:', !!token);
    console.log('👤 User role:', userRole);
    
    if (!token) {
      console.log('❌ No token found, redirecting to login...');
      // For development, set mock authentication
      if (import.meta.env.DEV || 
          window.location.hostname.includes('onrender.com')) {
        console.log('🔧 Development mode: Setting mock authentication');
        localStorage.setItem('token', 'dev-token-' + Date.now());
        localStorage.setItem('userRole', 'member');
        setIsAuthenticated(true);
      } else {
        navigate('/member/login');
      }
    } else if (userRole !== 'member') {
      console.log('❌ Wrong user role:', userRole);
      navigate('/member/login');
    } else {
      console.log('✅ Authentication confirmed');
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
            return Object.values(value).some(v => v !== null && v !== undefined);
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

  // Load creators from API
  const loadCreators = async () => {
    console.log('🎯 Loading creators...');
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      // Add auth header debugging
      const token = localStorage.getItem('token') || localStorage.getItem('memberToken');
      console.log('🔑 Using token for API call:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      const response = await memberService.getSwipeStack();
      console.log('📦 API Response:', response);

      if (response && (response.success || response.data || response.creators)) {
        const creatorsData = response.data || response.creators || [];
        console.log(`✅ Found ${creatorsData.length} creators`);
        
        // Transform creator data to match expected structure
        const transformedCreators = creatorsData.map(creator => ({
          id: creator._id || creator.id,
          _id: creator._id || creator.id,
          profileImage: creator.profileImage || creator.profilePhoto || '/placeholders/beaufitulbrunette1.png',
          displayName: creator.displayName || creator.name || 'Unknown',
          age: creator.age || 25,
          verified: creator.isVerified || false,
          isOnline: creator.isOnline || false,
          gender: creator.gender || 'female',
          bodyType: creator.bodyType || 'Average',
          ethnicity: creator.ethnicity || 'Not specified',
          hairColor: creator.hairColor || 'Brown',
          height: creator.height || 65,
          bio: creator.bio || '',
          location: creator.location || { city: 'Unknown', state: '', distance: 0 },
          lastActive: creator.lastActive || new Date(),
          createdAt: creator.createdAt || new Date(),
          // Additional fields for connections
          hasMessaged: creator.hasMessaged || false,
          hasPoked: creator.hasPoked || false,
          isTopCreator: creator.isTopCreator || false,
          monthlyEarnings: creator.monthlyEarnings || 0,
          messagePreview: creator.messagePreview || null
        }));
        
        setCreators(transformedCreators);
        setFilteredCreators(transformedCreators);
        console.log('✅ Creators loaded and transformed');
      } else {
        throw new Error(response?.message || 'No creators found');
      }
    } catch (error) {
      console.error('❌ Error loading creators:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Check if it's an auth error
      if (error.response?.status === 401 || error.code === 'UNAUTHORIZED') {
        console.log('🔐 Authentication error, using mock data');
      }
      
      setLoadingError(error.message || 'Failed to load creators');
      
      // No creators found or error loading
      setCreators([]);
      setFilteredCreators([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing connections and messages
  const loadExistingConnections = async () => {
    console.log('🔗 Loading existing connections...');
    try {
      const response = await api.get('/connections');
      console.log('🔗 Connections response:', response);

      if (response.success) {
        // Process connections into lookup objects
        const connections = {};
        const messages = {};
        
        response.data?.forEach(conn => {
          const creatorId = conn.creator?._id || conn.creator;
          connections[creatorId] = {
            hasPoked: conn.creatorLiked || false,
            hasLiked: conn.memberLiked || false,
            isConnected: conn.isConnected || false
          };
          
          if (conn.lastMessagePreview) {
            messages[creatorId] = {
              hasMessage: true,
              messageCount: conn.messageCount || 0,
              lastMessage: conn.lastMessagePreview.content
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

  // Apply filters to creators
  const applyFiltersToCreators = () => {
    console.log('🔍 Applying filters...');
    if (!creators || creators.length === 0) {
      setFilteredCreators([]);
      return;
    }

    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      setFilteredCreators(creators);
      return;
    }

    const filtered = creators.filter(creator => {
      // Age filter
      if (activeFilters.ageRange) {
        const { min, max } = activeFilters.ageRange;
        if (creator.age < min || creator.age > max) {
          return false;
        }
      }

      // Distance filter
      if (activeFilters.distanceEnabled && activeFilters.distance) {
        if (creator.location?.distance > activeFilters.distance) {
          return false;
        }
      }

      // Body type filter
      if (activeFilters.bodyTypes && activeFilters.bodyTypes.length > 0) {
        if (!activeFilters.bodyTypes.includes(creator.bodyType)) {
          return false;
        }
      }

      // Height filter
      if (activeFilters.height) {
        const { min, max } = activeFilters.height;
        if (min && creator.height < min) return false;
        if (max && creator.height > max) return false;
      }

      // Ethnicity filter
      if (activeFilters.ethnicities && activeFilters.ethnicities.length > 0) {
        if (!activeFilters.ethnicities.includes(creator.ethnicity)) {
          return false;
        }
      }

      // Hair color filter
      if (activeFilters.hairColors && activeFilters.hairColors.length > 0) {
        if (!activeFilters.hairColors.includes(creator.hairColor)) {
          return false;
        }
      }

      // Online only filter
      if (activeFilters.onlineOnly && !creator.isOnline) {
        return false;
      }

      // Verified only filter
      if (activeFilters.verifiedOnly && !creator.verified) {
        return false;
      }

      // New members only filter
      if (activeFilters.newMembersOnly) {
        const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);
        const createdDate = new Date(creator.createdAt);
        if (createdDate < thirtyDaysAgo) {
          return false;
        }
      }

      return true;
    });

    console.log(`🔍 Filtered ${creators.length} creators to ${filtered.length}`);
    setFilteredCreators(filtered);
    
    // Reset current index if it's out of bounds
    if (currentIndex >= filtered.length && filtered.length > 0) {
      setCurrentIndex(0);
      setKey(prev => prev + 1);
    }
  };

  // Handle swipe from SwipeCard
  const handleSwipe = async (direction, creatorId) => {
    console.log(`👆 Swiping ${direction} on creator ${creatorId}`);
    const creator = filteredCreators[currentIndex];
    if (!creator) return;
    
    try {
      // Make API call to process swipe
      const swipeAction = direction === 'right' ? 'like' : direction === 'up' ? 'superlike' : 'pass';
      const response = await memberService.swipeAction(creator._id || creator.id, swipeAction);
      console.log('👆 Swipe response:', response);
      
      // Check for connection in response
      if (response && response.isConnected) {
        // Show connection modal
        setConnectionType('instant_connection');
        setConnectionData({
          creatorName: creator.displayName,
          profileImage: creator.profileImage,
          creatorId: creator._id
        });
        setShowConnectionModal(true);
        console.log('💕 Connection established!');
      }
    } catch (error) {
      console.error('❌ Error processing swipe:', error);
      // Continue with UI updates even if API fails
    }
    
    // Add to history
    setSwipeHistory([...swipeHistory, { creator, action: direction }]);
    
    // Move to next creator after animation completes
    setTimeout(() => {
      if (currentIndex < filteredCreators.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setKey(prev => prev + 1);
      }
    }, 300);
  };

  // Handle button clicks
  const handleButtonSwipe = (direction) => {
    if (!filteredCreators[currentIndex]) return;
    handleSwipe(direction, filteredCreators[currentIndex]._id);
  };

  const handleRewind = () => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;
    
    const newHistory = [...swipeHistory];
    newHistory.pop();
    setSwipeHistory(newHistory);
    setCurrentIndex(Math.max(0, currentIndex - 1));
    setKey(prev => prev + 1);
  };

  const handleViewProfile = (creator) => {
    // Defensive check for creator and username
    if (!creator) {
      console.error('No creator provided to handleViewProfile');
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

  const currentCreator = filteredCreators?.[currentIndex];

  // Add visual indicators for creators who have already shown interest
  const getCardIndicators = (creator) => {
    const indicators = [];
    
    if (creator.hasMessaged || existingMessages?.[creator._id]) {
      indicators.push({
        type: 'message',
        text: 'Messaged You!',
        color: '#17D2C2'
      });
    }
    
    if (creator.hasPoked || existingConnections?.[creator._id]?.hasPoked) {
      indicators.push({
        type: 'poke',
        text: 'Poked You!',
        color: '#FFD700'
      });
    }
    
    if (creator.isTopCreator) {
      indicators.push({
        type: 'top',
        text: 'Top Creator',
        color: '#FF006E'
      });
    }
    
    return indicators;
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="browse-creators-page">
        <div className="browse-creators-loading">
          <Loader size={60} className="loading-spinner" />
          <h2>Checking authentication...</h2>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="browse-creators-page">
        <div className="browse-creators-loading">
          <Loader size={60} className="loading-spinner" />
          <h2>Finding creators for you...</h2>
          <p>This may take a moment</p>
        </div>
      </div>
    );
  }

  // No creators found (filters too restrictive)
  if (!currentCreator && filteredCreators.length === 0 && hasActiveFilters) {
    return (
      <div className="browse-creators-page">
        {/* Desktop Header */}
        {isDesktop && <MainHeader />}
        <div className="browse-creators-no-results">
          <Filter size={60} />
          <h2>No creators match your preferences</h2>
          <p>Try adjusting your browse settings to see more profiles</p>
          <button onClick={() => setActiveFilters({})} className="browse-reset-filters-btn">
            Reset Filters
          </button>
        </div>
        {/* Desktop Footer */}
        {isDesktop && <MainFooter />}
      </div>
    );
  }

  // No more creators available
  if (!currentCreator) {
    return (
      <div className="browse-creators-page">
        {/* Desktop Header */}
        {isDesktop && <MainHeader />}
        <div className="browse-creators-no-more-cards">
          <Star size={60} />
          <h2>No more profiles</h2>
          <p>Check back later for new creators</p>
          <button onClick={() => window.location.reload()} className="browse-refresh-btn">
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
    <div className="browse-creators-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Card Stack using SwipeCard component */}
      <div className="browse-creators-card-stack">
        {filteredCreators.slice(currentIndex, currentIndex + 3).map((creator, index) => (
          <div
            key={`${creator._id}-${key}-${index}`}
            className="browse-creators-card-wrapper"
            style={{
              position: 'absolute',
              zIndex: 3 - index,
              transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
              opacity: index < 2 ? 1 : 0
            }}
          >
            {/* Show indicators on the card if they have existing interest */}
            {index === 0 && getCardIndicators(creator).length > 0 && (
              <div className="card-indicators">
                {getCardIndicators(creator).map((indicator, i) => (
                  <div 
                    key={i} 
                    className="indicator-badge"
                    style={{ backgroundColor: indicator.color }}
                  >
                    {indicator.text}
                  </div>
                ))}
              </div>
            )}
            
            <SwipeCard
              creator={creator}
              onSwipe={handleSwipe}
              onViewProfile={handleViewProfile}
              isTop={index === 0}
              dragEnabled={index === 0}
              showActions={true}
              minimalView={true}
            />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="browse-creators-action-buttons">
        <button 
          className="browse-creators-action-btn browse-creators-rewind"
          onClick={handleRewind}
          disabled={swipeHistory.length === 0}
          aria-label="Rewind"
        >
          <RotateCcw size={24} />
        </button>
        
        <button 
          className="browse-creators-action-btn browse-creators-pass"
          onClick={() => handleButtonSwipe('left')}
          aria-label="Pass"
        >
          <X size={30} />
        </button>
        
        <button 
          className="browse-creators-action-btn browse-creators-super"
          onClick={() => handleButtonSwipe('up')}
          aria-label="Super Like"
        >
          <Star size={26} />
        </button>
        
        <button 
          className="browse-creators-action-btn browse-creators-like"
          onClick={() => handleButtonSwipe('right')}
          aria-label="Like"
        >
          <Heart size={28} />
        </button>
        
        <button 
          className="browse-creators-action-btn browse-creators-info"
          onClick={() => handleViewProfile(currentCreator)}
          aria-label="View Profile"
        >
          <Info size={24} />
        </button>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <ConnectionModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
          connectionType={connectionType}
          connectionData={connectionData}
          userRole="member"
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