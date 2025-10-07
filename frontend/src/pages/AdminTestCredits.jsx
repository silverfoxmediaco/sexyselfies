import React, { useState, useEffect } from 'react';
import { Search, Plus, DollarSign, Users, Trash2, RefreshCw } from 'lucide-react';
import adminService from '../services/admin.service';
import AdminHeader from '../components/AdminHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './AdminTestCredits.css';

const AdminTestCredits = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'transactions'

  // Grant modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantMemberId, setGrantMemberId] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'members') {
        await loadMembers();
      } else {
        await loadTransactions();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await adminService.getMembersWithTestCredits();
      if (response.success) {
        setMembers(response.data.members || []);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await adminService.getTestTransactions(1, 100);
      if (response.success) {
        setTransactions(response.data.transactions || []);
        setTransactionStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleGrantCredits = async () => {
    if (!grantMemberId || !grantAmount) {
      showMessage('error', 'Please enter member ID and amount');
      return;
    }

    if (parseFloat(grantAmount) <= 0 || parseFloat(grantAmount) > 10000) {
      showMessage('error', 'Amount must be between $0.01 and $10,000');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await adminService.grantTestCredits(
        grantMemberId,
        parseFloat(grantAmount),
        grantNote
      );

      if (response.success) {
        showMessage(
          'success',
          response.message || `Successfully granted $${parseFloat(grantAmount).toFixed(2)} test credits!`
        );
        setShowGrantModal(false);
        setGrantMemberId('');
        setGrantAmount('');
        setGrantNote('');
        await loadMembers();
      } else {
        showMessage('error', response.message || 'Failed to grant test credits');
      }
    } catch (error) {
      console.error('Grant credits error:', error);
      showMessage('error', error.message || 'Failed to grant test credits. Please check if the member ID is valid and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetCredits = async (memberId, amount) => {
    const newAmount = prompt(
      `Set exact test credit balance for member ${memberId}:`,
      amount || '0'
    );

    if (newAmount === null) return;

    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > 10000) {
      showMessage('error', 'Invalid amount. Must be between $0 and $10,000');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await adminService.setTestCredits(memberId, parsedAmount);
      if (response.success) {
        showMessage('success', response.message);
        loadMembers();
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAll = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset ALL test credits? This cannot be undone.'
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await adminService.resetAllTestCredits();
      if (response.success) {
        showMessage('success', response.message);
        loadMembers();
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const showMessage = (type, message) => {
    setActionMessage({ type, message });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const filteredMembers = members.filter(
    (member) =>
      member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter((transaction) => {
    const memberName = transaction.memberId?.username || '';
    const creatorName = transaction.creatorId?.stageName || '';
    return (
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creatorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="admin-test-credits-container">
      <AdminHeader />

      {/* Header */}
      <div className="admin-test-credits-header">
        <div>
          <h1>Test Credits Management</h1>
          <p className="admin-test-credits-subtitle">Grant and manage test credits for QA/development testing</p>
        </div>
        <div className="admin-test-credits-header-controls">
          <button
            className="admin-test-credits-btn-primary"
            onClick={() => setShowGrantModal(true)}
            disabled={isProcessing}
          >
            <Plus size={20} />
            Grant Credits
          </button>
          <button
            className="admin-test-credits-btn-danger"
            onClick={handleResetAll}
            disabled={isProcessing}
          >
            <Trash2 size={20} />
            Reset All
          </button>
          <button
            className="admin-test-credits-btn-secondary"
            onClick={loadData}
            disabled={loading || isProcessing}
          >
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`admin-test-credits-action-message ${actionMessage.type}`}>
          {actionMessage.message}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-test-credits-tabs">
        <button
          className={`admin-test-credits-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={18} />
          Members with Test Credits
        </button>
        <button
          className={`admin-test-credits-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <DollarSign size={18} />
          Test Transactions
        </button>
      </div>

      {/* Search */}
      <div className="admin-test-credits-search-bar">
        <Search size={20} />
        <input
          type="text"
          className="admin-test-credits-search-input"
          placeholder={`Search ${activeTab === 'members' ? 'members' : 'transactions'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="admin-test-credits-loading">
          <RefreshCw size={40} className="admin-test-credits-spinner" />
          <p>Loading...</p>
        </div>
      ) : activeTab === 'members' ? (
        <div className="admin-test-credits-members-section">
          {/* Summary Card */}
          <div className="admin-test-credits-summary-card">
            <div className="admin-test-credits-summary-stat">
              <span className="admin-test-credits-stat-label">Total Members</span>
              <span className="admin-test-credits-stat-value">{members.length}</span>
            </div>
            <div className="admin-test-credits-summary-stat">
              <span className="admin-test-credits-stat-label">Total Test Credits</span>
              <span className="admin-test-credits-stat-value">
                ${members.reduce((sum, m) => sum + (m.testCredits || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Members Table */}
          <div className="admin-test-credits-table-container">
            {filteredMembers.length === 0 ? (
              <div className="admin-test-credits-empty-state">
                <Users size={48} />
                <p>No members with test credits</p>
              </div>
            ) : (
              <table className="admin-test-credits-data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Member ID</th>
                    <th>Test Credits</th>
                    <th>Real Credits</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member._id}>
                      <td>{member.username}</td>
                      <td>{member.email}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <code style={{ fontSize: '11px', color: '#8e8e93' }}>
                            {member._id.substring(0, 8)}...
                          </code>
                          <button
                            className="admin-test-credits-btn-icon"
                            onClick={() => {
                              navigator.clipboard.writeText(member._id);
                              showMessage('success', 'Member ID copied to clipboard!');
                            }}
                            title="Copy Full Member ID"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="admin-test-credits-credit-amount">
                        ${(member.testCredits || 0).toFixed(2)}
                      </td>
                      <td className="admin-test-credits-credit-amount">
                        ${(member.credits || 0).toFixed(2)}
                      </td>
                      <td>
                        {member.lastActive
                          ? new Date(member.lastActive).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td>
                        <div className="admin-test-credits-action-buttons">
                          <button
                            className="admin-test-credits-btn-icon"
                            onClick={() =>
                              handleSetCredits(member._id, member.testCredits)
                            }
                            title="Set Balance"
                          >
                            <DollarSign size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-test-credits-transactions-section">
          {/* Transaction Stats */}
          {transactionStats && (
            <div className="admin-test-credits-summary-card">
              <div className="admin-test-credits-summary-stat">
                <span className="admin-test-credits-stat-label">Total Transactions</span>
                <span className="admin-test-credits-stat-value">{transactionStats.count || 0}</span>
              </div>
              <div className="admin-test-credits-summary-stat">
                <span className="admin-test-credits-stat-label">Total Amount</span>
                <span className="admin-test-credits-stat-value">
                  ${(transactionStats.totalAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="admin-test-credits-summary-stat">
                <span className="admin-test-credits-stat-label">Average Amount</span>
                <span className="admin-test-credits-stat-value">
                  ${(transactionStats.avgAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="admin-test-credits-table-container">
            {filteredTransactions.length === 0 ? (
              <div className="admin-test-credits-empty-state">
                <DollarSign size={48} />
                <p>No test transactions found</p>
              </div>
            ) : (
              <table className="admin-test-credits-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Creator</th>
                    <th>Content</th>
                    <th>Amount</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                      <td>{transaction.memberId?.username || 'Unknown'}</td>
                      <td>{transaction.creatorId?.stageName || 'Unknown'}</td>
                      <td>
                        {transaction.contentId?.title || 'Content'} (
                        {transaction.contentId?.type || 'unknown'})
                      </td>
                      <td className="admin-test-credits-credit-amount">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td>
                        <span className="admin-test-credits-source-badge">
                          {transaction.analytics?.source || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="admin-test-credits-modal-overlay" onClick={() => setShowGrantModal(false)}>
          <div className="admin-test-credits-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Grant Test Credits</h2>
            <div className="admin-test-credits-form-group">
              <label>Member ID</label>
              <input
                type="text"
                placeholder="Paste Member ID from table below or Members tab"
                value={grantMemberId}
                onChange={(e) => setGrantMemberId(e.target.value)}
                disabled={isProcessing}
              />
              <small style={{ color: '#8e8e93', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Tip: Click "Copy ID" button next to a member in the table to get their ID
              </small>
            </div>
            <div className="admin-test-credits-form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                placeholder="0.00"
                min="0.01"
                max="10000"
                step="0.01"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="admin-test-credits-form-group">
              <label>Note (Optional)</label>
              <textarea
                placeholder="Reason for granting credits..."
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                disabled={isProcessing}
                rows={3}
              />
            </div>
            <div className="admin-test-credits-modal-actions">
              <button
                className="admin-test-credits-btn-secondary"
                onClick={() => setShowGrantModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="admin-test-credits-btn-primary"
                onClick={handleGrantCredits}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Grant Credits'}
              </button>
            </div>
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

export default AdminTestCredits;
