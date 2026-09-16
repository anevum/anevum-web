export type AnalyticsSurface = "reply" | "book" | "story" | "store" | "rhenlink" | "wiki" | "lattice" | "legal";
export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type PostHogClient = typeof import("posthog-js")["default"];

const projectToken = String(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || "").trim();
const apiHost = String(import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const productionHosts = new Set(["anevum.com", "www.anevum.com", "wiki.anevum.com", "lattice.anevum.com"]);

let clientPromise: Promise<PostHogClient | null> | null = null;

export const analyticsConfigured = Boolean(projectToken);

function analyticsAllowed() {
  if (!analyticsConfigured || typeof window === "undefined" || !import.meta.env.PROD) return false;
  return productionHosts.has(window.location.hostname.toLowerCase());
}

function loadAnalyticsClient() {
  if (!analyticsAllowed()) return Promise.resolve<PostHogClient | null>(null);
  if (!clientPromise) {
    clientPromise = import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(projectToken, {
          api_host: apiHost,
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
          advanced_disable_flags: true,
          person_profiles: "identified_only",
          persistence: "sessionStorage",
          respect_dnt: true,
        });
        return posthog;
      })
      .catch(() => null);
  }
  return clientPromise;
}

export function initAnalytics() {
  if (!analyticsAllowed()) return false;
  void loadAnalyticsClient();
  return true;
}

function baseProperties(surface?: AnalyticsSurface): AnalyticsProperties {
  return {
    environment: "production",
    anevum_surface: surface,
    pathname: typeof window !== "undefined" ? window.location.pathname : undefined,
    hostname: typeof window !== "undefined" ? window.location.hostname.toLowerCase() : undefined,
  };
}

export function capture(event: string, properties: AnalyticsProperties = {}, surface?: AnalyticsSurface) {
  if (!analyticsAllowed()) return false;
  const payload = { ...baseProperties(surface), ...properties };
  void loadAnalyticsClient().then((client) => client?.capture(event, payload));
  return true;
}

export function capturePageView(surface: AnalyticsSurface, pathname: string) {
  if (!analyticsAllowed()) return false;
  const canonicalUrl = typeof window !== "undefined" ? `${window.location.origin}${pathname}` : pathname;
  const payload = {
    ...baseProperties(surface),
    $current_url: canonicalUrl,
    $pathname: pathname,
  };
  void loadAnalyticsClient().then((client) => client?.capture("$pageview", payload));
  return true;
}

export function capturePurchaseOutbound(input: { edition: string; destination: string; source: string }) {
  return capture("reply purchase outbound clicked", {
    edition: input.edition,
    destination: input.destination,
    source: input.source,
  }, "store");
}
