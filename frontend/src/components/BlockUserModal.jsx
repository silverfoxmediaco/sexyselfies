import React, { useState } from 'react';
import {
  X,
  UserX,
  AlertTriangle,
  CheckCircle,
  Shield,
  MessageSquareOff,
  EyeOff,
  Ban
} from 'lucide-react';
import memberService from '../services/member.service';
import './BlockUserModal.css';

const blockReasons = [
  {
    id: 'harassment',
    label: 'Harassment or Abuse',
    description: 'This user is harassing, threatening, or abusing me',
    icon: AlertTriangle,
    severity: 'high'
  },
  {
    id: 'spam',
    label: 'Spam or Unwanted Messages',
    description: 'This user is sending unwanted or repetitive messages',
    icon: MessageSquareOff,
    severity: 'medium'
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Behavior',
    description: 'This user is behaving inappropriately or violating guidelines',
    icon: Ban,
    severity: 'medium'
  },
  {
    id: 'fake_profile',
    label: 'Fake or Impersonation',
    description: 'This appears to be a fake account or someone impersonating another person',
    icon: UserX,
    severity: 'medium'
  },
  {
    id: 'privacy',
    label: 'Privacy Concerns',
    description: 'I want to limit who can see or contact me',
    icon: Shield,
    severity: 'low'
  },
  {
    id: 'not_interested',
    label: 'Not Interested',
    description: 'I am not interested in this user\'s content or interactions',
    icon: EyeOff,
    severity: 'low'
  }
];

