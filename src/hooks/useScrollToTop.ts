import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use requestAnimationFrame to batch with browser's paint cycle and avoid forced reflow
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 });
    });
  }, [pathname]);
};

export default useScrollToTop;