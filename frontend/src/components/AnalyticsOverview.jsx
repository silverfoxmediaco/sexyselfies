import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Eye,
  Heart,
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import './AnalyticsOverview.css';

const AnalyticsOverview = ({
  stats,
  onCardClick,
  loading = false,
  className = '',
  showAnimation = true
}) => {
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const cards = [
    {
      id: 'earnings',
      title: 'Total Earnings',
      icon: <DollarSign size={20} />,
      value: stats?.totalEarnings?.value || 0,
      change: stats?.totalEarnings?.change || 0,
      trend: stats?.totalEarnings?.trend || 'neutral',
      formatter: formatCurrency,
      colorClass: 'earnings'
    },
    {
      id: 'views',
      title: 'Profile Views',
      icon: <Eye size={20} />,
      value: stats?.profileViews?.value || 0,
      change: stats?.profileViews?.change || 0,
      trend: stats?.profileViews?.trend || 'neutral',
      formatter: formatNumber,
      colorClass: 'views'
    },
    {
      id: 'matches',
      title: 'New Connections',
      icon: <Heart size={20} />,
      value: stats?.newConnections?.value || 0,
      change: stats?.newConnections?.change || 0,
      trend: stats?.newConnections?.trend || 'neutral',
      formatter: formatNumber,
      colorClass: 'matches'
    },
    {
      id: 'conversion',
      title: 'Conversion Rate',
      icon: <Target size={20} />,
      value: stats?.conversionRate?.value || 0,
      change: stats?.conversionRate?.change || 0,
      trend: stats?.conversionRate?.trend || 'neutral',
      formatter: formatPercentage,
      colorClass: 'conversion'
    }
  ];

  const CardComponent = showAnimation ? motion.div : 'div';

  return (
    <div className={`AnalyticsOverview ${className}`}>
      <div className="AnalyticsOverview-cards">
        {cards.map((card, index) => (
          <CardComponent
            key={card.id}
            className={`AnalyticsOverview-card ${card.colorClass}`}
            onClick={() => onCardClick && onCardClick(card.id)}
            style={{ cursor: onCardClick ? 'pointer' : 'default' }}
            {...(showAnimation && {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1 * (index + 1) }
            })}
          >
            <div className="AnalyticsOverview-header">
              <div className="AnalyticsOverview-icon">
                {card.icon}
              </div>
              <span className="AnalyticsOverview-title">
                {card.title}
              </span>
            </div>

            <div className="AnalyticsOverview-value">
              {loading ? (
                <div className="AnalyticsOverview-skeleton" />
              ) : (
                card.formatter(card.value)
              )}
            </div>

            <div className="AnalyticsOverview-change">
              {loading ? (
                <div className="AnalyticsOverview-skeleton-small" />
              ) : (
                <>
                  <span className={`AnalyticsOverview-indicator ${getTrendClass(card.trend)}`}>
                    {getTrendIcon(card.trend)}
                    {Math.abs(card.change)}%
                  </span>
                  <span className="AnalyticsOverview-label">
                    vs last period
                  </span>
                </>
              )}
            </div>
          </CardComponent>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsOverview;