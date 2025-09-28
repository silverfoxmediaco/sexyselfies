import React from 'react';
import './MiniCharts.css';

const MiniCharts = ({
  charts = [],
  loading = false,
  className = ''
}) => {
  const defaultCharts = charts.length ? charts : [
    {
      id: 'revenue',
      title: 'Revenue Trend',
      value: 0,
      format: 'currency',
      trendClass: 'revenue-trend'
    },
    {
      id: 'views',
      title: 'Views This Week',
      value: 0,
      format: 'number',
      trendClass: 'views-trend'
    },
    {
      id: 'conversion',
      title: 'Conversion Rate',
      value: 0,
      format: 'percentage',
      trendClass: 'conversion-trend'
    }
  ];

  const formatValue = (value, format) => {
    if (loading) return '...';

    switch (format) {
      case 'currency':
        return `$${(value || 0).toLocaleString()}`;
      case 'percentage':
        return `${(value || 0).toFixed(1)}%`;
      case 'number':
      default:
        return (value || 0).toLocaleString();
    }
  };

  // Placeholder for future chart rendering
  const renderTrendLine = (chart) => {
    // This will be replaced with actual chart library (Chart.js, Recharts, etc.)
    return (
      <div className={`MiniCharts-trend-line ${chart.trendClass}`}>
        {/* Placeholder SVG trend line */}
        <svg className="MiniCharts-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${chart.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Placeholder trend line path */}
          {chart.id === 'revenue' && (
            <>
              <path
                d="M0,30 Q25,25 50,20 T100,15"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="MiniCharts-line"
              />
              <path
                d="M0,30 Q25,25 50,20 T100,15 L100,40 L0,40 Z"
                fill={`url(#gradient-${chart.id})`}
                className="MiniCharts-area"
              />
            </>
          )}

          {chart.id === 'views' && (
            <>
              <path
                d="M0,25 Q20,20 40,22 Q60,18 80,16 L100,12"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="MiniCharts-line"
              />
              <path
                d="M0,25 Q20,20 40,22 Q60,18 80,16 L100,12 L100,40 L0,40 Z"
                fill={`url(#gradient-${chart.id})`}
                className="MiniCharts-area"
              />
            </>
          )}

          {chart.id === 'conversion' && (
            <>
              <path
                d="M0,35 Q30,32 60,28 Q80,25 100,20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="MiniCharts-line"
              />
              <path
                d="M0,35 Q30,32 60,28 Q80,25 100,20 L100,40 L0,40 Z"
                fill={`url(#gradient-${chart.id})`}
                className="MiniCharts-area"
              />
            </>
          )}

          {/* Placeholder dots for data points */}
          <circle cx="25" cy={chart.id === 'revenue' ? 25 : chart.id === 'views' ? 20 : 32} r="2" fill="currentColor" className="MiniCharts-dot" />
          <circle cx="50" cy={chart.id === 'revenue' ? 20 : chart.id === 'views' ? 22 : 28} r="2" fill="currentColor" className="MiniCharts-dot" />
          <circle cx="75" cy={chart.id === 'revenue' ? 15 : chart.id === 'views' ? 16 : 25} r="2" fill="currentColor" className="MiniCharts-dot" />
        </svg>

        {/* Future: Render actual chart with chart.data */}
      </div>
    );
  };

  return (
    <div className={`MiniCharts ${className}`}>
      {defaultCharts.map((chart) => (
        <div key={chart.id} className="MiniCharts-chart">
          <div className="MiniCharts-header">
            <h4 className="MiniCharts-title">{chart.title}</h4>
          </div>

          <div className="MiniCharts-chart-container">
            {loading ? (
              <div className="MiniCharts-skeleton" />
            ) : (
              renderTrendLine(chart)
            )}
          </div>

          <div className="MiniCharts-footer">
            <div className="MiniCharts-value">
              {formatValue(chart.value, chart.format)}
            </div>
            {!loading && chart.trend && (
              <div className={`MiniCharts-trend ${chart.trend}`}>
                {chart.trend === 'up' && <span className="MiniCharts-trend-indicator">↗</span>}
                {chart.trend === 'down' && <span className="MiniCharts-trend-indicator">↘</span>}
                {chart.trend === 'neutral' && <span className="MiniCharts-trend-indicator">→</span>}
                <span className="MiniCharts-trend-text">
                  {chart.trend === 'up' && 'Trending up'}
                  {chart.trend === 'down' && 'Trending down'}
                  {chart.trend === 'neutral' && 'Stable'}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MiniCharts;