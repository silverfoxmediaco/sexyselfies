import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import ConnectionCard from './ConnectionCard';
import ConnectionsFilter from './ConnectionsFilter';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ConnectionsSkeleton from './ConnectionsSkeleton';
import './ConnectionsList.css';

/**
 * ConnectionsList - Main component for managing user connections
 *
 * @param {Object} props
 * @param {Array} props.connections - Array of connection objects
 * @param {Function} props.onDeleteConnection - Callback for deleting individual connection
 * @param {Function} props.onBulkDelete - Callback for bulk deletion
 * @param {Function} props.onRefresh - Callback for refreshing connections
 * @param {Boolean} props.loading - Loading state
 * @param {Object} props.error - Error object
 * @param {String} props.className - Additional CSS classes
 */
const ConnectionsList = ({
  connections = [],
  onDeleteConnection,
  onBulkDelete,
  onRefresh,
  loading = false,
  error = null,
  className = ''
}) => {
  // State management
  const [selectedConnections, setSelectedConnections] = useState(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Filter and sort connections
  const filteredConnections = useMemo(() => {
    let filtered = connections.filter(connection => {
      const searchText = filterText.toLowerCase();
      return (
        connection.name.toLowerCase().includes(searchText) ||
        connection.username.toLowerCase().includes(searchText) ||
        connection.lastMessage.toLowerCase().includes(searchText)
      );
    });

    // Sort connections
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.messageTime) - new Date(a.messageTime);
        case 'oldest':
          return new Date(a.messageTime) - new Date(b.messageTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [connections, filterText, sortBy]);

  // Handle individual connection selection
  const handleConnectionSelect = useCallback((connectionId, isSelected) => {
    setSelectedConnections(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(connectionId);
      } else {
        newSet.delete(connectionId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      setSelectedConnections(new Set(filteredConnections.map(c => c.id)));
    } else {
      setSelectedConnections(new Set());
    }
  }, [filteredConnections]);

  // Handle individual delete
  const handleDeleteClick = useCallback((connection) => {
    setConnectionToDelete(connection);
    setBulkDeleteMode(false);
    setDeleteModalOpen(true);
  }, []);

  // Handle bulk delete
  const handleBulkDeleteClick = useCallback(() => {
    setBulkDeleteMode(true);
    setDeleteModalOpen(true);
  }, []);

  // Confirm deletion
  const handleConfirmDelete = useCallback(async () => {
    try {
      if (bulkDeleteMode) {
        await onBulkDelete(Array.from(selectedConnections));
        setSelectedConnections(new Set());
      } else if (connectionToDelete) {
        await onDeleteConnection(connectionToDelete.id);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteModalOpen(false);
      setConnectionToDelete(null);
      setBulkDeleteMode(false);
    }
  }, [bulkDeleteMode, selectedConnections, connectionToDelete, onBulkDelete, onDeleteConnection]);

  // Cancel deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setConnectionToDelete(null);
    setBulkDeleteMode(false);
  }, []);

  // Clear selection when connections change
  useEffect(() => {
    setSelectedConnections(prev => {
      const connectionIds = new Set(connections.map(c => c.id));
      const newSet = new Set();
      prev.forEach(id => {
        if (connectionIds.has(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [connections]);

  // Calculate selection stats
  const allSelected = filteredConnections.length > 0 && selectedConnections.size === filteredConnections.length;
  const someSelected = selectedConnections.size > 0;

  // Handle error state
  if (error) {
    return (
      <div className={`ConnectionsList ${className}`}>
        <div className="ConnectionsList-error">
          <div className="ConnectionsList-error-icon">⚠️</div>
          <h3>Unable to load connections</h3>
          <p>{error.message || 'Something went wrong while loading your connections.'}</p>
          <button
            className="ConnectionsList-retry-btn"
            onClick={onRefresh}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`ConnectionsList ${className}`}>
      {/* Filter and actions header */}
      <div className="ConnectionsList-header">
        <ConnectionsFilter
          filterText={filterText}
          onFilterChange={setFilterText}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedCount={selectedConnections.size}
          totalCount={filteredConnections.length}
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
          onBulkDelete={someSelected ? handleBulkDeleteClick : null}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <ConnectionsSkeleton count={6} />
      )}

      {/* Empty state */}
      {!loading && filteredConnections.length === 0 && (
        <div className="ConnectionsList-empty">
          <div className="ConnectionsList-empty-icon">💬</div>
          <h3>No connections found</h3>
          <p>
            {filterText
              ? `No connections match "${filterText}"`
              : "You haven't connected with anyone yet."
            }
          </p>
          {filterText && (
            <button
              className="ConnectionsList-clear-filter"
              onClick={() => setFilterText('')}
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Connections list */}
      {!loading && filteredConnections.length > 0 && (
        <div className="ConnectionsList-grid">
          <AnimatePresence mode="popLayout">
            {filteredConnections.map((connection, index) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: "easeOut"
                }}
                layout
              >
                <ConnectionCard
                  connection={connection}
                  isSelected={selectedConnections.has(connection.id)}
                  onSelect={handleConnectionSelect}
                  onDelete={handleDeleteClick}
                  showCheckbox={someSelected}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        connection={connectionToDelete}
        bulkCount={bulkDeleteMode ? selectedConnections.size : 0}
      />
    </div>
  );
};

ConnectionsList.propTypes = {
  connections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    name: PropTypes.string.isRequired,
    username: PropTypes.string,
    connectionType: PropTypes.string,
    connectionTypeColor: PropTypes.string,
    lastMessage: PropTypes.string,
    messageTime: PropTypes.string,
    isConnected: PropTypes.bool
  })),
  onDeleteConnection: PropTypes.func.isRequired,
  onBulkDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.object,
  className: PropTypes.string
};

export default React.memo(ConnectionsList);