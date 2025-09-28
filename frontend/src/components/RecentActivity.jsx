import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  DollarSign,
  Heart,
  MessageCircle,
  Eye,
  Clock,
} from 'lucide-react';
import './RecentActivity.css';

const RecentActivity = ({
  activities = [],
  loading = false,
  showHeader = true,
  title = "Recent Activity",
  className = ''
}) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag size={16} />;
      case 'tip':
        return <DollarSign size={16} />;
      case 'connection':
        return <Heart size={16} />;
      case 'message':
        return <MessageCircle size={16} />;
      case 'view':
        return <Eye size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className={`RecentActivity ${className}`}>
        {showHeader && (
          <div className="RecentActivity-header">
            <h3 className="RecentActivity-title">{title}</h3>
          </div>
        )}
        <div className="RecentActivity-list">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="RecentActivity-item RecentActivity-skeleton">
              <div className="RecentActivity-icon-skeleton" />
              <div className="RecentActivity-content">
                <div className="RecentActivity-text-skeleton" />
                <div className="RecentActivity-time-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`RecentActivity ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      {showHeader && (
        <div className="RecentActivity-header">
          <h3 className="RecentActivity-title">{title}</h3>
        </div>
      )}

      <div className="RecentActivity-list">
        {activities.length === 0 ? (
          <div className="RecentActivity-empty">
            <Clock size={48} />
            <h4>No recent activity</h4>
            <p>Activity from your connections will appear here</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id || index}
              className={`RecentActivity-item RecentActivity-${activity.type}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <div className={`RecentActivity-icon RecentActivity-icon-${activity.type}`}>
                {getActivityIcon(activity.type)}
              </div>

              <div className="RecentActivity-content">
                <div className="RecentActivity-text">
                  <span className="RecentActivity-user">
                    {activity.user || activity.memberName}
                  </span>
                  <span className="RecentActivity-action">
                    {activity.action || activity.description}
                  </span>
                  {activity.amount && (
                    <span className="RecentActivity-amount">
                      {formatAmount(activity.amount)}
                    </span>
                  )}
                </div>
                <span className="RecentActivity-time">
                  {activity.time || activity.timeAgo}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RecentActivity;