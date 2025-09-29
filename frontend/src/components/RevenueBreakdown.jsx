import React from 'react';
import { Camera, Video, MessageCircle, Gift } from 'lucide-react';
import './RevenueBreakdown.css';

const RevenueBreakdown = ({
  breakdown,
  showTitle = true,
  onCardClick,
  loading = false,
  className = ''
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const calculatePercentage = (amount, total) => {
    if (!total || total === 0) return 0;
    return Math.round((amount / total) * 100);
  };

  const totalRevenue = breakdown ?
    (breakdown.photos?.amount || 0) +
    (breakdown.videos?.amount || 0) +
    (breakdown.messages?.amount || 0) +
    (breakdown.tips?.amount || 0) : 0;

  const categories = [
    {
      id: 'photos',
      icon: <Camera size={18} />,
      label: 'Photos',
      data: breakdown?.photos || { amount: 0, count: 0 },
      unit: 'sales'
    },
    {
      id: 'videos',
      icon: <Video size={18} />,
      label: 'Videos',
      data: breakdown?.videos || { amount: 0, count: 0 },
      unit: 'sales'
    },
    {
      id: 'messages',
      icon: <MessageCircle size={18} />,
      label: 'Messages',
      data: breakdown?.messages || { amount: 0, count: 0 },
      unit: 'sales'
    },
    {
      id: 'tips',
      icon: <Gift size={18} />,
      label: 'Tips',
      data: breakdown?.tips || { amount: 0, count: 0 },
      unit: 'tips'
    }
  ];

  return (
    <div className={`RevenueBreakdown ${className}`}>
      {showTitle && <h2>Revenue Breakdown</h2>}

      <div className="RevenueBreakdown-cards">
        {categories.map((category) => (
          <div
            key={category.id}
            className="RevenueBreakdown-card"
            onClick={() => onCardClick && onCardClick(category.id)}
            style={{ cursor: onCardClick ? 'pointer' : 'default' }}
          >
            <div className="RevenueBreakdown-header">
              {category.icon}
              <span>{category.label}</span>
            </div>

            <div className="RevenueBreakdown-amount">
              {loading ? (
                <div className="RevenueBreakdown-skeleton" />
              ) : (
                formatCurrency(category.data.amount)
              )}
            </div>

            <div className="RevenueBreakdown-stats">
              {loading ? (
                <>
                  <div className="RevenueBreakdown-skeleton-small" />
                  <div className="RevenueBreakdown-skeleton-small" />
                </>
              ) : (
                <>
                  <span className="RevenueBreakdown-percentage">
                    {calculatePercentage(category.data.amount, totalRevenue)}% of total
                  </span>
                  <span className="RevenueBreakdown-count">
                    {category.data.count} {category.unit}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueBreakdown;