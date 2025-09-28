import React from 'react';
import { Eye, Heart, DollarSign, Star, Package, Users } from 'lucide-react';
import './StatsGrid.css';

const StatsGrid = ({
  stats,
  loading = false,
  showAll = false,
  className = ''
}) => {
  const formatValue = (value, type) => {
    if (loading) return '...';
    if (value === null || value === undefined) return '0';

    if (type === 'earnings') {
      return `$${(value || 0).toLocaleString()}`;
    }
    if (type === 'rating') {
      return (value || 0).toFixed(1);
    }
    return (value || 0).toLocaleString();
  };

  const baseStats = [
    {
      icon: <Eye size={20} />,
      value: formatValue(stats?.totalViews, 'views'),
      label: 'Total Views',
      type: 'views'
    },
    {
      icon: <Heart size={20} />,
      value: formatValue(stats?.connections, 'connections'),
      label: 'Connections',
      type: 'connections'
    },
    {
      icon: <DollarSign size={20} />,
      value: formatValue(stats?.earnings, 'earnings'),
      label: 'Total Earnings',
      type: 'earnings'
    },
    {
      icon: <Star size={20} />,
      value: formatValue(stats?.rating, 'rating'),
      label: 'Rating',
      type: 'rating'
    }
  ];

  const extendedStats = [
    {
      icon: <Package size={20} />,
      value: formatValue(stats?.totalContent, 'content'),
      label: 'Total Content',
      type: 'content'
    },
    {
      icon: <Users size={20} />,
      value: formatValue(stats?.totalFollowers, 'followers'),
      label: 'Followers',
      type: 'followers'
    }
  ];

  const displayStats = showAll ? [...baseStats, ...extendedStats] : baseStats;

  return (
    <div className={`StatsGrid-container ${className}`}>
      {displayStats.map((stat, index) => (
        <div key={`${stat.type}-${index}`} className="StatsGrid-card">
          <div className={`StatsGrid-icon StatsGrid-icon-${stat.type}`}>
            {loading ? (
              <div className="StatsGrid-icon-skeleton" />
            ) : (
              stat.icon
            )}
          </div>
          <div className="StatsGrid-content">
            <span className="StatsGrid-value">
              {loading ? (
                <div className="StatsGrid-skeleton StatsGrid-skeleton-value" />
              ) : (
                stat.value
              )}
            </span>
            <span className="StatsGrid-label">
              {loading ? (
                <div className="StatsGrid-skeleton StatsGrid-skeleton-label" />
              ) : (
                stat.label
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;