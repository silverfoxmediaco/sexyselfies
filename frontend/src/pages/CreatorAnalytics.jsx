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
      <div className='overview-section'>
        <div className='overview-cards'>
          <motion.div
            className='overview-card earnings'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='card-header'>
              <div className='card-icon'>
                <DollarSign size={20} />
              </div>
              <span className='card-title'>Total Earnings</span>
            </div>
            <div className='card-value'>
              {formatCurrency(analyticsData?.overview?.totalEarnings || 0)}
            </div>
            <div className='card-change'>
              {renderChangeIndicator(analyticsData?.overview?.earningsChange || 0)}
              <span className='change-label'>vs last period</span>
            </div>
          </motion.div>

          <motion.div
            className='overview-card views'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='card-header'>
              <div className='card-icon'>
                <Eye size={20} />
              </div>
              <span className='card-title'>Profile Views</span>
            </div>
            <div className='card-value'>
              {formatNumber(analyticsData?.overview?.totalViews || 0)}
            </div>
            <div className='card-change'>
              {renderChangeIndicator(analyticsData?.overview?.viewsChange || 0)}
              <span className='change-label'>vs last period</span>
            </div>
          </motion.div>

          <motion.div
            className='overview-card matches'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='card-header'>
              <div className='card-icon'>
                <Heart size={20} />
              </div>
              <span className='card-title'>New Connections</span>
            </div>
            <div className='card-value'>
              {formatNumber(analyticsData?.overview?.totalConnections || 0)}
            </div>
            <div className='card-change'>
              {renderChangeIndicator(analyticsData?.overview?.connectionsChange || 0)}
              <span className='change-label'>vs last period</span>
            </div>
          </motion.div>

          <motion.div
            className='overview-card conversion'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className='card-header'>
              <div className='card-icon'>
                <Target size={20} />
              </div>
              <span className='card-title'>Conversion Rate</span>
            </div>
            <div className='card-value'>
              {analyticsData?.overview?.conversionRate || 0}%
            </div>
            <div className='card-change'>
              {renderChangeIndicator(analyticsData?.overview?.conversionChange || 0)}
              <span className='change-label'>vs last period</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className='revenue-section'>
        <h2>Revenue Breakdown</h2>
        <div className='revenue-cards'>
          <div className='revenue-card'>
            <div className='revenue-header'>
              <Camera size={18} />
              <span>Photos</span>
            </div>
            <div className='revenue-amount'>
              {formatCurrency(analyticsData?.revenue?.photos || 0)}
            </div>
            <div className='revenue-percentage'>
              {analyticsData?.overview?.totalEarnings ? Math.round(
                ((analyticsData?.revenue?.photos || 0) /
                  analyticsData.overview.totalEarnings) *
                  100
              ) : 0}
              % of total
            </div>
          </div>

          <div className='revenue-card'>
            <div className='revenue-header'>
              <Video size={18} />
              <span>Videos</span>
            </div>
            <div className='revenue-amount'>
              {formatCurrency(analyticsData?.revenue?.videos || 0)}
            </div>
            <div className='revenue-percentage'>
              {analyticsData?.overview?.totalEarnings ? Math.round(
                ((analyticsData?.revenue?.videos || 0) /
                  analyticsData.overview.totalEarnings) *
                  100
              ) : 0}
              % of total
            </div>
          </div>

          <div className='revenue-card'>
            <div className='revenue-header'>
              <MessageCircle size={18} />
              <span>Messages</span>
            </div>
            <div className='revenue-amount'>
              {formatCurrency(analyticsData?.revenue?.messages || 0)}
            </div>
            <div className='revenue-percentage'>
              {analyticsData?.overview?.totalEarnings ? Math.round(
                ((analyticsData?.revenue?.messages || 0) /
                  analyticsData.overview.totalEarnings) *
                  100
              ) : 0}
              % of total
            </div>
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className='content-section'>
        <h2>Top Performing Content</h2>
        <div className='content-list'>
          {(analyticsData.topContent || []).map((content, index) => (
            <div key={content.id} className='content-item'>
              <div className='content-rank'>#{index + 1}</div>
              <div className='content-type'>
                {content.type === 'photo' ? (
                  <Camera size={16} />
                ) : (
                  <Video size={16} />
                )}
              </div>
              <div className='content-info'>
                <span className='content-title'>{content.title}</span>
                <div className='content-stats'>
                  <span>{formatNumber(content.views)} views</span>
                  <span>{content.engagement}% engagement</span>
                </div>
              </div>
              <div className='content-earnings'>
                {formatCurrency(content.earnings)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals Progress */}
      <div className='goals-section'>
        <h2>Performance Goals</h2>
        <div className='goals-grid'>
          <div className='goal-card'>
            <div className='goal-header'>
              <DollarSign size={18} />
              <span>Monthly Earnings</span>
            </div>
            <div className='goal-progress'>
              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{
                    width: `${analyticsData.goals?.monthlyEarnings?.progress || 0}%`,
                  }}
                ></div>
              </div>
              <span className='progress-text'>
                {formatCurrency(analyticsData.goals?.monthlyEarnings?.current || 0)} /{' '}
                {formatCurrency(analyticsData.goals?.monthlyEarnings?.target || 1000)}
              </span>
            </div>
          </div>

          <div className='goal-card'>
            <div className='goal-header'>
              <Eye size={18} />
              <span>Weekly Views</span>
            </div>
            <div className='goal-progress'>
              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{
                    width: `${analyticsData.goals?.weeklyViews?.progress || 0}%`,
                  }}
                ></div>
              </div>
              <span className='progress-text'>
                {formatNumber(analyticsData.goals?.weeklyViews?.current || 0)} /{' '}
                {formatNumber(analyticsData.goals?.weeklyViews?.target || 500)}
              </span>
            </div>
          </div>

          <div className='goal-card'>
            <div className='goal-header'>
              <Target size={18} />
              <span>Conversion Rate</span>
            </div>
            <div className='goal-progress'>
              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{
                    width: `${analyticsData.goals?.conversionRate?.progress || 0}%`,
                  }}
                ></div>
              </div>
              <span className='progress-text'>
                {analyticsData.goals?.conversionRate?.current || 0}% /{' '}
                {analyticsData.goals?.conversionRate?.target || 15}%
              </span>
            </div>
          </div>
        </div>
      </div>

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
      <div className='actions-section'>
        <h2>Quick Actions</h2>
        <div className='actions-grid'>
          <motion.button
            className='action-btn'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={18} />
            <span>Export Report</span>
          </motion.button>

          <motion.button
            className='action-btn'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter size={18} />
            <span>Custom Filters</span>
          </motion.button>

          <motion.button
            className='action-btn'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Award size={18} />
            <span>Set Goals</span>
          </motion.button>

          <motion.button
            className='action-btn primary'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap size={18} />
            <span>Optimize Profile</span>
          </motion.button>
        </div>
      </div>

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorAnalytics;
