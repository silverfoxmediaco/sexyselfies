import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, DollarSign, TrendingUp } from 'lucide-react';
import './MembersOverview.css';

const MembersOverview = ({
  stats,
  onStatClick,
  loading = false,
  className = '',
  showAnimation = true
}) => {
  const statCards = [
    {
      id: 'total',
      icon: <Users size={20} />,
      value: stats?.totalMembers || 0,
      label: 'Total Members',
      colorClass: 'total',
      format: 'number'
    },
    {
      id: 'active',
      icon: <Activity size={20} />,
      value: stats?.activeMembers || 0,
      label: 'Active Members',
      colorClass: 'active',
      format: 'number'
    },
    {
      id: 'revenue',
      icon: <DollarSign size={20} />,
      value: stats?.totalRevenue || 0,
      label: 'Total Revenue',
      colorClass: 'revenue',
      format: 'currency'
    },
    {
      id: 'average',
      icon: <TrendingUp size={20} />,
      value: stats?.avgSpending || 0,
      label: 'Avg Spending',
      colorClass: 'average',
      format: 'currency'
    }
  ];

  const formatValue = (value, format) => {
    if (loading) return '...';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value || 0);
      case 'number':
      default:
        return (value || 0).toLocaleString();
    }
  };

  const CardComponent = showAnimation ? motion.div : 'div';

  return (
    <div className={`MembersOverview ${className}`}>
      <div className="MembersOverview-grid">
        {statCards.map((card, index) => (
          <CardComponent
            key={card.id}
            className="MembersOverview-card"
            onClick={() => onStatClick && onStatClick(card.id)}
            style={{ cursor: onStatClick ? 'pointer' : 'default' }}
            {...(showAnimation && {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1 * (index + 1) }
            })}
          >
            <div className={`MembersOverview-icon ${card.colorClass}`}>
              {card.icon}
            </div>
            <div className="MembersOverview-content">
              <span className="MembersOverview-value">
                {loading ? (
                  <div className="MembersOverview-skeleton" />
                ) : (
                  formatValue(card.value, card.format)
                )}
              </span>
              <span className="MembersOverview-label">
                {card.label}
              </span>
            </div>
          </CardComponent>
        ))}
      </div>
    </div>
  );
};

export default MembersOverview;