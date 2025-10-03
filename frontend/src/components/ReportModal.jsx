import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Shield,
  FileX,
  MessageSquare,
  UserX,
  Copyright,
  MoreHorizontal,
  Flag,
  CheckCircle
} from 'lucide-react';
import contentService from '../services/content.service';
import './ReportModal.css';

const reportCategories = [
  {
    id: 'underage',
    label: 'Underage Content',
    description: 'Content involving minors or appearing to involve minors',
    icon: Shield,
    severity: 'critical'
  },
  {
    id: 'illegal',
    label: 'Illegal Content',
    description: 'Content that violates laws or promotes illegal activities',
    icon: AlertTriangle,
    severity: 'critical'
  },
  {
    id: 'non_consensual',
    label: 'Non-consensual Content',
    description: 'Content shared without consent or revenge pornography',
    icon: UserX,
    severity: 'high'
  },
  {
    id: 'harassment',
    label: 'Harassment or Abuse',
    description: 'Bullying, threats, or targeted harassment',
    icon: MessageSquare,
    severity: 'high'
  },
  {
    id: 'spam',
    label: 'Spam or Misleading',
    description: 'Repetitive content, scams, or false information',
    icon: FileX,
    severity: 'medium'
  },
  {
    id: 'impersonation',
    label: 'Impersonation',
    description: 'Pretending to be someone else or fake account',
    icon: UserX,
    severity: 'medium'
  },
  {
    id: 'copyright',
    label: 'Copyright Violation',
    description: 'Content that violates intellectual property rights',
    icon: Copyright,
    severity: 'medium'
  },
  {
    id: 'other',
    label: 'Other Violation',
    description: 'Other community guideline violations',
    icon: MoreHorizontal,
    severity: 'low'
  }
];

const ReportModal = ({
  contentId,
  contentType = 'content',
  reportedUserId,
  isOpen,
  onClose,
  onSuccess = () => {}
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      setError('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const selectedCategoryData = reportCategories.find(cat => cat.id === selectedCategory);

      const reportData = {
        reason: selectedCategory,
        details: additionalDetails.trim(),
        timestamp: new Date().toISOString(),
        contentType,
        severity: selectedCategoryData?.severity || 'medium'
      };

      const response = await contentService.reportContent(
        contentId,
        selectedCategory,
        additionalDetails.trim()
      );

      if (response.error) {
        throw new Error(response.message || 'Failed to submit report');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onSuccess(reportData);
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Report submission error:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ReportModal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="report-modal-title"
      aria-describedby="report-modal-description"
      tabIndex="-1"
    >
      <div className="ReportModal-container">
        <div className="ReportModal-content">
          {/* Header */}
          <header className="ReportModal-header">
            <div className="ReportModal-header-content">
              <div className="ReportModal-icon">
                <Flag size={24} />
              </div>
              <div className="ReportModal-title-section">
                <h2 id="report-modal-title" className="ReportModal-title">
                  Report Content
                </h2>
                <p id="report-modal-description" className="ReportModal-subtitle">
                  Help us keep our community safe by reporting inappropriate content
                </p>
              </div>
            </div>
            <button
              type="button"
              className="ReportModal-close-button"
              onClick={onClose}
              aria-label="Close report modal"
            >
              <X size={20} />
            </button>
          </header>

          {/* Success State */}
          {isSubmitted ? (
            <div className="ReportModal-success">
              <div className="ReportModal-success-icon">
                <CheckCircle size={48} />
              </div>
              <h3>Report Submitted</h3>
              <p>
                Thank you for helping keep our community safe. We'll review your report and take appropriate action.
              </p>
            </div>
          ) : (
            /* Report Form */
            <form onSubmit={handleSubmit} className="ReportModal-form">
              {/* Category Selection */}
              <div className="ReportModal-section">
                <h3 className="ReportModal-section-title">
                  Why are you reporting this content?
                </h3>
                <div className="ReportModal-categories">
                  {reportCategories.map((category) => {
                    const IconComponent = category.icon;
                    const isSelected = selectedCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`ReportModal-category ${isSelected ? 'selected' : ''} ${category.severity}`}
                        onClick={() => handleCategorySelect(category.id)}
                        aria-pressed={isSelected}
                      >
                        <div className="ReportModal-category-icon">
                          <IconComponent size={20} />
                        </div>
                        <div className="ReportModal-category-content">
                          <h4 className="ReportModal-category-label">
                            {category.label}
                          </h4>
                          <p className="ReportModal-category-description">
                            {category.description}
                          </p>
                        </div>
                        <div className="ReportModal-category-radio">
                          <input
                            type="radio"
                            name="report-category"
                            value={category.id}
                            checked={isSelected}
                            onChange={() => handleCategorySelect(category.id)}
                            aria-labelledby={`category-${category.id}-label`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Details */}
              {selectedCategory && (
                <div className="ReportModal-section">
                  <label htmlFor="additional-details" className="ReportModal-section-title">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="additional-details"
                    className="ReportModal-textarea"
                    placeholder="Provide any additional context that might help us understand the issue..."
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                  <div className="ReportModal-character-count">
                    {additionalDetails.length}/500 characters
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="ReportModal-error" role="alert">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="ReportModal-actions">
                <button
                  type="button"
                  className="ReportModal-button ReportModal-button--secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ReportModal-button ReportModal-button--primary"
                  disabled={!selectedCategory || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="ReportModal-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag size={16} />
                      Submit Report
                    </>
                  )}
                </button>
              </div>

              {/* Disclaimer */}
              <div className="ReportModal-disclaimer">
                <p>
                  <strong>False reports may result in account restrictions.</strong>{' '}
                  Reports are reviewed by our moderation team and action is taken according to our community guidelines.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;