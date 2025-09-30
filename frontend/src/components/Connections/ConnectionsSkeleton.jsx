import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './ConnectionsSkeleton.css';

/**
 * ConnectionsSkeleton - Loading skeleton for connections list
 *
 * @param {Object} props
 * @param {Number} props.count - Number of skeleton items to show
 * @param {Boolean} props.showFilter - Whether to show filter skeleton
 */
const ConnectionsSkeleton = ({
  count = 6,
  showFilter = false
}) => {
  return (
    <div className="ConnectionsSkeleton">
      {/* Filter skeleton */}
      {showFilter && (
        <div className="ConnectionsSkeleton-filter">
          <div className="ConnectionsSkeleton-filter-row">
            <div className="ConnectionsSkeleton-search">
              <div className="ConnectionsSkeleton-bar long"></div>
            </div>
            <div className="ConnectionsSkeleton-sort">
              <div className="ConnectionsSkeleton-bar short"></div>
            </div>
          </div>
          <div className="ConnectionsSkeleton-actions">
            <div className="ConnectionsSkeleton-bar medium"></div>
            <div className="ConnectionsSkeleton-bar short"></div>
          </div>
        </div>
      )}

      {/* Connection cards skeleton */}
      <div className="ConnectionsSkeleton-grid">
        {Array.from({ length: count }, (_, index) => (
          <motion.div
            key={index}
            className="ConnectionsSkeleton-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            {/* Avatar skeleton */}
            <div className="ConnectionsSkeleton-avatar">
              <div className="ConnectionsSkeleton-circle">
                <div className="ConnectionsSkeleton-shimmer"></div>
              </div>
              <div className="ConnectionsSkeleton-badge">
                <div className="ConnectionsSkeleton-shimmer"></div>
              </div>
            </div>

            {/* Content skeleton */}
            <div className="ConnectionsSkeleton-content">
              <div className="ConnectionsSkeleton-header">
                <div className="ConnectionsSkeleton-names">
                  <div className="ConnectionsSkeleton-bar medium"></div>
                  <div className="ConnectionsSkeleton-bar short"></div>
                </div>
                <div className="ConnectionsSkeleton-action">
                  <div className="ConnectionsSkeleton-button"></div>
                </div>
              </div>
              <div className="ConnectionsSkeleton-message">
                <div className="ConnectionsSkeleton-bar long"></div>
                <div className="ConnectionsSkeleton-bar short"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/**
 * Individual skeleton bar component
 */
const SkeletonBar = ({ width = '100%', height = '12px', className = '' }) => (
  <div
    className={`ConnectionsSkeleton-bar ${className}`}
    style={{ width, height }}
  >
    <div className="ConnectionsSkeleton-shimmer"></div>
  </div>
);

/**
 * Skeleton circle for avatars
 */
const SkeletonCircle = ({ size = '56px', className = '' }) => (
  <div
    className={`ConnectionsSkeleton-circle ${className}`}
    style={{ width: size, height: size }}
  >
    <div className="ConnectionsSkeleton-shimmer"></div>
  </div>
);

// Export additional skeleton components for reuse
export { SkeletonBar, SkeletonCircle };

ConnectionsSkeleton.propTypes = {
  count: PropTypes.number,
  showFilter: PropTypes.bool
};

SkeletonBar.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string
};

SkeletonCircle.propTypes = {
  size: PropTypes.string,
  className: PropTypes.string
};

export default React.memo(ConnectionsSkeleton);