import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * usePullToRefresh Hook
 * Implements pull-to-refresh functionality for mobile
 *
 * @param {Function} onRefresh - Function to call when refreshing
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and methods
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80, // Distance to trigger refresh
    maxPull = 150, // Maximum pull distance
    refreshTimeout = 10000, // Max refresh duration
    disabled = false,
    container = null, // Custom container (null = document)
    showIndicator = true,
    indicatorHeight = 60,
    resistance = 2.5, // Pull resistance factor
    snapbackDuration = 300,
    onPullStart = null,
    onPullMove = null,
    onPullEnd = null,
    onRefreshComplete = null,
  } = options;

  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);

  // Refs
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const containerRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const indicatorRef = useRef(null);
  const contentRef = useRef(null);
  const isScrolledToTopRef = useRef(true);

  /**
   * Check if scrolled to top
   */
  const checkScrollPosition = useCallback(() => {
    const element = container || document.documentElement;
    const scrollTop = element.scrollTop || window.pageYOffset || 0;
    isScrolledToTopRef.current = scrollTop === 0;
    return scrollTop === 0;
  }, [container]);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback(
    e => {
      if (disabled || isRefreshing) return;

      if (!checkScrollPosition()) return;

      const touch = e.touches[0];
      startYRef.current = touch.clientY;
      setIsPulling(true);

      if (onPullStart) {
        onPullStart();
      }
    },
    [disabled, isRefreshing, checkScrollPosition, onPullStart]
  );

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback(
    e => {
      if (disabled || isRefreshing || !isPulling) return;
      if (!isScrolledToTopRef.current) return;

      const touch = e.touches[0];
      currentYRef.current = touch.clientY;

      const diff = currentYRef.current - startYRef.current;

      if (diff > 0) {
        e.preventDefault();

        // Apply resistance
        const adjustedDistance = diff / resistance;
        const actualDistance = Math.min(adjustedDistance, maxPull);

        setPullDistance(actualDistance);

        // Calculate progress (0 to 1)
        const progress = Math.min(actualDistance / threshold, 1);
        setPullProgress(progress);

        // Check if can refresh
        setCanRefresh(actualDistance >= threshold);

        // Apply transform to content
        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${actualDistance}px)`;
          contentRef.current.style.transition = 'none';
        }

        // Update indicator
        if (indicatorRef.current) {
          indicatorRef.current.style.transform = `translateY(${actualDistance}px)`;
          indicatorRef.current.style.opacity = progress;

          // Rotate spinner based on progress
          const spinner = indicatorRef.current.querySelector('.ptr-spinner');
          if (spinner) {
            spinner.style.transform = `rotate(${progress * 360}deg)`;
          }
        }

        if (onPullMove) {
          onPullMove({
            distance: actualDistance,
            progress,
            canRefresh: actualDistance >= threshold,
          });
        }
      }
    },
    [
      disabled,
      isRefreshing,
      isPulling,
      maxPull,
      threshold,
      resistance,
      onPullMove,
    ]
  );

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);

    if (onPullEnd) {
      onPullEnd({
        distance: pullDistance,
        canRefresh,
      });
    }

    if (canRefresh && pullDistance >= threshold) {
      // Start refreshing
      setIsRefreshing(true);

      // Snap to refresh position
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${indicatorHeight}px)`;
        contentRef.current.style.transition = `transform ${snapbackDuration}ms ease`;
      }

      if (indicatorRef.current) {
        indicatorRef.current.style.transform = `translateY(${indicatorHeight}px)`;
        indicatorRef.current.classList.add('refreshing');
      }

      // Set timeout for refresh
      refreshTimeoutRef.current = setTimeout(() => {
        completeRefresh();
      }, refreshTimeout);

      try {
        // Call refresh function
        await onRefresh();
        completeRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
        completeRefresh();
      }
    } else {
      // Snap back
      resetPosition();
    }
  }, [
    disabled,
    isRefreshing,
    isPulling,
    pullDistance,
    canRefresh,
    threshold,
    indicatorHeight,
    snapbackDuration,
    onPullEnd,
    onRefresh,
    refreshTimeout,
  ]);

  /**
   * Complete refresh
   */
  const completeRefresh = useCallback(() => {
    setIsRefreshing(false);
    setCanRefresh(false);

    // Clear timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Reset position
    resetPosition();

    if (indicatorRef.current) {
      indicatorRef.current.classList.remove('refreshing');
    }

    if (onRefreshComplete) {
      onRefreshComplete();
    }
  }, [onRefreshComplete]);

  /**
   * Reset position
   */
  const resetPosition = useCallback(() => {
    setPullDistance(0);
    setPullProgress(0);

    if (contentRef.current) {
      contentRef.current.style.transform = 'translateY(0)';
      contentRef.current.style.transition = `transform ${snapbackDuration}ms ease`;
    }

    if (indicatorRef.current) {
      indicatorRef.current.style.transform = 'translateY(0)';
      indicatorRef.current.style.opacity = '0';
    }

    // Reset after transition
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.style.transition = '';
      }
    }, snapbackDuration);
  }, [snapbackDuration]);

  /**
   * Create refresh indicator
   */
  const createIndicator = useCallback(() => {
    if (!showIndicator) return null;

    const indicator = document.createElement('div');
    indicator.className = 'ptr-indicator';
    indicator.innerHTML = `
      <div class="ptr-spinner">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round"/>
        </svg>
      </div>
      <div class="ptr-text">Pull to refresh</div>
    `;

    // Apply styles
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      width: 40px;
      height: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 9999;
    `;

    return indicator;
  }, [showIndicator]);

  /**
   * Set container element
   */
  const setContainer = useCallback(element => {
    containerRef.current = element;
    contentRef.current = element;
  }, []);

  /**
   * Trigger manual refresh
   */
  const triggerRefresh = useCallback(async () => {
    if (isRefreshing || disabled) return;

    setIsRefreshing(true);

    try {
      await onRefresh();
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      completeRefresh();
    }
  }, [isRefreshing, disabled, onRefresh, completeRefresh]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    if (disabled) return;

    const element = containerRef.current || document.body;

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Scroll listener
    const scrollElement = container || window;
    scrollElement.addEventListener('scroll', checkScrollPosition, {
      passive: true,
    });

    // Create and append indicator
    if (showIndicator && !indicatorRef.current) {
      indicatorRef.current = createIndicator();
      document.body.appendChild(indicatorRef.current);
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      scrollElement.removeEventListener('scroll', checkScrollPosition);

      if (indicatorRef.current) {
        indicatorRef.current.remove();
        indicatorRef.current = null;
      }

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [
    disabled,
    container,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    checkScrollPosition,
    showIndicator,
    createIndicator,
  ]);

  return {
    // State
    isRefreshing,
    isPulling,
    pullDistance,
    pullProgress,
    canRefresh,

    // Methods
    triggerRefresh,
    setContainer,

    // Utils
    isActive: isPulling || isRefreshing,
    progressPercentage: Math.round(pullProgress * 100),
  };
};

export default usePullToRefresh;
