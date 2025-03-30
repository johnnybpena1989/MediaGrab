import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * ScrollToTop is a component that scrolls the window to the top
 * when the route changes. This ensures that when a user navigates
 * to a new page, they start at the top of that page.
 */
export default function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Scroll to the top of the page when location changes
    window.scrollTo(0, 0);
  }, [location]);
  
  // This component doesn't render anything
  return null;
}