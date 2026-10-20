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
  
  
  // Product URLs are handled by the React app.
  // Support both existing UUID URLs and new SEO-friendly product slugs.
  // Do not redirect /product/:id to /shop.

  return { shouldRedirect: false, newPath: '' };
};
