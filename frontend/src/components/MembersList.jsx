import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  Clock,
  Calendar,
  MapPin,
  Heart,
  MessageCircle,
  Gift,
  MoreHorizontal,
  ChevronRight,
  Crown,
  Star
} from 'lucide-react';
import './MembersList.css';

const MembersList = ({
  members = [],
  viewMode = 'list',
  onMemberClick,
  onMemberAction,
  loading = false,
  emptyStateConfig,
  className = '',
  showAnimation = true
}) => {
  const defaultEmptyState = {
    icon: <Users size={64} />,
    title: 'No members found',
    description: 'Start connecting with members to see them here!',
    actionButton: null
  };

  const emptyState = { ...defaultEmptyState, ...emptyStateConfig };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'VIP':
        return 'tier-vip';
      case 'Premium':
        return 'tier-premium';
      case 'Regular':
        return 'tier-regular';
      case 'New':
        return 'tier-new';
      default:
        return 'tier-regular';
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  const ItemComponent = showAnimation ? motion.div : 'div';

  if (loading) {
    return (
      <div className={`MembersList ${className}`}>
        <div className="MembersList-loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="MembersList-skeleton">
              <div className="MembersList-skeleton-avatar"></div>
              <div className="MembersList-skeleton-content">
                <div className="MembersList-skeleton-name"></div>
                <div className="MembersList-skeleton-info"></div>
                <div className="MembersList-skeleton-stats"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className={`MembersList ${className}`}>
        <div className="MembersList-empty">
          {emptyState.icon}
          <h3>{emptyState.title}</h3>
          <p>{emptyState.description}</p>
          {emptyState.actionButton}
        </div>
      </div>
    );
  }

  return (
    <div className={`MembersList MembersList--${viewMode} ${className}`}>
      <div className="MembersList-grid">
        {members.map((member, index) => (
          <ItemComponent
            key={member.id}
            className="MembersList-item"
            onClick={() => onMemberClick && onMemberClick(member)}
            {...(showAnimation && {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: index * 0.05 }
            })}
          >
            <div className="MembersList-avatar">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} />
              ) : (
                <div className="MembersList-avatar-placeholder">
                  {member.name.charAt(0)}
                </div>
              )}
              {member.isOnline && (
                <div className="MembersList-online-indicator"></div>
              )}
              {member.isPremium && (
                <div className="MembersList-premium-badge">
                  <Crown size={12} />
                </div>
              )}
            </div>

            <div className="MembersList-info">
              <div className="MembersList-main-info">
                <div className="MembersList-name-section">
                  <h3>{member.name}</h3>
                  <div
                    className={`MembersList-tier-badge ${getTierBadgeClass(member.tier)}`}
                  >
                    {member.tier}
                  </div>
                  {member.rating && (
                    <div className="MembersList-rating">
                      {getRatingStars(member.rating)}
                    </div>
                  )}
                </div>
                <div className="MembersList-meta">
                  <span className="MembersList-age">{member.age}</span>
                  <span className="MembersList-location">
                    <MapPin size={12} />
                    {member.location}
                  </span>
                </div>
              </div>

              <div className="MembersList-stats-row">
                <div className="MembersList-spent">
                  <DollarSign size={14} />
                  <span className="amount">
                    {formatCurrency(member.totalSpent)}
                  </span>
                  <span className="count">
                    ({member.purchasesCount} purchases)
                  </span>
                </div>
                <div className="MembersList-activity">
                  <Clock size={14} />
                  <span>Last active: {member.lastActive}</span>
                </div>
              </div>

              <div className="MembersList-details-row">
                <div className="MembersList-joined">
                  <Calendar size={14} />
                  <span>Joined {member.joinedDate}</span>
                </div>
                {member.favoriteContent && (
                  <div className="MembersList-favorite">
                    <Heart size={14} />
                    <span>Loves: {member.favoriteContent}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="MembersList-actions">
              <button
                className="MembersList-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMemberAction && onMemberAction('message', member.id);
                }}
                title="Send Message"
              >
                <MessageCircle size={18} />
              </button>
              <button
                className="MembersList-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMemberAction && onMemberAction('gift', member.id);
                }}
                title="Send Gift"
              >
                <Gift size={18} />
              </button>
              <button
                className="MembersList-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMemberAction && onMemberAction('more', member.id);
                }}
                title="More Actions"
              >
                <MoreHorizontal size={18} />
              </button>
              <ChevronRight size={20} className="MembersList-chevron" />
            </div>
          </ItemComponent>
        ))}
      </div>
    </div>
  );
};

export default MembersList;