import React from 'react';
import { CreditCard, AlertCircle, Clock, CheckCircle, Send } from 'lucide-react';
import './PayoutHistory.css';

const PayoutHistory = ({
  availableAmount = 0,
  minimumPayout = 50,
  payoutHistory = [],
  onPayoutSettings,
  onRequestPayout,
  loading = false,
  className = '',
  hasPendingRequest = false,
  pendingRequest = null
}) => {
  const canRequestPayout = availableAmount >= minimumPayout && !hasPendingRequest;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className={`PayoutHistory ${className}`}>
      <div className="PayoutHistory-header">
        <h2>Payout History</h2>
        <div className="PayoutHistory-actions">
          {canRequestPayout && onRequestPayout && (
            <button
              className="PayoutHistory-request-btn"
              onClick={onRequestPayout}
            >
              <Send size={16} />
              Request Payout
            </button>
          )}
          {hasPendingRequest && (
            <div className="PayoutHistory-pending-notice">
              <Clock size={16} />
              Payout request pending
            </div>
          )}
          <button
            className="PayoutHistory-settings-btn"
            onClick={onPayoutSettings}
          >
            <CreditCard size={16} />
            Payout Settings
          </button>
        </div>
      </div>

      <div className="PayoutHistory-available">
        <div className="PayoutHistory-info">
          <span className="PayoutHistory-label">Available for Payout:</span>
          <span className="PayoutHistory-amount">
            {formatCurrency(availableAmount)}
          </span>
        </div>

        {availableAmount < minimumPayout && (
          <div className="PayoutHistory-notice">
            <AlertCircle size={14} />
            Minimum payout is {formatCurrency(minimumPayout)}
          </div>
        )}
      </div>

      <div className="PayoutHistory-list">
        {loading ? (
          <div className="PayoutHistory-loading">
            <div className="PayoutHistory-loading-spinner"></div>
            <span>Loading payout history...</span>
          </div>
        ) : payoutHistory.length > 0 ? (
          payoutHistory.map((payout) => (
            <div key={payout.id} className={`PayoutHistory-item ${payout.status}`}>
              <div className="PayoutHistory-item-info">
                <span className="PayoutHistory-item-amount">
                  {formatCurrency(payout.amount)}
                </span>
                <span className="PayoutHistory-item-method">{payout.method}</span>
              </div>
              <div className="PayoutHistory-item-date">{payout.date}</div>
              <div className={`PayoutHistory-item-status ${payout.status}`}>
                {payout.status === 'paid' ? (
                  <>
                    <CheckCircle size={14} /> Paid
                  </>
                ) : (
                  <>
                    <Clock size={14} /> Pending
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="PayoutHistory-empty">
            <div className="PayoutHistory-empty-icon">
              <CreditCard size={48} />
            </div>
            <h3>No payout history yet</h3>
            <p>Your completed payouts will appear here once processed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutHistory;