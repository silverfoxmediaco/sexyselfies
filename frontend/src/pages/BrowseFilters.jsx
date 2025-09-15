import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, RotateCcw, Check, MapPin, Users,
  Calendar, Sliders, Sparkles
} from 'lucide-react';
import axios from 'axios';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './BrowseFilters.css';

const BrowseFilters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  
  // Check if this is first-time setup from login
  const isFirstTimeSetup = location.state?.isFirstTime || false;
  
  // State for all filter options
  const [filters, setFilters] = useState({
    ageRange: { min: 18, max: 35 },
    location: '', // Country
    bodyTypes: [],
    onlineOnly: false,
    verifiedOnly: false,
    newMembersOnly: false
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Filter options
  const bodyTypeOptions = [
    'Slim', 'Slender', 'Athletic', 'Average', 'Curvy', 
    'Plus Size', 'BBW', 'Muscular', 'Dad Bod', 'Mom Bod'
  ];

  const countryOptions = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
    'Japan', 'South Korea', 'Brazil', 'Mexico', 'Argentina', 'Other'
  ];

  useEffect(() => {
    loadSavedFilters();
  }, []);

  useEffect(() => {
    countActiveFilters();
  }, [filters]);

  const loadSavedFilters = async () => {
    setIsLoading(true);
    try {
      // Try to load from API first
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/v1/members/browse/preferences', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success && response.data.preferences) {
            setFilters(response.data.preferences);
            // Also save to localStorage for offline access
            localStorage.setItem('browseFilters', JSON.stringify(response.data.preferences));
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('Failed to load filters from server, trying localStorage:', apiError);
        }
      }
      
      // Fallback to localStorage
      const savedFilters = localStorage.getItem('browseFilters');
      if (savedFilters) {
        setFilters(JSON.parse(savedFilters));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading filters:', error);
      setIsLoading(false);
    }
  };

  const countActiveFilters = () => {
    let count = 0;

    // Check age range (not default)
    if (filters.ageRange.min !== 18 || filters.ageRange.max !== 35) count++;

    // Check location
    if (filters.location && filters.location !== '') count++;

    // Check body types
    if (filters.bodyTypes.length > 0) count++;

    // Check toggles
    if (filters.onlineOnly) count++;
    if (filters.verifiedOnly) count++;
    if (filters.newMembersOnly) count++;

    setActiveFilterCount(count);
  };

  const handleAgeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [type]: parseInt(value)
      }
    }));
    setHasChanges(true);
  };

  const handleLocationChange = (value) => {
    setFilters(prev => ({
      ...prev,
      location: value
    }));
    setHasChanges(true);
  };

  const toggleArrayFilter = (filterType, value) => {
    setFilters(prev => {
      const array = prev[filterType];
      const newArray = array.includes(value)
        ? array.filter(item => item !== value)
        : [...array, value];
      
      return {
        ...prev,
        [filterType]: newArray
      };
    });
    setHasChanges(true);
  };

  const toggleBooleanFilter = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
    setHasChanges(true);
  };


  const resetAllFilters = () => {
    const defaultFilters = {
      ageRange: { min: 18, max: 35 },
      location: '',
      bodyTypes: [],
      onlineOnly: false,
      verifiedOnly: false,
      newMembersOnly: false
    };
    
    setFilters(defaultFilters);
    setHasChanges(true);
  };

  const applyFilters = async () => {
    try {
      // Save to localStorage for immediate use
      localStorage.setItem('browseFilters', JSON.stringify(filters));
      
      // Save to API for persistence
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.post('/api/v1/members/browse/preferences', filters, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (apiError) {
          console.warn('Failed to save filters to server:', apiError);
          // Continue anyway since localStorage is saved
        }
      }
      
      setHasChanges(false);
      
      // Navigate based on context
      if (isFirstTimeSetup) {
        // Complete first-time setup and go to browse creators
        await completeProfileSetup();
      } else {
        // Regular filter update - go back
        navigate(-1);
      }
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const completeProfileSetup = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Mark profile as complete
        await axios.post('/api/v1/members/complete-profile', {}, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Navigate to browse creators
      navigate('/member/browse-creators', { replace: true });
    } catch (error) {
      console.error('Error completing profile setup:', error);
      // Navigate anyway
      navigate('/member/browse-creators', { replace: true });
    }
  };


  if (isLoading) {
    return (
      <div className="bf-container">
        {/* Desktop Header */}
        {isDesktop && <MainHeader />}
        <div className="bf-loading">
          <div className="bf-loading-spinner"></div>
          <p>Loading preferences...</p>
        </div>
        {/* Desktop Footer */}
        {isDesktop && <MainFooter />}
      </div>
    );
  }

  return (
    <div className="bf-container">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Header */}
      <header className="bf-header">
        <button 
          className="bf-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        
        <h1 className="bf-title">
          {isFirstTimeSetup ? 'Complete Your Setup' : 'Browse Preferences'}
        </h1>
        {isFirstTimeSetup && (
          <p className="bf-subtitle">Set your preferences to find the perfect creators</p>
        )}
        
        <button 
          className="bf-reset-btn"
          onClick={resetAllFilters}
          aria-label="Reset all filters"
        >
          <RotateCcw size={20} />
        </button>
      </header>

      {/* Active Filters Count */}
      {activeFilterCount > 0 && (
        <div className="bf-active-count">
          <span className="bf-count-badge">{activeFilterCount}</span>
          <span className="bf-count-text">active filters</span>
        </div>
      )}

      {/* Filter Sections */}
      <div className="bf-content">
        {/* Age Range */}
        <section className="bf-section">
          <h2 className="bf-section-title">
            <Calendar size={18} />
            Age Range
          </h2>
          <div className="bf-age-range">
            <div className="bf-age-inputs">
              <div className="bf-age-input-group">
                <label>Min</label>
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={filters.ageRange.min}
                  onChange={(e) => handleAgeChange('min', e.target.value)}
                  className="bf-age-input"
                />
              </div>
              <span className="bf-age-separator">to</span>
              <div className="bf-age-input-group">
                <label>Max</label>
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={filters.ageRange.max}
                  onChange={(e) => handleAgeChange('max', e.target.value)}
                  className="bf-age-input"
                />
              </div>
            </div>
            <div className="bf-range-slider">
              <input
                type="range"
                min="18"
                max="99"
                value={filters.ageRange.min}
                onChange={(e) => handleAgeChange('min', e.target.value)}
                className="bf-slider bf-slider-min"
              />
              <input
                type="range"
                min="18"
                max="99"
                value={filters.ageRange.max}
                onChange={(e) => handleAgeChange('max', e.target.value)}
                className="bf-slider bf-slider-max"
              />
              <div className="bf-slider-track"></div>
              <div 
                className="bf-slider-fill"
                style={{
                  left: `${((filters.ageRange.min - 18) / 81) * 100}%`,
                  width: `${((filters.ageRange.max - filters.ageRange.min) / 81) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </section>

        {/* Location/Country */}
        <section className="bf-section">
          <h2 className="bf-section-title">
            <MapPin size={18} />
            Location
          </h2>
          <div className="bf-location">
            <select
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="bf-location-select"
            >
              <option value="">Any Country</option>
              {countryOptions.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Body Type */}
        <section className="bf-section">
          <h2 className="bf-section-title">
            <Users size={18} />
            Body Type
          </h2>
          <div className="bf-chip-grid">
            {bodyTypeOptions.map(type => (
              <button
                key={type}
                className={`bf-chip ${filters.bodyTypes.includes(type) ? 'bf-selected' : ''}`}
                onClick={() => toggleArrayFilter('bodyTypes', type)}
              >
                {filters.bodyTypes.includes(type) && <Check size={14} />}
                {type}
              </button>
            ))}
          </div>
        </section>


        {/* Quick Filters */}
        <section className="bf-section">
          <h2 className="bf-section-title">
            <Sliders size={18} />
            Quick Filters
          </h2>
          <div className="bf-toggle-list">
            <div className="bf-toggle-item">
              <div className="bf-toggle-info">
                <span className="bf-toggle-label">Online Now Only</span>
                <span className="bf-toggle-description">Show only active users</span>
              </div>
              <button
                className={`bf-toggle ${filters.onlineOnly ? 'bf-active' : ''}`}
                onClick={() => toggleBooleanFilter('onlineOnly')}
                aria-label="Toggle online only"
              >
                <div className="bf-toggle-handle"></div>
              </button>
            </div>

            <div className="bf-toggle-item">
              <div className="bf-toggle-info">
                <span className="bf-toggle-label">Verified Only</span>
                <span className="bf-toggle-description">Show only verified profiles</span>
              </div>
              <button
                className={`bf-toggle ${filters.verifiedOnly ? 'bf-active' : ''}`}
                onClick={() => toggleBooleanFilter('verifiedOnly')}
                aria-label="Toggle verified only"
              >
                <div className="bf-toggle-handle"></div>
              </button>
            </div>

            <div className="bf-toggle-item">
              <div className="bf-toggle-info">
                <span className="bf-toggle-label">New Members</span>
                <span className="bf-toggle-description">Joined in the last 30 days</span>
              </div>
              <button
                className={`bf-toggle ${filters.newMembersOnly ? 'bf-active' : ''}`}
                onClick={() => toggleBooleanFilter('newMembersOnly')}
                aria-label="Toggle new members only"
              >
                <div className="bf-toggle-handle"></div>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Apply Button */}
      <div className="bf-footer">
        {isFirstTimeSetup && (
          <div className="bf-setup-message">
            <Sparkles size={16} />
            <span>Complete your setup to start discovering creators!</span>
          </div>
        )}
        <button 
          className={`bf-apply-btn ${isFirstTimeSetup ? 'bf-setup-btn' : ''}`}
          onClick={applyFilters}
          disabled={!hasChanges && !isFirstTimeSetup}
        >
          {isFirstTimeSetup ? (
            <>
              <Sparkles size={18} />
              Start Discovering
            </>
          ) : (
            <>
              Apply Filters
              {activeFilterCount > 0 && (
                <span className="bf-apply-count">{activeFilterCount}</span>
              )}
            </>
          )}
        </button>
      </div>
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default BrowseFilters;