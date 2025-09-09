import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Flame, Star, Heart, MessageCircle, Users, 
  MapPin, ArrowLeft, Filter, Loader, AlertCircle,
  Sparkles, Crown, Zap, Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './TrendingCreators.css';

const TrendingCreators = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  
  // State management
  const [trendingCreators, setTrendingCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, all-time
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, earnings, engagement, growth
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters] = useState({
    verified: false,
    newCreators: false,
    location: '',
    minAge: 18,
    maxAge: 35
  });

  // Load trending creators on component mount and when period/category changes
  useEffect(() => {
    loadTrendingCreators();
  }, [selectedPeriod, selectedCategory]);

  // Load trending creators from API
  const loadTrendingCreators = async () => {
    setIsLoading(true);
    setLoadingError(null);
    

    // Production API call
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/creator/trending', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          period: selectedPeriod,
          category: selectedCategory,
          ...filters
        }
      });

      if (response.data.success) {
        setTrendingCreators(response.data.creators);
      } else {
        throw new Error(response.data.message || 'Failed to load trending creators');
      }
    } catch (error) {
      console.error('Error loading trending creators:', error);
      setLoadingError(error.response?.data?.message || 'Failed to load trending creators');
      setTrendingCreators([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creator card click
  const handleCreatorClick = (creator) => {
    navigate(`/creator/${creator.username}`);
  };

  // Handle like creator
  const handleLikeCreator = async (creatorId, e) => {
    e.stopPropagation();
    console.log('Like creator:', creatorId);
    // TODO: Implement like functionality
  };

  // Handle message creator
  const handleMessageCreator = async (creatorId, e) => {
    e.stopPropagation();
    navigate(`/member/messages/${creatorId}`);
  };

  // Get trending badge for creator
  const getTrendingBadge = (creator, index) => {
    if (index === 0) {
      return { icon: Crown, text: '#1 Trending', color: '#FFD700' };
    }
    if (index === 1) {
      return { icon: Trophy, text: '#2 Trending', color: '#C0C0C0' };
    }
    if (index === 2) {
      return { icon: Star, text: '#3 Trending', color: '#CD7F32' };
    }
    if (creator.isRising) {
      return { icon: TrendingUp, text: 'Rising Star', color: '#17D2C2' };
    }
    if (creator.isTopCreator) {
      return { icon: Flame, text: 'Top Creator', color: '#FF6B6B' };
    }
    return null;
  };

  // Format numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatEarnings = (earnings) => {
    if (earnings >= 1000) return `$${formatNumber(earnings)}`;
    return `$${earnings}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="trending-creators-page">
        <div className="trending-loading">
          <Loader className="spinner" size={32} />
          <span>Loading trending creators...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (loadingError) {
    return (
      <div className="trending-creators-page">
        <div className="trending-error">
          <AlertCircle size={48} />
          <h3>Error Loading Trending</h3>
          <p>{loadingError}</p>
          <button onClick={loadTrendingCreators} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-creators-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Header */}
      <div className="trending-header">
        <button 
          className="trending-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="trending-title">
          <Flame className="trending-icon" size={24} />
          <h1>Trending Creators</h1>
        </div>
        
        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Period & Category Filters */}
      <div className="trending-controls">
        <div className="period-tabs">
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all-time', label: 'All Time' }
          ].map(period => (
            <button
              key={period.key}
              className={`period-tab ${selectedPeriod === period.key ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.key)}
            >
              {period.label}
            </button>
          ))}
        </div>

        <div className="category-tabs">
          {[
            { key: 'all', label: 'All', icon: TrendingUp },
            { key: 'earnings', label: 'Top Earners', icon: Crown },
            { key: 'engagement', label: 'Most Popular', icon: Heart },
            { key: 'growth', label: 'Rising Stars', icon: Zap }
          ].map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.key}
                className={`category-tab ${selectedCategory === category.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.key)}
              >
                <Icon size={16} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending List */}
      <div className="trending-list">
        {trendingCreators.map((creator, index) => {
          const badge = getTrendingBadge(creator, index);
          const BadgeIcon = badge?.icon;
          
          return (
            <motion.div
              key={creator._id}
              className="trending-creator-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleCreatorClick(creator)}
            >
              {/* Rank & Badge */}
              <div className="creator-rank">
                <span className="rank-number">#{index + 1}</span>
                {badge && (
                  <div 
                    className="trending-badge"
                    style={{ backgroundColor: badge.color }}
                  >
                    <BadgeIcon size={12} />
                    <span>{badge.text}</span>
                  </div>
                )}
              </div>

              {/* Profile Image */}
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
              </div>

              {/* Creator Info */}
              <div className="creator-info">
                <div className="creator-main">
                  <h3 className="creator-name">{creator.displayName}</h3>
                  <p className="creator-username">@{creator.username}</p>
                  <p className="creator-bio">{creator.bio}</p>
                </div>

                <div className="creator-meta">
                  <span className="creator-age">{creator.age}</span>
                  {creator.location && (
                    <span className="creator-location">
                      <MapPin size={12} />
                      {creator.location.city}
                    </span>
                  )}
                  <span className="creator-rating">
                    <Star size={12} />
                    {creator.stats.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="creator-stats">
                <div className="stat-item">
                  <Users size={14} />
                  <span>{formatNumber(creator.stats.followers)} followers</span>
                </div>
                <div className="stat-item">
                  <TrendingUp size={14} />
                  <span>+{(creator.stats.growthRate * 100).toFixed(0)}% growth</span>
                </div>
                <div className="stat-item">
                  <Heart size={14} />
                  <span>{(creator.stats.engagementRate * 100).toFixed(0)}% engagement</span>
                </div>
                {selectedCategory === 'earnings' && (
                  <div className="stat-item earnings">
                    <Crown size={14} />
                    <span>{formatEarnings(creator.stats.totalEarnings)}/mo</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="creator-actions">
                <button
                  className="action-btn like-btn"
                  onClick={(e) => handleLikeCreator(creator._id, e)}
                  aria-label="Like"
                >
                  <Heart size={16} />
                </button>
                <button
                  className="action-btn message-btn"
                  onClick={(e) => handleMessageCreator(creator._id, e)}
                  aria-label="Message"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {trendingCreators.length === 0 && !isLoading && (
        <div className="trending-empty">
          <TrendingUp size={64} />
          <h2>No Trending Creators</h2>
          <p>Check back later for trending creators</p>
        </div>
      )}

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default TrendingCreators;