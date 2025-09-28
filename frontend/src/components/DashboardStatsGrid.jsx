import React from 'react';
import {
  Eye,
  Users,
  DollarSign,
  Star,
  Gift,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import './DashboardStatsGrid.css';

const DashboardStatsGrid = ({
  stats,
  onCardClick,
  loading = false,
  className = ''
}) => {
  const statCards = [
    {
      id: 'totalViews',
      icon: <Eye size={20} />,
      label: 'Total Views',
      colorClass: 'blue',
      data: stats?.totalViews
    },
    {
      id: 'connections',
      icon: <Users size={20} />,
      label: 'Connections',
      colorClass: 'green',
      data: stats?.connections
    },
    {
      id: 'revenue',
      icon: <DollarSign size={20} />,
      label: 'Revenue',
      colorClass: 'purple',
      data: stats?.revenue
    },
    {
      id: 'avgRating',
      icon: <Star size={20} />,
      label: 'Avg Rating',
      colorClass: 'yellow',
      data: stats?.avgRating
    },
    {
      id: 'giftsSent',
      icon: <Gift size={20} />,
      label: 'Gifts Sent',
      colorClass: 'teal',
      data: stats?.giftsSent
    }
  ];

  const formatValue = (id, value) => {
    if (loading || value === undefined) return '...';

    if (id === 'revenue') {
      return `$${(value || 0).toLocaleString()}`;
    }
    if (id === 'avgRating') {
      return (value || 0).toFixed(1);
    }
    return (value || 0).toLocaleString();
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUp size={14} />;
    if (trend === 'down') return <ArrowDown size={14} />;
    return <Minus size={14} />;
  };

  const getTrendClass = (trend) => {
    if (trend === 'up') return 'positive';
    if (trend === 'down') return 'negative';
    return 'neutral';
  };

  return (
    <div className={`DashboardStatsGrid ${className}`}>
      {statCards.map((card) => (
        <div
          key={card.id}
          className={`DashboardStatsGrid-card ${card.colorClass} ${loading ? 'loading' : ''}`}
          onClick={() => onCardClick && onCardClick(card.id)}
          style={{ cursor: onCardClick ? 'pointer' : 'default' }}
          role={onCardClick ? 'button' : undefined}
          tabIndex={onCardClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onCardClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onCardClick(card.id);
            }
          }}
        >
          <div className="DashboardStatsGrid-header">
            <div className="DashboardStatsGrid-icon">
              {card.icon}
            </div>
            <span className="DashboardStatsGrid-label">{card.label}</span>
          </div>

          <div className="DashboardStatsGrid-value">
            {loading ? (
              <div className="DashboardStatsGrid-skeleton-value" />
            ) : (
              formatValue(card.id, card.data?.value)
            )}
          </div>

          <div className={`DashboardStatsGrid-change ${getTrendClass(card.data?.trend)}`}>
            {!loading && card.data && card.data.change !== undefined ? (
              <>
                <div className="DashboardStatsGrid-trend-icon">
                  {getTrendIcon(card.data.trend)}
                </div>
                <span className="DashboardStatsGrid-change-text">
                  {Math.abs(card.data.change || 0)}%
                </span>
              </>
            ) : loading ? (
              <div className="DashboardStatsGrid-skeleton-change" />
            ) : (
              <div className="DashboardStatsGrid-no-change">
                <Minus size={14} />
                <span>--</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsGrid;