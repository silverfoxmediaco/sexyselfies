import React from 'react';
import AnalyticsCard from './AnalyticsCard';
import {
  Users,
  Activity,
  Diamond,
  Sparkles,
  DollarSign,
  TrendingUp,
  Calendar,
  Heart,
  Target,
  Eye
} from 'lucide-react';
import './AnalyticsCards.css';

const AnalyticsCards = ({ stats, loading = false, className = '', onCardClick }) => {
  const defaultStats = {
    totalMembers: 0,
    activeToday: 0,
    highSpenders: 0,
    newThisWeek: 0,
    avgSpending: 0
  };

  const mergedStats = { ...defaultStats, ...stats };

  const cards = [
    {
      id: 'totalMembers',
      icon: <Users size={20} />,
      value: mergedStats.totalMembers,
      label: 'Total Members',
      type: 'default',
      trend: mergedStats.totalMembersTrend
    },
    {
      id: 'activeToday',
      icon: <Activity size={20} />,
      value: mergedStats.activeToday,
      label: 'Active Today',
      type: 'active',
      trend: mergedStats.activeTodayTrend
    },
    {
      id: 'highSpenders',
      icon: <Diamond size={20} />,
      value: mergedStats.highSpenders,
      label: 'High Spenders',
      type: 'premium',
      trend: mergedStats.highSpendersTrend
    },
    {
      id: 'newThisWeek',
      icon: <Sparkles size={20} />,
      value: mergedStats.newThisWeek,
      label: 'New This Week',
      type: 'new',
      trend: mergedStats.newThisWeekTrend
    },
    {
      id: 'avgSpending',
      icon: <DollarSign size={20} />,
      value: mergedStats.avgSpending,
      label: 'Avg Spending',
      type: 'money',
      trend: mergedStats.avgSpendingTrend
    }
  ];

  const handleCardClick = (cardId, cardData) => {
    if (onCardClick) {
      onCardClick(cardId, cardData);
    }
  };

  return (
    <div className={`AnalyticsCards-container ${className}`}>
      {cards.map((card) => (
        <AnalyticsCard
          key={card.id}
          icon={card.icon}
          value={card.value}
          label={card.label}
          type={card.type}
          loading={loading}
          trend={card.trend}
          onClick={onCardClick ? () => handleCardClick(card.id, card) : undefined}
        />
      ))}
    </div>
  );
};

// Custom AnalyticsCards component for different use cases
export const CreatorAnalyticsCards = ({ stats, loading = false, className = '', onCardClick }) => {
  const creatorCards = [
    {
      id: 'totalEarnings',
      icon: <DollarSign size={20} />,
      value: stats?.totalEarnings || 0,
      label: 'Total Earnings',
      type: 'money',
      trend: stats?.totalEarningsTrend
    },
    {
      id: 'monthlyEarnings',
      icon: <TrendingUp size={20} />,
      value: stats?.monthlyEarnings || 0,
      label: 'Monthly Earnings',
      type: 'success',
      trend: stats?.monthlyEarningsTrend
    },
    {
      id: 'subscribers',
      icon: <Users size={20} />,
      value: stats?.subscribers || 0,
      label: 'Subscribers',
      type: 'premium',
      trend: stats?.subscribersTrend
    },
    {
      id: 'contentViews',
      icon: <Eye size={20} />,
      value: stats?.contentViews || 0,
      label: 'Content Views',
      type: 'active',
      trend: stats?.contentViewsTrend
    },
    {
      id: 'engagement',
      icon: <Heart size={20} />,
      value: stats?.engagement || 0,
      label: 'Engagement Rate',
      type: 'new',
      trend: stats?.engagementTrend
    }
  ];

  return (
    <div className={`AnalyticsCards-container ${className}`}>
      {creatorCards.map((card) => (
        <AnalyticsCard
          key={card.id}
          icon={card.icon}
          value={card.value}
          label={card.label}
          type={card.type}
          loading={loading}
          trend={card.trend}
          onClick={onCardClick ? () => onCardClick(card.id, card) : undefined}
        />
      ))}
    </div>
  );
};

// Admin Analytics Cards
export const AdminAnalyticsCards = ({ stats, loading = false, className = '', onCardClick }) => {
  const adminCards = [
    {
      id: 'totalUsers',
      icon: <Users size={20} />,
      value: stats?.totalUsers || 0,
      label: 'Total Users',
      type: 'default',
      trend: stats?.totalUsersTrend
    },
    {
      id: 'activeUsers',
      icon: <Activity size={20} />,
      value: stats?.activeUsers || 0,
      label: 'Active Users',
      type: 'active',
      trend: stats?.activeUsersTrend
    },
    {
      id: 'revenue',
      icon: <DollarSign size={20} />,
      value: stats?.revenue || 0,
      label: 'Platform Revenue',
      type: 'money',
      trend: stats?.revenueTrend
    },
    {
      id: 'newSignups',
      icon: <Sparkles size={20} />,
      value: stats?.newSignups || 0,
      label: 'New Signups',
      type: 'new',
      trend: stats?.newSignupsTrend
    },
    {
      id: 'conversionRate',
      icon: <Target size={20} />,
      value: `${stats?.conversionRate || 0}%`,
      label: 'Conversion Rate',
      type: 'premium',
      trend: stats?.conversionRateTrend
    }
  ];

  return (
    <div className={`AnalyticsCards-container ${className}`}>
      {adminCards.map((card) => (
        <AnalyticsCard
          key={card.id}
          icon={card.icon}
          value={card.value}
          label={card.label}
          type={card.type}
          loading={loading}
          trend={card.trend}
          onClick={onCardClick ? () => onCardClick(card.id, card) : undefined}
        />
      ))}
    </div>
  );
};

export default AnalyticsCards;