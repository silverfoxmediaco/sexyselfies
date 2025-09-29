import React, { useState, useEffect } from 'react';
import { TrendingUp, Eye, DollarSign, Heart, BarChart, Camera, Video, ChevronRight } from 'lucide-react';
import creatorService from '../services/creator.service';
import './TopPerformingContent.css';

const TopPerformingContent = ({
  limit = 5,
  timeRange = 'month',
  onContentClick,
  showMetrics = true,
  className = '',
  onTimeRangeChange
}) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopContent();
  }, [timeRange, limit]);

  const fetchTopContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call to get top performing content
      const response = await creatorService.getTopPerformingContent({
        timeRange,
        limit,
        sortBy: 'revenue' // or 'views', 'engagement'
      });

      if (response && !response.error) {
        setContent(response.data || response);
      } else {
        throw new Error(response?.message || 'Failed to fetch content');
      }
    } catch (err) {
      console.error('Failed to fetch top content:', err);
      setError('Failed to load content');
      // Set fallback data for development
      setContent([
        {
          id: 'demo1',
          title: 'Sample Content 1',
          type: 'photo',
          views: 1245,
          revenue: 89.50,
          likes: 156,
          purchases: 23,
          thumbnail: null,
          createdAt: '2025-01-15'
        },
        {
          id: 'demo2',
          title: 'Sample Content 2',
          type: 'video',
          views: 892,
          revenue: 156.25,
          likes: 203,
          purchases: 31,
          thumbnail: null,
          createdAt: '2025-01-14'
        },
        {
          id: 'demo3',
          title: 'Sample Content 3',
          type: 'photo',
          views: 567,
          revenue: 67.80,
          likes: 89,
          purchases: 15,
          thumbnail: null,
          createdAt: '2025-01-13'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value, type) => {
    if (type === 'currency') {
      return `$${(value || 0).toFixed(2)}`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value || 0;
  };

  const handleTimeRangeChange = (newTimeRange) => {
    if (onTimeRangeChange) {
      onTimeRangeChange(newTimeRange);
    }
  };

  const getContentIcon = (type) => {
    return type === 'video' ? <Video size={16} /> : <Camera size={16} />;
  };

  return (
    <div className={`TopPerformingContent ${className}`}>
      <div className="TopPerformingContent-header">
        <h2>
          <TrendingUp size={20} />
          Top Performing Content
        </h2>
        <select
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          className="TopPerformingContent-filter"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="TopPerformingContent-list">
        {loading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="TopPerformingContent-skeleton">
              <div className="TopPerformingContent-skeleton-rank"></div>
              <div className="TopPerformingContent-skeleton-image"></div>
              <div className="TopPerformingContent-skeleton-content">
                <div className="TopPerformingContent-skeleton-title"></div>
                <div className="TopPerformingContent-skeleton-metrics"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="TopPerformingContent-error">
            <BarChart size={48} />
            <p>{error}</p>
            <button onClick={fetchTopContent} className="retry-btn">
              Try Again
            </button>
          </div>
        ) : content.length > 0 ? (
          content.map((item, index) => (
            <div
              key={item.id}
              className="TopPerformingContent-item"
              onClick={() => onContentClick && onContentClick(item)}
            >
              <div className="TopPerformingContent-rank">
                #{index + 1}
              </div>

              <div className="TopPerformingContent-thumbnail">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} loading="lazy" />
                ) : (
                  <div className="TopPerformingContent-thumbnail-placeholder">
                    {getContentIcon(item.type)}
                  </div>
                )}
                <div className="TopPerformingContent-type-badge">
                  {getContentIcon(item.type)}
                </div>
              </div>

              <div className="TopPerformingContent-details">
                <h4>{item.title || `Content ${index + 1}`}</h4>

                {showMetrics && (
                  <div className="TopPerformingContent-metrics">
                    <span className="TopPerformingContent-metric">
                      <Eye size={14} />
                      {formatMetric(item.views)}
                    </span>
                    <span className="TopPerformingContent-metric revenue">
                      <DollarSign size={14} />
                      {formatMetric(item.revenue, 'currency')}
                    </span>
                    <span className="TopPerformingContent-metric">
                      <Heart size={14} />
                      {formatMetric(item.likes)}
                    </span>
                  </div>
                )}

                <div className="TopPerformingContent-summary">
                  <span className="purchases">{item.purchases} purchases</span>
                  <span className="date">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {onContentClick && (
                <div className="TopPerformingContent-action">
                  <ChevronRight size={16} />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="TopPerformingContent-empty">
            <BarChart size={48} />
            <h3>No content data available yet</h3>
            <p>Upload content to see performance metrics</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformingContent;