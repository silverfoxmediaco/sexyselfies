import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useOfflineStatus Hook
 * Monitors network connectivity and provides offline/online status
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and methods
 */
export const useOfflineStatus = (options = {}) => {
  const {
    pingUrl = '/api/ping',
    pingInterval = 30000, // 30 seconds
    enablePing = true,
    onOnline = null,
    onOffline = null,
    checkOnFocus = true,
    debounceDelay = 1000
  } = options;

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [connectionType, setConnectionType] = useState('unknown');
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [effectiveType, setEffectiveType] = useState('unknown');
  const [saveData, setSaveData] = useState(false);

  // Refs
  const pingIntervalRef = useRef(null);
  const offlineStartRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000);

  /**
   * Update connection information
   */
  const updateConnectionInfo = useCallback(() => {
    if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
        setDownloadSpeed(connection.downlink || 0);
        setSaveData(connection.saveData || false);

        // Determine connection quality
        let quality = 'unknown';
        if (connection.effectiveType === '4g') {
          quality = 'excellent';
        } else if (connection.effectiveType === '3g') {
          quality = 'good';
        } else if (connection.effectiveType === '2g') {
          quality = 'poor';
        } else if (connection.effectiveType === 'slow-2g') {
          quality = 'very-poor';
        }
        setConnectionQuality(quality);
      }
    }
  }, []);

  /**
   * Perform network ping check
   */
  const performPingCheck = useCallback(async () => {
    if (!enablePing) return true;

    setIsChecking(true);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const latency = Date.now() - startTime;
      
      // Update connection quality based on latency
      if (latency < 100) {
        setConnectionQuality('excellent');
      } else if (latency < 300) {
        setConnectionQuality('good');
      } else if (latency < 1000) {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('poor');
      }

      return response.ok;
    } catch (error) {
      console.warn('Ping check failed:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [enablePing, pingUrl]);

  /**
   * Handle going online
   */
  const handleOnline = useCallback(async () => {
    // Debounce online events
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      // Verify with ping if enabled
      const isReallyOnline = await performPingCheck();
      
      if (isReallyOnline) {
        setIsOnline(true);
        setLastOnlineTime(Date.now());
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
        
        // Calculate offline duration
        if (offlineStartRef.current) {
          const duration = Date.now() - offlineStartRef.current;
          setOfflineDuration(duration);
          offlineStartRef.current = null;
        }

        updateConnectionInfo();

        if (onOnline) {
          onOnline({
            offlineDuration,
            timestamp: Date.now()
          });
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('app-online', {
          detail: { offlineDuration }
        }));
      }
    }, debounceDelay);
  }, [performPingCheck, offlineDuration, onOnline, updateConnectionInfo, debounceDelay]);

  /**
   * Handle going offline
   */
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    offlineStartRef.current = Date.now();
    
    if (onOffline) {
      onOffline({
        lastOnlineTime,
        timestamp: Date.now()
      });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-offline', {
      detail: { lastOnlineTime }
    }));

    // Start reconnection attempts
    attemptReconnection();
  }, [lastOnlineTime, onOffline]);

  /**
   * Attempt to reconnect
   */
  const attemptReconnection = useCallback(async () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current++;
    
    setTimeout(async () => {
      const isReallyOnline = await performPingCheck();
      
      if (isReallyOnline) {
        handleOnline();
      } else {
        // Exponential backoff
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
        attemptReconnection();
      }
    }, reconnectDelayRef.current);
  }, [performPingCheck, handleOnline]);

  /**
   * Force check online status
   */
  const checkOnlineStatus = useCallback(async () => {
    const browserOnline = navigator.onLine;
    
    if (browserOnline) {
      const isReallyOnline = await performPingCheck();
      setIsOnline(isReallyOnline);
      
      if (isReallyOnline) {
        updateConnectionInfo();
      }
    } else {
      setIsOnline(false);
    }
  }, [performPingCheck, updateConnectionInfo]);

  /**
   * Handle visibility change
   */
  const handleVisibilityChange = useCallback(() => {
    if (checkOnFocus && !document.hidden) {
      checkOnlineStatus();
    }
  }, [checkOnFocus, checkOnlineStatus]);

  /**
   * Handle connection change
   */
  const handleConnectionChange = useCallback(() => {
    updateConnectionInfo();
  }, [updateConnectionInfo]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    // Network events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Connection change
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    // Initial check
    checkOnlineStatus();

    // Setup ping interval
    if (enablePing && pingInterval) {
      pingIntervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          performPingCheck();
        }
      }, pingInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [handleOnline, handleOffline, handleVisibilityChange, handleConnectionChange, checkOnlineStatus, enablePing, pingInterval, performPingCheck]);

  /**
   * Get offline duration in human readable format
   */
  const getOfflineDurationFormatted = useCallback(() => {
    if (offlineDuration === 0) return 'N/A';
    
    const seconds = Math.floor(offlineDuration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, [offlineDuration]);

  /**
   * Check if should use reduced data
   */
  const shouldReduceData = useCallback(() => {
    return saveData || connectionQuality === 'poor' || connectionQuality === 'very-poor';
  }, [saveData, connectionQuality]);

  return {
    // Status
    isOnline,
    isOffline: !isOnline,
    isChecking,
    
    // Connection info
    connectionQuality,
    connectionType,
    effectiveType,
    downloadSpeed,
    saveData,
    
    // Time tracking
    lastOnlineTime,
    offlineDuration,
    getOfflineDurationFormatted,
    
    // Methods
    checkOnlineStatus,
    shouldReduceData,
    
    // Utilities
    isSlowConnection: connectionQuality === 'poor' || connectionQuality === 'very-poor',
    isFastConnection: connectionQuality === 'excellent' || connectionQuality === 'good',
    canAutoplayVideo: connectionQuality === 'excellent' || connectionQuality === 'good',
    reconnectAttempts: reconnectAttemptsRef.current
  };
};

export default useOfflineStatus;