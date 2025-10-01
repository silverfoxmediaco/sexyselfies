import React from 'react';
import './ConnectionsStatsFilter.css';

const ConnectionsStatsFilter = ({ stats, onFilterChange, activeFilter = 'total', loading = false }) => {
  // Handle filter selection
  const handleFilterClick = (filterType) => {
    console.log('🔄 ConnectionsStatsFilter: Filter changed to:', filterType);
    if (onFilterChange) {
      onFilterChange(filterType);
    }
  };

  if (loading) {
    return (
      <div className="ConnectionsStatsFilter-container">
        <div className="ConnectionsStatsFilter-loading">Loading stats...</div>
      </div>
    );
  }

  const safeStats = {
    total: stats?.total || 0,
    active: stats?.active || 0,
    pending: stats?.pending || 0,
    expired: stats?.expired || 0
  };

  return (
    <div className="ConnectionsStatsFilter-container">
      <div className="ConnectionsStatsFilter-stats">
        {/* Total */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'total' ? 'active' : ''}`}
          onClick={() => handleFilterClick('total')}
        >
          <span className="ConnectionsStatsFilter-stat-value">{safeStats.total}</span>
          <span className="ConnectionsStatsFilter-stat-label">Total</span>
        </div>

        {/* Active */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => handleFilterClick('active')}
        >
          <span className="ConnectionsStatsFilter-stat-value ConnectionsStatsFilter-active">{safeStats.active}</span>
          <span className="ConnectionsStatsFilter-stat-label">Active</span>
        </div>

        {/* Pending */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => handleFilterClick('pending')}
        >
          <span className="ConnectionsStatsFilter-stat-value ConnectionsStatsFilter-pending">{safeStats.pending}</span>
          <span className="ConnectionsStatsFilter-stat-label">Pending</span>
        </div>

        {/* Expired */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'expired' ? 'active' : ''}`}
          onClick={() => handleFilterClick('expired')}
        >
          <span className="ConnectionsStatsFilter-stat-value ConnectionsStatsFilter-expired">{safeStats.expired}</span>
          <span className="ConnectionsStatsFilter-stat-label">Expired</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsStatsFilter;