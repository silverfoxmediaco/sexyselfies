import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, DollarSign, TrendingUp } from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import SimpleConnectionsList from '../components/SimpleConnectionsList';
import ConnectionsStatsFilter from '../components/ConnectionsStatsFilter';
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
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('total');

  // Fetch connections from API
  const fetchConnections = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching connections with params:', params);

      // Get connections only (removed stats call to prevent infinite loop)
      const connectionsResponse = await connectionsService.getConnections(params);

      // Handle connections response
      if (connectionsResponse.success) {
        // Transform connections to match component expectations
        const transformedConnections = connectionsResponse.connections.map(conn =>
          connectionsService.transformConnection(conn)
        );

        setConnections(transformedConnections);

        // Update stats based on connections data instead of separate API call
        const connectionStats = {
          total: transformedConnections.length,
          active: transformedConnections.filter(c => c.status === 'connected').length,
          pending: transformedConnections.filter(c => c.status === 'pending').length,
          expired: transformedConnections.filter(c => c.status === 'expired').length,
        };
        setStats(connectionStats);

        console.log('✅ Connections loaded:', transformedConnections.length);
      } else {
        console.log('⚠️ Connections response failed, using empty array');
        setConnections([]);
        setStats({ total: 0, active: 0, pending: 0, expired: 0 });
      }

    } catch (err) {
      console.error('❌ Error fetching connections:', err);
      setError({
        message: err.message || 'Unable to load your connections. Please try again.'
      });
      setConnections([]);
      setStats({ total: 0, active: 0, pending: 0, expired: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Filter connections based on selected filter
  const filterConnections = useCallback((filterType) => {
    if (filterType === 'total') {
      setFilteredConnections(connections);
    } else {
      const filtered = connections.filter(conn => {
        switch (filterType) {
          case 'active':
            return conn.status === 'connected';
          case 'pending':
            return conn.status === 'pending';
          case 'expired':
            return conn.status === 'expired';
          default:
            return true;
        }
      });
      setFilteredConnections(filtered);
    }
  }, [connections]);

  // Handle filter change
  const handleFilterChange = useCallback((filterType) => {
    setActiveFilter(filterType);
    filterConnections(filterType);
  }, [filterConnections]);

  // Update filtered connections when connections change
  useEffect(() => {
    filterConnections(activeFilter);
  }, [connections, activeFilter, filterConnections]);

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
        </div>

        {/* Stats Filter Component */}
        <ConnectionsStatsFilter
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          loading={loading}
        />

        {/* Main Content - SimpleConnectionsList Component */}
        <div className='connections-content'>
          <SimpleConnectionsList connections={filteredConnections} loading={loading} error={error} />
        </div>
      </div>

      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default MyConnections;