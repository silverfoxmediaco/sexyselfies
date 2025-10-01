import React, { useState, useEffect } from 'react';
import api from '../services/api.config';
import './ConnectionsStatsFilter.css';

const ConnectionsStatsFilter = ({ onFilterChange, activeFilter = 'total' }) => {
  console.log('🔄 ConnectionsStatsFilter: Component mounting/rendering...');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connection stats
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/connections/stats');
      console.log('📊 ConnectionsStatsFilter: Stats response:', response);

      if (response.data) {
        setStats({
          total: response.data.total || 0,
          active: response.data.active || 0,
          pending: response.data.pending || 0,
          expired: response.data.expired || 0
        });
      }
    } catch (err) {
      console.error('❌ ConnectionsStatsFilter: Error fetching stats:', err);
      setError('Unable to load stats');
      // Set default stats on error
      setStats({ total: 0, active: 0, pending: 0, expired: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter selection
  const handleFilterClick = (filterType) => {
    console.log('🔄 ConnectionsStatsFilter: Filter changed to:', filterType);
    if (onFilterChange) {
      onFilterChange(filterType);
    }
  };

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="ConnectionsStatsFilter-container">
        <div className="ConnectionsStatsFilter-loading">Loading stats...</div>
      </div>
    );
  }

  console.log('🔄 ConnectionsStatsFilter: Rendering with stats:', stats, 'loading:', loading, 'error:', error);

  return (
    <div className="ConnectionsStatsFilter-container">
      <div className="ConnectionsStatsFilter-stats">
        {/* Total */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'total' ? 'active' : ''}`}
          onClick={() => handleFilterClick('total')}
        >
          <span className="ConnectionsStatsFilter-stat-value">{stats.total}</span>
          <span className="ConnectionsStatsFilter-stat-label">Total</span>
        </div>

        {/* Active */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => handleFilterClick('active')}
        >
          <span className="ConnectionsStatsFilter-stat-value ConnectionsStatsFilter-active">{stats.active}</span>
          <span className="ConnectionsStatsFilter-stat-label">Active</span>
        </div>

        {/* Pending */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => handleFilterClick('pending')}
        >
          <span className="ConnectionsStatsFilter-stat-value ConnectionsStatsFilter-pending">{stats.pending}</span>
          <span className="ConnectionsStatsFilter-stat-label">Pending</span>
        </div>

        {/* Expired */}
        <div
          className={`ConnectionsStatsFilter-stat-item ${activeFilter === 'expired' ? 'active' : ''}`}
          onClick={() => handleFilterClick('expired')}
        >
          <span className="ConnectionsStatsFilter-stat-value ConnectionsStatsFilter-expired">{stats.expired}</span>
          <span className="ConnectionsStatsFilter-stat-label">Expired</span>
        </div>
      </div>

      {error && (
        <div className="ConnectionsStatsFilter-error">
          {error}
          <button onClick={fetchStats} className="ConnectionsStatsFilter-retry">
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionsStatsFilter;