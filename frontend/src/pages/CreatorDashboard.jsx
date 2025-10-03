import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import creatorService from '../services/creator.service';
import paymentService from '../services/payment.service';
import { getGiftAnalytics } from '../services/gift.service';
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
  Gift,
  Wallet,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import DashboardStatsGrid from '../components/DashboardStatsGrid';
import MiniCharts from '../components/MiniCharts';
import BottomQuickActions from '../components/BottomQuickActions';
import RecentActivity from '../components/RecentActivity';
import TopContent from '../components/TopContent';
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
    giftStats: {
      totalSent: 0,
      totalValue: 0,
      conversionRate: 0,
      topGifts: [],
    },
  });
  const [creatorName, setCreatorName] = useState('Creator');
  const [earningsData, setEarningsData] = useState({
    pendingPayout: 0,
    todayEarnings: 0,
    availableBalance: 0,
    loading: true
  });

  // Load dashboard data on mount and time range change
  useEffect(() => {
    loadDashboardData();
    loadEarningsData();
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

      // Get gift analytics data
      let giftStats = {
        totalSent: 0,
        totalValue: 0,
        conversionRate: 0,
        topGifts: [],
      };

      try {
        const giftResponse = await getGiftAnalytics({ period: timeRange });
        if (!giftResponse.error && giftResponse.data) {
          giftStats = {
            totalSent: giftResponse.data.totalSent || 0,
            totalValue: giftResponse.data.totalValue || 0,
            conversionRate: giftResponse.data.conversionRate || 0,
            topGifts: giftResponse.data.topGifts || [],
          };
        }
      } catch (giftError) {
        console.log('Could not load gift analytics:', giftError);
        // Use default zero values
      }

      setDashboardData({
        stats: statsData,
        recentActivity: recentActivity,
        topContent: topContent,
        giftStats: giftStats,
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
        giftStats: {
          totalSent: 0,
          totalValue: 0,
          conversionRate: 0,
          topGifts: [],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEarningsData = async () => {
    try {
      setEarningsData(prev => ({ ...prev, loading: true }));

      // Fetch earnings summary data
      const earningsResponse = await paymentService.getCreatorEarnings('today');

      if (earningsResponse.data?.earnings) {
        const earnings = earningsResponse.data.earnings;

        setEarningsData({
          pendingPayout: earnings.payouts?.pending?.netAmount || 0,
          todayEarnings: earnings.realTimeMetrics?.todayEarnings?.amount || 0,
          availableBalance: earnings.payouts?.pending?.amount || 0,
          loading: false
        });
      } else {
        setEarningsData({
          pendingPayout: 0,
          todayEarnings: 0,
          availableBalance: 0,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
      setEarningsData({
        pendingPayout: 0,
        todayEarnings: 0,
        availableBalance: 0,
        loading: false
      });
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

  // Prepare stats data for DashboardStatsGrid component
  const statsForGrid = {
    totalViews: {
      value: dashboardData.stats.views,
      change: Math.abs(dashboardData.stats.viewsChange),
      trend: dashboardData.stats.viewsChange >= 0 ? 'up' : dashboardData.stats.viewsChange < 0 ? 'down' : 'neutral'
    },
    connections: {
      value: dashboardData.stats.connections,
      change: Math.abs(dashboardData.stats.connectionsChange),
      trend: dashboardData.stats.connectionsChange >= 0 ? 'up' : dashboardData.stats.connectionsChange < 0 ? 'down' : 'neutral'
    },
    revenue: {
      value: dashboardData.stats.revenue,
      change: Math.abs(dashboardData.stats.revenueChange),
      trend: dashboardData.stats.revenueChange >= 0 ? 'up' : dashboardData.stats.revenueChange < 0 ? 'down' : 'neutral'
    },
    avgRating: {
      value: dashboardData.stats.avgRating,
      change: Math.abs(dashboardData.stats.ratingChange),
      trend: dashboardData.stats.ratingChange >= 0 ? 'up' : dashboardData.stats.ratingChange < 0 ? 'down' : 'neutral'
    },
    giftsSent: {
      value: dashboardData.giftStats.totalSent,
      change: Math.abs(dashboardData.giftStats.conversionRate),
      trend: dashboardData.giftStats.conversionRate >= 0 ? 'up' : dashboardData.giftStats.conversionRate < 0 ? 'down' : 'neutral'
    }
  };

  // Handle recent activity click (optional)
  const handleActivityClick = (activity) => {
    // Could navigate to specific activity or show details
    console.log('Activity clicked:', activity);
  };

  // Import images at the top of the component

  // Handle top content click
  const handleTopContentClick = (content) => {
    // Could navigate to content details or analytics
    console.log('Content clicked:', content);
    navigate(`/creator/content/${content.id || content._id}/analytics`);
  };

  // Gift Analytics Component
  const GiftAnalytics = () => (
    <motion.div
      className='creator-dashboard-gift-analytics'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h3 className='creator-dashboard-section-title'>Gift Performance</h3>

      <div className='creator-dashboard-gift-stats-grid'>
        <div className='gift-stat-card'>
          <div className='gift-stat-icon'>
            <Gift size={20} />
          </div>
          <div className='gift-stat-info'>
            <span className='gift-stat-value'>{formatNumber(dashboardData.giftStats.totalSent)}</span>
            <span className='gift-stat-label'>Total Gifts Sent</span>
          </div>
        </div>

        <div className='gift-stat-card'>
          <div className='gift-stat-icon'>
            <DollarSign size={20} />
          </div>
          <div className='gift-stat-info'>
            <span className='gift-stat-value'>${formatNumber(dashboardData.giftStats.totalValue)}</span>
            <span className='gift-stat-label'>Gift Value</span>
          </div>
        </div>

        <div className='gift-stat-card'>
          <div className='gift-stat-icon'>
            <TrendingUp size={20} />
          </div>
          <div className='gift-stat-info'>
            <span className='gift-stat-value'>{dashboardData.giftStats.conversionRate.toFixed(1)}%</span>
            <span className='gift-stat-label'>Conversion Rate</span>
          </div>
        </div>
      </div>

      {dashboardData.giftStats.topGifts.length > 0 && (
        <div className='creator-dashboard-top-gifts'>
          <h4 className='creator-dashboard-subsection-title'>Most Popular Gifts</h4>
          <div className='top-gifts-list'>
            {dashboardData.giftStats.topGifts.slice(0, 3).map((gift, index) => (
              <div key={gift.contentId || index} className='top-gift-item'>
                <div className='top-gift-thumbnail'>
                  {gift.thumbnailUrl ? (
                    <img src={gift.thumbnailUrl} alt={gift.title} />
                  ) : (
                    <div className='gift-placeholder'>
                      {gift.type === 'video' ? '🎥' : '📸'}
                    </div>
                  )}
                </div>
                <div className='top-gift-details'>
                  <h5>{gift.title}</h5>
                  <div className='top-gift-stats'>
                    <span className='gift-count'>{gift.sentCount} sent</span>
                    <span className='gift-revenue'>${formatNumber(gift.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  // Quick Actions data
  const quickActionsData = [
    {
      id: 'analytics',
      icon: <TrendingUp size={24} />,
      label: 'View Analytics',
      path: '/creator/analytics',
      color: 'orange',
      description: 'See your performance metrics'
    },
    {
      id: 'earnings',
      icon: <DollarSign size={24} />,
      label: 'View Earnings',
      path: '/creator/earnings',
      color: 'green',
      description: 'Check your revenue and payouts'
    },
    {
      id: 'upload',
      icon: <Upload size={24} />,
      label: 'Upload Content',
      path: '/creator/upload',
      color: 'teal',
      description: 'Add new photos and videos'
    },
    {
      id: 'messages',
      icon: <MessageCircle size={24} />,
      label: 'Messages',
      path: '/creator/messages',
      color: 'blue',
      description: 'Chat with your fans',
      badge: dashboardData.stats.unreadMessages || 0
    }
  ];

  const handleQuickActionClick = (action) => {
    navigate(action.path);
  };

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

      {/* Earnings Quick Display Widget */}
      <motion.div
        className='creator-dashboard-earnings-widget'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className='earnings-widget-header'>
          <div className='earnings-widget-title'>
            <Wallet size={20} />
            <h3>Earnings Overview</h3>
          </div>
          <button
            className='earnings-widget-view-all'
            onClick={() => navigate(`/creator/${creatorId}/earnings`)}
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>

        <div className='earnings-widget-content'>
          {earningsData.loading ? (
            <div className='earnings-widget-loading'>
              <div className='earnings-stat-skeleton' />
              <div className='earnings-stat-skeleton' />
              <div className='earnings-stat-skeleton' />
            </div>
          ) : (
            <div className='earnings-stats-grid'>
              <div className='earnings-stat-card primary'>
                <div className='earnings-stat-icon'>
                  <DollarSign size={18} />
                </div>
                <div className='earnings-stat-content'>
                  <span className='earnings-stat-label'>Today's Earnings</span>
                  <span className='earnings-stat-value'>
                    {formatCurrency(earningsData.todayEarnings)}
                  </span>
                </div>
              </div>

              <div className='earnings-stat-card'>
                <div className='earnings-stat-icon'>
                  <CreditCard size={18} />
                </div>
                <div className='earnings-stat-content'>
                  <span className='earnings-stat-label'>Pending Payout</span>
                  <span className='earnings-stat-value'>
                    {formatCurrency(earningsData.pendingPayout)}
                  </span>
                </div>
              </div>

              <div className='earnings-stat-card'>
                <div className='earnings-stat-icon'>
                  <TrendingUp size={18} />
                </div>
                <div className='earnings-stat-content'>
                  <span className='earnings-stat-label'>Available</span>
                  <span className='earnings-stat-value'>
                    {formatCurrency(earningsData.availableBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <DashboardStatsGrid
        stats={statsForGrid}
        onCardClick={(statType) => {
          navigate(`/creator/${creatorId}/analytics`);
        }}
        loading={isLoading}
      />

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
        <MiniCharts
          charts={[
            {
              id: 'revenue',
              title: 'Revenue Trend',
              value: dashboardData.stats.revenue,
              format: 'currency',
              trend: dashboardData.stats.revenueChange >= 0 ? 'up' : dashboardData.stats.revenueChange < 0 ? 'down' : 'neutral',
              trendClass: 'revenue-trend'
            },
            {
              id: 'views',
              title: 'Views This Week',
              value: dashboardData.stats.views,
              format: 'number',
              trend: dashboardData.stats.viewsChange >= 0 ? 'up' : dashboardData.stats.viewsChange < 0 ? 'down' : 'neutral',
              trendClass: 'views-trend'
            },
            {
              id: 'conversion',
              title: 'Conversion Rate',
              value: dashboardData.stats.conversionRate || 0,
              format: 'percentage',
              trend: 'neutral',
              trendClass: 'conversion-trend'
            }
          ]}
          loading={isLoading}
        />
      </motion.div>

      {/* Content Grid */}
      <div className='dashboard-content'>
        <div className='content-left'>
          <RecentActivity
            activities={dashboardData.recentActivity}
            loading={isLoading}
            showHeader={true}
            title="Recent Activity"
            onActivityClick={handleActivityClick}
          />
        </div>

        <div className='content-right'>
          <TopContent
            content={dashboardData.topContent}
            loading={isLoading}
            showHeader={true}
            title="Top Performing Content"
            onContentClick={handleTopContentClick}
          />
        </div>
      </div>

      {/* Gift Analytics */}
      <GiftAnalytics />

      {/* Quick Actions */}
      <BottomQuickActions
        actions={quickActionsData}
        onActionClick={handleQuickActionClick}
        showHeader={true}
        title="Quick Actions"
        loading={isLoading}
      />

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorDashboard;
