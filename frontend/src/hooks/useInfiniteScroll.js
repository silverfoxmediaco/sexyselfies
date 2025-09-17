import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useInfiniteScroll Hook
 * Handles infinite scrolling with automatic pagination
 *
 * @param {Function} fetchMore - Function to fetch more data
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and methods
 */
export const useInfiniteScroll = (fetchMore, options = {}) => {
  const {
    threshold = 100, // Distance from bottom to trigger load
    initialPage = 1,
    pageSize = 20,
    direction = 'vertical', // 'vertical' or 'horizontal'
    container = null, // Custom scroll container (null = window)
    debounceDelay = 200,
    retryAttempts = 3,
    retryDelay = 1000,
    onError = null,
    onSuccess = null,
    enabled = true,
  } = options;

  // State
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Refs
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const lastScrollPosition = useRef(0);

  /**
   * Load more items
   */
  const loadMore = useCallback(
    async (isRefresh = false) => {
      if (loadingRef.current || (!hasMore && !isRefresh) || !enabled) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const currentPage = isRefresh ? 1 : page;

      try {
        const result = await fetchMore({
          page: currentPage,
          pageSize,
          isRefresh,
        });

        if (result) {
          const {
            data = [],
            hasMore: moreAvailable = false,
            total = 0,
            totalPages: pages = 0,
            error: fetchError = null,
          } = result;

          if (fetchError) {
            throw new Error(fetchError);
          }

          if (isRefresh) {
            setItems(data);
            setPage(2);
          } else {
            setItems(prev => [...prev, ...data]);
            setPage(prev => prev + 1);
          }

          setHasMore(moreAvailable);
          setTotalItems(total);
          setTotalPages(pages);
          retryCountRef.current = 0;

          if (onSuccess) {
            onSuccess({
              items: data,
              page: currentPage,
              total,
              isRefresh,
            });
          }
        }
      } catch (err) {
        console.error('Infinite scroll error:', err);
        setError(err.message || 'Failed to load items');

        // Retry logic
        if (retryCountRef.current < retryAttempts) {
          retryCountRef.current++;
          setTimeout(() => {
            loadMore(isRefresh);
          }, retryDelay * retryCountRef.current);
        } else {
          if (onError) {
            onError(err);
          }
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      hasMore,
      fetchMore,
      pageSize,
      enabled,
      onSuccess,
      onError,
      retryAttempts,
      retryDelay,
    ]
  );

  /**
   * Refresh items (reload from page 1)
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await loadMore(true);
  }, [loadMore]);

  /**
   * Reset the infinite scroll
   */
  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setTotalItems(0);
    setTotalPages(0);
    loadingRef.current = false;
    retryCountRef.current = 0;
  }, [initialPage]);

  /**
   * Handle scroll event with debouncing
   */
  const handleScroll = useCallback(() => {
    if (!enabled || loading || !hasMore) return;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const scrollContainer = container || window;
      let shouldLoad = false;

      if (direction === 'vertical') {
        if (scrollContainer === window) {
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = window.innerHeight;

          shouldLoad = scrollTop + clientHeight >= scrollHeight - threshold;
          lastScrollPosition.current = scrollTop;
        } else if (scrollContainer) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
          shouldLoad = scrollTop + clientHeight >= scrollHeight - threshold;
          lastScrollPosition.current = scrollTop;
        }
      } else {
        // Horizontal scrolling
        if (scrollContainer === window) {
          const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = window.innerWidth;

          shouldLoad = scrollLeft + clientWidth >= scrollWidth - threshold;
          lastScrollPosition.current = scrollLeft;
        } else if (scrollContainer) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
          shouldLoad = scrollLeft + clientWidth >= scrollWidth - threshold;
          lastScrollPosition.current = scrollLeft;
        }
      }

      if (shouldLoad) {
        loadMore();
      }
    }, debounceDelay);
  }, [
    container,
    direction,
    threshold,
    loading,
    hasMore,
    enabled,
    loadMore,
    debounceDelay,
  ]);

  /**
   * Setup Intersection Observer for better performance
   */
  const setupIntersectionObserver = useCallback(
    targetElement => {
      if (!targetElement || !enabled) return;

      // Disconnect existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      const options = {
        root: container,
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      };

      observerRef.current = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadMore();
          }
        });
      }, options);

      observerRef.current.observe(targetElement);
    },
    [container, threshold, hasMore, loading, enabled, loadMore]
  );

  /**
   * Set the last element for Intersection Observer
   */
  const setLastElement = useCallback(
    element => {
      if (element) {
        setupIntersectionObserver(element);
      }
    },
    [setupIntersectionObserver]
  );

  /**
   * Scroll to top
   */
  const scrollToTop = useCallback(() => {
    const scrollContainer = container || window;

    if (direction === 'vertical') {
      if (scrollContainer === window) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (scrollContainer === window) {
        window.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (scrollContainer) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [container, direction]);

  /**
   * Get scroll position
   */
  const getScrollPosition = useCallback(() => {
    return lastScrollPosition.current;
  }, []);

  /**
   * Restore scroll position
   */
  const restoreScrollPosition = useCallback(
    position => {
      const scrollContainer = container || window;

      if (direction === 'vertical') {
        if (scrollContainer === window) {
          window.scrollTo({ top: position, behavior: 'auto' });
        } else if (scrollContainer) {
          scrollContainer.scrollTop = position;
        }
      } else {
        if (scrollContainer === window) {
          window.scrollTo({ left: position, behavior: 'auto' });
        } else if (scrollContainer) {
          scrollContainer.scrollLeft = position;
        }
      }
    },
    [container, direction]
  );

  /**
   * Setup scroll listener
   */
  useEffect(() => {
    if (!enabled) return;

    const scrollContainer = container || window;

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, {
        passive: true,
      });
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [container, handleScroll, enabled]);

  /**
   * Load initial data
   */
  useEffect(() => {
    if (items.length === 0 && enabled) {
      loadMore();
    }
  }, [enabled]);

  /**
   * Cleanup observer on unmount
   */
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    // Data
    items,
    loading,
    error,
    hasMore,
    refreshing,
    page,
    totalItems,
    totalPages,

    // Methods
    loadMore: () => loadMore(false),
    refresh,
    reset,
    setLastElement,
    scrollToTop,
    getScrollPosition,
    restoreScrollPosition,

    // Utils
    isEmpty: items.length === 0,
    isLastPage: page >= totalPages,
    itemCount: items.length,
  };
};

export default useInfiniteScroll;
