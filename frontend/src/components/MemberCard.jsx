import React from 'react';
import {
  Users,
  DollarSign,
  Package,
  MessageCircle,
  Gift,
  Eye,
  Sparkles,
  Trophy,
  Heart
} from 'lucide-react';
import './MemberCard.css';

const MemberCard = ({
  member,
  isSelected,
  onSelect,
  onMessage,
  onGift,
  onView,
  className = ''
}) => {
  // Calculate time ago for last active
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Get activity status for styling
  const getActivityStatus = (timestamp) => {
    if (!timestamp) return 'inactive';
    const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (minutes < 60) return 'active'; // < 1 hour
    if (minutes < 1440) return 'recent'; // < 24 hours
    return 'inactive';
  };

  // Badge mapping
  const getBadgeInfo = (badgeType) => {
    const badges = {
      newcomer: {
        icon: <Sparkles size={12} />,
        label: 'Newcomer',
        className: 'MemberCard-badge-newcomer'
      },
      vip: {
        icon: <Trophy size={12} />,
        label: 'VIP',
        className: 'MemberCard-badge-vip'
      },
      supporter: {
        icon: <Heart size={12} />,
        label: 'Supporter',
        className: 'MemberCard-badge-supporter'
      },
      whale: {
        icon: <DollarSign size={12} />,
        label: 'Whale',
        className: 'MemberCard-badge-whale'
      }
    };
    return badges[badgeType] || badges.newcomer;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount || 0}`;
  };

  const activityStatus = getActivityStatus(member.lastActive);

  return (
    <div className={`MemberCard-container ${className}`}>
      <div className="MemberCard-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="MemberCard-checkbox-input"
        />
      </div>

      <div className="MemberCard-header">
        <div className="MemberCard-identity">
          <h3 className="MemberCard-username">{member.username}</h3>
          <span className={`MemberCard-status MemberCard-status-${activityStatus}`}>
            {getTimeAgo(member.lastActive)}
          </span>
        </div>
        <div className="MemberCard-tier">
          <Users size={16} />
          <span>{member.isNew ? 'New Member' : member.tier || 'Standard'}</span>
        </div>
      </div>

      <div className="MemberCard-stats">
        <div className="MemberCard-stat">
          <div className="MemberCard-stat-icon">
            <DollarSign size={14} />
          </div>
          <div className="MemberCard-stat-content">
            <span className="MemberCard-stat-value">
              {formatCurrency(member.stats?.monthlySpend)}
            </span>
            <span className="MemberCard-stat-label">30d Spend</span>
          </div>
        </div>

        <div className="MemberCard-stat">
          <div className="MemberCard-stat-icon">
            <Package size={14} />
          </div>
          <div className="MemberCard-stat-content">
            <span className="MemberCard-stat-value">
              {member.stats?.totalPurchases || 0}
            </span>
            <span className="MemberCard-stat-label">Purchases</span>
          </div>
        </div>

        <div className="MemberCard-stat">
          <div className="MemberCard-stat-icon">
            <MessageCircle size={14} />
          </div>
          <div className="MemberCard-stat-content">
            <span className="MemberCard-stat-value">
              {member.stats?.messageCount || 0}
            </span>
            <span className="MemberCard-stat-label">Messages</span>
          </div>
        </div>

        <div className="MemberCard-stat">
          <div className="MemberCard-stat-icon">
            <Gift size={14} />
          </div>
          <div className="MemberCard-stat-content">
            <span className="MemberCard-stat-value">
              {formatCurrency(member.stats?.tipTotal)}
            </span>
            <span className="MemberCard-stat-label">Tips</span>
          </div>
        </div>
      </div>

      {member.badges && member.badges.length > 0 && (
        <div className="MemberCard-badges">
          {member.badges.map((badge, index) => {
            const badgeInfo = getBadgeInfo(badge);
            return (
              <span key={`${badge}-${index}`} className={`MemberCard-badge ${badgeInfo.className}`}>
                {badgeInfo.icon}
                <span>{badgeInfo.label}</span>
              </span>
            );
          })}
        </div>
      )}

      <div className="MemberCard-actions">
        <button
          onClick={() => onMessage && onMessage(member)}
          className="MemberCard-action-btn MemberCard-action-message"
          title="Send Message"
        >
          <MessageCircle size={16} />
          <span>Message</span>
        </button>
        <button
          onClick={() => onGift && onGift(member)}
          className="MemberCard-action-btn MemberCard-action-gift"
          title="Send Gift"
        >
          <Gift size={16} />
          <span>Gift</span>
        </button>
        <button
          onClick={() => onView && onView(member)}
          className="MemberCard-action-btn MemberCard-action-view"
          title="View Profile"
        >
          <Eye size={16} />
          <span>View</span>
        </button>
      </div>
    </div>
  );
};

export default MemberCard;