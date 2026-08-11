/**
 * Currency conversion utilities
 * Detects user's location and converts ZAR prices to local currency
 */

interface CurrencyRates {
  [key: string]: number;
}

// Exchange rates relative to ZAR (1 ZAR = X currency)
// These are approximate rates - in production, fetch from API
const EXCHANGE_RATES: CurrencyRates = {
  USD: 0.055,  // US Dollar
  EUR: 0.051,  // Euro
  GBP: 0.043,  // British Pound
  AUD: 0.085,  // Australian Dollar
  CAD: 0.076,  // Canadian Dollar
  INR: 4.65,   // Indian Rupee
  ZAR: 1.0,    // South African Rand (base)
};

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  INR: '₹',
  ZAR: 'R',
};

// Map country codes to currencies
const COUNTRY_CURRENCY_MAP: { [key: string]: string } = {
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
  AU: 'AUD',
  CA: 'CAD',
  IN: 'INR',
  ZA: 'ZAR',
};

// Map timezone prefixes to currencies (primary detection method - no API needed)
const TIMEZONE_CURRENCY_MAP: { [key: string]: string } = {
  'Africa/Johannesburg': 'ZAR',
  'Africa/Cape_Town': 'ZAR',
  'Africa/Durban': 'ZAR',
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Phoenix': 'USD',
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'Europe/London': 'GBP',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Perth': 'AUD',
  'Asia/Kolkata': 'INR',
  'Asia/Mumbai': 'INR',
};

// Cache key and TTL for detected currency (7 days - longer to reduce API calls)
const CURRENCY_CACHE_KEY = 'detected_currency_cache';
const CURRENCY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

interface CurrencyCache {
  currency: string;
  timestamp: number;
}

// In-memory deduplication to prevent multiple concurrent API calls
let pendingDetection: Promise<string> | null = null;

/**
 * Detect currency from browser timezone (no API call needed)
 */
const detectFromTimezone = (): string | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Direct match
    if (TIMEZONE_CURRENCY_MAP[timezone]) {
      return TIMEZONE_CURRENCY_MAP[timezone];
    }
    
    // Check by region prefix
    if (timezone.startsWith('Africa/')) return 'ZAR';
    if (timezone.startsWith('America/')) {
      // Most Americas use USD, Canada uses CAD
      if (timezone.includes('Toronto') || timezone.includes('Vancouver') || timezone.includes('Montreal')) {
        return 'CAD';
      }
      return 'USD';
    }
    if (timezone.startsWith('Europe/London')) return 'GBP';
    if (timezone.startsWith('Europe/')) return 'EUR';
    if (timezone.startsWith('Australia/')) return 'AUD';
    if (timezone.startsWith('Asia/Kolkata') || timezone.startsWith('Asia/Calcutta')) return 'INR';
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Detect user's currency based on location
 * Uses caching and timezone detection to minimize API calls
 */
export const detectUserCurrency = async (): Promise<string> => {
  // Check localStorage first for user preference
  try {
    const savedCurrency = localStorage.getItem('preferred_currency');
    if (savedCurrency && EXCHANGE_RATES[savedCurrency]) {
      return savedCurrency;
    }
  } catch {
    // Ignore storage errors
  }

  // Check cached detection result
  try {
    const cached = localStorage.getItem(CURRENCY_CACHE_KEY);
    if (cached) {
      const { currency, timestamp }: CurrencyCache = JSON.parse(cached);
      if (Date.now() - timestamp < CURRENCY_CACHE_TTL && EXCHANGE_RATES[currency]) {
        return currency;
      }
    }
  } catch {
    // Ignore cache parsing errors
  }

  // Try timezone detection first (no API call - instant)
  const timezoneCurrency = detectFromTimezone();
  if (timezoneCurrency && EXCHANGE_RATES[timezoneCurrency]) {
    cacheCurrency(timezoneCurrency);
    return timezoneCurrency;
  }

  // Deduplicate concurrent requests - if a detection is already in progress, wait for it
  if (pendingDetection) {
    return pendingDetection;
  }

  // Start IP-based detection as fallback
  pendingDetection = (async (): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const currency = COUNTRY_CURRENCY_MAP[data.country_code] || data.currency;
        if (currency && EXCHANGE_RATES[currency]) {
          cacheCurrency(currency);
          return currency;
        }
      }
    } catch {
      // Silently fail - no console logging to avoid Lighthouse errors
    } finally {
      pendingDetection = null;
    }

    // Default to ZAR and cache it
    cacheCurrency('ZAR');
    return 'ZAR';
  })();

  return pendingDetection;
};

/**
 * Cache detected currency to prevent repeated API calls
 */
const cacheCurrency = (currency: string): void => {
  try {
    const cache: CurrencyCache = { currency, timestamp: Date.now() };
    localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Convert ZAR price to target currency
 */
export const convertPrice = (priceInZAR: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency] || 1.0;
  return priceInZAR * rate;
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || 'R';
  return `${symbol}${price.toFixed(2)}`;
};

/**
 * Get currency display info
 */
export const getCurrencyInfo = (currency: string) => ({
  code: currency,
  symbol: CURRENCY_SYMBOLS[currency] || 'R',
  rate: EXCHANGE_RATES[currency] || 1.0,
});

/**
 * Set user's preferred currency
 */
export const setPreferredCurrency = (currency: string) => {
  try {
    if (EXCHANGE_RATES[currency]) {
      localStorage.setItem('preferred_currency', currency);
    }
  } catch {
    // Ignore storage errors
  }
};
