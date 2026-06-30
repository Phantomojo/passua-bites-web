import { useEffect, useCallback } from "react";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

function initGA4() {
  if (initialized || !GA_MEASUREMENT_ID) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  const el = document.createElement("script");
  el.async = true;
  el.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(el);
}

/** Fire a GA4 event. Safe to call before init — silently no-ops if GA4 not configured. */
export function trackGA4Event(name: string, params?: Record<string, unknown>) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", name, params);
}

/** Hook to initialize GA4 and get page-view tracking helper. Call once at app root. */
export function useAnalytics() {
  useEffect(() => {
    initGA4();
  }, []);

  const trackPageView = useCallback((page: string, title?: string) => {
    if (!GA_MEASUREMENT_ID || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: page,
      page_title: title,
      page_location: window.location.origin + page,
    });
  }, []);

  return { trackPageView, trackGA4Event };
}
