import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Download,
  Calendar,
  Clock,
  CreditCard,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Camera,
  Video,
  MessageCircle,
  Gift,
  Zap,
  Target,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Send,
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomQuickActions from '../components/BottomQuickActions';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import creatorService from '../services/creator.service';
import './CreatorEarnings.css';

const CreatorEarnings = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutData, setPayoutData] = useState({
    availableEarnings: 0,
    hasPendingRequest: false,
    pendingRequest: null,
  });
  const [requestForm, setRequestForm] = useState({
    amount: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  useEffect(() => {
    loadEarnings();
    loadPayoutData();
  }, [selectedPeriod]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      // Check if in development mode
      const isDevelopment =
        import.meta.env.DEV ||
        localStorage.getItem('token') === 'dev-token-12345';

      const data = await creatorService.getEarnings(selectedPeriod);
      setEarningsData(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
      // Fallback to empty state with basic structure
      setEarningsData({
        overview: {
          totalEarnings: 0,
          earningsChange: 0,
          pendingPayout: 0,
          payoutChange: 0,
          thisMonthEarnings: 0,
          monthChange: 0,
          avgDailyEarnings: 0,
          dailyChange: 0,
        },
        breakdown: {
          photos: { amount: 0, percentage: 0, count: 0 },
          videos: { amount: 0, percentage: 0, count: 0 },
          messages: { amount: 0, percentage: 0, count: 0 },
          tips: { amount: 0, percentage: 0, count: 0 },
        },
        recentTransactions: [],
        topEarners: [],
        payoutHistory: [],
        goals: {
          monthlyTarget: 0,
          currentProgress: 0,
          daysLeft: 0,
          dailyAvgNeeded: 0,
        },
      });
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  const loadPayoutData = async () => {
    try {
      const token = localStorage.getItem('token');
      const isDevelopment = import.meta.env.DEV || token === 'dev-token-12345';

      if (isDevelopment) {
        // Mock data for development
        setPayoutData({
          availableEarnings: 892.45,
          hasPendingRequest: false,
          pendingRequest: null,
        });
        return;
      }

      const data = await creatorService.getPayoutHistory();
      setPayoutData(data);
    } catch (error) {
      console.error('Failed to load payout data:', error);
    }
  };

  const handlePayoutRequest = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = await creatorService.requestPayout({
        amount: parseFloat(requestForm.amount),
        payout_method: 'bank', // default method
        account_details: {},
        notes: requestForm.message,
      });

      if (!data.error) {
        alert(
          'Payout request submitted! You will receive an email confirmation and we will process it within 1-2 business days.'
        );
        setShowPayoutModal(false);
        setRequestForm({ amount: '', message: '' });
        loadPayoutData(); // Refresh payout data
      } else {
        alert(data.message || 'Failed to submit payout request');
      }
    } catch (error) {
      console.error('Payout request error:', error);
      alert('Failed to submit payout request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='earnings-loading'>
        <div className='loading-spinner'></div>
        <p>Loading earnings data...</p>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className='earnings-error'>
        <DollarSign size={48} />
        <p>Unable to load earnings data</p>
      </div>
    );
  }

  return (
    <div className='creator-earnings'>
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}

      {/* Header */}
      <div className='earnings-header'>
        <div className='header-content'>
          <h1>
            <DollarSign size={24} />
            Earnings Dashboard
          </h1>
          <div className='earnings-header-actions'>
            <div className='earnings-period-selector'>
              {periods.map(period => (
                <button
                  key={period.value}
                  className={`earnings-period-btn ${selectedPeriod === period.value ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className='overview-section'>
        <div className='overview-cards'>
          <motion.div
            className='overview-card total-earnings'
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
              {formatCurrency(earningsData.overview.totalEarnings)}
            </div>
            <div className='card-change'>
              {renderChangeIndicator(earningsData.overview.earningsChange)}
              <span className='change-label'>vs last period</span>
            </div>
          </motion.div>

          <motion.div
            className='overview-card pending-payout'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='card-header'>
              <div className='card-icon'>
                <Clock size={20} />
              </div>
              <span className='card-title'>Pending Payout</span>
            </div>
            <div className='card-value'>
              {formatCurrency(earningsData.overview.pendingPayout)}
            </div>
            <div className='card-change'>
              {renderChangeIndicator(earningsData.overview.payoutChange)}
              <span className='change-label'>vs last period</span>
            </div>
          </motion.div>

          <motion.div
            className='overview-card month-earnings'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='card-header'>
              <div className='card-icon'>
                <Calendar size={20} />
              </div>
              <span className='card-title'>This Month</span>
            </div>
            <div className='card-value'>
              {formatCurrency(earningsData.overview.thisMonthEarnings)}
            </div>
            <div className='card-change'>
              {renderChangeIndicator(earningsData.overview.monthChange)}
              <span className='change-label'>vs last month</span>
            </div>
          </motion.div>

          <motion.div
            className='overview-card daily-avg'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className='card-header'>
              <div className='card-icon'>
                <BarChart3 size={20} />
              </div>
              <span className='card-title'>Daily Average</span>
            </div>
            <div className='card-value'>
              {formatCurrency(earningsData.overview.avgDailyEarnings)}
            </div>
            <div className='card-change'>
              {renderChangeIndicator(earningsData.overview.dailyChange)}
              <span className='change-label'>vs last period</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className='breakdown-section'>
        <h2>Revenue Breakdown</h2>
        <div className='breakdown-cards'>
          <div className='breakdown-card'>
            <div className='breakdown-header'>
              <Camera size={18} />
              <span>Photos</span>
            </div>
            <div className='breakdown-amount'>
              {formatCurrency(earningsData.breakdown.photos.amount)}
            </div>
            <div className='breakdown-stats'>
              <span className='percentage'>
                {earningsData.breakdown.photos.percentage}% of total
              </span>
              <span className='count'>
                {earningsData.breakdown.photos.count} sales
              </span>
            </div>
          </div>

          <div className='breakdown-card'>
            <div className='breakdown-header'>
              <Video size={18} />
              <span>Videos</span>
            </div>
            <div className='breakdown-amount'>
              {formatCurrency(earningsData.breakdown.videos.amount)}
            </div>
            <div className='breakdown-stats'>
              <span className='percentage'>
                {earningsData.breakdown.videos.percentage}% of total
              </span>
              <span className='count'>
                {earningsData.breakdown.videos.count} sales
              </span>
            </div>
          </div>

          <div className='breakdown-card'>
            <div className='breakdown-header'>
              <MessageCircle size={18} />
              <span>Messages</span>
            </div>
            <div className='breakdown-amount'>
              {formatCurrency(earningsData.breakdown.messages.amount)}
            </div>
            <div className='breakdown-stats'>
              <span className='percentage'>
                {earningsData.breakdown.messages.percentage}% of total
              </span>
              <span className='count'>
                {earningsData.breakdown.messages.count} sales
              </span>
            </div>
          </div>

          <div className='breakdown-card'>
            <div className='breakdown-header'>
              <Gift size={18} />
              <span>Tips</span>
            </div>
            <div className='breakdown-amount'>
              {formatCurrency(earningsData.breakdown.tips.amount)}
            </div>
            <div className='breakdown-stats'>
              <span className='percentage'>
                {earningsData.breakdown.tips.percentage}% of total
              </span>
              <span className='count'>
                {earningsData.breakdown.tips.count} tips
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Top Earners */}
      <div className='content-grid'>
        <div className='content-left'>
          <div className='transactions-section'>
            <h2>Recent Transactions</h2>
            <div className='transactions-list'>
              {earningsData.recentTransactions.map(transaction => (
                <div key={transaction.id} className='transaction-item'>
                  <div className='transaction-icon'>
                    {transaction.type === 'photo' && <Camera size={16} />}
                    {transaction.type === 'video' && <Video size={16} />}
                    {transaction.type === 'message' && (
                      <MessageCircle size={16} />
                    )}
                    {transaction.type === 'tip' && <Gift size={16} />}
                  </div>
                  <div className='transaction-info'>
                    <span className='transaction-user'>{transaction.user}</span>
                    <span className='transaction-type'>
                      {transaction.type === 'tip'
                        ? 'sent a tip'
                        : `purchased ${transaction.type}`}
                    </span>
                    <span className='transaction-date'>{transaction.date}</span>
                  </div>
                  <div className='transaction-amount'>
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div className={`transaction-status ${transaction.status}`}>
                    <CheckCircle size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='content-right'>
          <div className='top-earners-section'>
            <h2>Top Performing Content</h2>
            <div className='top-earners-list'>
              {earningsData.topEarners.map((item, index) => (
                <div key={item.id} className='earner-item'>
                  <div className='earner-rank'>#{index + 1}</div>
                  <div className='earner-type'>
                    {item.type === 'photo' ? (
                      <Camera size={16} />
                    ) : item.type === 'video' ? (
                      <Video size={16} />
                    ) : (
                      <MessageCircle size={16} />
                    )}
                  </div>
                  <div className='earner-info'>
                    <span className='earner-title'>{item.title}</span>
                    <span className='earner-sales'>{item.sales} sales</span>
                  </div>
                  <div className='earner-earnings'>
                    {formatCurrency(item.earnings)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Goal Progress */}
      <div className='goals-section'>
        <h2>Monthly Goal Progress</h2>
        <div className='goal-card'>
          <div className='goal-header'>
            <div className='goal-info'>
              <span className='goal-title'>Monthly Earnings Target</span>
              <span className='goal-subtitle'>
                {earningsData.goals.daysLeft} days remaining
              </span>
            </div>
            <div className='goal-target'>
              {formatCurrency(earningsData.goals.currentProgress)} /{' '}
              {formatCurrency(earningsData.goals.monthlyTarget)}
            </div>
          </div>
          <div className='goal-progress'>
            <div className='progress-bar'>
              <div
                className='progress-fill'
                style={{
                  width: `${(earningsData.goals.currentProgress / earningsData.goals.monthlyTarget) * 100}%`,
                }}
              ></div>
            </div>
            <div className='progress-stats'>
              <span className='progress-percentage'>
                {Math.round(
                  (earningsData.goals.currentProgress /
                    earningsData.goals.monthlyTarget) *
                    100
                )}
                % complete
              </span>
              <span className='daily-needed'>
                {formatCurrency(earningsData.goals.dailyAvgNeeded)}/day needed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className='payout-section'>
        <div className='payout-header'>
          <h2>Payout History</h2>
          <div className='payout-header-actions'>
            {!payoutData.hasPendingRequest &&
              payoutData.availableEarnings >= 50 && (
                <motion.button
                  className='request-payout-btn'
                  onClick={() => setShowPayoutModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send size={16} />
                  Request Payout
                </motion.button>
              )}
            {payoutData.hasPendingRequest && (
              <div className='pending-payout-notice'>
                <Clock size={16} />
                Payout request pending
              </div>
            )}
            <button
              className='payout-settings-btn'
              onClick={() => navigate('/creator/settings')}
            >
              <CreditCard size={16} />
              Payout Settings
            </button>
          </div>
        </div>

        {/* Available Earnings Display */}
        <div className='available-earnings'>
          <div className='earnings-info'>
            <span className='earnings-label'>Available for Payout:</span>
            <span className='earnings-amount'>
              {formatCurrency(payoutData.availableEarnings)}
            </span>
          </div>
          {payoutData.availableEarnings < 50 && (
            <div className='minimum-notice'>
              <AlertCircle size={14} />
              Minimum payout is $50.00
            </div>
          )}
        </div>
        <div className='payout-list'>
          {earningsData.payoutHistory.map(payout => (
            <div key={payout.id} className={`payout-item ${payout.status}`}>
              <div className='payout-info'>
                <span className='payout-amount'>
                  {formatCurrency(payout.amount)}
                </span>
                <span className='payout-method'>{payout.method}</span>
              </div>
              <div className='payout-date'>{payout.date}</div>
              <div className={`payout-status ${payout.status}`}>
                {payout.status === 'paid' ? (
                  <>
                    <CheckCircle size={14} /> Paid
                  </>
                ) : (
                  <>
                    <Clock size={14} /> Pending
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <BottomQuickActions
        title="Earnings Actions"
        actions={[
          {
            id: 'analytics',
            icon: <BarChart3 size={24} />,
            label: 'View Analytics',
            description: 'See detailed performance metrics',
            color: 'blue',
            path: '/creator/analytics'
          },
          {
            id: 'goal',
            icon: <Target size={24} />,
            label: 'Set Monthly Goal',
            description: 'Update your earnings target',
            color: 'orange',
            path: '/creator/earnings/goals'
          },
          {
            id: 'taxes',
            icon: <Download size={24} />,
            label: 'Tax Documents',
            description: 'Download tax forms and reports',
            color: 'purple',
            path: '/creator/earnings/tax-documents'
          },
          {
            id: 'upload',
            icon: <Zap size={24} />,
            label: 'Upload Content',
            description: 'Add new content to earn more',
            color: 'green',
            path: '/creator/upload'
          }
        ]}
        onActionClick={(action) => {
          if (action.path) {
            navigate(action.path);
          } else {
            console.log('Action clicked:', action.label);
          }
        }}
        showHeader={true}
        loading={false}
      />

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div
          className='payout-modal-overlay'
          onClick={() => setShowPayoutModal(false)}
        >
          <motion.div
            className='payout-modal'
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className='modal-header'>
              <h2>Request Payout</h2>
              <button
                className='close-btn'
                onClick={() => setShowPayoutModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePayoutRequest}>
              <div className='modal-content'>
                <div className='available-display'>
                  <span className='available-label'>Available for Payout:</span>
                  <span className='available-value'>
                    {formatCurrency(payoutData.availableEarnings)}
                  </span>
                </div>

                <div className='form-group'>
                  <label htmlFor='amount'>Payout Amount</label>
                  <div className='amount-input-wrapper'>
                    <span className='currency-symbol'>$</span>
                    <input
                      type='number'
                      id='amount'
                      value={requestForm.amount}
                      onChange={e =>
                        setRequestForm(prev => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      min='50'
                      max={payoutData.availableEarnings}
                      step='0.01'
                      required
                      placeholder='0.00'
                    />
                  </div>
                  <div className='field-help'>
                    Minimum: $50.00 • Maximum: $
                    {payoutData.availableEarnings.toFixed(2)}
                  </div>
                </div>

                <div className='form-group'>
                  <label htmlFor='message'>Message (Optional)</label>
                  <textarea
                    id='message'
                    value={requestForm.message}
                    onChange={e =>
                      setRequestForm(prev => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder='Any additional notes or requests...'
                    maxLength={500}
                    rows={3}
                  />
                  <div className='field-help'>
                    {requestForm.message.length}/500 characters
                  </div>
                </div>

                <div className='payout-info'>
                  <div className='info-item'>
                    <AlertCircle size={16} />
                    <span>
                      Payouts are processed manually within 1-2 business days
                    </span>
                  </div>
                  <div className='info-item'>
                    <CheckCircle size={16} />
                    <span>
                      You'll receive an email confirmation once processed
                    </span>
                  </div>
                </div>
              </div>

              <div className='modal-footer'>
                <button
                  type='button'
                  className='cancel-btn'
                  onClick={() => setShowPayoutModal(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='submit-btn'
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Request Payout'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorEarnings;
