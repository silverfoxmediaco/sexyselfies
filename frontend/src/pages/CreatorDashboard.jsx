import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CreatorDashboard.css';
import {
  TrendingUp, Users, DollarSign, Eye, Heart, MessageCircle,
  Upload, Settings, Calendar, ChevronDown, ArrowUp, ArrowDown, 
  Camera, Video, Star, ShoppingBag
} from 'lucide-react';

// Import images
import img1 from '../assets/IMG_5017.jpg';
import img2 from '../assets/IMG_5019.jpg';
import img3 from '../assets/IMG_5020.jpg';
import img4 from '../assets/IMG_5021.jpg';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('day');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      views: 12847,
      viewsChange: 12.5,
      subscribers: 1284,
      subscribersChange: 8.3,
      revenue: 3847.92,
      revenueChange: 15.7,
      avgRating: 4.8,
      ratingChange: 0.2
    },
    recentActivity: [],
    topContent: []
  });

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Stats Component
  const StatsGrid = () => (
    <div className="stats-grid">
      {[
        { 
          label: 'Total Views', 
          value: formatNumber(dashboardData.stats.views), 
          change: dashboardData.stats.viewsChange,
          icon: Eye,
          color: 'blue'
        },
        { 
          label: 'Subscribers', 
          value: formatNumber(dashboardData.stats.subscribers), 
          change: dashboardData.stats.subscribersChange,
          icon: Users,
          color: 'green'
        },
        { 
          label: 'Revenue', 
          value: formatCurrency(dashboardData.stats.revenue), 
          change: dashboardData.stats.revenueChange,
          icon: DollarSign,
          color: 'purple'
        },
        { 
          label: 'Avg Rating', 
          value: dashboardData.stats.avgRating, 
          change: dashboardData.stats.ratingChange,
          icon: Star,
          color: 'yellow'
        }
      ].map((stat, index) => (
        <motion.div 
          key={stat.label}
          className={`stat-card ${stat.color}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => navigate('/creator/analytics')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <stat.icon size={20} />
            <span className="stat-label">{stat.label}</span>
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className={`stat-change ${stat.change >= 0 ? 'positive' : 'negative'}`}>
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
      className="recent-activity"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="section-title">Recent Activity</h3>
      <div className="activity-list">
        {[
          { type: 'purchase', user: 'Sarah M.', action: 'purchased your photo set', amount: 29.99, time: '5 min ago' },
          { type: 'tip', user: 'Mike R.', action: 'sent you a tip', amount: 50, time: '1 hour ago' },
          { type: 'match', user: 'Emma L.', action: 'matched with you', time: '2 hours ago' },
          { type: 'message', user: 'Jessica K.', action: 'sent you a message', time: '3 hours ago' },
          { type: 'view', user: 'David P.', action: 'viewed your profile', time: '4 hours ago' }
        ].map((activity, index) => (
          <motion.div 
            key={index}
            className="activity-item"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
          >
            <div className={`activity-icon ${activity.type}`}>
              {activity.type === 'purchase' && <ShoppingBag size={16} />}
              {activity.type === 'tip' && <DollarSign size={16} />}
              {activity.type === 'match' && <Heart size={16} />}
              {activity.type === 'message' && <MessageCircle size={16} />}
              {activity.type === 'view' && <Eye size={16} />}
            </div>
            <div className="activity-content">
              <p>
                <span className="activity-user">{activity.user}</span> {activity.action}
                {activity.amount && <span className="activity-amount"> ${activity.amount}</span>}
              </p>
              <span className="activity-time">{activity.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Import images at the top of the component
  const contentImages = [
    '/src/assets/IMG_5017.jpg',
    '/src/assets/IMG_5019.jpg',
    '/src/assets/IMG_5020.jpg',
    '/src/assets/IMG_5021.jpg',
    '/src/assets/IMG_5023.jpg',
    '/src/assets/IMG_5027.jpg',
    '/src/assets/IMG_5028.jpg',
    '/src/assets/IMG_5029.jpg'
  ];

  // Top Content Component with real images
  const TopContent = () => (
    <motion.div 
      className="top-content"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3 className="section-title">Top Performing Content</h3>
      <div className="content-grid">
        {[0, 1, 2, 3].map((index) => (
          <motion.div 
            key={index}
            className="content-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="content-preview">
              <img 
                src={contentImages[index]} 
                alt={`Content ${index + 1}`}
                className="content-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="content-placeholder" style={{ display: 'none' }}>
                {index % 2 === 0 ? <Video size={24} /> : <Camera size={24} />}
              </div>
              <div className="content-type-badge">
                {index % 2 === 0 ? <Video size={14} /> : <Camera size={14} />}
              </div>
              <div className="content-stats">
                <span className="stat">
                  <Eye size={12} />
                  {formatNumber(1234 * (index + 1))}
                </span>
                <span className="stat">
                  <DollarSign size={12} />
                  {formatCurrency(29.99 * (index + 1))}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Quick Actions Component
  const QuickActions = () => (
    <motion.div 
      className="quick-actions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h3 className="section-title">Quick Actions</h3>
      <div className="actions-grid">
        {[
          { icon: TrendingUp, label: 'View Analytics', path: '/creator/analytics', color: 'orange' },
          { icon: DollarSign, label: 'View Earnings', path: '/creator/earnings', color: 'green' },
          { icon: Upload, label: 'Upload Content', path: '/creator/upload', color: 'teal' },
          { icon: MessageCircle, label: 'Messages', path: '/creator/messages', color: 'blue', badge: 3 }
        ].map((action, index) => (
          <motion.button
            key={action.label}
            className={`quick-action-btn ${action.color}`}
            onClick={() => navigate(action.path)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="action-icon">
              <action.icon size={24} />
              {action.badge && <span className="action-badge">{action.badge}</span>}
            </div>
            <span className="action-label">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="creator-dashboard">
      {/* Dashboard Header - SIMPLIFIED WITHOUT ACTION BUTTONS */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <motion.h1 
            className="dashboard-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Welcome back, Creator
            <span className="wave">👋</span>
          </motion.h1>
          <p className="dashboard-subtitle">
            Here's how your content is performing today
          </p>
        </div>
      </div>
      
      {/* Time range selector */}
      <div className="time-range-selector">
        {['day', 'week', 'month'].map(range => (
          <button
            key={range}
            className={`range-btn ${timeRange === range ? 'active' : ''}`}
            onClick={() => setTimeRange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Analytics Preview */}
      <motion.div 
        className="analytics-preview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="dashboard-analytics-header">
          <h3 className="section-title">Performance Overview</h3>
          <div className="dashboard-header-actions-small">
            <button 
              className="view-full-btn secondary"
              onClick={() => navigate('/creator/earnings')}
            >
              View Earnings
            </button>
            <button 
              className="view-full-btn"
              onClick={() => navigate('/creator/analytics')}
            >
              View Analytics
            </button>
          </div>
        </div>
        <div className="mini-charts">
          <div className="mini-chart" onClick={() => navigate('/creator/earnings')}>
            <div className="chart-title">Revenue Trend</div>
            <div className="chart-placeholder">
              <div className="trend-line revenue-trend"></div>
            </div>
            <div className="chart-value">{formatCurrency(dashboardData.stats.revenue)}</div>
          </div>
          <div className="mini-chart" onClick={() => navigate('/creator/analytics')}>
            <div className="chart-title">Views This Week</div>
            <div className="chart-placeholder">
              <div className="trend-line views-trend"></div>
            </div>
            <div className="chart-value">{formatNumber(dashboardData.stats.views)}</div>
          </div>
          <div className="mini-chart" onClick={() => navigate('/creator/analytics')}>
            <div className="chart-title">Conversion Rate</div>
            <div className="chart-placeholder">
              <div className="trend-line conversion-trend"></div>
            </div>
            <div className="chart-value">4.2%</div>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="dashboard-content">
        <div className="content-left">
          <RecentActivity />
        </div>
        
        <div className="content-right">
          <TopContent />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default CreatorDashboard;