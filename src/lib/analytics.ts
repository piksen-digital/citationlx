// Lightweight GA4 event helper. gtag.js is loaded in the root route shell.
// Falls back to pushing onto dataLayer if gtag is not available yet.
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  };
  if (typeof w.gtag === "function") {
    w.gtag("event", event, params);
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event, ...params });
  }
}
