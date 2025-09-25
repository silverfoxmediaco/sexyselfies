// GiftContentModal.jsx - Modal for creators to select content and send gifts
import React, { useState, useEffect } from 'react';
import { getCreatorContentLibrary, sendGift, validateGiftData } from '../services/gift.service';
import './GiftContentModal.css';

const GiftContentModal = ({
  isOpen,
  onClose,
  member,
  onGiftSent
}) => {
  const [contentLibrary, setContentLibrary] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [giftMessage, setGiftMessage] = useState("Here's a special gift just for you! 🎁");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // Load creator's content library when modal opens
  useEffect(() => {
    if (isOpen && contentLibrary.length === 0) {
      loadContentLibrary();
    }
  }, [isOpen]);

  const loadContentLibrary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCreatorContentLibrary();
      setContentLibrary(response.content || []);
    } catch (error) {
      console.error('Failed to load content library:', error);
      setError('Failed to load your content library. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSelect = (content) => {
    setSelectedContent(content);
    setError(null);
  };

  const handleSendGift = async () => {
    if (!selectedContent || !member) return;

    // Validate gift data
    const giftData = {
      contentId: selectedContent.id,
      message: giftMessage.trim(),
    };

    const validation = validateGiftData(giftData);
    if (!validation.isValid) {
      setError(validation.errors.join('. '));
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await sendGift(member.id, giftData);

      // Notify parent component of successful gift
      if (onGiftSent) {
        onGiftSent({
          member,
          content: selectedContent,
          message: giftMessage,
          gift: response.gift,
        });
      }

      // Reset form and close modal
      setSelectedContent(null);
      setGiftMessage("Here's a special gift just for you! 🎁");
      onClose();

    } catch (error) {
      console.error('Failed to send gift:', error);
      setError(error.message || 'Failed to send gift. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setSelectedContent(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="GiftContentModal-overlay" onClick={handleClose}>
      <div className="GiftContentModal-container" onClick={(e) => e.stopPropagation()}>
        <div className="GiftContentModal-header">
          <h2>🎁 Send Gift to @{member?.username}</h2>
          <button
            className="GiftContentModal-close"
            onClick={handleClose}
            disabled={isSending}
          >
            ×
          </button>
        </div>

        <div className="GiftContentModal-content">
          {/* Step 1: Select Content */}
          <div className="GiftContentModal-section">
            <h3>Step 1: Choose Content to Gift</h3>

            {isLoading ? (
              <div className="GiftContentModal-loading">
                <div className="loading-spinner"></div>
                <p>Loading your content library...</p>
              </div>
            ) : contentLibrary.length === 0 ? (
              <div className="GiftContentModal-empty">
                <p>No giftable content available.</p>
                <p>Upload paid content to start gifting!</p>
              </div>
            ) : (
              <div className="GiftContentModal-library">
                {contentLibrary.map((content) => (
                  <div
                    key={content.id}
                    className={`GiftContentModal-item ${
                      selectedContent?.id === content.id ? 'selected' : ''
                    }`}
                    onClick={() => handleContentSelect(content)}
                  >
                    <div className="GiftContentModal-thumbnail">
                      {content.thumbnailUrl ? (
                        <img src={content.thumbnailUrl} alt={content.title} />
                      ) : (
                        <div className="GiftContentModal-placeholder">
                          {content.type === 'video' ? '🎥' : '📸'}
                        </div>
                      )}
                    </div>
                    <div className="GiftContentModal-details">
                      <h4>{content.title}</h4>
                      <p className="GiftContentModal-price">${content.price}</p>
                      <p className="GiftContentModal-type">{content.type}</p>
                    </div>
                    {selectedContent?.id === content.id && (
                      <div className="GiftContentModal-selected-check">✓</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Personal Message */}
          {selectedContent && (
            <div className="GiftContentModal-section">
              <h3>Step 2: Add Personal Message</h3>
              <div className="GiftContentModal-selected-info">
                <p>
                  <strong>Gifting:</strong> "{selectedContent.title}"
                  <span className="GiftContentModal-value">(${selectedContent.price} value)</span>
                </p>
              </div>
              <textarea
                className="GiftContentModal-message"
                placeholder="Add a personal message..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <div className="GiftContentModal-char-count">
                {giftMessage.length}/500
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="GiftContentModal-error">
              {error}
            </div>
          )}
        </div>

        <div className="GiftContentModal-footer">
          <button
            className="GiftContentModal-cancel"
            onClick={handleClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            className="GiftContentModal-send"
            onClick={handleSendGift}
            disabled={!selectedContent || isSending}
          >
            {isSending ? (
              <>
                <div className="button-spinner"></div>
                Sending Gift...
              </>
            ) : (
              '🎁 Send Gift'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftContentModal;