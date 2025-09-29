import React from 'react';
import { DollarSign, Eye, Target } from 'lucide-react';
import './PerformanceGoals.css';

const PerformanceGoals = ({
  goals = [],
  showTitle = true,
  onEditGoal,
  loading = false,
  className = ''
}) => {
  const formatValue = (value, unit) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value || 0);
      case 'percentage':
        return `${(value || 0).toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(value || 0);
    }
  };

  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'high';
    if (percentage >= 25) return 'medium';
    return 'low';
  };

  const getStatusText = (current, target) => {
    const progress = calculateProgress(current, target);
    if (progress >= 100) return 'Goal achieved!';
    if (progress >= 75) return 'Almost there!';
    if (progress >= 25) return 'Making progress';
    return 'Just getting started';
  };

  return (
    <div className={`PerformanceGoals ${className}`}>
      {showTitle && <h2>Performance Goals</h2>}

      <div className="PerformanceGoals-grid">
        {loading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="PerformanceGoals-card skeleton">
              <div className="PerformanceGoals-skeleton-icon" />
              <div className="PerformanceGoals-skeleton-content">
                <div className="PerformanceGoals-skeleton-title" />
                <div className="PerformanceGoals-skeleton-values" />
                <div className="PerformanceGoals-skeleton-bar" />
              </div>
            </div>
          ))
        ) : goals.length > 0 ? (
          goals.map((goal) => {
            const progress = calculateProgress(goal.current, goal.target);
            const progressColor = getProgressColor(progress);

            return (
              <div
                key={goal.id}
                className="PerformanceGoals-card"
                onClick={() => onEditGoal && onEditGoal(goal)}
                style={{ cursor: onEditGoal ? 'pointer' : 'default' }}
              >
                <div className="PerformanceGoals-header">
                  <div className={`PerformanceGoals-icon ${progressColor}`}>
                    {goal.icon}
                  </div>
                  <div className="PerformanceGoals-title">
                    {goal.title}
                  </div>
                </div>

                <div className="PerformanceGoals-values">
                  <div className="PerformanceGoals-current">
                    {formatValue(goal.current, goal.unit)}
                  </div>
                  <div className="PerformanceGoals-target">
                    of {formatValue(goal.target, goal.unit)} goal
                  </div>
                </div>

                <div className="PerformanceGoals-progress">
                  <div className="PerformanceGoals-progress-bar">
                    <div
                      className={`PerformanceGoals-progress-fill ${progressColor}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="PerformanceGoals-progress-text">
                    <span className="PerformanceGoals-percentage">
                      {Math.round(progress)}%
                    </span>
                    <span className="PerformanceGoals-status">
                      {getStatusText(goal.current, goal.target)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="PerformanceGoals-empty">
            <Target size={48} />
            <p>No goals set yet</p>
            <span>Set performance goals to track your progress</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceGoals;