import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Star, RotateCcw, Info, Filter, Loader } from 'lucide-react';
import SwipeCard from '../components/SwipeCard';
import ConnectionModal from '../components/ConnectionModal';
import axios from 'axios';
import './BrowseCreators.css';

const BrowseCreators = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  
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

  // Load creators and filters on component mount
  useEffect(() => {
    loadFilters();
    loadCreators();
    loadExistingConnections();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersToCreators();
  }, [creators, activeFilters]);

  // Load saved filters from localStorage
  const loadFilters = () => {
    try {
      const savedFilters = localStorage.getItem('browseFilters');
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        setActiveFilters(filters);
        
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
      console.error('Error loading filters:', error);
    }
  };

  // Load creators from API
  const loadCreators = async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/connections/stack', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCreators(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load creators');
      }
    } catch (error) {
      console.error('Error loading creators:', error);
      setLoadingError(error.response?.data?.message || 'Failed to load creators');
      
      // Fallback to mock data for development
      const mockCreators = [
        {
          id: '1',
          profilePhoto: '/placeholders/beaufitulbrunette1.png',
          displayName: 'Sophia',
          age: 24,
          verified: true,
          isOnline: true,
          gender: 'female',
          bodyType: 'Athletic',
          ethnicity: 'Caucasian',
          hairColor: 'Brown',
          height: 66, // 5'6"
          location: { city: 'Los Angeles', state: 'CA', distance: 15 },
          hasMessaged: true,
          messagePreview: "Hey! I noticed you liked my content...",
          lastActive: new Date(),
          createdAt: new Date(Date.now() - 86400000 * 10) // 10 days ago
        },
        {
          id: '2',
          profilePhoto: '/placeholders/beautifulbrunette2.png',
          displayName: 'Isabella',
          age: 22,
          verified: true,
          isOnline: false,
          gender: 'female',
          bodyType: 'Slim',
          ethnicity: 'Hispanic/Latino',
          hairColor: 'Black',
          height: 64, // 5'4"
          location: { city: 'Miami', state: 'FL', distance: 23 },
          lastActive: new Date(Date.now() - 3600000),
          hasPoked: true,
          createdAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
        },
        {
          id: '3',
          profilePhoto: '/placeholders/beautifulbrunette4.png',
          displayName: 'Emma',
          age: 26,
          verified: true,
          isOnline: true,
          gender: 'female',
          bodyType: 'Curvy',
          ethnicity: 'Caucasian',
          hairColor: 'Blonde',
          height: 68, // 5'8"
          location: { city: 'New York', state: 'NY', distance: 8 },
          isTopCreator: true,
          monthlyEarnings: 15000,
          lastActive: new Date(),
          createdAt: new Date(Date.now() - 86400000 * 45) // 45 days ago
        },
        {
          id: '4',
          profilePhoto: '/placeholders/cuteblondeselfie1.png',
          displayName: 'Ashley',
          age: 23,
          verified: false,
          isOnline: true,
          gender: 'female',
          bodyType: 'Average',
          ethnicity: 'Asian',
          hairColor: 'Blonde',
          height: 62, // 5'2"
          location: { city: 'San Francisco', state: 'CA', distance: 45 },
          lastActive: new Date(),
          createdAt: new Date(Date.now() - 86400000 * 15) // 15 days ago
        },
        {
          id: '5',
          profilePhoto: '/placeholders/beaufitulbrunette1.png',
          displayName: 'Mia',
          age: 25,
          verified: true,
          isOnline: false,
          gender: 'female',
          bodyType: 'Plus Size',
          ethnicity: 'Black',
          hairColor: 'Black',
          height: 65, // 5'5"
          location: { city: 'Chicago', state: 'IL', distance: 12 },
          lastActive: new Date(Date.now() - 7200000),
          hasMessaged: true,
          messagePreview: "I have exclusive content just for you!",
          createdAt: new Date(Date.now() - 86400000 * 3) // 3 days ago
        },
        {
          id: '6',
          profilePhoto: '/placeholders/beautifulbrunette2.png',
          displayName: 'Olivia',
          age: 21,
          verified: false,
          isOnline: true,
          gender: 'female',
          bodyType: 'Slender',
          ethnicity: 'Mixed',
          hairColor: 'Brown',
          height: 67, // 5'7"
          location: { city: 'Austin', state: 'TX', distance: 78 },
          lastActive: new Date(),
          createdAt: new Date(Date.now() - 86400000 * 1) // 1 day ago
        }
      ];
      
      setCreators(mockCreators);
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing connections and messages
  const loadExistingConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/members/connections', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const { messages, connections } = response.data;
        setExistingMessages(messages);
        setExistingConnections(connections);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      
      // Fallback mock data
      const mockExistingMessages = {
        '1': { 
          hasMessage: true, 
          messageCount: 3,
          lastMessage: "Hey! I noticed you liked my content..."
        },
        '5': { 
          hasMessage: true, 
          messageCount: 1,
          lastMessage: "I have exclusive content just for you!"
        }
      };
      
      const mockExistingConnections = {
        '2': { hasPoked: true, pokedAt: Date.now() - 7200000 }
      };
      
      setExistingMessages(mockExistingMessages);
      setExistingConnections(mockExistingConnections);
    }
  };

  // Apply filters to creators
  const applyFiltersToCreators = () => {
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

    setFilteredCreators(filtered);
    
    // Reset current index if it's out of bounds
    if (currentIndex >= filtered.length) {
      setCurrentIndex(0);
      setKey(prev => prev + 1);
    }
  };

  // Check for existing connections when swiping
  const checkForConnection = (direction, creator) => {
    // Check if this is a mutual connection
    if (direction === 'right' || direction === 'super') {
      // Check if creator already messaged the member
      if (creator.hasMessaged || existingMessages?.[creator._id]) {
        return {
          type: 'mutual_interest',
          data: {
            creatorName: creator.displayName,
            profilePhoto: creator.profilePhoto,
            message: creator.messagePreview || existingMessages?.[creator._id]?.lastMessage
          }
        };
      }
      
      // Check if creator already poked
      if (creator.hasPoked || existingConnections?.[creator._id]?.hasPoked) {
        return {
          type: 'creator_poke',
          data: {
            creatorName: creator.displayName,
            profilePhoto: creator.profilePhoto
          }
        };
      }
      
      // Check if this is a top creator
      if (creator.isTopCreator) {
        return {
          type: 'high_value_connection',
          data: {
            creatorName: creator.displayName,
            profilePhoto: creator.profilePhoto,
            earnings: creator.monthlyEarnings
          }
        };
      }
      
      // Check if this is first connection
      if (swipeHistory.filter(h => h.action === 'right' || h.action === 'super').length === 0) {
        return {
          type: 'first_connection',
          data: {
            creatorName: creator.displayName,
            profilePhoto: creator.profilePhoto
          }
        };
      }
      
      // Regular connection
      return {
        type: 'instant_connection',
        data: {
          creatorName: creator.displayName,
          profilePhoto: creator.profilePhoto
        }
      };
    }
    
    return null;
  };

  // Handle swipe from SwipeCard
  const handleSwipe = (direction, creatorId) => {
    const creator = filteredCreators[currentIndex];
    
    // Check for special connections
    const connection = checkForConnection(direction, creator);
    
    if (connection) {
      // Show exciting connection modal
      setConnectionType(connection.type);
      setConnectionData(connection.data);
      setShowConnectionModal(true);
      
      // Log the connection
      console.log('Connection made:', connection);
      
      // Here you would make API call to create the connection
      // await createConnection(creator._id, connection.type);
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
    handleSwipe(direction, filteredCreators[currentIndex]?._id);
  };

  const handleRewind = () => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;
    
    const newHistory = [...swipeHistory];
    newHistory.pop();
    setSwipeHistory(newHistory);
    setCurrentIndex(Math.max(0, currentIndex - 1));
    setKey(prev => prev + 1);
  };

  const handleViewProfile = (creatorId) => {
    navigate(`/creator/${creatorId}`);
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

  // Error state
  if (loadingError) {
    return (
      <div className="browse-creators-page">
        <div className="browse-creators-error">
          <X size={60} />
          <h2>Something went wrong</h2>
          <p>{loadingError}</p>
          <button onClick={loadCreators}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No creators found (filters too restrictive)
  if (!currentCreator && filteredCreators.length === 0 && hasActiveFilters) {
    return (
      <div className="browse-creators-page">
        <div className="browse-creators-no-results">
          <Filter size={60} />
          <h2>No creators match your preferences</h2>
          <p>Try adjusting your browse settings to see more profiles</p>
        </div>
      </div>
    );
  }

  // No more creators available
  if (!currentCreator) {
    return (
      <div className="browse-creators-page">
        <div className="browse-creators-no-more-cards">
          <Star size={60} />
          <h2>No more profiles</h2>
          <p>Check back later for new creators</p>
          <button onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-creators-page">
      {/* Card Stack using SwipeCard component */}
      <div className="browse-creators-card-stack">
        {filteredCreators.slice(currentIndex, currentIndex + 3).map((creator, index) => (
          <div
            key={`${creator._id}-${key}`}
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
              showActions={false}
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
          onClick={() => handleButtonSwipe('super')}
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
          onClick={() => handleViewProfile(currentCreator._id)}
          aria-label="View Profile"
        >
          <Info size={24} />
        </button>
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        connectionType={connectionType}
        connectionData={connectionData}
        userRole="member"
      />
    </div>
  );
};

export default BrowseCreators;