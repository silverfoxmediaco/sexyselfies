import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSwipeGesture Hook
 * Handles swipe gestures with customizable callbacks
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and methods
 */
export const useSwipeGesture = (options = {}) => {
  const {
    onSwipeLeft = null,
    onSwipeRight = null,
    onSwipeUp = null,
    onSwipeDown = null,
    onSwiping = null,
    onSwipeStart = null,
    onSwipeEnd = null,
    threshold = 50,
    preventScroll = true,
    trackMouse = true,
    trackTouch = true,
    rotationAngle = 15,
    swipeVelocity = 0.5,
    disableSwipeBack = false
  } = options;

  // State
  const [isSwiping, setIsSwiping] = useState(false);
  const [direction, setDirection] = useState(null);
  const [distance, setDistance] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [swipeCount, setSwipeCount] = useState(0);

  // Refs
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });
  const startTimeRef = useRef(0);
  const elementRef = useRef(null);
  const animationFrameRef = useRef(null);
  const historyRef = useRef([]);

  /**
   * Calculate swipe metrics
   */
  const calculateSwipeMetrics = useCallback(() => {
    const deltaX = currentPosRef.current.x - startPosRef.current.x;
    const deltaY = currentPosRef.current.y - startPosRef.current.y;
    const deltaTime = Date.now() - startTimeRef.current;
    
    const velocityX = deltaTime > 0 ? deltaX / deltaTime : 0;
    const velocityY = deltaTime > 0 ? deltaY / deltaTime : 0;
    
    return {
      distance: { x: deltaX, y: deltaY },
      velocity: { x: velocityX, y: velocityY },
      duration: deltaTime,
      angle: Math.atan2(deltaY, deltaX) * 180 / Math.PI
    };
  }, []);

  /**
   * Determine swipe direction
   */
  const determineDirection = useCallback((deltaX, deltaY) => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  /**
   * Handle swipe start
   */
  const handleSwipeStart = useCallback((x, y) => {
    startPosRef.current = { x, y };
    currentPosRef.current = { x, y };
    startTimeRef.current = Date.now();
    setIsSwiping(true);
    setDirection(null);
    
    // Clear history
    historyRef.current = [{ x, y, time: Date.now() }];

    if (onSwipeStart) {
      onSwipeStart({ x, y });
    }
  }, [onSwipeStart]);

  /**
   * Handle swipe move
   */
  const handleSwipeMove = useCallback((x, y) => {
    if (!isSwiping) return;

    currentPosRef.current = { x, y };
    
    // Add to history for gesture recognition
    historyRef.current.push({ x, y, time: Date.now() });
    if (historyRef.current.length > 10) {
      historyRef.current.shift();
    }

    const metrics = calculateSwipeMetrics();
    const currentDirection = determineDirection(metrics.distance.x, metrics.distance.y);
    
    setDistance(metrics.distance);
    setVelocity(metrics.velocity);
    setDirection(currentDirection);

    if (elementRef.current) {
      // Apply visual feedback
      const rotation = (metrics.distance.x / 10) * rotationAngle;
      const opacity = Math.max(0, 1 - Math.abs(metrics.distance.x) / 300);
      
      elementRef.current.style.transform = `
        translate(${metrics.distance.x}px, ${metrics.distance.y}px) 
        rotate(${Math.min(Math.max(rotation, -rotationAngle), rotationAngle)}deg)
      `;
      elementRef.current.style.opacity = opacity;
    }

    if (onSwiping) {
      onSwiping({
        direction: currentDirection,
        distance: metrics.distance,
        velocity: metrics.velocity,
        angle: metrics.angle
      });
    }
  }, [isSwiping, calculateSwipeMetrics, determineDirection, rotationAngle, onSwiping]);

  /**
   * Handle swipe end
   */
  const handleSwipeEnd = useCallback(() => {
    if (!isSwiping) return;

    const metrics = calculateSwipeMetrics();
    const finalDirection = determineDirection(metrics.distance.x, metrics.distance.y);
    
    // Check if swipe threshold is met
    const meetsThreshold = 
      Math.abs(metrics.distance.x) > threshold || 
      Math.abs(metrics.distance.y) > threshold;
    
    const meetsVelocity = 
      Math.abs(metrics.velocity.x) > swipeVelocity || 
      Math.abs(metrics.velocity.y) > swipeVelocity;

    if (meetsThreshold || meetsVelocity) {
      // Trigger swipe callback
      switch (finalDirection) {
        case 'left':
          if (onSwipeLeft) {
            onSwipeLeft(metrics);
            setSwipeCount(prev => prev + 1);
          }
          break;
        case 'right':
          if (onSwipeRight) {
            onSwipeRight(metrics);
            setSwipeCount(prev => prev + 1);
          }
          break;
        case 'up':
          if (onSwipeUp) {
            onSwipeUp(metrics);
            setSwipeCount(prev => prev + 1);
          }
          break;
        case 'down':
          if (onSwipeDown) {
            onSwipeDown(metrics);
            setSwipeCount(prev => prev + 1);
          }
          break;
      }
    } else {
      // Snap back
      if (elementRef.current) {
        elementRef.current.style.transform = 'translate(0, 0) rotate(0)';
        elementRef.current.style.opacity = '1';
        elementRef.current.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
          if (elementRef.current) {
            elementRef.current.style.transition = '';
          }
        }, 300);
      }
    }

    if (onSwipeEnd) {
      onSwipeEnd({
        direction: finalDirection,
        distance: metrics.distance,
        velocity: metrics.velocity,
        duration: metrics.duration,
        triggered: meetsThreshold || meetsVelocity
      });
    }

    // Reset state
    setIsSwiping(false);
    setDirection(null);
    setDistance({ x: 0, y: 0 });
    setVelocity({ x: 0, y: 0 });
    historyRef.current = [];
  }, [isSwiping, calculateSwipeMetrics, determineDirection, threshold, swipeVelocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipeEnd]);

  /**
   * Touch event handlers
   */
  const handleTouchStart = useCallback((e) => {
    if (!trackTouch) return;
    
    const touch = e.touches[0];
    handleSwipeStart(touch.clientX, touch.clientY);
    
    if (preventScroll) {
      e.preventDefault();
    }
  }, [trackTouch, handleSwipeStart, preventScroll]);

  const handleTouchMove = useCallback((e) => {
    if (!trackTouch || !isSwiping) return;
    
    const touch = e.touches[0];
    handleSwipeMove(touch.clientX, touch.clientY);
    
    if (preventScroll) {
      e.preventDefault();
    }
  }, [trackTouch, isSwiping, handleSwipeMove, preventScroll]);

  const handleTouchEnd = useCallback((e) => {
    if (!trackTouch || !isSwiping) return;
    handleSwipeEnd();
  }, [trackTouch, isSwiping, handleSwipeEnd]);

  /**
   * Mouse event handlers
   */
  const handleMouseDown = useCallback((e) => {
    if (!trackMouse) return;
    handleSwipeStart(e.clientX, e.clientY);
  }, [trackMouse, handleSwipeStart]);

  const handleMouseMove = useCallback((e) => {
    if (!trackMouse || !isSwiping) return;
    handleSwipeMove(e.clientX, e.clientY);
  }, [trackMouse, isSwiping, handleSwipeMove]);

  const handleMouseUp = useCallback((e) => {
    if (!trackMouse || !isSwiping) return;
    handleSwipeEnd();
  }, [trackMouse, isSwiping, handleSwipeEnd]);

  const handleMouseLeave = useCallback((e) => {
    if (!trackMouse || !isSwiping) return;
    handleSwipeEnd();
  }, [trackMouse, isSwiping, handleSwipeEnd]);

  /**
   * Bind events to element
   */
  const bind = useCallback((element) => {
    if (!element) return;
    
    elementRef.current = element;
    
    // Touch events
    if (trackTouch) {
      element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
      element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
      element.addEventListener('touchend', handleTouchEnd);
      element.addEventListener('touchcancel', handleTouchEnd);
    }
    
    // Mouse events
    if (trackMouse) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('mouseleave', handleMouseLeave);
    }
    
    // Prevent drag
    element.addEventListener('dragstart', (e) => e.preventDefault());
    
    return () => {
      if (trackTouch) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchEnd);
      }
      
      if (trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [trackTouch, trackMouse, preventScroll, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  /**
   * Reset swipe state
   */
  const reset = useCallback(() => {
    setIsSwiping(false);
    setDirection(null);
    setDistance({ x: 0, y: 0 });
    setVelocity({ x: 0, y: 0 });
    historyRef.current = [];
    
    if (elementRef.current) {
      elementRef.current.style.transform = '';
      elementRef.current.style.opacity = '';
      elementRef.current.style.transition = '';
    }
  }, []);

  /**
   * Get swipe stats
   */
  const getStats = useCallback(() => {
    return {
      totalSwipes: swipeCount,
      currentDirection: direction,
      isActive: isSwiping,
      lastDistance: distance,
      lastVelocity: velocity,
      history: historyRef.current
    };
  }, [swipeCount, direction, isSwiping, distance, velocity]);

  return {
    // State
    isSwiping,
    direction,
    distance,
    velocity,
    swipeCount,
    
    // Methods
    bind,
    reset,
    getStats,
    
    // Handlers (for manual binding)
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave
    }
  };
};

export default useSwipeGesture;