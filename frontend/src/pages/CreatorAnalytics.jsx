import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  Camera,
  Video,
  Download,
  Filter,
  BarChart3,
  Activity,
  Target,
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import BottomQuickActions from '../components/BottomQuickActions';
import PerformanceGoals from '../components/PerformanceGoals';
import AnalyticsOverview from '../components/AnalyticsOverview';
import RevenueBreakdown from '../components/RevenueBreakdown';
import TopPerformingContent from '../components/TopPerformingContent';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import api from '../services/api.config';
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
    { value: '1y', label: '1 Year' },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Check if in development mode
      const isDevelopment =
        import.meta.env.DEV ||
        localStorage.getItem('token') === 'dev-token-12345';

      const response = await api.get(
        `/creator/analytics?period=${selectedPeriod}&compare=false`
      );
      setAnalyticsData(response);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to empty state with basic structure
      setAnalyticsData({
        overview: {
          totalEarnings: 0,
          earningsChange: 0,
          totalViews: 0,
          viewsChange: 0,
          totalConnections: 0,
          connectionsChange: 0,
          conversionRate: 0,
          conversionChange: 0,
        },
        revenue: {
          photos: 0,
          videos: 0,
          messages: 0,
        },
        topContent: [
          {
            id: 'demo1',
            title: 'Sample Content 1',
            type: 'photo',
            views: 245,
            engagement: 12,
            earnings: 89.50,
          },
          {
            id: 'demo2',
            title: 'Sample Content 2',
            type: 'video',
            views: 189,
            engagement: 18,
            earnings: 156.25,
          },
        ],
        goals: {
          monthlyEarnings: {
            current: 0,
            target: 1000,
            progress: 0,
          },
          weeklyViews: {
            current: 0,
            target: 500,
            progress: 0,
          },
          conversionRate: {
            current: 0,
            target: 15,
            progress: 0,
          },
        },
        demographics: {
          ageGroups: [
            { range: '18-24', percentage: 25 },
            { range: '25-34', percentage: 45 },
            { range: '35-44', percentage: 20 },
            { range: '45+', percentage: 10 },
          ],
          topLocations: [
            { country: 'United States', count: 150, percentage: 35 },
            { country: 'Canada', count: 80, percentage: 20 },
            { country: 'United Kingdom', count: 65, percentage: 15 },
          ],
        },
        performance: {
          topContent: [],
          recentActivity: [],
        },
        insights: {
          bestPerformingDay: 'Monday',
          peakHours: '8-10 PM',
          topContentType: 'photos',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = num => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const renderChangeIndicator = change => {
    if (change > 0) {
      return (
        <span className='change-indicator positive'>
          <ArrowUp size={14} />
          {change}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className='change-indicator negative'>
          <ArrowDown size={14} />
          {Math.abs(change)}%
        </span>
      );
    } else {
      return (
        <span className='change-indicator neutral'>
          <Minus size={14} />
          0%
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className='analytics-loading'>
        <div className='loading-spinner'></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className='analytics-error'>
        <Activity size={48} />
        <p>Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className='creator-analytics'>
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      {/* Header */}
      <div className='analytics-header'>
        <div className='analytics-header-content'>
          <h1>
            <BarChart3 size={24} />
            Analytics Dashboard
          </h1>
          <div className='analytics-period-selector'>
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
      <AnalyticsOverview
        stats={{
          totalEarnings: {
            value: analyticsData?.overview?.totalEarnings || 0,
            change: analyticsData?.overview?.earningsChange || 0,
            trend: analyticsData?.overview?.earningsChange > 0 ? 'up' : analyticsData?.overview?.earningsChange < 0 ? 'down' : 'neutral'
          },
          profileViews: {
            value: analyticsData?.overview?.totalViews || 0,
            change: analyticsData?.overview?.viewsChange || 0,
            trend: analyticsData?.overview?.viewsChange > 0 ? 'up' : analyticsData?.overview?.viewsChange < 0 ? 'down' : 'neutral'
          },
          newConnections: {
            value: analyticsData?.overview?.totalConnections || 0,
            change: analyticsData?.overview?.connectionsChange || 0,
            trend: analyticsData?.overview?.connectionsChange > 0 ? 'up' : analyticsData?.overview?.connectionsChange < 0 ? 'down' : 'neutral'
          },
          conversionRate: {
            value: analyticsData?.overview?.conversionRate || 0,
            change: analyticsData?.overview?.conversionChange || 0,
            trend: analyticsData?.overview?.conversionChange > 0 ? 'up' : analyticsData?.overview?.conversionChange < 0 ? 'down' : 'neutral'
          }
        }}
        onCardClick={(cardType) => {
          console.log('Analytics card clicked:', cardType);
          // Handle navigation to detailed analytics
        }}
        loading={loading}
        className="overview-section"
        showAnimation={true}
      />

      {/* Revenue Breakdown */}
      <RevenueBreakdown
        breakdown={{
          photos: {
            amount: analyticsData?.revenue?.photos || 0,
            count: analyticsData?.stats?.photoSales || 0
          },
          videos: {
            amount: analyticsData?.revenue?.videos || 0,
            count: analyticsData?.stats?.videoSales || 0
          },
          messages: {
            amount: analyticsData?.revenue?.messages || 0,
            count: analyticsData?.stats?.messageSales || 0
          },
          tips: {
            amount: analyticsData?.revenue?.tips || 0,
            count: analyticsData?.stats?.tipsCount || 0
          }
        }}
        showTitle={true}
        onCardClick={(type) => {
          console.log('Revenue type clicked:', type);
          // Handle navigation to detailed revenue breakdown
        }}
        loading={loading}
        className="revenue-section"
      />

      {/* Top Performing Content */}
      <TopPerformingContent
        limit={5}
        timeRange={selectedPeriod}
        showMetrics={true}
        onContentClick={(content) => {
          console.log('Content clicked:', content);
          // Handle navigation to content details or open modal
        }}
        onTimeRangeChange={(range) => {
          setSelectedPeriod(range);
        }}
        loading={loading}
        className="content-section"
      />

      {/* Performance Goals */}
      <PerformanceGoals
        goals={[
          {
            id: 'monthly-earnings',
            icon: <DollarSign size={18} />,
            title: 'Monthly Earnings',
            current: analyticsData?.goals?.monthlyEarnings?.current || 0,
            target: analyticsData?.goals?.monthlyEarnings?.target || 1000,
            unit: 'currency'
          },
          {
            id: 'weekly-views',
            icon: <Eye size={18} />,
            title: 'Weekly Views',
            current: analyticsData?.goals?.weeklyViews?.current || 0,
            target: analyticsData?.goals?.weeklyViews?.target || 500,
            unit: 'number'
          },
          {
            id: 'conversion-rate',
            icon: <Target size={18} />,
            title: 'Conversion Rate',
            current: analyticsData?.goals?.conversionRate?.current || 0,
            target: analyticsData?.goals?.conversionRate?.target || 15,
            unit: 'percentage'
          }
        ]}
        showTitle={true}
        onEditGoal={(goal) => {
          console.log('Edit goal clicked:', goal);
          // Handle goal editing
        }}
        loading={loading}
        className="goals-section"
      />

      {/* Demographics */}
      <div className='demographics-section'>
        <h2>Audience Demographics</h2>
        <div className='demographics-grid'>
          <div className='demo-card'>
            <h3>Age Groups</h3>
            <div className='age-groups'>
              {(analyticsData.demographics?.ageGroups || []).map(group => (
                <div key={group.range} className='age-group'>
                  <div className='age-range'>{group.range}</div>
                  <div className='age-bar'>
                    <div
                      className='age-fill'
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <div className='age-percentage'>{group.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className='demo-card'>
            <h3>Top Locations</h3>
            <div className='location-list'>
              {(analyticsData.demographics?.topLocations || []).map(location => (
                <div key={location.country} className='location-item'>
                  <span className='location-name'>{location.country}</span>
                  <div className='location-stats'>
                    <span className='location-count'>{location.count}</span>
                    <span className='location-percentage'>
                      {location.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <BottomQuickActions
        title="Analytics Actions"
        actions={[
          {
            id: 'export',
            icon: <Download size={24} />,
            label: 'Export Report',
            description: 'Download analytics data',
            color: 'blue',
            path: '/creator/analytics/export'
          },
          {
            id: 'filters',
            icon: <Filter size={24} />,
            label: 'Custom Filters',
            description: 'Create custom analytics views',
            color: 'purple',
            path: '/creator/analytics/filters'
          },
          {
            id: 'goals',
            icon: <Award size={24} />,
            label: 'Set Goals',
            description: 'Configure performance targets',
            color: 'orange',
            path: '/creator/analytics/goals'
          },
          {
            id: 'optimize',
            icon: <Zap size={24} />,
            label: 'Optimize Profile',
            description: 'Get improvement suggestions',
            color: 'green',
            path: '/creator/profile-setup'
          }
        ]}
        onActionClick={(action) => {
          if (action.path) {
            // Navigate to the action's path
            console.log('Navigate to:', action.path);
          } else {
            console.log('Action clicked:', action.label);
          }
        }}
        showHeader={true}
        loading={false}
      />

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorAnalytics;
