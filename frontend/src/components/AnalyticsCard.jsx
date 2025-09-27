import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './AnalyticsCard.css';

const AnalyticsCard = ({
  icon,
  value,
  label,
  type = 'default',
  onClick,
  loading = false,
  trend,
  className = ''
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      // Format currency values
      if (label.toLowerCase().includes('avg') || label.toLowerCase().includes('spending') || label.toLowerCase().includes('$')) {
        return `$${val.toFixed(2)}`;
      }
      // Format large numbers with commas
      return val.toLocaleString();
    }
    return val;
  };

  const getLoadingValue = () => {
    if (label.toLowerCase().includes('avg') || label.toLowerCase().includes('spending')) {
      return '$--';
    }
    return '--';
  };

  return (
    <div
      className={`AnalyticsCard AnalyticsCard-${type} ${onClick ? 'AnalyticsCard-clickable' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={`AnalyticsCard-icon AnalyticsCard-icon-${type}`}>
        {loading ? (
          <div className="AnalyticsCard-spinner" />
        ) : (
          icon
        )}
      </div>

      <div className="AnalyticsCard-content">
        <div className="AnalyticsCard-value">
          {loading ? getLoadingValue() : formatValue(value)}
        </div>
        <div className="AnalyticsCard-label">{label}</div>

        {trend && !loading && (
          <div className={`AnalyticsCard-trend ${trend.isUp ? 'AnalyticsCard-trend-up' : 'AnalyticsCard-trend-down'}`}>
            {trend.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCard;