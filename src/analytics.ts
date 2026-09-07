type EventProperties = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: EventProperties) => void;
    };
  }
}

export function capture(event: string, properties?: EventProperties) {
  if (typeof window === "undefined") return;
  window.posthog?.capture(event, properties);
}
