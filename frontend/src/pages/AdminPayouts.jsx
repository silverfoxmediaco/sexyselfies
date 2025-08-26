import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './AdminPayouts.css';

const AdminPayouts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [payoutData, setPayoutData] = useState({
    pendingPayouts: [],
    payoutHistory: [],
    totalPending: 0,
    totalPaidToday: 0,
    stats: {
      creatorsAwaitingPayout: 0,
      averagePayoutAmount: 0,
      thisMonthPayouts: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'pending', 'ready'

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/financials/payouts`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setPayoutData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payout data:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorSelection = (creatorId) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const handleBulkPayout = async () => {
    if (selectedCreators.length === 0) return;

    setProcessingPayout(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/financials/process-payouts`,
        {
          creatorIds: selectedCreators,
          payoutMethod: 'paypal'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert(`Successfully processed ${selectedCreators.length} payouts!`);
        setSelectedCreators([]);
        fetchPayoutData(); // Refresh data
      }
    } catch (error) {
      console.error('Payout processing failed:', error);
      alert('Failed to process payouts. Please try again.');
    } finally {
      setProcessingPayout(false);
    }
  };

  const filteredCreators = payoutData.pendingPayouts.filter(creator => {
    if (filterType === 'ready') return creator.pendingAmount >= creator.minimumPayout;
    if (filterType === 'pending') return creator.pendingAmount < creator.minimumPayout;
    return true;
  });

  const totalSelectedAmount = selectedCreators.reduce((sum, id) => {
    const creator = filteredCreators.find(c => c._id === id);
    return sum + (creator?.pendingAmount || 0);
  }, 0);

  if (loading) {
    return <div className="admin-loading">Loading payout data...</div>;
  }

  return (
    <div className="admin-payouts">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      <div className="payouts-header">
        <h1>Creator Payouts</h1>
        <div className="payout-stats">
          <div className="stat-card">
            <h3>Pending Payouts</h3>
            <p className="stat-number">${payoutData.totalPending.toFixed(2)}</p>
            <span>{payoutData.stats.creatorsAwaitingPayout} creators</span>
          </div>
          <div className="stat-card">
            <h3>Paid Today</h3>
            <p className="stat-number">${payoutData.totalPaidToday.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>This Month</h3>
            <p className="stat-number">${payoutData.stats.thisMonthPayouts.toFixed(2)}</p>
            <span>Avg: ${payoutData.stats.averagePayoutAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="payouts-controls">
        <div className="filters">
          <button 
            className={filterType === 'all' ? 'active' : ''} 
            onClick={() => setFilterType('all')}
          >
            All Creators ({payoutData.pendingPayouts.length})
          </button>
          <button 
            className={filterType === 'ready' ? 'active' : ''} 
            onClick={() => setFilterType('ready')}
          >
            Ready to Pay ({payoutData.pendingPayouts.filter(c => c.pendingAmount >= c.minimumPayout).length})
          </button>
          <button 
            className={filterType === 'pending' ? 'active' : ''} 
            onClick={() => setFilterType('pending')}
          >
            Below Minimum ({payoutData.pendingPayouts.filter(c => c.pendingAmount < c.minimumPayout).length})
          </button>
        </div>

        <div className="bulk-actions">
          {selectedCreators.length > 0 && (
            <div className="selection-info">
              <span>{selectedCreators.length} creators selected</span>
              <span className="total-amount">${totalSelectedAmount.toFixed(2)} total</span>
            </div>
          )}
          <button 
            className="bulk-payout-btn"
            onClick={handleBulkPayout}
            disabled={selectedCreators.length === 0 || processingPayout}
          >
            {processingPayout ? 'Processing...' : `Process ${selectedCreators.length} PayPal Payouts`}
          </button>
        </div>
      </div>

      <div className="creators-table">
        <div className="table-header">
          <div className="checkbox-col">
            <input 
              type="checkbox" 
              onChange={(e) => {
                if (e.target.checked) {
                  const readyCreators = filteredCreators
                    .filter(c => c.pendingAmount >= c.minimumPayout)
                    .map(c => c._id);
                  setSelectedCreators(readyCreators);
                } else {
                  setSelectedCreators([]);
                }
              }}
              checked={selectedCreators.length > 0 && 
                selectedCreators.length === filteredCreators.filter(c => c.pendingAmount >= c.minimumPayout).length}
            />
          </div>
          <div className="creator-col">Creator</div>
          <div className="amount-col">Pending Amount</div>
          <div className="paypal-col">PayPal Email</div>
          <div className="minimum-col">Minimum</div>
          <div className="status-col">Status</div>
          <div className="actions-col">Actions</div>
        </div>

        <div className="table-body">
          {filteredCreators.map(creator => {
            const isReady = creator.pendingAmount >= creator.minimumPayout;
            const isSelected = selectedCreators.includes(creator._id);
            
            return (
              <div key={creator._id} className={`creator-row ${isSelected ? 'selected' : ''}`}>
                <div className="checkbox-col">
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCreatorSelection(creator._id)}
                    disabled={!isReady}
                  />
                </div>
                <div className="creator-col">
                  <div className="creator-info">
                    <img src={creator.profileImage} alt="" className="creator-avatar" />
                    <div>
                      <div className="creator-name">{creator.displayName}</div>
                      <div className="creator-email">{creator.email}</div>
                    </div>
                  </div>
                </div>
                <div className="amount-col">
                  <span className={`amount ${isReady ? 'ready' : 'pending'}`}>
                    ${creator.pendingAmount.toFixed(2)}
                  </span>
                </div>
                <div className="paypal-col">
                  <span className={creator.paypalEmail ? 'has-paypal' : 'no-paypal'}>
                    {creator.paypalEmail || 'Not set'}
                  </span>
                </div>
                <div className="minimum-col">
                  ${creator.minimumPayout.toFixed(2)}
                </div>
                <div className="status-col">
                  <span className={`status ${isReady ? 'ready' : 'waiting'}`}>
                    {isReady ? 'Ready' : 'Waiting'}
                  </span>
                </div>
                <div className="actions-col">
                  {isReady && (
                    <button 
                      className="individual-payout-btn"
                      onClick={() => handleBulkPayout([creator._id])}
                      disabled={processingPayout}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {payoutData.payoutHistory.length > 0 && (
        <div className="payout-history">
          <h2>Recent Payouts</h2>
          <div className="history-list">
            {payoutData.payoutHistory.slice(0, 10).map(payout => (
              <div key={payout._id} className="history-item">
                <div className="history-info">
                  <span className="creator-name">{payout.creatorName}</span>
                  <span className="payout-amount">${payout.amount.toFixed(2)}</span>
                </div>
                <div className="history-meta">
                  <span className="payout-date">{new Date(payout.processedAt).toLocaleDateString()}</span>
                  <span className={`payout-status ${payout.status}`}>{payout.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default AdminPayouts;