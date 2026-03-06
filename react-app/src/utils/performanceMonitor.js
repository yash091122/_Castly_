/**
 * Performance Monitoring Utilities
 * Track and optimize application performance
 */

// Performance metrics storage
const metrics = {
  pageLoads: [],
  apiCalls: [],
  renders: [],
  interactions: []
};

/**
 * Measure page load performance
 */
export const measurePageLoad = () => {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domComplete - perfData.domLoading;
  const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
  
  const metric = {
    pageLoadTime,
    connectTime,
    renderTime,
    domReadyTime,
    timestamp: Date.now()
  };
  
  metrics.pageLoads.push(metric);
  
  return metric;
};

/**
 * Measure Core Web Vitals
 */
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;
  
  // Largest Contentful Paint (LCP)
  const observeLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  };
  
  // First Input Delay (FID)
  const observeFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  };
  
  // Cumulative Layout Shift (CLS)
  const observeCLS = () => {
    let clsScore = 0;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
      
      console.log('CLS:', clsScore);
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  };
  
  // Time to First Byte (TTFB)
  const measureTTFB = () => {
    const perfData = window.performance.timing;
    const ttfb = perfData.responseStart - perfData.navigationStart;
    console.log('TTFB:', ttfb);
  };
  
  try {
    observeLCP();
    observeFID();
    observeCLS();
    measureTTFB();
  } catch (error) {
    console.error('Error measuring web vitals:', error);
  }
};

/**
 * Measure API call performance
 * @param {string} endpoint - API endpoint
 * @param {function} apiCall - API call function
 * @returns {Promise}
 */
export const measureApiCall = async (endpoint, apiCall) => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    metrics.apiCalls.push({
      endpoint,
      duration,
      success: true,
      timestamp: Date.now()
    });
    
    if (duration > 1000) {
      console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    metrics.apiCalls.push({
      endpoint,
      duration,
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
    
    throw error;
  }
};

/**
 * Measure component render time
 * @param {string} componentName - Component name
 * @param {function} renderFn - Render function
 */
export const measureRender = (componentName, renderFn) => {
  const startTime = performance.now();
  
  const result = renderFn();
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  metrics.renders.push({
    component: componentName,
    duration,
    timestamp: Date.now()
  });
  
  if (duration > 16) { // 60fps = 16ms per frame
    console.warn(`Slow render: ${componentName} took ${duration}ms`);
  }
  
  return result;
};

/**
 * Measure user interaction
 * @param {string} action - Action name
 * @param {function} handler - Event handler
 */
export const measureInteraction = (action, handler) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await handler(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      metrics.interactions.push({
        action,
        duration,
        timestamp: Date.now()
      });
      
      if (duration > 100) {
        console.warn(`Slow interaction: ${action} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      throw error;
    }
  };
};

/**
 * Get performance report
 * @returns {object} Performance metrics
 */
export const getPerformanceReport = () => {
  const avgPageLoad = metrics.pageLoads.length > 0
    ? metrics.pageLoads.reduce((sum, m) => sum + m.pageLoadTime, 0) / metrics.pageLoads.length
    : 0;
  
  const avgApiCall = metrics.apiCalls.length > 0
    ? metrics.apiCalls.reduce((sum, m) => sum + m.duration, 0) / metrics.apiCalls.length
    : 0;
  
  const avgRender = metrics.renders.length > 0
    ? metrics.renders.reduce((sum, m) => sum + m.duration, 0) / metrics.renders.length
    : 0;
  
  const slowApiCalls = metrics.apiCalls.filter(m => m.duration > 1000);
  const slowRenders = metrics.renders.filter(m => m.duration > 16);
  
  return {
    pageLoads: {
      count: metrics.pageLoads.length,
      average: avgPageLoad,
      latest: metrics.pageLoads[metrics.pageLoads.length - 1]
    },
    apiCalls: {
      count: metrics.apiCalls.length,
      average: avgApiCall,
      slow: slowApiCalls.length,
      slowCalls: slowApiCalls
    },
    renders: {
      count: metrics.renders.length,
      average: avgRender,
      slow: slowRenders.length,
      slowRenders: slowRenders
    },
    interactions: {
      count: metrics.interactions.length
    }
  };
};

/**
 * Clear performance metrics
 */
export const clearMetrics = () => {
  metrics.pageLoads = [];
  metrics.apiCalls = [];
  metrics.renders = [];
  metrics.interactions = [];
};

/**
 * Log performance report to console
 */
export const logPerformanceReport = () => {
  const report = getPerformanceReport();
  
  console.group('📊 Performance Report');
  console.log('Page Loads:', report.pageLoads);
  console.log('API Calls:', report.apiCalls);
  console.log('Renders:', report.renders);
  console.log('Interactions:', report.interactions);
  console.groupEnd();
  
  return report;
};

/**
 * Monitor memory usage
 */
export const monitorMemory = () => {
  if (typeof window === 'undefined' || !performance.memory) {
    console.warn('Memory monitoring not supported');
    return null;
  }
  
  const memory = performance.memory;
  
  return {
    usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    percentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
  };
};

/**
 * Detect performance issues
 */
export const detectPerformanceIssues = () => {
  const issues = [];
  const report = getPerformanceReport();
  
  // Check page load time
  if (report.pageLoads.average > 3000) {
    issues.push({
      type: 'slow-page-load',
      severity: 'high',
      message: `Average page load time is ${report.pageLoads.average}ms (target: <3000ms)`
    });
  }
  
  // Check API calls
  if (report.apiCalls.average > 500) {
    issues.push({
      type: 'slow-api',
      severity: 'medium',
      message: `Average API call time is ${report.apiCalls.average}ms (target: <500ms)`
    });
  }
  
  // Check renders
  if (report.renders.average > 16) {
    issues.push({
      type: 'slow-render',
      severity: 'medium',
      message: `Average render time is ${report.renders.average}ms (target: <16ms for 60fps)`
    });
  }
  
  // Check memory
  const memory = monitorMemory();
  if (memory && parseFloat(memory.percentage) > 80) {
    issues.push({
      type: 'high-memory',
      severity: 'high',
      message: `Memory usage is ${memory.percentage} (target: <80%)`
    });
  }
  
  return issues;
};

/**
 * Start performance monitoring
 */
export const startPerformanceMonitoring = () => {
  // Measure on page load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        measurePageLoad();
        measureWebVitals();
      }, 0);
    });
    
    // Log report every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const issues = detectPerformanceIssues();
        if (issues.length > 0) {
          console.warn('⚠️ Performance Issues Detected:', issues);
        }
      }, 30000);
    }
  }
};

export default {
  measurePageLoad,
  measureWebVitals,
  measureApiCall,
  measureRender,
  measureInteraction,
  getPerformanceReport,
  clearMetrics,
  logPerformanceReport,
  monitorMemory,
  detectPerformanceIssues,
  startPerformanceMonitoring
};
