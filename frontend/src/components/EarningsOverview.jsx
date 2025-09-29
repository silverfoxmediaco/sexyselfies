import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Clock,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import './EarningsOverview.css';

const EarningsOverview = ({
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
    }).format(amount || 0);
  };

  const cards = [
    {
      id: 'total',
      title: 'Total Earnings',
      icon: <DollarSign size={20} />,
      value: stats?.totalEarnings?.value || 0,
      change: stats?.totalEarnings?.change || 0,
      trend: stats?.totalEarnings?.trend || 'neutral',
      changeLabel: 'vs last period',
      colorClass: 'total-earnings'
    },
    {
      id: 'pending',
      title: 'Pending Payout',
      icon: <Clock size={20} />,
      value: stats?.pendingPayout?.value || 0,
      change: stats?.pendingPayout?.change || 0,
      trend: stats?.pendingPayout?.trend || 'neutral',
      changeLabel: 'vs last period',
      colorClass: 'pending-payout'
    },
    {
      id: 'month',
      title: 'This Month',
      icon: <Calendar size={20} />,
      value: stats?.monthEarnings?.value || 0,
      change: stats?.monthEarnings?.change || 0,
      trend: stats?.monthEarnings?.trend || 'neutral',
      changeLabel: 'vs last month',
      colorClass: 'month-earnings'
    },
    {
      id: 'daily',
      title: 'Daily Average',
      icon: <BarChart3 size={20} />,
      value: stats?.dailyAverage?.value || 0,
      change: stats?.dailyAverage?.change || 0,
      trend: stats?.dailyAverage?.trend || 'neutral',
      changeLabel: 'vs last period',
      colorClass: 'daily-avg'
    }
  ];

  const CardComponent = showAnimation ? motion.div : 'div';

  return (
    <div className={`EarningsOverview ${className}`}>
      <div className="EarningsOverview-cards">
        {cards.map((card, index) => (
          <CardComponent
            key={card.id}
            className={`EarningsOverview-card ${card.colorClass}`}
            onClick={() => onCardClick && onCardClick(card.id)}
            style={{ cursor: onCardClick ? 'pointer' : 'default' }}
            {...(showAnimation && {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1 * (index + 1) }
            })}
          >
            <div className="EarningsOverview-header">
              <div className="EarningsOverview-icon">
                {card.icon}
              </div>
              <span className="EarningsOverview-title">
                {card.title}
              </span>
            </div>

            <div className="EarningsOverview-value">
              {loading ? (
                <div className="EarningsOverview-skeleton" />
              ) : (
                formatCurrency(card.value)
              )}
            </div>

            <div className="EarningsOverview-change">
              {loading ? (
                <div className="EarningsOverview-skeleton-small" />
              ) : (
                <>
                  <span className={`EarningsOverview-indicator ${getTrendClass(card.trend)}`}>
                    {getTrendIcon(card.trend)}
                    {Math.abs(card.change)}%
                  </span>
                  <span className="EarningsOverview-label">
                    {card.changeLabel}
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

export default EarningsOverview;