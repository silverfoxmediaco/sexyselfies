import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  AlertCircle,
  TrendingUp,
  Clock,
  Plus,
  Wallet,
  History,
  ChevronRight,
  Zap
} from 'lucide-react';
import paymentService from '../../services/payment.service';
import CreditPurchaseModal from './CreditPurchaseModal';
import './MemberWallet.css';

const MemberWallet = ({ user, onCreditUpdate }) => {
  const [credits, setCredits] = useState(user?.credits || 0);
  const [transactions, setTransactions] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lowBalance, setLowBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check for low balance (less than 200 credits)
  useEffect(() => {
    setLowBalance(credits < 200);
  }, [credits]);

  // Fetch initial data
  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);

      // Fetch current credit balance
      const balanceResponse = await paymentService.getCreditBalance();
      if (balanceResponse.data?.balance !== undefined) {
        setCredits(balanceResponse.data.balance);
        if (onCreditUpdate) {
          onCreditUpdate(balanceResponse.data.balance);
        }
      }

      // Fetch recent credit transactions
      const historyResponse = await paymentService.getCreditHistory({
        limit: 10,
        type: 'all'
      });
      if (historyResponse.data?.transactions) {
        setTransactions(historyResponse.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      // Use cached data if available
      if (error.code === 'OFFLINE') {
        const cachedBalance = localStorage.getItem('credit_balance');
        if (cachedBalance) {
          setCredits(parseInt(cachedBalance));
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickPurchase = async (creditAmount) => {
    try {
      // Find matching package or create custom amount
      const packages = await paymentService.getCreditPackages();
      const matchingPackage = packages.data?.packages?.find(
        pkg => pkg.credits === creditAmount
      );

      if (matchingPackage) {
        await handleCreditPurchase(matchingPackage);
      } else {
        // Custom amount - open purchase modal
        setShowPurchaseModal(true);
      }
    } catch (error) {
      console.error('Quick purchase error:', error);
    }
  };

  const handleCreditPurchase = async (packageData) => {
    try {
      // This connects to existing payment.service.js
      const response = await paymentService.purchaseCredits(
        packageData.id,
        'ccbill'
      );

      if (response.data?.redirect_url) {
        // CCBill will redirect to purchase page
        window.location.href = response.data.redirect_url;
      } else {
        // Refresh wallet data after successful purchase
        await fetchWalletData();
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'wallet_topup':
      case 'credits':
        return <Plus size={16} className="MemberWallet-transaction-icon positive" />;
      case 'content_unlock':
        return <Wallet size={16} className="MemberWallet-transaction-icon negative" />;
      case 'tip':
        return <TrendingUp size={16} className="MemberWallet-transaction-icon negative" />;
      default:
        return <CreditCard size={16} className="MemberWallet-transaction-icon" />;
    }
  };

  const getTransactionDescription = (transaction) => {
    switch (transaction.type) {
      case 'wallet_topup':
      case 'credits':
        return 'Credits Added';
      case 'content_unlock':
        return 'Content Unlock';
      case 'tip':
        return 'Creator Tip';
      case 'message_unlock':
        return 'Message Unlock';
      default:
        return transaction.description || 'Transaction';
    }
  };

  if (loading) {
    return (
      <div className="MemberWallet">
        <div className="MemberWallet-skeleton">
          <div className="MemberWallet-balance-skeleton" />
          <div className="MemberWallet-grid-skeleton" />
          <div className="MemberWallet-transactions-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="MemberWallet"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Balance Card */}
      <motion.div
        className={`MemberWallet-balance-card ${lowBalance ? 'low-balance' : ''}`}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="MemberWallet-balance-header">
          <div className="MemberWallet-balance-title">
            <Wallet size={24} className="MemberWallet-wallet-icon" />
            <h2>Credit Balance</h2>
          </div>
          <button
            className="MemberWallet-refresh-btn"
            onClick={fetchWalletData}
            disabled={refreshing}
          >
            <Clock size={16} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>

        <div className="MemberWallet-balance-amount">
          <span className="MemberWallet-credits-value">
            {credits.toLocaleString()}
          </span>
          <span className="MemberWallet-credits-label">credits</span>
        </div>

        {lowBalance && (
          <motion.div
            className="MemberWallet-low-balance-alert"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AlertCircle size={16} />
            <span>Running low! Add credits to keep enjoying content</span>
          </motion.div>
        )}

        <button
          className="MemberWallet-add-credits-btn"
          onClick={() => setShowPurchaseModal(true)}
        >
          <Plus size={18} />
          Add Credits
        </button>
      </motion.div>

      {/* Quick Add Options */}
      <motion.div
        className="MemberWallet-quick-add-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h3>Quick Add</h3>
        <div className="MemberWallet-quick-add-grid">
          <button
            className="MemberWallet-quick-add-btn"
            onClick={() => handleQuickPurchase(5)}
          >
            <Zap size={16} />
            <span className="MemberWallet-credit-amount">5</span>
            <span className="MemberWallet-dollar-amount">$5.00</span>
          </button>
          <button
            className="MemberWallet-quick-add-btn"
            onClick={() => handleQuickPurchase(10)}
          >
            <Zap size={16} />
            <span className="MemberWallet-credit-amount">10</span>
            <span className="MemberWallet-dollar-amount">$10.00</span>
          </button>
          <button
            className="MemberWallet-quick-add-btn"
            onClick={() => handleQuickPurchase(25)}
          >
            <Zap size={16} />
            <span className="MemberWallet-credit-amount">25</span>
            <span className="MemberWallet-dollar-amount">$25.00</span>
          </button>
          <button
            className="MemberWallet-quick-add-btn"
            onClick={() => handleQuickPurchase(50)}
          >
            <Zap size={16} />
            <span className="MemberWallet-credit-amount">50</span>
            <span className="MemberWallet-dollar-amount">$50.00</span>
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="MemberWallet-recent-activity"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="MemberWallet-activity-header">
          <div className="MemberWallet-activity-title">
            <History size={20} />
            <h3>Recent Activity</h3>
          </div>
          <button className="MemberWallet-view-all-btn">
            View All
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="MemberWallet-transactions-list">
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <motion.div
                key={transaction._id || index}
                className="MemberWallet-transaction-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (index * 0.05), duration: 0.3 }}
              >
                <div className="MemberWallet-transaction-left">
                  {getTransactionIcon(transaction.type)}
                  <div className="MemberWallet-transaction-info">
                    <span className="MemberWallet-transaction-description">
                      {getTransactionDescription(transaction)}
                    </span>
                    <span className="MemberWallet-transaction-time">
                      {formatDate(transaction.createdAt || transaction.date)}
                    </span>
                  </div>
                </div>
                <div className="MemberWallet-transaction-right">
                  <span className={`MemberWallet-transaction-amount ${
                    transaction.type === 'wallet_topup' || transaction.type === 'credits'
                      ? 'positive' : 'negative'
                  }`}>
                    {transaction.type === 'wallet_topup' || transaction.type === 'credits' ? '+' : '-'}
                    {transaction.credits || (transaction.amount * 100)}
                  </span>
                  <span className="MemberWallet-credits-unit">credits</span>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="MemberWallet-empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <CreditCard size={48} />
              <p>No transactions yet</p>
              <span>Your credit activity will appear here</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Credit Purchase Modal */}
      {showPurchaseModal && (
        <CreditPurchaseModal
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handleCreditPurchase}
          currentCredits={credits}
        />
      )}
    </motion.div>
  );
};

export default MemberWallet;