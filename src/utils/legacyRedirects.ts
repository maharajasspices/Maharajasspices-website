/**
 * Legacy WordPress URL redirect mappings
 * Maps old WordPress URL patterns to new React routes
 */

export interface RedirectResult {
  shouldRedirect: boolean;
  newPath: string;
}

export const getLegacyRedirect = (pathname: string): RedirectResult => {
  const lowerPath = pathname.toLowerCase();
  
  // WordPress product tag pages -> Shop
  if (lowerPath.includes('/product-tag/')) {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // WordPress product brand pages -> Shop
  if (lowerPath.includes('/product-brand/')) {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // WordPress product category pages -> Shop
  if (lowerPath.includes('/product-category/')) {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // WordPress paginated shop pages -> Shop
  if (lowerPath.match(/\/shop\/page\/?\d*/)) {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // WordPress raw-spices category -> Shop with Spices category
  if (lowerPath.includes('/raw-spices/')) {
    return { shouldRedirect: true, newPath: '/shop?category=spices' };
  }
  
  // WordPress virtual-spice-bar -> Shop
  if (lowerPath.includes('/virtual-spice-bar/')) {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // WordPress fortified-spice -> Shop
  if (lowerPath.includes('/fortified-spice/')) {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // Old about-us slug -> new about
  if (lowerPath === '/about-us' || lowerPath === '/about-us/') {
    return { shouldRedirect: true, newPath: '/about' };
  }
  
  // Old deals page -> Shop
  if (lowerPath.includes('/deals-of-the-day')) {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // Old shop-carousel -> Shop
  if (lowerPath === '/shop-carousel' || lowerPath === '/shop-carousel/') {
    return { shouldRedirect: true, newPath: '/shop' };
  }
  
  // WordPress single product pages -> Shop (can't map individual products easily)
  // Pattern: /product/product-slug (text-based slugs only)
  // IMPORTANT: Do NOT redirect UUID-based product IDs (used by React app)
  // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const productMatch = lowerPath.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    const productId = productMatch[1];
    // Check if it's a valid UUID (React app format) - don't redirect these
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(productId)) {
      // It's a WordPress text slug, redirect to shop
      return { shouldRedirect: true, newPath: '/shop' };
    }
  }
  
  return { shouldRedirect: false, newPath: '' };
};
