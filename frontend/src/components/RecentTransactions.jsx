import React from 'react';
import {
  Camera,
  Video,
  MessageCircle,
  Gift,
  DollarSign,
  Calendar,
  ChevronRight
} from 'lucide-react';
import './RecentTransactions.css';

const RecentTransactions = ({
  transactions = [],
  showTitle = true,
  limit = 10,
  onTransactionClick,
  onViewAll,
  loading = false,
  className = ''
}) => {
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'photo':
        return <Camera size={16} />;
      case 'video':
        return <Video size={16} />;
      case 'message':
        return <MessageCircle size={16} />;
      case 'tip':
        return <Gift size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'photo':
        return 'photo';
      case 'video':
        return 'video';
      case 'message':
        return 'message';
      case 'tip':
        return 'tip';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const displayTransactions = transactions.slice(0, limit);

  return (
    <div className={`RecentTransactions ${className}`}>
      {showTitle && (
        <div className="RecentTransactions-header">
          <h2>Recent Transactions</h2>
          {onViewAll && transactions.length > limit && (
            <button
              className="RecentTransactions-viewAll"
              onClick={onViewAll}
            >
              View All
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      <div className="RecentTransactions-list">
        {loading ? (
          // Loading skeleton
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="RecentTransactions-skeleton">
              <div className="RecentTransactions-skeleton-icon" />
              <div className="RecentTransactions-skeleton-content">
                <div className="RecentTransactions-skeleton-title" />
                <div className="RecentTransactions-skeleton-subtitle" />
              </div>
              <div className="RecentTransactions-skeleton-amount" />
            </div>
          ))
        ) : displayTransactions.length > 0 ? (
          displayTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="RecentTransactions-item"
              onClick={() => onTransactionClick && onTransactionClick(transaction)}
              style={{ cursor: onTransactionClick ? 'pointer' : 'default' }}
            >
              <div className={`RecentTransactions-icon ${getTransactionColor(transaction.type)}`}>
                {getTransactionIcon(transaction.type)}
              </div>

              <div className="RecentTransactions-details">
                <div className="RecentTransactions-title">
                  {transaction.title || transaction.description || `${transaction.type} purchase`}
                </div>
                <div className="RecentTransactions-meta">
                  <span className="RecentTransactions-buyer">
                    {transaction.buyerName || transaction.user || 'Anonymous'}
                  </span>
                  <span className="RecentTransactions-separator">•</span>
                  <span className="RecentTransactions-date">
                    {formatDate(transaction.createdAt || transaction.date)}
                  </span>
                  <span className="RecentTransactions-time">
                    {formatTime(transaction.createdAt || transaction.date)}
                  </span>
                </div>
              </div>

              <div className="RecentTransactions-amount">
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))
        ) : (
          <div className="RecentTransactions-empty">
            <DollarSign size={48} />
            <p>No transactions yet</p>
            <span>Your earnings will appear here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;