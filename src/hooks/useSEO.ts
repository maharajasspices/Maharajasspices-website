import { useEffect } from 'react';
import { updateMetaTags, SEOMetadata } from '@/utils/seo';

/**
 * Custom hook for managing SEO metadata
 * Automatically updates meta tags when metadata changes
 */
export const useSEO = (metadata: SEOMetadata) => {
  useEffect(() => {
    updateMetaTags(metadata);
  }, [metadata]);
};

export default useSEO;
