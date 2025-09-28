import React from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Video,
  Eye,
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
} from 'lucide-react';
import './TopContent.css';

const TopContent = ({
  content = [],
  loading = false,
  showHeader = true,
  title = "Top Performing Content",
  onContentClick,
  className = ''
}) => {
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleContentClick = (contentItem) => {
    if (onContentClick) {
      onContentClick(contentItem);
    }
  };

  if (loading) {
    return (
      <div className={`TopContent ${className}`}>
        {showHeader && (
          <div className="TopContent-header">
            <h3 className="TopContent-title">{title}</h3>
          </div>
        )}
        <div className="TopContent-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="TopContent-item TopContent-skeleton">
              <div className="TopContent-preview-skeleton">
                <div className="TopContent-image-skeleton" />
                <div className="TopContent-overlay-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`TopContent ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      {showHeader && (
        <div className="TopContent-header">
          <h3 className="TopContent-title">{title}</h3>
        </div>
      )}

      <div className="TopContent-grid">
        {content.length === 0 ? (
          <div className="TopContent-empty">
            <TrendingUp size={48} />
            <h4>No content data available</h4>
            <p>Upload content to see performance metrics</p>
          </div>
        ) : (
          content.slice(0, 4).map((contentItem, index) => (
            <motion.div
              key={contentItem.id || contentItem._id || index}
              className="TopContent-item"
              onClick={() => handleContentClick(contentItem)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <div className="TopContent-preview">
                <div className="TopContent-image-container">
                  {contentItem.thumbnailUrl || contentItem.mediaUrl ? (
                    <img
                      src={contentItem.thumbnailUrl || contentItem.mediaUrl}
                      alt={contentItem.title || `Content ${index + 1}`}
                      className="TopContent-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div
                    className="TopContent-placeholder"
                    style={{
                      display: (contentItem.thumbnailUrl || contentItem.mediaUrl) ? 'none' : 'flex'
                    }}
                  >
                    {contentItem.contentType === 'video' || contentItem.type === 'video' ? (
                      <Video size={24} />
                    ) : (
                      <Camera size={24} />
                    )}
                  </div>

                  <div className="TopContent-overlay">
                    <div className="TopContent-type-badge">
                      {contentItem.contentType === 'video' || contentItem.type === 'video' ? (
                        <Video size={12} />
                      ) : (
                        <Camera size={12} />
                      )}
                    </div>

                    <div className="TopContent-stats">
                      <div className="TopContent-stat">
                        <Eye size={12} />
                        <span>{formatNumber(contentItem.views || contentItem.totalViews || 0)}</span>
                      </div>
                      <div className="TopContent-stat">
                        <DollarSign size={12} />
                        <span>{formatCurrency(contentItem.earnings || contentItem.revenue || 0)}</span>
                      </div>
                    </div>

                    {contentItem.price && (
                      <div className="TopContent-price">
                        {formatCurrency(contentItem.price)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="TopContent-info">
                  <h4 className="TopContent-content-title">
                    {contentItem.title || `Content ${index + 1}`}
                  </h4>

                  <div className="TopContent-metadata">
                    <div className="TopContent-date">
                      <Calendar size={12} />
                      <span>{formatDate(contentItem.createdAt)}</span>
                    </div>

                    {contentItem.likes > 0 && (
                      <div className="TopContent-likes">
                        <Star size={12} />
                        <span>{formatNumber(contentItem.likes)}</span>
                      </div>
                    )}
                  </div>

                  <div className="TopContent-performance">
                    <div className="TopContent-metric">
                      <span className="TopContent-metric-label">Views</span>
                      <span className="TopContent-metric-value">
                        {formatNumber(contentItem.views || contentItem.totalViews || 0)}
                      </span>
                    </div>
                    <div className="TopContent-metric">
                      <span className="TopContent-metric-label">Earned</span>
                      <span className="TopContent-metric-value">
                        {formatCurrency(contentItem.earnings || contentItem.revenue || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TopContent;