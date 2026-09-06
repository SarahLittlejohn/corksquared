import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveals an element once it scrolls into view. The observer is disconnected on
 * the first intersection, so scrolling back up does not replay the animation.
 *
 * When the visitor prefers reduced motion the element starts visible and no
 * observer is created at all.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    const element = ref.current;
    if (!element || isVisible) return;

    // Older Safari and any non-browser render: show the photo rather than hide it.
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}
