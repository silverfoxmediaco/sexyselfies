import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, DollarSign, TrendingUp } from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import SimpleConnectionsList from '../components/SimpleConnectionsList';
import connectionsService from '../services/connections.service';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './MyConnections.css';

const MyConnections = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  // State
  const [connections, setConnections] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connections from API
  const fetchConnections = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching connections with params:', params);

      // Get both connections and stats
      const [connectionsResponse, statsResponse] = await Promise.allSettled([
        connectionsService.getConnections(params),
        connectionsService.getConnectionStats().catch(() => ({ stats: stats })) // Fallback on stats error
      ]);

      // Handle connections response
      if (connectionsResponse.status === 'fulfilled' && connectionsResponse.value.success) {
        // Transform connections to match component expectations
        const transformedConnections = connectionsResponse.value.connections.map(conn =>
          connectionsService.transformConnection(conn)
        );

        setConnections(transformedConnections);
        console.log('✅ Connections loaded:', transformedConnections.length);
      } else {
        console.log('⚠️ Connections response failed, using empty array');
        setConnections([]);
      }

      // Handle stats response
      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.stats || statsResponse.value.data || stats);
      }

    } catch (err) {
      console.error('❌ Error fetching connections:', err);
      setError({
        message: err.message || 'Unable to load your connections. Please try again.'
      });
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [stats]);

  // Delete individual connection
  const handleDeleteConnection = useCallback(async (connectionId) => {
    try {
      console.log('🗑️ Deleting connection:', connectionId);

      // Optimistic update
      setConnections(prev => prev.filter(c => c.id !== connectionId));

      await connectionsService.deleteConnection(connectionId);

      // Update stats after successful delete
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        active: Math.max(0, prev.active - 1) // Assuming deleted connection was active
      }));

      console.log('✅ Connection deleted successfully');
    } catch (err) {
      console.error('❌ Failed to delete connection:', err);

      // Revert optimistic update on error
      fetchConnections();

      // Could show toast notification here
      alert('Failed to delete connection. Please try again.');
    }
  }, [fetchConnections]);

  // Bulk delete connections
  const handleBulkDelete = useCallback(async (connectionIds) => {
    try {
      console.log('🗑️ Bulk deleting connections:', connectionIds);

      // Optimistic update
      const deletedCount = connectionIds.length;
      setConnections(prev => prev.filter(c => !connectionIds.includes(c.id)));

      await connectionsService.bulkDeleteConnections(connectionIds);

      // Update stats after successful bulk delete
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - deletedCount),
        active: Math.max(0, prev.active - deletedCount) // Assuming deleted connections were active
      }));

      console.log('✅ Connections deleted successfully');
    } catch (err) {
      console.error('❌ Failed to bulk delete connections:', err);

      // Revert optimistic update on error
      fetchConnections();

      // Could show toast notification here
      alert('Failed to delete connections. Please try again.');
    }
  }, [fetchConnections]);

  // Refresh connections
  const handleRefresh = useCallback(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Load connections on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Format currency for stats display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <>
      {isDesktop && <MainHeader />}

      <div className='my-connections-container'>
        {/* Header */}
        <div className='connections-header'>
          <div className='header-top'>
            <h1>My Connections</h1>
          </div>

          {/* Stats Bar - Only show when not loading and have data */}
          {!loading && !error && (
            <div className='connections-stats'>
              <div className='stat-item'>
                <span className='stat-value'>{stats.total}</span>
                <span className='stat-label'>Total</span>
              </div>
              <div className='stat-item'>
                <span className='stat-value' style={{ color: '#22C55E' }}>
                  {stats.active}
                </span>
                <span className='stat-label'>Active</span>
              </div>
              <div className='stat-item'>
                <span className='stat-value' style={{ color: '#F59E0B' }}>
                  {stats.pending}
                </span>
                <span className='stat-label'>Pending</span>
              </div>
              <div className='stat-item'>
                <span className='stat-value' style={{ color: '#EF4444' }}>
                  {stats.expired}
                </span>
                <span className='stat-label'>Expired</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - SimpleConnectionsList Component */}
        <div className='connections-content'>
          <SimpleConnectionsList />
        </div>
      </div>

      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default MyConnections;