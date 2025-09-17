/**
 * Gesture Utilities
 * Handles swipe gestures for discovery pages and other touch interactions
 */

class GestureHandler {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      threshold: options.threshold || 50, // Minimum distance for swipe
      restraint: options.restraint || 100, // Maximum perpendicular distance
      allowedTime: options.allowedTime || 500, // Maximum time for swipe
      onSwipeLeft: options.onSwipeLeft || (() => {}),
      onSwipeRight: options.onSwipeRight || (() => {}),
      onSwipeUp: options.onSwipeUp || (() => {}),
      onSwipeDown: options.onSwipeDown || (() => {}),
      onTap: options.onTap || (() => {}),
      onDoubleTap: options.onDoubleTap || (() => {}),
      onLongPress: options.onLongPress || (() => {}),
      onPinch: options.onPinch || (() => {}),
      onDrag: options.onDrag || (() => {}),
      onDragEnd: options.onDragEnd || (() => {}),
      enableHaptic: options.enableHaptic !== false,
      preventScroll: options.preventScroll !== false,
    };

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.touchStartTime = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastTap = 0;
    this.longPressTimer = null;
    this.pinchStartDistance = 0;

    this.init();
  }

  init() {
    if (!this.element) return;

    // Touch events
    this.element.addEventListener(
      'touchstart',
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.element.addEventListener(
      'touchmove',
      this.handleTouchMove.bind(this),
      { passive: false }
    );
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });
    this.element.addEventListener(
      'touchcancel',
      this.handleTouchCancel.bind(this),
      { passive: false }
    );

    // Mouse events (for desktop testing)
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener(
      'mouseleave',
      this.handleMouseLeave.bind(this)
    );

    // Prevent default drag behavior
    this.element.addEventListener('dragstart', e => e.preventDefault());
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isDragging = false;
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;

    // Prevent scroll if needed
    if (this.options.preventScroll) {
      e.preventDefault();
    }

    // Handle pinch gesture
    if (e.touches.length === 2) {
      this.pinchStartDistance = this.getPinchDistance(e.touches);
    }

    // Long press detection
    this.longPressTimer = setTimeout(() => {
      if (!this.isDragging) {
        this.triggerHaptic('impact', 'medium');
        this.options.onLongPress({
          x: this.touchStartX,
          y: this.touchStartY,
          target: e.target,
        });
      }
    }, 500);
  }

  handleTouchMove(e) {
    if (!this.touchStartX || !this.touchStartY) return;

    const touch = e.touches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;

    // Clear long press if moving
    if (this.longPressTimer) {
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - this.touchStartX, 2) +
          Math.pow(touch.clientY - this.touchStartY, 2)
      );
      if (moveDistance > 10) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
        this.isDragging = true;
      }
    }

    // Handle pinch
    if (e.touches.length === 2) {
      const currentDistance = this.getPinchDistance(e.touches);
      const scale = currentDistance / this.pinchStartDistance;
      this.options.onPinch({
        scale,
        center: this.getPinchCenter(e.touches),
      });
    }

    // Handle drag
    if (this.isDragging) {
      const deltaX = touch.clientX - this.dragStartX;
      const deltaY = touch.clientY - this.dragStartY;

      this.options.onDrag({
        deltaX,
        deltaY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startX: this.dragStartX,
        startY: this.dragStartY,
      });

      if (this.options.preventScroll) {
        e.preventDefault();
      }
    }
  }

  handleTouchEnd(e) {
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;

    // Calculate distances
    const horizontalDistance = this.touchEndX - this.touchStartX;
    const verticalDistance = this.touchEndY - this.touchStartY;
    const horizontalAbsolute = Math.abs(horizontalDistance);
    const verticalAbsolute = Math.abs(verticalDistance);

    // Drag end
    if (this.isDragging) {
      this.options.onDragEnd({
        deltaX: horizontalDistance,
        deltaY: verticalDistance,
        velocity: this.calculateVelocity(
          horizontalDistance,
          verticalDistance,
          touchDuration
        ),
      });
      this.isDragging = false;
      return;
    }

    // Check for tap
    if (
      horizontalAbsolute < 10 &&
      verticalAbsolute < 10 &&
      touchDuration < 200
    ) {
      // Check for double tap
      const currentTime = Date.now();
      if (currentTime - this.lastTap < 300) {
        this.triggerHaptic('impact', 'light');
        this.options.onDoubleTap({
          x: this.touchStartX,
          y: this.touchStartY,
          target: e.target,
        });
        this.lastTap = 0;
      } else {
        this.options.onTap({
          x: this.touchStartX,
          y: this.touchStartY,
          target: e.target,
        });
        this.lastTap = currentTime;
      }
      return;
    }

    // Check for swipe
    if (touchDuration <= this.options.allowedTime) {
      // Horizontal swipe
      if (
        horizontalAbsolute >= this.options.threshold &&
        horizontalAbsolute > verticalAbsolute
      ) {
        if (horizontalDistance > 0) {
          this.triggerHaptic('impact', 'light');
          this.options.onSwipeRight({
            distance: horizontalDistance,
            velocity: horizontalDistance / touchDuration,
            startX: this.touchStartX,
            startY: this.touchStartY,
            endX: this.touchEndX,
            endY: this.touchEndY,
          });
        } else {
          this.triggerHaptic('impact', 'light');
          this.options.onSwipeLeft({
            distance: Math.abs(horizontalDistance),
            velocity: Math.abs(horizontalDistance) / touchDuration,
            startX: this.touchStartX,
            startY: this.touchStartY,
            endX: this.touchEndX,
            endY: this.touchEndY,
          });
        }
      }
      // Vertical swipe
      else if (
        verticalAbsolute >= this.options.threshold &&
        verticalAbsolute > horizontalAbsolute
      ) {
        if (verticalDistance > 0) {
          this.options.onSwipeDown({
            distance: verticalDistance,
            velocity: verticalDistance / touchDuration,
            startX: this.touchStartX,
            startY: this.touchStartY,
            endX: this.touchEndX,
            endY: this.touchEndY,
          });
        } else {
          this.options.onSwipeUp({
            distance: Math.abs(verticalDistance),
            velocity: Math.abs(verticalDistance) / touchDuration,
            startX: this.touchStartX,
            startY: this.touchStartY,
            endX: this.touchEndX,
            endY: this.touchEndY,
          });
        }
      }
    }

    // Reset values
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
  }

  handleTouchCancel() {
    // Clear any timers and reset
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.isDragging = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  // Mouse event handlers for desktop
  handleMouseDown(e) {
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchStartTime = Date.now();
    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
  }

  handleMouseMove(e) {
    if (!this.touchStartX || !this.touchStartY) return;

    this.touchEndX = e.clientX;
    this.touchEndY = e.clientY;

    if (
      !this.isDragging &&
      (Math.abs(e.clientX - this.touchStartX) > 10 ||
        Math.abs(e.clientY - this.touchStartY) > 10)
    ) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      this.options.onDrag({
        deltaX: e.clientX - this.dragStartX,
        deltaY: e.clientY - this.dragStartY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    }
  }

  handleMouseUp(e) {
    if (this.touchStartX && this.touchStartY) {
      this.touchEndX = e.clientX;
      this.touchEndY = e.clientY;
      this.handleTouchEnd(e);
    }
  }

  handleMouseLeave() {
    this.handleTouchCancel();
  }

  // Helper methods
  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPinchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  calculateVelocity(distanceX, distanceY, time) {
    return {
      x: distanceX / time,
      y: distanceY / time,
      magnitude: Math.sqrt(
        Math.pow(distanceX / time, 2) + Math.pow(distanceY / time, 2)
      ),
    };
  }

  triggerHaptic(type = 'impact', intensity = 'light') {
    if (!this.options.enableHaptic) return;

    // Haptic Feedback API (for supported devices)
    if ('vibrate' in navigator) {
      switch (intensity) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
      }
    }
  }

  destroy() {
    // Remove all event listeners
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }
}

