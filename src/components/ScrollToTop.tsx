import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_KEY = 'tb_scroll_pos';

function readPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}');
  } catch {
    return {};
  }
}

function writePosition(historyKey: string, y: number) {
  try {
    const positions = readPositions();
    positions[historyKey] = y;
    // Cap at 30 entries to avoid sessionStorage bloat
    const entries = Object.entries(positions);
    const trimmed =
      entries.length > 30
        ? Object.fromEntries(entries.slice(-30))
        : positions;
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage unavailable — graceful no-op
  }
}

/**
 * Scroll manager — must be rendered inside <BrowserRouter>.
 *
 * Behaviour:
 *  - PUSH / REPLACE navigation (clicking a link)  → scroll to top instantly.
 *  - POP navigation (back / forward button)        → restore the exact scroll
 *    position the user was at when they left that page.
 *
 * Positions are stored in sessionStorage keyed by React Router's location.key,
 * which is stable and unique per history entry.
 */
export default function ScrollToTop() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();

  // Always tracks the currently active history key so the scroll listener
  // can save to the right entry even while the route transition is in flight.
  const activeKeyRef = useRef<string>(key);

  // Continuously save scroll position for the active page.
  useEffect(() => {
    const onScroll = () => {
      writePosition(activeKeyRef.current, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On route change: restore or reset scroll position.
  useEffect(() => {
    if (navigationType === 'POP') {
      // Back / forward — restore where the user was on this history entry.
      const saved = readPositions()[key];
      // Double-RAF: waits for the new route's DOM to paint before scrolling,
      // which prevents the position being clobbered by layout recalculations.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved ?? 0, left: 0, behavior: 'instant' });
        });
      });
    } else {
      // Push / Replace — new page, always start at the top.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Update activeKey AFTER the above so any late-firing scroll events
    // from the previous page still get attributed to the correct key.
    activeKeyRef.current = key;
  }, [pathname, key, navigationType]);

  return null;
}
