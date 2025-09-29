import React from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import './MembersFilters.css';

const MembersFilters = ({
  filterValue = 'all',
  sortValue = 'totalSpent',
  sortOrder = 'desc',
  onFilterChange,
  onSortChange,
  onSortOrderToggle,
  filterOptions,
  sortOptions,
  className = ''
}) => {
  const defaultFilterOptions = [
    { value: 'all', label: 'All Members' },
    { value: 'premium', label: 'Premium' },
    { value: 'active', label: 'Active' },
    { value: 'high-spenders', label: 'High Spenders' },
    { value: 'recent', label: 'Recently Joined' }
  ];

  const defaultSortOptions = [
    { value: 'totalSpent', label: 'Total Spent' },
    { value: 'lastActive', label: 'Last Active' },
    { value: 'joinedDate', label: 'Join Date' },
    { value: 'name', label: 'Name' }
  ];

  const filters = filterOptions || defaultFilterOptions;
  const sorts = sortOptions || defaultSortOptions;

  return (
    <div className={`MembersFilters ${className}`}>
      <select
        className="MembersFilters-select MembersFilters-filter"
        value={filterValue}
        onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
        aria-label="Filter members"
      >
        {filters.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="MembersFilters-select MembersFilters-sort"
        value={sortValue}
        onChange={(e) => onSortChange && onSortChange(e.target.value)}
        aria-label="Sort members"
      >
        {sorts.map(option => (
          <option key={option.value} value={option.value}>
            Sort by {option.label}
          </option>
        ))}
      </select>

      <button
        className="MembersFilters-order-btn"
        onClick={onSortOrderToggle}
        title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
        aria-label={`Change sort order to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
      >
        {sortOrder === 'asc' ?
          <ArrowUpWideNarrow size={18} /> :
          <ArrowDownWideNarrow size={18} />
        }
      </button>
    </div>
  );
};

export default MembersFilters;