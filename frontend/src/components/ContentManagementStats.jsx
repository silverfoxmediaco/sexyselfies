import React from 'react';
import { Upload, Eye, DollarSign, Users } from 'lucide-react';
import './ContentManagementStats.css';

const ContentManagementStats = ({
  stats,
  onStatClick,
  loading = false,
  className = ''
}) => {
  const statCards = [
    {
      id: 'content',
      icon: <Upload size={24} />,
      value: stats?.totalContent || 0,
      label: 'Total Content',
      format: 'number'
    },
    {
      id: 'views',
      icon: <Eye size={24} />,
      value: stats?.totalViews || 0,
      label: 'Total Views',
      format: 'number'
    },
    {
      id: 'earnings',
      icon: <DollarSign size={24} />,
      value: stats?.totalEarnings || 0,
      label: 'Total Earnings',
      format: 'currency'
    },
    {
      id: 'connections',
      icon: <Users size={24} />,
      value: stats?.connections || 0,
      label: 'Connections',
      format: 'number'
    }
  ];

  const formatValue = (value, format) => {
    if (loading) return '...';

    switch (format) {
      case 'currency':
        return `$${(value || 0).toFixed(2)}`;
      case 'number':
      default:
        return (value || 0).toLocaleString();
    }
  };

  return (
    <div className={`ContentManagementStats ${className}`}>
      {statCards.map((card) => (
        <div
          key={card.id}
          className="ContentManagementStats-card"
          onClick={() => onStatClick && onStatClick(card.id)}
          style={{ cursor: onStatClick ? 'pointer' : 'default' }}
        >
          <div className="ContentManagementStats-icon">
            {card.icon}
          </div>
          <div className="ContentManagementStats-info">
            <span className="ContentManagementStats-value">
              {formatValue(card.value, card.format)}
            </span>
            <span className="ContentManagementStats-label">
              {card.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContentManagementStats;