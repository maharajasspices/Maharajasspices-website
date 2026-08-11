import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLegacyRedirect } from '@/utils/legacyRedirects';

/**
 * Handles redirects from old WordPress URLs to new React routes
 * Place this component inside BrowserRouter but outside Routes
 */
const LegacyRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { shouldRedirect, newPath } = getLegacyRedirect(location.pathname);
    
    if (shouldRedirect) {
      // Use replace to avoid polluting browser history with old URLs
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default LegacyRedirectHandler;
