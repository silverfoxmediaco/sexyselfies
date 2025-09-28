import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Upload,
  MessageCircle,
  Users,
  Eye,
  Settings,
  Gift
} from 'lucide-react';
import './QuickActions.css';

const QuickActions = ({
  actions = [],
  onActionClick,
  showHeader = true,
  title = "Quick Actions",
  loading = false,
  className = ''
}) => {
  const defaultActions = actions.length ? actions : [
    {
      id: 'analytics',
      icon: <TrendingUp size={24} />,
      label: 'View Analytics',
      path: '/creator/analytics',
      color: 'orange',
      description: 'See your performance metrics'
    },
    {
      id: 'earnings',
      icon: <DollarSign size={24} />,
      label: 'View Earnings',
      path: '/creator/earnings',
      color: 'green',
      description: 'Check your revenue and payouts'
    },
    {
      id: 'upload',
      icon: <Upload size={24} />,
      label: 'Upload Content',
      path: '/creator/upload',
      color: 'teal',
      description: 'Add new photos and videos'
    },
    {
      id: 'messages',
      icon: <MessageCircle size={24} />,
      label: 'Messages',
      path: '/creator/messages',
      color: 'blue',
      description: 'Chat with your fans',
      badge: 0 // Will be passed from parent
    }
  ];

  const handleActionClick = (action) => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <div className={`QuickActions ${className}`}>
      {showHeader && (
        <div className="QuickActions-header">
          <h3 className="QuickActions-title">{title}</h3>
        </div>
      )}

      <div className="QuickActions-grid">
        {defaultActions.map((action, index) => (
          <button
            key={action.id}
            className={`QuickActions-btn ${action.color} ${loading ? 'loading' : ''}`}
            onClick={() => handleActionClick(action)}
            disabled={loading}
            title={action.description}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="QuickActions-icon">
              {loading ? (
                <div className="QuickActions-skeleton-icon" />
              ) : (
                <>
                  {action.icon}
                  {action.badge > 0 && (
                    <span className="QuickActions-badge">
                      {action.badge > 99 ? '99+' : action.badge}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="QuickActions-content">
              <span className="QuickActions-label">
                {loading ? (
                  <div className="QuickActions-skeleton-text" />
                ) : (
                  action.label
                )}
              </span>
              {action.description && !loading && (
                <span className="QuickActions-description">
                  {action.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;