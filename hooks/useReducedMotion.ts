'use client';

import { useState, useEffect } from 'react';

/**
 * Returns `true` when the user has requested reduced motion via the OS/browser
 * `prefers-reduced-motion: reduce` media query.
 *
 * - Safe for SSR: returns `false` on the server (no window).
 * - Reactively updates if the user changes the preference at runtime.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
