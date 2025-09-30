import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, DollarSign, TrendingUp } from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { ConnectionsList } from '../components/Connections';
import connectionsService from '../services/connections.service';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './MemberConnections.css';

/**
 * MemberConnections - Updated member connections page using new components
 */
const MemberConnections = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  // State
  const [connections, setConnections] = useState([]);
  const [stats, setStats] = useState({
    totalConnections: 0,
    activeChats: 0,
    totalSpent: 0,
    avgResponse: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connections from API
  const fetchConnections = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching connections with params:', params);

      const response = await connectionsService.getConnections({
        status: 'active', // Only show active connections for members
        ...params
      });

      console.log('✅ Connections response:', response);

      if (response.success) {
        // Transform connections to match component expectations
        const transformedConnections = response.connections.map(conn =>
          connectionsService.transformConnection(conn)
        );

        setConnections(transformedConnections);
        setStats(response.stats || stats);
      } else {
        throw new Error('Failed to fetch connections');
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
  }, []);

  // Delete individual connection
  const handleDeleteConnection = useCallback(async (connectionId) => {
    try {
      console.log('🗑️ Deleting connection:', connectionId);

      // Optimistic update
      setConnections(prev => prev.filter(c => c.id !== connectionId));

      await connectionsService.deleteConnection(connectionId);

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
      setConnections(prev => prev.filter(c => !connectionIds.includes(c.id)));

      await connectionsService.bulkDeleteConnections(connectionIds);

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
    <div className='member-connections'>
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Page Header */}
      <div className='member-connections-header'>
        <div className='member-connections-header-content'>
          <h1>
            <Users size={24} />
            My Connections
          </h1>
          <p>Manage your connections and chat history</p>
        </div>
      </div>

      {/* Stats Overview - Only show when not loading and have data */}
      {!loading && !error && connections.length > 0 && (
        <div className='member-connections-overview'>
          <div className='member-connections-stats-grid'>
            <div className='member-connections-stat-card'>
              <div className='member-connections-stat-icon'>
                <Users size={20} />
              </div>
              <div className='member-connections-stat-content'>
                <div className='member-connections-stat-value'>
                  {stats.totalConnections || connections.length}
                </div>
                <div className='member-connections-stat-label'>Total Connections</div>
              </div>
            </div>

            <div className='member-connections-stat-card'>
              <div className='member-connections-stat-icon'>
                <MessageCircle size={20} />
              </div>
              <div className='member-connections-stat-content'>
                <div className='member-connections-stat-value'>
                  {stats.activeChats || 0}
                </div>
                <div className='member-connections-stat-label'>Active Chats</div>
              </div>
            </div>

            <div className='member-connections-stat-card'>
              <div className='member-connections-stat-icon'>
                <DollarSign size={20} />
              </div>
              <div className='member-connections-stat-content'>
                <div className='member-connections-stat-value'>
                  {formatCurrency(stats.totalSpent)}
                </div>
                <div className='member-connections-stat-label'>Total Spent</div>
              </div>
            </div>

            <div className='member-connections-stat-card'>
              <div className='member-connections-stat-icon'>
                <TrendingUp size={20} />
              </div>
              <div className='member-connections-stat-content'>
                <div className='member-connections-stat-value'>
                  {stats.avgResponse || 0}m
                </div>
                <div className='member-connections-stat-label'>Avg Response</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Connections List */}
      <div className='member-connections-content'>
        <ConnectionsList
          connections={connections}
          onDeleteConnection={handleDeleteConnection}
          onBulkDelete={handleBulkDelete}
          onRefresh={handleRefresh}
          loading={loading}
          error={error}
          className="member-connections-list"
        />
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default MemberConnections;