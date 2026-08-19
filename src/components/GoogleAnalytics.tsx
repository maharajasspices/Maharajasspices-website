import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_MEASUREMENT_ID = "G-2HL1Y9KJPQ";

export const GoogleAnalytics = () => {
  const location = useLocation();

  // Load Google Analytics once
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // Prevent loading it twice
    if (document.querySelector(`script[src*="${GA_MEASUREMENT_ID}"]`)) {
      return;
    }

    // Create Google Analytics script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

    document.head.appendChild(script);

    // Set up dataLayer
    window.dataLayer = window.dataLayer || [];

    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }

    window.gtag = gtag;

    gtag("js", new Date());

    gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: true,
    });
  }, []);

  // Track React route changes
  useEffect(() => {
    if (!window.gtag) return;

    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);

  return null;
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!window.gtag) return;

  window.gtag("event", eventName, eventParams);
};

// Track ecommerce purchase
export const trackPurchase = (
  transactionId: string,
  value: number,
  items: any[]
) => {
  if (!window.gtag) return;

  window.gtag("event", "purchase", {
    transaction_id: transactionId,
    value,
    currency: "ZAR",
    items,
  });
};

// Track add to cart
export const trackAddToCart = (item: any) => {
  if (!window.gtag) return;

  window.gtag("event", "add_to_cart", {
    currency: "ZAR",
    value: item.price,
    items: [item],
  });
};

// TypeScript declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}