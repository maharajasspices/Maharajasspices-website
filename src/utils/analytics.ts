/**
 * Simple privacy-focused analytics utilities
 * No external services or tracking cookies
 */

interface PageView {
  path: string;
  timestamp: number;
  referrer: string;
  userAgent: string;
}

interface AnalyticsEvent {
  name: string;
  data?: Record<string, any>;
  timestamp: number;
}

const ANALYTICS_KEY = 'maharajas_analytics';
const MAX_EVENTS = 1000;

/**
 * Track a page view
 */
export const trackPageView = (path: string) => {
  const pageView: PageView = {
    path,
    timestamp: Date.now(),
    referrer: document.referrer,
    userAgent: navigator.userAgent,
  };

  // Store in localStorage (privacy-focused, local only)
  try {
    const existing = localStorage.getItem(ANALYTICS_KEY);
    const analytics = existing ? JSON.parse(existing) : { pageViews: [], events: [] };
    
    analytics.pageViews = analytics.pageViews || [];
    analytics.pageViews.push(pageView);
    
    // Keep only last MAX_EVENTS
    if (analytics.pageViews.length > MAX_EVENTS) {
      analytics.pageViews = analytics.pageViews.slice(-MAX_EVENTS);
    }
    
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

/**
 * Track a custom event
 */
export const trackEvent = (name: string, data?: Record<string, any>) => {
  const event: AnalyticsEvent = {
    name,
    data,
    timestamp: Date.now(),
  };

  try {
    const existing = localStorage.getItem(ANALYTICS_KEY);
    const analytics = existing ? JSON.parse(existing) : { pageViews: [], events: [] };
    
    analytics.events = analytics.events || [];
    analytics.events.push(event);
    
    // Keep only last MAX_EVENTS
    if (analytics.events.length > MAX_EVENTS) {
      analytics.events = analytics.events.slice(-MAX_EVENTS);
    }
    
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

/**
 * Get analytics data (for admin dashboard)
 */
export const getAnalyticsData = () => {
  try {
    const existing = localStorage.getItem(ANALYTICS_KEY);
    return existing ? JSON.parse(existing) : { pageViews: [], events: [] };
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return { pageViews: [], events: [] };
  }
};

/**
 * Clear analytics data
 */
export const clearAnalytics = () => {
  try {
    localStorage.removeItem(ANALYTICS_KEY);
  } catch (error) {
    console.error('Failed to clear analytics:', error);
  }
};