// Swipeable card handler specifically for discovery pages
export class SwipeableCard {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      onSwipeLeft: options.onSwipeLeft || (() => {}),
      onSwipeRight: options.onSwipeRight || (() => {}),
      onSwipeUp: options.onSwipeUp || (() => {}),
      swipeThreshold: options.swipeThreshold || 100,
      rotationMultiplier: options.rotationMultiplier || 0.1,
      maxRotation: options.maxRotation || 30,
      animationDuration: options.animationDuration || 300,
    };

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.rotation = 0;
    this.opacity = 1;

    this.init();
  }

  init() {
    this.gesture = new GestureHandler(this.element, {
      preventScroll: true,
      onDrag: this.handleDrag.bind(this),
      onDragEnd: this.handleDragEnd.bind(this),
    });

    // Set initial transform origin
    this.element.style.transformOrigin = 'center bottom';
    this.element.style.transition = 'none';
  }

  handleDrag({ deltaX, deltaY }) {
    this.currentX = deltaX;
    this.currentY = deltaY;

    // Calculate rotation based on horizontal movement
    this.rotation = deltaX * this.options.rotationMultiplier;
    this.rotation = Math.max(
      -this.options.maxRotation,
      Math.min(this.options.maxRotation, this.rotation)
    );

    // Calculate opacity based on distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    this.opacity = Math.max(0, 1 - distance / 300);

    // Apply transforms
    this.element.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${this.rotation}deg)`;

    // Show swipe indicators
    this.updateSwipeIndicators(deltaX, deltaY);
  }

  handleDragEnd({ deltaX, deltaY, velocity }) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocityMagnitude = velocity.magnitude;

    // Determine if swipe threshold is met
    if (distance > this.options.swipeThreshold || velocityMagnitude > 0.5) {
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.swipeRight();
        } else {
          this.swipeLeft();
        }
      } else {
        // Vertical swipe (super like)
        if (deltaY < 0) {
          this.swipeUp();
        }
      }
    } else {
      // Snap back to center
      this.snapBack();
    }
  }

  swipeLeft() {
    this.element.style.transition = `transform ${this.options.animationDuration}ms ease-out`;
    this.element.style.transform = `translate(-150%, ${this.currentY}px) rotate(-30deg)`;

    setTimeout(() => {
      this.options.onSwipeLeft(this.element);
    }, this.options.animationDuration);
  }

  swipeRight() {
    this.element.style.transition = `transform ${this.options.animationDuration}ms ease-out`;
    this.element.style.transform = `translate(150%, ${this.currentY}px) rotate(30deg)`;

    setTimeout(() => {
      this.options.onSwipeRight(this.element);
    }, this.options.animationDuration);
  }

  swipeUp() {
    this.element.style.transition = `transform ${this.options.animationDuration}ms ease-out`;
    this.element.style.transform = `translate(${this.currentX}px, -150%) rotate(${this.rotation}deg)`;

    setTimeout(() => {
      this.options.onSwipeUp(this.element);
    }, this.options.animationDuration);
  }

  snapBack() {
    this.element.style.transition = `transform ${this.options.animationDuration}ms ease-out`;
    this.element.style.transform = 'translate(0, 0) rotate(0)';
    this.hideSwipeIndicators();
  }

  updateSwipeIndicators(deltaX, deltaY) {
    // This would update visual indicators on the card
    // Implementation depends on your UI
    const likeIndicator = this.element.querySelector('.like-indicator');
    const passIndicator = this.element.querySelector('.pass-indicator');
    const superIndicator = this.element.querySelector('.super-indicator');

    if (likeIndicator && passIndicator) {
      if (deltaX > 50) {
        likeIndicator.style.opacity = Math.min(1, deltaX / 100);
        passIndicator.style.opacity = 0;
      } else if (deltaX < -50) {
        passIndicator.style.opacity = Math.min(1, Math.abs(deltaX) / 100);
        likeIndicator.style.opacity = 0;
      } else {
        likeIndicator.style.opacity = 0;
        passIndicator.style.opacity = 0;
      }
    }

    if (superIndicator && deltaY < -50) {
      superIndicator.style.opacity = Math.min(1, Math.abs(deltaY) / 100);
    } else if (superIndicator) {
      superIndicator.style.opacity = 0;
    }
  }

  hideSwipeIndicators() {
    const indicators = this.element.querySelectorAll(
      '.like-indicator, .pass-indicator, .super-indicator'
    );
    indicators.forEach(indicator => {
      if (indicator) indicator.style.opacity = 0;
    });
  }

  destroy() {
    this.gesture.destroy();
  }
}

// Pull to refresh handler
export class PullToRefresh {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      onRefresh: options.onRefresh || (() => Promise.resolve()),
      threshold: options.threshold || 80,
      max: options.max || 150,
      refreshTimeout: options.refreshTimeout || 3000,
    };

    this.isRefreshing = false;
    this.startY = 0;
    this.currentY = 0;
    this.pulling = false;

    this.init();
  }

  init() {
    this.element.addEventListener(
      'touchstart',
      this.handleTouchStart.bind(this),
      { passive: true }
    );
    this.element.addEventListener(
      'touchmove',
      this.handleTouchMove.bind(this),
      { passive: false }
    );
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Create refresh indicator
    this.createRefreshIndicator();
  }

  createRefreshIndicator() {
    this.refreshIndicator = document.createElement('div');
    this.refreshIndicator.className = 'pull-refresh-indicator';
    this.refreshIndicator.innerHTML = `
      <div class="pull-refresh-spinner">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `;
    this.refreshIndicator.style.cssText = `
      position: absolute;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
    `;

    this.element.style.position = 'relative';
    this.element.prepend(this.refreshIndicator);
  }

  handleTouchStart(e) {
    if (this.isRefreshing) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      this.startY = e.touches[0].clientY;
      this.pulling = true;
    }
  }

  handleTouchMove(e) {
    if (!this.pulling || this.isRefreshing) return;

    this.currentY = e.touches[0].clientY;
    const pullDistance = Math.min(
      this.currentY - this.startY,
      this.options.max
    );

    if (pullDistance > 0) {
      e.preventDefault();

      const percentage = pullDistance / this.options.threshold;
      const opacity = Math.min(percentage, 1);
      const rotation = percentage * 180;

      this.refreshIndicator.style.opacity = opacity;
      this.refreshIndicator.style.transform = `translateX(-50%) translateY(${pullDistance / 2}px) rotate(${rotation}deg)`;

      if (pullDistance > this.options.threshold) {
        this.refreshIndicator.classList.add('ready');
      } else {
        this.refreshIndicator.classList.remove('ready');
      }
    }
  }

  async handleTouchEnd() {
    if (!this.pulling || this.isRefreshing) return;

    const pullDistance = this.currentY - this.startY;

    if (pullDistance > this.options.threshold) {
      this.isRefreshing = true;
      this.refreshIndicator.classList.add('refreshing');

      try {
        await Promise.race([
          this.options.onRefresh(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Refresh timeout')),
              this.options.refreshTimeout
            )
          ),
        ]);
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        this.isRefreshing = false;
        this.refreshIndicator.classList.remove('refreshing', 'ready');
      }
    }

    // Reset
    this.refreshIndicator.style.opacity = 0;
    this.refreshIndicator.style.transform = 'translateX(-50%)';
    this.pulling = false;
    this.startY = 0;
    this.currentY = 0;
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);

    if (this.refreshIndicator) {
      this.refreshIndicator.remove();
    }
  }
}

// Export default gesture handler
export default GestureHandler;
