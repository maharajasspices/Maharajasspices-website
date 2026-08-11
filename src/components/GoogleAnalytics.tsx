import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Google Analytics component
 * Loads GA only after user interaction or idle time to improve TTI
 * Uses requestIdleCallback for better main-thread performance
 */

const GA_MEASUREMENT_ID = 'G-E2TVH2E94W';

// Polyfill for requestIdleCallback
const requestIdleCallbackPolyfill = (cb: IdleRequestCallback): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(cb, { timeout: 2000 });
  }
  return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 1) as unknown as number;
};

export const GoogleAnalytics = () => {
  const location = useLocation();
  const gaLoadedRef = useRef(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || gaLoadedRef.current) return;

    const loadGA = () => {
      if (gaLoadedRef.current) return;
      gaLoadedRef.current = true;

      // Remove event listeners once loaded
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);

      // Use requestIdleCallback to avoid blocking main thread
      requestIdleCallbackPolyfill(() => {
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
          page_path: location.pathname,
          send_page_view: true,
        });

        (window as any).gtag = gtag;
      });
    };

    const handleInteraction = () => {
      // Debounce using requestIdleCallback
      requestIdleCallbackPolyfill(() => loadGA());
    };

    // Load GA on first user interaction OR after 15 seconds
    window.addEventListener('scroll', handleInteraction, { once: true, passive: true });
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });

    // Longer delay for auto-load (15s instead of 8s)
    const timeoutId = setTimeout(() => {
      requestIdleCallbackPolyfill(() => loadGA());
    }, 15000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [location.pathname]);

  // Track page views on route change
  useEffect(() => {
    if (GA_MEASUREMENT_ID && (window as any).gtag) {
      // Use requestIdleCallback for page view tracking too
      requestIdleCallbackPolyfill(() => {
        (window as any).gtag('config', GA_MEASUREMENT_ID, {
          page_path: location.pathname,
        });
      });
    }
  }, [location]);

  return null;
};

/**
 * Track custom events
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (GA_MEASUREMENT_ID && (window as any).gtag) {
    requestIdleCallbackPolyfill(() => {
      (window as any).gtag('event', eventName, eventParams);
    });
  }
};

/**
 * Track ecommerce events
 */
export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
  if (GA_MEASUREMENT_ID && (window as any).gtag) {
    requestIdleCallbackPolyfill(() => {
      (window as any).gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: 'ZAR',
        items: items,
      });
    });
  }
};

export const trackAddToCart = (item: any) => {
  if (GA_MEASUREMENT_ID && (window as any).gtag) {
    requestIdleCallbackPolyfill(() => {
      (window as any).gtag('event', 'add_to_cart', {
        currency: 'ZAR',
        value: item.price,
        items: [item],
      });
    });
  }
};

// Declare gtag type for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
