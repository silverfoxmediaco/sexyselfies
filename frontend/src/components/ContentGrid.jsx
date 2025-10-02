import React, { useState } from 'react';
import {
  Image,
  Video,
  MessageSquare,
  Edit,
  Eye,
  Share2,
  Trash2,
  Calendar,
  Heart,
  DollarSign,
  Plus
} from 'lucide-react';
import './ContentGrid.css';

const ContentGrid = ({
  content = [],
  viewMode = 'grid',
  onEdit,
  onView,
  onShare,
  onDelete,
  onSelect,
  selectable = true,
  loading = false,
  className = '',
  emptyState = null
}) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'photo':
        return <Image size={16} />;
      case 'video':
        return <Video size={16} />;
      case 'message':
        return <MessageSquare size={16} />;
      default:
        return <Image size={16} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'photo':
        return 'Photo Set';
      case 'video':
        return 'Video';
      case 'message':
        return 'Message';
      default:
        return 'Content';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price, isFree = false) => {
    return isFree || price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const handleItemSelection = (itemId) => {
    const newSelectedItems = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];

    setSelectedItems(newSelectedItems);
    if (onSelect) {
      onSelect(newSelectedItems);
    }
  };

  const handleSelectAll = () => {
    const allIds = content.map(item => item.id);
    setSelectedItems(allIds);
    if (onSelect) {
      onSelect(allIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
    if (onSelect) {
      onSelect([]);
    }
  };

  if (loading) {
    return (
      <div className={`ContentGrid ${className}`}>
        <div className={`ContentGrid-items ContentGrid-items-${viewMode}`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="ContentGrid-item ContentGrid-item-loading">
              <div className="ContentGrid-thumbnail-skeleton"></div>
              <div className="ContentGrid-info-skeleton">
                <div className="ContentGrid-title-skeleton"></div>
                <div className="ContentGrid-description-skeleton"></div>
                <div className="ContentGrid-stats-skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className={`ContentGrid ${className}`}>
        {emptyState || (
          <div className="ContentGrid-empty">
            <Plus size={48} />
            <h3>No content found</h3>
            <p>Start creating content to build your audience and earn money</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`ContentGrid ${className}`}>
      {selectable && selectedItems.length > 0 && (
        <div className="ContentGrid-selection-bar">
          <span>{selectedItems.length} selected</span>
          <div className="ContentGrid-selection-actions">
            <button onClick={handleSelectAll}>Select All</button>
            <button onClick={handleClearSelection}>Clear Selection</button>
            {onDelete && (
              <button
                onClick={() => onDelete(selectedItems)}
                className="ContentGrid-delete-btn"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      <div className={`ContentGrid-items ContentGrid-items-${viewMode}`}>
        {content.map((item) => (
          <div
            key={item.id}
            className={`ContentGrid-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}
          >
            {selectable && (
              <div className="ContentGrid-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleItemSelection(item.id)}
                />
              </div>
            )}

            <div className="ContentGrid-thumbnail">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title || 'Content thumbnail'}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="ContentGrid-placeholder"
                style={{
                  display: item.thumbnailUrl ? 'none' : 'flex'
                }}
              >
                {getTypeIcon(item.type)}
                <span>No Preview</span>
              </div>

              <div className="ContentGrid-type-indicator">
                {getTypeIcon(item.type)}
              </div>

              {item.duration && (
                <div className="ContentGrid-duration">
                  {item.duration}
                </div>
              )}

              <div className="ContentGrid-price-badge">
                {formatPrice(item.price, item.isFree)}
              </div>
            </div>

            <div className="ContentGrid-info">
              <h3>{item.title}</h3>
              <p className="ContentGrid-description">
                {item.description && item.description.length > 100
                  ? `${item.description.substring(0, 100)}...`
                  : item.description || 'No description'}
              </p>

              <div className="ContentGrid-meta">
                <span className="ContentGrid-date">
                  <Calendar size={12} />
                  {formatDate(item.createdAt)}
                </span>
                <span className="ContentGrid-type-label">
                  {getTypeLabel(item.type)}
                </span>
              </div>

              <div className="ContentGrid-stats">
                <span className="ContentGrid-stat">
                  <Eye size={12} />
                  {item.stats?.views || 0} views
                </span>
                <span className="ContentGrid-stat">
                  <Heart size={12} />
                  {item.stats?.likes || 0} likes
                </span>
                <span className="ContentGrid-stat">
                  <DollarSign size={12} />
                  ${(item.stats?.earnings || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="ContentGrid-actions">
              {onEdit && (
                <button
                  className="ContentGrid-action-btn"
                  onClick={() => onEdit(item.id)}
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
              )}

              {onView && (
                <button
                  className="ContentGrid-action-btn"
                  onClick={() => onView(item.id)}
                  title="View"
                >
                  <Eye size={18} />
                </button>
              )}

              {onShare && (
                <button
                  className="ContentGrid-action-btn"
                  onClick={() => onShare(item.id)}
                  title="Share"
                >
                  <Share2 size={18} />
                </button>
              )}

              {onDelete && (
                <button
                  className="ContentGrid-action-btn ContentGrid-delete-btn"
                  onClick={() => onDelete([item.id])}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentGrid;