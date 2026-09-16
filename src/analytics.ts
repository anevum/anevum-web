import posthog from "posthog-js";

export type AnalyticsSurface = "reply" | "book" | "story" | "store" | "rhenlink" | "wiki" | "lattice";
export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const projectToken = String(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || "").trim();
const apiHost = String(import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const productionHosts = new Set(["anevum.com", "www.anevum.com", "wiki.anevum.com", "lattice.anevum.com"]);

let initialized = false;

export const analyticsConfigured = Boolean(projectToken);

export function initAnalytics() {
  if (initialized) return true;
  if (!analyticsConfigured || typeof window === "undefined" || !import.meta.env.PROD) return false;
  if (!productionHosts.has(window.location.hostname.toLowerCase())) return false;

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
  initialized = true;
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
  if (!initAnalytics()) return false;
  posthog.capture(event, { ...baseProperties(surface), ...properties });
  return true;
}

export function capturePageView(surface: AnalyticsSurface, pathname: string) {
  if (!initAnalytics()) return false;
  const canonicalUrl = typeof window !== "undefined" ? `${window.location.origin}${pathname}` : pathname;
  posthog.capture("$pageview", {
    ...baseProperties(surface),
    $current_url: canonicalUrl,
    $pathname: pathname,
  });
  return true;
}

export function capturePurchaseOutbound(input: { edition: string; destination: string; source: string }) {
  return capture("reply purchase outbound clicked", {
    edition: input.edition,
    destination: input.destination,
    source: input.source,
  }, "store");
}
