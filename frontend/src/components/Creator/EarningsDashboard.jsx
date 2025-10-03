import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Award,
  Clock,
  Zap,
  CreditCard,
  Users,
  Eye,
  Gift,
  RefreshCw,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  ExternalLink
} from 'lucide-react';
import paymentService from '../../services/payment.service';
import './EarningsDashboard.css';

const EarningsDashboard = ({ creator, onPayoutRequest }) => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('today');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchEarningsData();
  }, [timeframe]);

  const fetchEarningsData = async () => {
    try {
      setRefreshing(true);
      const response = await paymentService.getCreatorEarnings(timeframe);
      if (response.data?.earnings) {
        setEarnings(response.data.earnings);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="EarningsDashboard-trend-icon positive" />;
    if (trend === 'down') return <TrendingDown className="EarningsDashboard-trend-icon negative" />;
    return <TrendingUp className="EarningsDashboard-trend-icon neutral" />;
  };

  const getGoalProgress = (achieved, target) => {
    if (!target) return 0;
    return Math.min((achieved / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="EarningsDashboard">
        <div className="EarningsDashboard-skeleton">
          <div className="EarningsDashboard-header-skeleton" />
          <div className="EarningsDashboard-cards-skeleton">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="EarningsDashboard-card-skeleton" />
            ))}
          </div>
          <div className="EarningsDashboard-chart-skeleton" />
        </div>
      </div>
    );
  }

  const realTimeMetrics = earnings?.realTimeMetrics || {};
  const todayEarnings = realTimeMetrics.todayEarnings || {};
  const analytics = earnings?.analytics || {};
  const goals = earnings?.goals || {};
  const payouts = earnings?.payouts || {};
  const insights = earnings?.insights || {};

  return (
    <motion.div
      className="EarningsDashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="EarningsDashboard-header">
        <div className="EarningsDashboard-header-title">
          <h1>Earnings Dashboard</h1>
          <p>Track your financial performance and growth</p>
        </div>
        <div className="EarningsDashboard-header-actions">
          <div className="EarningsDashboard-timeframe-selector">
            {['today', 'week', 'month', 'year'].map((period) => (
              <button
                key={period}
                className={`EarningsDashboard-timeframe-btn ${timeframe === period ? 'active' : ''}`}
                onClick={() => setTimeframe(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="EarningsDashboard-refresh-btn"
            onClick={fetchEarningsData}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? 'spinning' : ''} size={16} />
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="EarningsDashboard-metrics-grid">
        <motion.div
          className="EarningsDashboard-metric-card primary"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="EarningsDashboard-metric-header">
            <div className="EarningsDashboard-metric-icon">
              <DollarSign size={24} />
            </div>
            <div className="EarningsDashboard-metric-trend">
              {getTrendIcon(todayEarnings.comparedToYesterday?.trend)}
              <span className={`EarningsDashboard-trend-value ${todayEarnings.comparedToYesterday?.trend || 'neutral'}`}>
                {formatPercentage(todayEarnings.comparedToYesterday?.percentage)}
              </span>
            </div>
          </div>
          <div className="EarningsDashboard-metric-value">
            {formatCurrency(todayEarnings.amount)}
          </div>
          <div className="EarningsDashboard-metric-label">
            Today's Earnings
          </div>
          <div className="EarningsDashboard-metric-detail">
            {todayEarnings.transactionCount || 0} transactions
          </div>
        </motion.div>

        <motion.div
          className="EarningsDashboard-metric-card"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="EarningsDashboard-metric-header">
            <div className="EarningsDashboard-metric-icon">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="EarningsDashboard-metric-value">
            {formatCurrency(analytics.lifetimeEarnings)}
          </div>
          <div className="EarningsDashboard-metric-label">
            Lifetime Earnings
          </div>
          <div className="EarningsDashboard-metric-detail">
            {formatCurrency(analytics.averages?.monthlyAverage)} avg/month
          </div>
        </motion.div>

        <motion.div
          className="EarningsDashboard-metric-card"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="EarningsDashboard-metric-header">
            <div className="EarningsDashboard-metric-icon">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="EarningsDashboard-metric-value">
            {formatCurrency(payouts.pending?.netAmount)}
          </div>
          <div className="EarningsDashboard-metric-label">
            Pending Payout
          </div>
          <div className="EarningsDashboard-metric-detail">
            Available {payouts.pending?.availableDate ? new Date(payouts.pending.availableDate).toLocaleDateString() : 'now'}
          </div>
        </motion.div>

        <motion.div
          className="EarningsDashboard-metric-card"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="EarningsDashboard-metric-header">
            <div className="EarningsDashboard-metric-icon">
              <Target size={24} />
            </div>
          </div>
          <div className="EarningsDashboard-metric-value">
            {formatPercentage(getGoalProgress(goals.monthly?.achieved, goals.monthly?.target))}
          </div>
          <div className="EarningsDashboard-metric-label">
            Monthly Goal
          </div>
          <div className="EarningsDashboard-metric-detail">
            {formatCurrency(goals.monthly?.achieved)} / {formatCurrency(goals.monthly?.target)}
          </div>
        </motion.div>
      </div>

      {/* Goals Progress Section */}
      {goals.monthly && (
        <motion.div
          className="EarningsDashboard-goals-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="EarningsDashboard-section-header">
            <h3>Goals Progress</h3>
            <button className="EarningsDashboard-section-action">
              <Settings size={16} />
              Manage Goals
            </button>
          </div>
          <div className="EarningsDashboard-goals-grid">
            <div className="EarningsDashboard-goal-card">
              <div className="EarningsDashboard-goal-header">
                <span className="EarningsDashboard-goal-label">Daily Goal</span>
                <span className="EarningsDashboard-goal-value">
                  {formatCurrency(goals.daily?.achieved)} / {formatCurrency(goals.daily?.target)}
                </span>
              </div>
              <div className="EarningsDashboard-goal-progress">
                <div
                  className="EarningsDashboard-goal-progress-bar"
                  style={{ width: `${getGoalProgress(goals.daily?.achieved, goals.daily?.target)}%` }}
                />
              </div>
              <div className="EarningsDashboard-goal-details">
                <span>🔥 {goals.daily?.streak || 0} day streak</span>
                <span>{formatPercentage(getGoalProgress(goals.daily?.achieved, goals.daily?.target))}</span>
              </div>
            </div>

            <div className="EarningsDashboard-goal-card">
              <div className="EarningsDashboard-goal-header">
                <span className="EarningsDashboard-goal-label">Weekly Goal</span>
                <span className="EarningsDashboard-goal-value">
                  {formatCurrency(goals.weekly?.achieved)} / {formatCurrency(goals.weekly?.target)}
                </span>
              </div>
              <div className="EarningsDashboard-goal-progress">
                <div
                  className="EarningsDashboard-goal-progress-bar"
                  style={{ width: `${getGoalProgress(goals.weekly?.achieved, goals.weekly?.target)}%` }}
                />
              </div>
              <div className="EarningsDashboard-goal-details">
                <span>{goals.weekly?.daysRemaining || 0} days remaining</span>
                <span>{formatPercentage(getGoalProgress(goals.weekly?.achieved, goals.weekly?.target))}</span>
              </div>
            </div>

            <div className="EarningsDashboard-goal-card">
              <div className="EarningsDashboard-goal-header">
                <span className="EarningsDashboard-goal-label">Monthly Goal</span>
                <span className="EarningsDashboard-goal-value">
                  {formatCurrency(goals.monthly?.achieved)} / {formatCurrency(goals.monthly?.target)}
                </span>
              </div>
              <div className="EarningsDashboard-goal-progress">
                <div
                  className="EarningsDashboard-goal-progress-bar"
                  style={{ width: `${getGoalProgress(goals.monthly?.achieved, goals.monthly?.target)}%` }}
                />
              </div>
              <div className="EarningsDashboard-goal-details">
                <span>{goals.monthly?.willAchieve ? '✅ On track' : '⚠️ Behind'}</span>
                <span>{formatPercentage(getGoalProgress(goals.monthly?.achieved, goals.monthly?.target))}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Earnings Breakdown */}
      <motion.div
        className="EarningsDashboard-breakdown-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="EarningsDashboard-section-header">
          <h3>Earnings Breakdown</h3>
          <button className="EarningsDashboard-section-action">
            View Details
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="EarningsDashboard-breakdown-grid">
          {earnings?.earningsBreakdown?.bySource && Object.entries(earnings.earningsBreakdown.bySource).map(([source, data]) => (
            <div key={source} className="EarningsDashboard-breakdown-item">
              <div className="EarningsDashboard-breakdown-icon">
                {source === 'contentSales' && <Eye size={16} />}
                {source === 'tips' && <Gift size={16} />}
                {source === 'messages' && <Users size={16} />}
                {source === 'subscriptions' && <Calendar size={16} />}
                {source === 'bundles' && <Zap size={16} />}
                {source === 'referrals' && <Award size={16} />}
                {source === 'bonuses' && <Target size={16} />}
              </div>
              <div className="EarningsDashboard-breakdown-content">
                <div className="EarningsDashboard-breakdown-label">
                  {source.charAt(0).toUpperCase() + source.slice(1).replace(/([A-Z])/g, ' $1')}
                </div>
                <div className="EarningsDashboard-breakdown-value">
                  {formatCurrency(data.amount)}
                </div>
                <div className="EarningsDashboard-breakdown-meta">
                  {data.count} transactions • {formatPercentage(data.percentage)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Insights & Opportunities */}
      {insights.opportunities?.length > 0 && (
        <motion.div
          className="EarningsDashboard-insights-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="EarningsDashboard-section-header">
            <h3>Growth Opportunities</h3>
            <button className="EarningsDashboard-section-action">
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="EarningsDashboard-insights-list">
            {insights.opportunities.slice(0, 3).map((opportunity, index) => (
              <div key={index} className="EarningsDashboard-insight-card">
                <div className="EarningsDashboard-insight-icon">
                  <Info size={16} />
                </div>
                <div className="EarningsDashboard-insight-content">
                  <div className="EarningsDashboard-insight-title">
                    {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)} Opportunity
                  </div>
                  <div className="EarningsDashboard-insight-description">
                    {opportunity.description}
                  </div>
                  <div className="EarningsDashboard-insight-meta">
                    <span className="EarningsDashboard-insight-potential">
                      Up to {formatCurrency(opportunity.potentialEarnings)}
                    </span>
                    <span className={`EarningsDashboard-insight-effort ${opportunity.effort}`}>
                      {opportunity.effort} effort
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Warnings */}
      {insights.warnings?.filter(w => w.severity === 'critical' || w.severity === 'warning').length > 0 && (
        <motion.div
          className="EarningsDashboard-warnings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="EarningsDashboard-section-header">
            <h3>Attention Needed</h3>
          </div>
          <div className="EarningsDashboard-warnings-list">
            {insights.warnings.filter(w => w.severity === 'critical' || w.severity === 'warning').map((warning, index) => (
              <div key={index} className={`EarningsDashboard-warning-card ${warning.severity}`}>
                <div className="EarningsDashboard-warning-icon">
                  {warning.severity === 'critical' ? <AlertTriangle size={16} /> : <Info size={16} />}
                </div>
                <div className="EarningsDashboard-warning-content">
                  <div className="EarningsDashboard-warning-title">
                    {warning.type.charAt(0).toUpperCase() + warning.type.slice(1)}
                  </div>
                  <div className="EarningsDashboard-warning-message">
                    {warning.message}
                  </div>
                  {warning.solution && (
                    <div className="EarningsDashboard-warning-solution">
                      <strong>Solution:</strong> {warning.solution}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Payout Section */}
      <motion.div
        className="EarningsDashboard-payout-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="EarningsDashboard-section-header">
          <h3>Payout Management</h3>
          <button className="EarningsDashboard-section-action">
            <Download size={16} />
            Tax Documents
          </button>
        </div>
        <div className="EarningsDashboard-payout-card">
          <div className="EarningsDashboard-payout-content">
            <div className="EarningsDashboard-payout-amount">
              <span className="EarningsDashboard-payout-label">Available for Payout</span>
              <span className="EarningsDashboard-payout-value">
                {formatCurrency(payouts.pending?.netAmount)}
              </span>
            </div>
            <div className="EarningsDashboard-payout-details">
              <div className="EarningsDashboard-payout-detail">
                <span>Processing Fee:</span>
                <span>{formatCurrency(payouts.pending?.processingFee)}</span>
              </div>
              <div className="EarningsDashboard-payout-detail">
                <span>Next Payout:</span>
                <span>{payouts.schedule?.nextPayout ? new Date(payouts.schedule.nextPayout).toLocaleDateString() : 'Manual'}</span>
              </div>
              <div className="EarningsDashboard-payout-detail">
                <span>Method:</span>
                <span>{payouts.schedule?.preferredMethod?.toUpperCase() || 'Bank'}</span>
              </div>
            </div>
          </div>
          <div className="EarningsDashboard-payout-actions">
            <button
              className="EarningsDashboard-payout-btn primary"
              onClick={() => onPayoutRequest && onPayoutRequest()}
              disabled={!payouts.pending?.netAmount || payouts.pending.netAmount < (payouts.schedule?.minimumBalance || 50)}
            >
              Request Payout
            </button>
            <button className="EarningsDashboard-payout-btn secondary">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </motion.div>

      {/* Recent Achievements */}
      {goals.achievements?.length > 0 && (
        <motion.div
          className="EarningsDashboard-achievements-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="EarningsDashboard-section-header">
            <h3>Recent Achievements</h3>
            <button className="EarningsDashboard-section-action">
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="EarningsDashboard-achievements-list">
            {goals.achievements.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="EarningsDashboard-achievement-card">
                <div className="EarningsDashboard-achievement-icon">
                  <Award size={16} />
                </div>
                <div className="EarningsDashboard-achievement-content">
                  <div className="EarningsDashboard-achievement-name">
                    {achievement.name}
                  </div>
                  <div className="EarningsDashboard-achievement-description">
                    {achievement.description}
                  </div>
                  <div className="EarningsDashboard-achievement-meta">
                    <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                    {achievement.reward && (
                      <span className="EarningsDashboard-achievement-reward">
                        +{formatCurrency(achievement.reward)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EarningsDashboard;