import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionsList } from './index';
import './ConnectionsExample.css';

/**
 * ConnectionsExample - Example usage of the ConnectionsList component
 * This shows how to integrate the connections components with API calls
 */
const ConnectionsExample = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const mockConnections = [
    {
      id: '1',
      avatar: '/placeholders/beautifulbrunette2.png',
      name: 'Sarah Johnson',
      username: 'sarah_j',
      connectionType: 'S',
      connectionTypeColor: '#8e8e93',
      lastMessage: 'Hey! Thanks for connecting with me 💕',
      messageTime: '2025-09-22T15:30:00Z',
      isConnected: true
    },
    {
      id: '2',
      avatar: '/placeholders/creator1.png',
      name: 'Emma Wilson',
      username: 'emma_w',
      connectionType: 'M',
      connectionTypeColor: '#3b82f6',
      lastMessage: 'Check out my latest content!',
      messageTime: '2025-09-22T10:15:00Z',
      isConnected: true
    },
    {
      id: '3',
      avatar: null, // Test fallback avatar
      name: 'Jessica Davis',
      username: 'jess_d',
      connectionType: 'C',
      connectionTypeColor: '#10b981',
      lastMessage: 'No messages yet',
      messageTime: '2025-09-21T18:45:00Z',
      isConnected: false
    },
    {
      id: '4',
      avatar: '/placeholders/creator2.png',
      name: 'Ashley Miller',
      username: 'ash_m',
      connectionType: 'F',
      connectionTypeColor: '#f59e0b',
      lastMessage: 'Love your profile! Can\'t wait to see more content from you.',
      messageTime: '2025-09-21T14:20:00Z',
      isConnected: true
    },
    {
      id: '5',
      avatar: '/placeholders/creator3.png',
      name: 'Madison Taylor',
      username: 'madi_t',
      connectionType: 'P',
      connectionTypeColor: '#8b5cf6',
      lastMessage: 'Thanks for the exclusive content access!',
      messageTime: '2025-09-20T09:30:00Z',
      isConnected: true
    }
  ];

  // Simulate API calls
  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate API call
      // const response = await api.get('/connections');
      // setConnections(response.data);

      setConnections(mockConnections);
    } catch (err) {
      setError({
        message: 'Failed to load connections. Please check your internet connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete individual connection
  const handleDeleteConnection = useCallback(async (connectionId) => {
    try {
      // Optimistic update
      setConnections(prev => prev.filter(c => c.id !== connectionId));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // await api.delete(`/connections/${connectionId}`);

      console.log('Connection deleted:', connectionId);
    } catch (err) {
      // Revert optimistic update on error
      setConnections(mockConnections);
      console.error('Failed to delete connection:', err);
    }
  }, []);

  // Bulk delete connections
  const handleBulkDelete = useCallback(async (connectionIds) => {
    try {
      // Optimistic update
      setConnections(prev => prev.filter(c => !connectionIds.includes(c.id)));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // await api.post('/connections/bulk-delete', { connectionIds });

      console.log('Connections deleted:', connectionIds);
    } catch (err) {
      // Revert optimistic update on error
      setConnections(mockConnections);
      console.error('Failed to delete connections:', err);
    }
  }, []);

  // Refresh connections
  const handleRefresh = useCallback(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Load connections on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return (
    <div className="ConnectionsExample">
      <div className="ConnectionsExample-header">
        <h1>My Connections</h1>
        <p>Manage your connections and chat history</p>
      </div>

      <ConnectionsList
        connections={connections}
        onDeleteConnection={handleDeleteConnection}
        onBulkDelete={handleBulkDelete}
        onRefresh={handleRefresh}
        loading={loading}
        error={error}
        className="ConnectionsExample-list"
      />
    </div>
  );
};

export default ConnectionsExample;