const BlockUserModal = ({
  userId,
  userName,
  userType = 'creator', // 'creator' or 'member'
  isOpen,
  onClose,
  onSuccess = () => {},
  currentlyBlocked = false
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [action, setAction] = useState(currentlyBlocked ? 'unblock' : 'block');
  const [error, setError] = useState('');

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (action === 'block' && !selectedReason) {
      setError('Please select a reason for blocking this user');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let response;

      if (action === 'block') {
        const blockData = {
          reason: selectedReason,
          details: additionalDetails.trim()
        };

        response = await memberService.blockCreator(userId, selectedReason);
      } else {
        response = await memberService.unblockCreator(userId);
      }

      if (response.error) {
        throw new Error(response.message || `Failed to ${action} user`);
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onSuccess({ action, userId, reason: selectedReason });
        onClose();
      }, 2000);

    } catch (err) {
      console.error(`${action} user error:`, err);
      setError(err.message || `Failed to ${action} user. Please try again.`);
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

  const actionText = action === 'block' ? 'Block' : 'Unblock';
  const actionPastTense = action === 'block' ? 'Blocked' : 'Unblocked';

  return (
    <div
      className="BlockUserModal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="block-modal-title"
      aria-describedby="block-modal-description"
      tabIndex="-1"
    >
      <div className="BlockUserModal-container">
        <div className="BlockUserModal-content">
          {/* Header */}
          <header className="BlockUserModal-header">
            <div className="BlockUserModal-header-content">
              <div className={`BlockUserModal-icon ${action === 'block' ? 'block' : 'unblock'}`}>
                <UserX size={24} />
              </div>
              <div className="BlockUserModal-title-section">
                <h2 id="block-modal-title" className="BlockUserModal-title">
                  {actionText} {userName || 'User'}
                </h2>
                <p id="block-modal-description" className="BlockUserModal-subtitle">
                  {action === 'block'
                    ? "This user won't be able to see your content or contact you"
                    : "This user will be able to see your content and contact you again"
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              className="BlockUserModal-close-button"
              onClick={onClose}
              aria-label="Close block modal"
            >
              <X size={20} />
            </button>
          </header>

          {/* Success State */}
          {isSubmitted ? (
            <div className="BlockUserModal-success">
              <div className="BlockUserModal-success-icon">
                <CheckCircle size={48} />
              </div>
              <h3>User {actionPastTense}</h3>
              <p>
                {action === 'block'
                  ? `${userName || 'This user'} has been blocked and won't be able to contact you or see your content.`
                  : `${userName || 'This user'} has been unblocked and can now interact with you again.`
                }
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="BlockUserModal-form">
              {/* Toggle between block/unblock if currently blocked */}
              {currentlyBlocked && (
                <div className="BlockUserModal-section">
                  <div className="BlockUserModal-toggle-section">
                    <h3 className="BlockUserModal-section-title">Action</h3>
                    <div className="BlockUserModal-toggle-options">
                      <label className="BlockUserModal-toggle-option">
                        <input
                          type="radio"
                          name="action"
                          value="unblock"
                          checked={action === 'unblock'}
                          onChange={(e) => setAction(e.target.value)}
                        />
                        <div className="BlockUserModal-toggle-content">
                          <h4>Unblock User</h4>
                          <p>Allow this user to see your content and contact you again</p>
                        </div>
                      </label>
                      <label className="BlockUserModal-toggle-option">
                        <input
                          type="radio"
                          name="action"
                          value="block"
                          checked={action === 'block'}
                          onChange={(e) => setAction(e.target.value)}
                        />
                        <div className="BlockUserModal-toggle-content">
                          <h4>Keep Blocked</h4>
                          <p>Update the reason for keeping this user blocked</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason Selection - only show for block action */}
              {action === 'block' && (
                <div className="BlockUserModal-section">
                  <h3 className="BlockUserModal-section-title">
                    Why are you blocking this user?
                  </h3>
                  <div className="BlockUserModal-reasons">
                    {blockReasons.map((reason) => {
                      const IconComponent = reason.icon;
                      const isSelected = selectedReason === reason.id;

                      return (
                        <button
                          key={reason.id}
                          type="button"
                          className={`BlockUserModal-reason ${isSelected ? 'selected' : ''} ${reason.severity}`}
                          onClick={() => handleReasonSelect(reason.id)}
                          aria-pressed={isSelected}
                        >
                          <div className="BlockUserModal-reason-icon">
                            <IconComponent size={20} />
                          </div>
                          <div className="BlockUserModal-reason-content">
                            <h4 className="BlockUserModal-reason-label">
                              {reason.label}
                            </h4>
                            <p className="BlockUserModal-reason-description">
                              {reason.description}
                            </p>
                          </div>
                          <div className="BlockUserModal-reason-radio">
                            <input
                              type="radio"
                              name="block-reason"
                              value={reason.id}
                              checked={isSelected}
                              onChange={() => handleReasonSelect(reason.id)}
                              aria-labelledby={`reason-${reason.id}-label`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Details - only show for block action */}
              {action === 'block' && selectedReason && (
                <div className="BlockUserModal-section">
                  <label htmlFor="additional-details" className="BlockUserModal-section-title">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="additional-details"
                    className="BlockUserModal-textarea"
                    placeholder="Provide any additional context about why you're blocking this user..."
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    maxLength={300}
                    rows={3}
                  />
                  <div className="BlockUserModal-character-count">
                    {additionalDetails.length}/300 characters
                  </div>
                </div>
              )}

              {/* Warning for block action */}
              {action === 'block' && (
                <div className="BlockUserModal-warning">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>What happens when you block a user:</strong>
                    <ul>
                      <li>They won't be able to see your content or profile</li>
                      <li>They can't send you messages or comments</li>
                      <li>You won't see their content in your feeds</li>
                      <li>Any existing connections will be removed</li>
                      <li>You can unblock them at any time</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="BlockUserModal-error" role="alert">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="BlockUserModal-actions">
                <button
                  type="button"
                  className="BlockUserModal-button BlockUserModal-button--secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`BlockUserModal-button ${action === 'block'
                    ? 'BlockUserModal-button--danger'
                    : 'BlockUserModal-button--primary'
                  }`}
                  disabled={(action === 'block' && !selectedReason) || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="BlockUserModal-spinner"></span>
                      {action === 'block' ? 'Blocking...' : 'Unblocking...'}
                    </>
                  ) : (
                    <>
                      <UserX size={16} />
                      {actionText} User
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;