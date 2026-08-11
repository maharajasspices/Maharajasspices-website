import { useState, useEffect } from 'react';
import { detectUserCurrency, convertPrice, formatPrice, getCurrencyInfo } from '@/utils/currency';

/**
 * Hook for currency conversion and formatting
 * Automatically detects user's currency and converts prices
 */
export const useCurrency = () => {
  const [currency, setCurrency] = useState<string>('ZAR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initCurrency = async () => {
      try {
        const detectedCurrency = await detectUserCurrency();
        setCurrency(detectedCurrency);
      } catch (error) {
        console.error('Failed to detect currency:', error);
        setCurrency('ZAR'); // Fallback to ZAR
      } finally {
        setLoading(false);
      }
    };

    initCurrency();
  }, []);

  const convert = (priceInZAR: number): number => {
    return convertPrice(priceInZAR, currency);
  };

  const format = (priceInZAR: number): string => {
    const convertedPrice = convert(priceInZAR);
    return formatPrice(convertedPrice, currency);
  };

  const currencyInfo = getCurrencyInfo(currency);

  return {
    currency,
    loading,
    convert,
    format,
    currencyInfo,
    setCurrency,
  };
};
