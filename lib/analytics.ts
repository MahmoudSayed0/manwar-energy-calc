declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  window.plausible(name, props ? { props } : undefined);
}

export {};
