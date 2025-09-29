import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import './SettingsMenu.css';

const SettingsMenu = ({
  menuItems = [],
  onItemClick,
  className = '',
  showAnimation = true
}) => {
  const ItemComponent = showAnimation ? motion.button : 'button';

  return (
    <div className={`SettingsMenu ${className}`}>
      <div className="SettingsMenu-grid">
        {menuItems.map((item, index) => (
          <ItemComponent
            key={item.id}
            className={`SettingsMenu-item ${item.priority || 'medium'}`}
            onClick={() => onItemClick && onItemClick(item.id)}
            tabIndex={0}
            {...(showAnimation && {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: index * 0.1 },
              whileTap: { scale: 0.98 }
            })}
          >
            <div className="SettingsMenu-item-header">
              <div className="SettingsMenu-item-icon">
                {item.icon}
              </div>
              {item.showBadge && item.priority === 'high' && (
                <div className="SettingsMenu-priority-badge">!</div>
              )}
            </div>

            <div className="SettingsMenu-item-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="SettingsMenu-item-count">
                {item.itemCount || item.items || 0} settings
              </span>
            </div>

            <ChevronRight
              size={20}
              className="SettingsMenu-chevron"
            />
          </ItemComponent>
        ))}
      </div>
    </div>
  );
};

export default SettingsMenu;