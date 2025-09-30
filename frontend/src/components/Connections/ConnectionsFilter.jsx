import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Minus,
  Trash2,
  SortAsc,
  X,
  Users
} from 'lucide-react';
import './ConnectionsFilter.css';

/**
 * ConnectionsFilter - Filter and bulk action controls for connections
 *
 * @param {Object} props
 * @param {String} props.filterText - Current filter text
 * @param {Function} props.onFilterChange - Filter text change handler
 * @param {String} props.sortBy - Current sort option
 * @param {Function} props.onSortChange - Sort change handler
 * @param {Number} props.selectedCount - Number of selected items
 * @param {Number} props.totalCount - Total number of items
 * @param {Boolean} props.allSelected - Whether all items are selected
 * @param {Function} props.onSelectAll - Select all handler
 * @param {Function} props.onBulkDelete - Bulk delete handler (null if disabled)
 */
const ConnectionsFilter = ({
  filterText = '',
  onFilterChange,
  sortBy = 'recent',
  onSortChange,
  selectedCount = 0,
  totalCount = 0,
  allSelected = false,
  onSelectAll,
  onBulkDelete = null
}) => {
  // Handle filter input change
  const handleFilterChange = useCallback((e) => {
    onFilterChange(e.target.value);
  }, [onFilterChange]);

  // Clear filter
  const handleClearFilter = useCallback(() => {
    onFilterChange('');
  }, [onFilterChange]);

  // Handle sort change
  const handleSortChange = useCallback((e) => {
    onSortChange(e.target.value);
  }, [onSortChange]);

  // Handle select all checkbox
  const handleSelectAllChange = useCallback((e) => {
    onSelectAll(e.target.checked);
  }, [onSelectAll]);

  // Calculate checkbox state
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;
  const isChecked = allSelected && totalCount > 0;

  // Sort options
  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' }
  ];

  return (
    <div className="ConnectionsFilter">
      {/* Search and filter row */}
      <div className="ConnectionsFilter-search-row">
        <div className="ConnectionsFilter-search">
          <div className="ConnectionsFilter-search-input">
            <Search size={20} className="ConnectionsFilter-search-icon" />
            <input
              type="text"
              placeholder="Search connections..."
              value={filterText}
              onChange={handleFilterChange}
              className="ConnectionsFilter-input"
              aria-label="Search connections"
            />
            {filterText && (
              <button
                className="ConnectionsFilter-clear"
                onClick={handleClearFilter}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="ConnectionsFilter-controls">
          {/* Sort dropdown */}
          <div className="ConnectionsFilter-sort">
            <SortAsc size={16} className="ConnectionsFilter-sort-icon" />
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="ConnectionsFilter-sort-select"
              aria-label="Sort connections"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selection and actions row */}
      <div className="ConnectionsFilter-actions-row">
        <div className="ConnectionsFilter-selection">
          <div className="ConnectionsFilter-select-all">
            <div className="ConnectionsFilter-checkbox-container">
              {isIndeterminate ? (
                <Minus
                  size={16}
                  className="ConnectionsFilter-checkbox-icon indeterminate"
                  onClick={() => onSelectAll(false)}
                />
              ) : isChecked ? (
                <CheckSquare
                  size={16}
                  className="ConnectionsFilter-checkbox-icon checked"
                  onClick={() => onSelectAll(false)}
                />
              ) : (
                <Square
                  size={16}
                  className="ConnectionsFilter-checkbox-icon"
                  onClick={() => onSelectAll(true)}
                />
              )}
              <input
                type="checkbox"
                checked={isChecked}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAllChange}
                className="ConnectionsFilter-checkbox-hidden"
                aria-label={isChecked ? 'Deselect all' : 'Select all'}
              />
            </div>
            <span className="ConnectionsFilter-selection-text">
              {selectedCount > 0 ? (
                `${selectedCount} of ${totalCount} selected`
              ) : (
                `${totalCount} connections`
              )}
            </span>
          </div>

          <div className="ConnectionsFilter-count">
            <Users size={16} />
            <span>{totalCount}</span>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedCount > 0 && (
          <motion.div
            className="ConnectionsFilter-bulk-actions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {onBulkDelete && (
              <button
                className="ConnectionsFilter-bulk-delete"
                onClick={onBulkDelete}
                aria-label={`Delete ${selectedCount} selected connections`}
                title={`Delete ${selectedCount} selected connections`}
              >
                <Trash2 size={16} />
                <span>Delete {selectedCount}</span>
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Filter summary */}
      {filterText && (
        <div className="ConnectionsFilter-summary">
          <Filter size={14} />
          <span>Showing results for "{filterText}"</span>
          <button
            className="ConnectionsFilter-clear-summary"
            onClick={handleClearFilter}
            aria-label="Clear filter"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};


export default memo(ConnectionsFilter);