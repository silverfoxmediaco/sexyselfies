import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Heart,
  DollarSign,
  Clock,
  Eye,
  ExternalLink,
  Download,
  Share2,
  Gift,
  MessageCircle,
  Star
} from 'lucide-react';
import './GiftViewingModal.css';

const GiftViewingModal = ({ gift, isOpen, onClose, onCreatorClick }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !gift) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCreatorClick = () => {
    if (onCreatorClick) {
      onCreatorClick(gift);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="GiftViewingModal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        <motion.div
          className="GiftViewingModal-container"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="GiftViewingModal-header">
            <div className="GiftViewingModal-header-info">
              <Gift size={20} />
              <h2>Gift from {gift.creator.username}</h2>
            </div>
            <button
              className="GiftViewingModal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="GiftViewingModal-content">
            {/* Content Display */}
            <div className="GiftViewingModal-media">
              {gift.content.type === 'image' ? (
                <div className="GiftViewingModal-image-container">
                  {imageLoading && (
                    <div className="GiftViewingModal-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading your gift...</p>
                    </div>
                  )}
                  {!imageError ? (
                    <img
                      src={gift.content.fileUrl}
                      alt={gift.content.title}
                      className="GiftViewingModal-image"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{ display: imageLoading ? 'none' : 'block' }}
                    />
                  ) : (
                    <div className="GiftViewingModal-error">
                      <Gift size={48} />
                      <p>Unable to load gift content</p>
                      <small>Please try again later</small>
                    </div>
                  )}
                </div>
              ) : (
                <div className="GiftViewingModal-video-container">
                  <video
                    controls
                    className="GiftViewingModal-video"
                    poster={gift.content.thumbnailUrl}
                    preload="metadata"
                  >
                    <source src={gift.content.fileUrl} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                </div>
              )}
            </div>

            {/* Gift Details */}
            <div className="GiftViewingModal-details">
              {/* Content Title */}
              <div className="GiftViewingModal-title">
                <h3>{gift.content.title}</h3>
                <div className="GiftViewingModal-content-meta">
                  <span className="content-type">{gift.content.type}</span>
                  <span className="content-value">
                    <DollarSign size={14} />
                    ${gift.originalPrice} value
                  </span>
                </div>
              </div>

              {/* Creator Info */}
              <div className="GiftViewingModal-creator">
                <div className="creator-avatar">
                  {gift.creator.profilePicture ? (
                    <img
                      src={gift.creator.profilePicture}
                      alt={gift.creator.username}
                    />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="creator-info">
                  <h4>@{gift.creator.username}</h4>
                  <p>Content Creator</p>
                </div>
                <button
                  className="GiftViewingModal-creator-btn"
                  onClick={handleCreatorClick}
                >
                  View Profile
                  <ExternalLink size={16} />
                </button>
              </div>

              {/* Personal Message */}
              {gift.message && (
                <div className="GiftViewingModal-message">
                  <h4>Personal Message</h4>
                  <div className="message-content">
                    <MessageCircle size={16} />
                    <p>"{gift.message}"</p>
                  </div>
                </div>
              )}

              {/* Gift Meta */}
              <div className="GiftViewingModal-meta">
                <div className="meta-item">
                  <Clock size={16} />
                  <div>
                    <span className="meta-label">Received</span>
                    <span className="meta-value">
                      {formatDate(gift.giftedAt)}
                    </span>
                  </div>
                </div>

                {gift.viewedAt && (
                  <div className="meta-item">
                    <Eye size={16} />
                    <div>
                      <span className="meta-label">First Viewed</span>
                      <span className="meta-value">
                        {formatDate(gift.viewedAt)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="meta-item">
                  <Star size={16} />
                  <div>
                    <span className="meta-label">Status</span>
                    <span className="meta-value">
                      {gift.isViewed ? 'Viewed' : 'New'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="GiftViewingModal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => {
                    // Add share functionality
                    if (navigator.share) {
                      navigator.share({
                        title: `Gift from @${gift.creator.username}`,
                        text: `Check out this gift I received: "${gift.content.title}"`,
                      });
                    }
                  }}
                >
                  <Share2 size={16} />
                  Share
                </button>

                <button
                  className="action-btn primary"
                  onClick={handleCreatorClick}
                >
                  <Heart size={16} />
                  Connect with Creator
                </button>
              </div>

              {/* Appreciation Message */}
              <div className="GiftViewingModal-appreciation">
                <Gift size={20} />
                <p>
                  This exclusive content was gifted to you by{' '}
                  <strong>@{gift.creator.username}</strong>.
                  Show your appreciation by connecting and supporting their content!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GiftViewingModal;