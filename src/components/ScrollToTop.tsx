import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Instantly scrolls the window to the top on every route change —
 * forward navigation, back button, forward button, anything.
 *
 * Uses behavior:'instant' which overrides the CSS scroll-behavior:smooth
 * so there is zero scroll animation on page transitions.
 *
 * Must be rendered inside <BrowserRouter> so useLocation() works.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
