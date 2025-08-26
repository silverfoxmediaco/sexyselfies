import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Eye, Heart, MessageCircle, DollarSign, 
  Users, Calendar, Clock, Star, Camera, Video, Download, Filter,
  ChevronLeft, ChevronRight, BarChart3, PieChart, Activity,
  Target, Award, Zap, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './CreatorAnalytics.css';

const CreatorAnalytics = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Check if in development mode
      const isDevelopment = import.meta.env.DEV || localStorage.getItem('token') === 'dev-token-12345';
      
      if (isDevelopment) {
        // Use mock data in development
        const mockData = {
          overview: {
            totalEarnings: 2847.50,
            earningsChange: 12.5,
            totalViews: 15420,
            viewsChange: 8.3,
            totalMatches: 342,
            matchesChange: -2.1,
            conversionRate: 4.2,
            conversionChange: 1.8
          },
          revenue: {
            photos: 1650.00,
            videos: 890.50,
            messages: 307.00
          },
          topContent: [
            { id: 1, type: 'photo', title: 'Sunset Beach', earnings: 124.50, views: 892, engagement: 87 },
            { id: 2, type: 'video', title: 'Morning Routine', earnings: 98.75, views: 654, engagement: 92 },
            { id: 3, type: 'photo', title: 'Coffee Vibes', earnings: 87.25, views: 743, engagement: 76 }
          ],
          demographics: {
            ageGroups: [
              { range: '18-24', percentage: 28, count: 96 },
              { range: '25-34', percentage: 45, count: 154 },
              { range: '35-44', percentage: 18, count: 62 },
              { range: '45+', percentage: 9, count: 30 }
            ],
            topLocations: [
              { country: 'United States', percentage: 42, count: 144 },
              { country: 'Canada', percentage: 23, count: 79 },
              { country: 'United Kingdom', percentage: 15, count: 51 },
              { country: 'Australia', percentage: 10, count: 34 },
              { country: 'Germany', percentage: 10, count: 34 }
            ]
          },
          engagement: {
            dailyViews: [120, 145, 98, 167, 189, 134, 156],
            dailyEarnings: [45.50, 67.25, 32.75, 89.50, 92.25, 58.75, 78.50]
          },
          goals: {
            monthlyEarnings: { current: 2847.50, target: 3500, progress: 81 },
            weeklyViews: { current: 1089, target: 1200, progress: 91 },
            conversionRate: { current: 4.2, target: 5.0, progress: 84 }
          }
        };

        setTimeout(() => {
          setAnalyticsData(mockData);
          setLoading(false);
          console.log('DEV MODE: Using mock analytics data');
        }, 800);
      } else {
        const response = await fetch(`/api/creator/analytics?period=${selectedPeriod}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setAnalyticsData(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const renderChangeIndicator = (change) => {
    if (change > 0) {
      return (
        <span className="change-indicator positive">
          <ArrowUp size={14} />
          {change}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="change-indicator negative">
          <ArrowDown size={14} />
          {Math.abs(change)}%
        </span>
      );
    } else {
      return (
        <span className="change-indicator neutral">
          <Minus size={14} />
          0%
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-error">
        <Activity size={48} />
        <p>Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="creator-analytics">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-header-content">
          <h1>
            <BarChart3 size={24} />
            Analytics Dashboard
          </h1>
          <div className="analytics-period-selector">
            {periods.map(period => (
              <button
                key={period.value}
                className={`analytics-period-btn ${selectedPeriod === period.value ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period.value)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-section">
        <div className="overview-cards">
          <motion.div 
            className="overview-card earnings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-header">
              <div className="card-icon">
                <DollarSign size={20} />
              </div>
              <span className="card-title">Total Earnings</span>
            </div>
            <div className="card-value">
              {formatCurrency(analyticsData.overview.totalEarnings)}
            </div>
            <div className="card-change">
              {renderChangeIndicator(analyticsData.overview.earningsChange)}
              <span className="change-label">vs last period</span>
            </div>
          </motion.div>

          <motion.div 
            className="overview-card views"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <div className="card-icon">
                <Eye size={20} />
              </div>
              <span className="card-title">Profile Views</span>
            </div>
            <div className="card-value">
              {formatNumber(analyticsData.overview.totalViews)}
            </div>
            <div className="card-change">
              {renderChangeIndicator(analyticsData.overview.viewsChange)}
              <span className="change-label">vs last period</span>
            </div>
          </motion.div>

          <motion.div 
            className="overview-card matches"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card-header">
              <div className="card-icon">
                <Heart size={20} />
              </div>
              <span className="card-title">New Matches</span>
            </div>
            <div className="card-value">
              {formatNumber(analyticsData.overview.totalMatches)}
            </div>
            <div className="card-change">
              {renderChangeIndicator(analyticsData.overview.matchesChange)}
              <span className="change-label">vs last period</span>
            </div>
          </motion.div>

          <motion.div 
            className="overview-card conversion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card-header">
              <div className="card-icon">
                <Target size={20} />
              </div>
              <span className="card-title">Conversion Rate</span>
            </div>
            <div className="card-value">
              {analyticsData.overview.conversionRate}%
            </div>
            <div className="card-change">
              {renderChangeIndicator(analyticsData.overview.conversionChange)}
              <span className="change-label">vs last period</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="revenue-section">
        <h2>Revenue Breakdown</h2>
        <div className="revenue-cards">
          <div className="revenue-card">
            <div className="revenue-header">
              <Camera size={18} />
              <span>Photos</span>
            </div>
            <div className="revenue-amount">
              {formatCurrency(analyticsData.revenue.photos)}
            </div>
            <div className="revenue-percentage">
              {Math.round((analyticsData.revenue.photos / analyticsData.overview.totalEarnings) * 100)}% of total
            </div>
          </div>

          <div className="revenue-card">
            <div className="revenue-header">
              <Video size={18} />
              <span>Videos</span>
            </div>
            <div className="revenue-amount">
              {formatCurrency(analyticsData.revenue.videos)}
            </div>
            <div className="revenue-percentage">
              {Math.round((analyticsData.revenue.videos / analyticsData.overview.totalEarnings) * 100)}% of total
            </div>
          </div>

          <div className="revenue-card">
            <div className="revenue-header">
              <MessageCircle size={18} />
              <span>Messages</span>
            </div>
            <div className="revenue-amount">
              {formatCurrency(analyticsData.revenue.messages)}
            </div>
            <div className="revenue-percentage">
              {Math.round((analyticsData.revenue.messages / analyticsData.overview.totalEarnings) * 100)}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="content-section">
        <h2>Top Performing Content</h2>
        <div className="content-list">
          {analyticsData.topContent.map((content, index) => (
            <div key={content.id} className="content-item">
              <div className="content-rank">#{index + 1}</div>
              <div className="content-type">
                {content.type === 'photo' ? <Camera size={16} /> : <Video size={16} />}
              </div>
              <div className="content-info">
                <span className="content-title">{content.title}</span>
                <div className="content-stats">
                  <span>{formatNumber(content.views)} views</span>
                  <span>{content.engagement}% engagement</span>
                </div>
              </div>
              <div className="content-earnings">
                {formatCurrency(content.earnings)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals Progress */}
      <div className="goals-section">
        <h2>Performance Goals</h2>
        <div className="goals-grid">
          <div className="goal-card">
            <div className="goal-header">
              <DollarSign size={18} />
              <span>Monthly Earnings</span>
            </div>
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${analyticsData.goals.monthlyEarnings.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {formatCurrency(analyticsData.goals.monthlyEarnings.current)} / {formatCurrency(analyticsData.goals.monthlyEarnings.target)}
              </span>
            </div>
          </div>

          <div className="goal-card">
            <div className="goal-header">
              <Eye size={18} />
              <span>Weekly Views</span>
            </div>
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${analyticsData.goals.weeklyViews.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {formatNumber(analyticsData.goals.weeklyViews.current)} / {formatNumber(analyticsData.goals.weeklyViews.target)}
              </span>
            </div>
          </div>

          <div className="goal-card">
            <div className="goal-header">
              <Target size={18} />
              <span>Conversion Rate</span>
            </div>
            <div className="goal-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${analyticsData.goals.conversionRate.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {analyticsData.goals.conversionRate.current}% / {analyticsData.goals.conversionRate.target}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="demographics-section">
        <h2>Audience Demographics</h2>
        <div className="demographics-grid">
          <div className="demo-card">
            <h3>Age Groups</h3>
            <div className="age-groups">
              {analyticsData.demographics.ageGroups.map(group => (
                <div key={group.range} className="age-group">
                  <div className="age-range">{group.range}</div>
                  <div className="age-bar">
                    <div 
                      className="age-fill"
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <div className="age-percentage">{group.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="demo-card">
            <h3>Top Locations</h3>
            <div className="location-list">
              {analyticsData.demographics.topLocations.map(location => (
                <div key={location.country} className="location-item">
                  <span className="location-name">{location.country}</span>
                  <div className="location-stats">
                    <span className="location-count">{location.count}</span>
                    <span className="location-percentage">{location.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <motion.button 
            className="action-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={18} />
            <span>Export Report</span>
          </motion.button>

          <motion.button 
            className="action-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter size={18} />
            <span>Custom Filters</span>
          </motion.button>

          <motion.button 
            className="action-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Award size={18} />
            <span>Set Goals</span>
          </motion.button>

          <motion.button 
            className="action-btn primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap size={18} />
            <span>Optimize Profile</span>
          </motion.button>
        </div>
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorAnalytics;