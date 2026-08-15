import { useEffect, useRef, useState } from "react";

/**
 * Marks media as loadable only when its container is close to the viewport.
 * This prevents a full menu grid from opening every video connection at once.
 */
export function useLazyMedia<T extends HTMLElement>(rootMargin = "240px 0px") {
  const ref = useRef<T | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, shouldLoad] as const;
}
