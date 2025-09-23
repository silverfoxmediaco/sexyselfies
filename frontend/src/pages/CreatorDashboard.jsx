import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import creatorService from '../services/creator.service';
import './CreatorDashboard.css';
import {
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  Upload,
  ArrowUp,
  ArrowDown,
  Camera,
  Video,
  Star,
  ShoppingBag,
} from 'lucide-react';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      views: 0,
      viewsChange: 0,
      connections: 0,
      connectionsChange: 0,
      revenue: 0,
      revenueChange: 0,
      avgRating: 0,
      ratingChange: 0,
    },
    recentActivity: [],
    topContent: [],
  });
  const [creatorName, setCreatorName] = useState('Creator');

  // Load dashboard data on mount and time range change
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  // Set up auto-refresh every 5 minutes for real-time data
  useEffect(() => {
    const refreshInterval = setInterval(
      () => {
        if (!isLoading) {
          loadDashboardData();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [isLoading]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get creator name - same logic as profile page
      try {
        const isDevelopment =
          import.meta.env.DEV ||
          import.meta.env.MODE === 'development' ||
          localStorage.getItem('token') === 'dev-token-12345';

        if (isDevelopment) {
          setCreatorName('tamara'); // Match the real logged-in user
        } else {
          const profileResponse = await creatorService.getProfile();
          const name =
            profileResponse?.data?.displayName ||
            profileResponse?.displayName ||
            localStorage.getItem('displayName') ||
            localStorage.getItem('creatorName') ||
            localStorage.getItem('username') ||
            'Creator';
          setCreatorName(name);
        }
      } catch (nameError) {
        console.log('Could not fetch creator name, using fallback');
        const fallbackName =
          localStorage.getItem('displayName') ||
          localStorage.getItem('creatorName') ||
          localStorage.getItem('username') ||
          'Creator';
        setCreatorName(fallbackName);
      }

      // Get dashboard analytics data
      const analyticsResponse =
        await creatorService.getDashboardData(timeRange);

      if (analyticsResponse.error) {
        throw new Error(analyticsResponse.message);
      }

      const dashboard = analyticsResponse.dashboard;

      // Transform API data to dashboard format with zero fallbacks
      const statsData = {
        views: dashboard?.traffic?.overview?.totalVisits || 0,
        viewsChange: calculateChange(dashboard?.traffic?.trends?.change || 0),
        connections: dashboard?.audience?.total || 0,
        connectionsChange: calculateChange(dashboard?.audience?.new || 0),
        revenue: dashboard?.revenue?.total || 0,
        revenueChange: calculateChange(dashboard?.revenue?.change || 0),
        avgRating: dashboard?.engagement?.rating || 0,
        ratingChange: calculateChange(dashboard?.engagement?.ratingChange || 0),
      };

      // Get recent activity - no fallback data, show empty state if none
      const activityResponse = await creatorService.getRecentActivity(5);
      let recentActivity = activityResponse.error
        ? []
        : activityResponse.data || [];

      // Get top content - no fallback data, show empty state if none
      const contentResponse = await creatorService.getContentPerformance({
        period: timeRange,
        sort: 'earnings',
        limit: 4,
      });
      let topContent = contentResponse.error ? [] : contentResponse.data || [];

      setDashboardData({
        stats: statsData,
        recentActivity: recentActivity,
        topContent: topContent,
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
      setError(error.message || 'Failed to load dashboard data');

      // Use zero fallback data in case of error
      setDashboardData({
        stats: {
          views: 0,
          viewsChange: 0,
          connections: 0,
          connectionsChange: 0,
          revenue: 0,
          revenueChange: 0,
          avgRating: 0,
          ratingChange: 0,
        },
        recentActivity: [],
        topContent: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateChange = value => {
    if (typeof value === 'string' && value.includes('%')) {
      return parseFloat(value.replace('%', ''));
    }
    return typeof value === 'number' ? value : 0;
  };

  const formatNumber = num => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stats Component
  const StatsGrid = () => (
    <div className='creator-dashboard-stats-grid'>
      {[
        {
          label: 'Total Views',
          value: formatNumber(dashboardData.stats.views),
          change: dashboardData.stats.viewsChange,
          icon: Eye,
          color: 'blue',
        },
        {
          label: 'Connections',
          value: formatNumber(dashboardData.stats.connections),
          change: dashboardData.stats.connectionsChange,
          icon: Users,
          color: 'green',
        },
        {
          label: 'Revenue',
          value: formatCurrency(dashboardData.stats.revenue),
          change: dashboardData.stats.revenueChange,
          icon: DollarSign,
          color: 'purple',
        },
        {
          label: 'Avg Rating',
          value: dashboardData.stats.avgRating,
          change: dashboardData.stats.ratingChange,
          icon: Star,
          color: 'yellow',
        },
      ].map((stat, index) => (
        <motion.div
          key={stat.label}
          className={`creator-dashboard-stat-card creator-dashboard-${stat.color}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => navigate(`/creator/${creatorId}/analytics`)}
          style={{ cursor: 'pointer' }}
        >
          <div className='creator-dashboard-stat-header'>
            <stat.icon size={20} />
            <span className='creator-dashboard-stat-label'>{stat.label}</span>
          </div>
          <div className='creator-dashboard-stat-value'>{stat.value}</div>
          <div
            className={`creator-dashboard-stat-change ${stat.change >= 0 ? 'creator-dashboard-positive' : 'creator-dashboard-negative'}`}
          >
            {stat.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <span>{Math.abs(stat.change)}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Recent Activity Component
  const RecentActivity = () => (
    <motion.div
      className='creator-dashboard-recent-activity'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className='creator-dashboard-section-title'>Recent Activity</h3>
      <div className='creator-dashboard-activity-list'>
        {dashboardData.recentActivity.length === 0 ? (
          <div className='creator-dashboard-no-activity'>
            <p>No recent activity</p>
          </div>
        ) : (
          dashboardData.recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id || index}
              className='creator-dashboard-activity-item'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <div
                className={`creator-dashboard-activity-icon creator-dashboard-${activity.type}`}
              >
                {activity.type === 'purchase' && <ShoppingBag size={16} />}
                {activity.type === 'tip' && <DollarSign size={16} />}
                {activity.type === 'connection' && <Heart size={16} />}
                {activity.type === 'message' && <MessageCircle size={16} />}
                {activity.type === 'view' && <Eye size={16} />}
              </div>
              <div className='creator-dashboard-activity-content'>
                <p>
                  <span className='creator-dashboard-activity-user'>
                    {activity.user || activity.memberName}
                  </span>{' '}
                  {activity.action || activity.description}
                  {activity.amount && (
                    <span className='creator-dashboard-activity-amount'>
                      {' '}
                      ${activity.amount}
                    </span>
                  )}
                </p>
                <span className='creator-dashboard-activity-time'>
                  {activity.time || activity.timeAgo}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );

  // Import images at the top of the component

  // Top Content Component with real data
  const TopContent = () => (
    <motion.div
      className='creator-dashboard-top-content'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3 className='creator-dashboard-section-title'>
        Top Performing Content
      </h3>
      <div className='creator-dashboard-content-grid'>
        {dashboardData.topContent.length === 0 ? (
          <div className='creator-dashboard-no-content'>
            <p>No content data available</p>
          </div>
        ) : (
          dashboardData.topContent.slice(0, 4).map((content, index) => (
            <motion.div
              key={content.id || index}
              className='creator-dashboard-content-item'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className='creator-dashboard-content-preview'>
                <img
                  src={content.thumbnailUrl || content.mediaUrl}
                  alt={content.title || `Content ${index + 1}`}
                  className='creator-dashboard-content-image'
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div
                  className='creator-dashboard-content-placeholder'
                  style={{ display: 'none' }}
                >
                  {content.contentType === 'video' ? (
                    <Video size={24} />
                  ) : (
                    <Camera size={24} />
                  )}
                </div>
                <div className='creator-dashboard-content-type-badge'>
                  {content.contentType === 'video' ? (
                    <Video size={14} />
                  ) : (
                    <Camera size={14} />
                  )}
                </div>
                <div className='creator-dashboard-content-stats'>
                  <span className='creator-dashboard-content-stat'>
                    <Eye size={12} />
                    {formatNumber(content.views || content.totalViews || 0)}
                  </span>
                  <span className='creator-dashboard-content-stat'>
                    <DollarSign size={12} />
                    {formatCurrency(content.earnings || content.revenue || 0)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );

  // Quick Actions Component
  const QuickActions = () => (
    <motion.div
      className='creator-dashboard-quick-actions'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h3 className='creator-dashboard-section-title'>Quick Actions</h3>
      <div className='creator-dashboard-actions-grid'>
        {[
          {
            icon: TrendingUp,
            label: 'View Analytics',
            path: '/creator/analytics',
            color: 'orange',
          },
          {
            icon: DollarSign,
            label: 'View Earnings',
            path: '/creator/earnings',
            color: 'green',
          },
          {
            icon: Upload,
            label: 'Upload Content',
            path: '/creator/upload',
            color: 'teal',
          },
          {
            icon: MessageCircle,
            label: 'Messages',
            path: '/creator/messages',
            color: 'blue',
            badge: dashboardData.stats.unreadMessages || 0,
          },
        ].map((action, index) => (
          <motion.button
            key={action.label}
            className={`quick-action-btn ${action.color}`}
            onClick={() => navigate(action.path)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className='creator-dashboard-action-icon'>
              <action.icon size={24} />
              {action.badge > 0 && (
                <span className='creator-dashboard-action-badge'>
                  {action.badge}
                </span>
              )}
            </div>
            <span className='creator-dashboard-action-label'>
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className='creator-dashboard'>
        <div className='creator-dashboard-loading'>
          <div className='creator-dashboard-loading-spinner'></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='creator-dashboard'>
        <div className='creator-dashboard-error'>
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>
          <button
            onClick={loadDashboardData}
            className='creator-dashboard-retry-btn'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='creator-dashboard'>
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      {/* Dashboard Header - SIMPLIFIED WITHOUT ACTION BUTTONS */}
      <div className='creator-dashboard-header'>
        <div className='creator-dashboard-header-content'>
          <div className='creator-dashboard-title-section'>
            <motion.h1
              className='creator-dashboard-title'
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Welcome back, {creatorName}
              <span className='creator-dashboard-wave'>👋</span>
            </motion.h1>
            <button
              className='creator-dashboard-refresh-btn'
              onClick={loadDashboardData}
              disabled={isLoading}
              title='Refresh dashboard'
            >
              <TrendingUp size={16} />
              Refresh
            </button>
          </div>
          <p className='creator-dashboard-subtitle'>
            Here's how your content is performing today
          </p>
        </div>
      </div>

      {/* Time range selector */}
      <div className='creator-dashboard-time-range-selector'>
        {[
          { value: '7d', label: 'Week' },
          { value: '30d', label: 'Month' },
          { value: '90d', label: 'Quarter' },
        ].map(period => (
          <button
            key={period.value}
            className={`creator-dashboard-range-btn ${timeRange === period.value ? 'creator-dashboard-active' : ''}`}
            onClick={() => setTimeRange(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Analytics Preview */}
      <motion.div
        className='creator-dashboard-analytics-preview'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className='dashboard-analytics-header'>
          <h3 className='section-title'>Performance Overview</h3>
          <div className='dashboard-header-actions-small'>
            <button
              className='view-full-btn secondary'
              onClick={() => navigate(`/creator/${creatorId}/earnings`)}
            >
              View Earnings
            </button>
            <button
              className='view-full-btn'
              onClick={() => navigate(`/creator/${creatorId}/analytics`)}
            >
              View Analytics
            </button>
          </div>
        </div>
        <div className='mini-charts'>
          <div
            className='mini-chart'
            onClick={() => navigate(`/creator/${creatorId}/earnings`)}
          >
            <div className='chart-title'>Revenue Trend</div>
            <div className='chart-placeholder'>
              <div className='trend-line revenue-trend'></div>
            </div>
            <div className='chart-value'>
              {formatCurrency(dashboardData.stats.revenue)}
            </div>
          </div>
          <div
            className='mini-chart'
            onClick={() => navigate(`/creator/${creatorId}/analytics`)}
          >
            <div className='chart-title'>Views This Week</div>
            <div className='chart-placeholder'>
              <div className='trend-line views-trend'></div>
            </div>
            <div className='chart-value'>
              {formatNumber(dashboardData.stats.views)}
            </div>
          </div>
          <div
            className='mini-chart'
            onClick={() => navigate(`/creator/${creatorId}/analytics`)}
          >
            <div className='chart-title'>Conversion Rate</div>
            <div className='chart-placeholder'>
              <div className='trend-line conversion-trend'></div>
            </div>
            <div className='chart-value'>
              {(dashboardData.stats.conversionRate || 0).toFixed(1)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className='dashboard-content'>
        <div className='content-left'>
          <RecentActivity />
        </div>

        <div className='content-right'>
          <TopContent />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorDashboard;
