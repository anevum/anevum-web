import { analyticsConfigured } from "./analytics";
import { CANON_PROJECTION_SYNC } from "./canonProjection";
import { memberBackend } from "./memberClient";

export type LaunchReadinessState = "ready" | "pending" | "optional" | "stale";

export type LaunchReadinessItem = {
  id: string;
  label: string;
  state: LaunchReadinessState;
  critical: boolean;
  detail: string;
  actionHref?: string;
  actionLabel?: string;
};

function configured(value: unknown) {
  return Boolean(String(value || "").trim());
}

const buyUrl = String(import.meta.env.VITE_REPLY_BUY_URL || "").trim();
const hardcoverUrl = String(import.meta.env.VITE_REPLY_HARDCOVER_URL || "").trim();
const paperbackUrl = String(import.meta.env.VITE_REPLY_PAPERBACK_URL || "").trim();
const ebookUrl = String(import.meta.env.VITE_REPLY_EBOOK_URL || "").trim();
const releaseLabel = String(import.meta.env.VITE_REPLY_RELEASE_LABEL || "").trim();
const coverUrl = String(import.meta.env.VITE_REPLY_COVER_URL || "").trim();
const sampleUrl = String(import.meta.env.VITE_REPLY_SAMPLE_URL || "").trim();
const heroImageUrl = String(import.meta.env.VITE_REPLY_HERO_IMAGE_URL || "").trim();

export const replyEditionLinksConfigured = [buyUrl, hardcoverUrl, paperbackUrl, ebookUrl].some(configured);
export const replyReleaseLabelConfigured = configured(releaseLabel);
export const replyCoverConfigured = configured(coverUrl);
export const replySampleConfigured = configured(sampleUrl);
export const replyHeroConfigured = configured(heroImageUrl);

function projectionAgeDays() {
  const timestamp = Date.parse(`${CANON_PROJECTION_SYNC.syncedAt}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

export function getLaunchReadiness(): LaunchReadinessItem[] {
  const ageDays = projectionAgeDays();
  const canonFresh = CANON_PROJECTION_SYNC.queueCount > 0 && ageDays <= 1;

  return [
    {
      id: "canon-projection",
      label: "Canon projection",
      state: canonFresh ? "ready" : "stale",
      critical: true,
      detail: canonFresh
        ? `${CANON_PROJECTION_SYNC.queueCount} released records · synced ${CANON_PROJECTION_SYNC.syncedAt}`
        : `Last validated projection is ${ageDays === Number.POSITIVE_INFINITY ? "undated" : `${ageDays} days old`}.`,
      actionHref: "https://wiki.anevum.com/",
      actionLabel: "OPEN WIKI",
    },
    {
      id: "rhenlink",
      label: "RHENLINK identity",
      state: memberBackend.configured ? "ready" : "pending",
      critical: true,
      detail: memberBackend.configured ? "Member authentication and persistent metadata are configured." : "Member backend configuration is incomplete.",
      actionHref: "https://anevum.com/rhenlink",
      actionLabel: "OPEN RHENLINK",
    },
    {
      id: "purchase-links",
      label: "REPLY purchase links",
      state: replyEditionLinksConfigured ? "ready" : "pending",
      critical: true,
      detail: replyEditionLinksConfigured ? "At least one live edition/purchase destination is configured." : "Pre-release mode is active; no edition destination is configured yet.",
      actionHref: "https://anevum.com/store",
      actionLabel: "OPEN STORE",
    },
    {
      id: "official-cover",
      label: "Official REPLY cover",
      state: replyCoverConfigured ? "ready" : "pending",
      critical: true,
      detail: replyCoverConfigured ? "The production book surface is using a configured cover asset." : "The book surface is still using its neutral fallback presentation instead of the final cover.",
      actionHref: "https://anevum.com/the-book",
      actionLabel: "OPEN BOOK",
    },
    {
      id: "analytics",
      label: "Launch analytics",
      state: analyticsConfigured ? "ready" : "pending",
      critical: true,
      detail: analyticsConfigured ? "Privacy-light funnel analytics are configured for production." : "Instrumentation is built but inert until a production PostHog browser project token is configured.",
    },
    {
      id: "release-label",
      label: "Release messaging",
      state: replyReleaseLabelConfigured ? "ready" : "optional",
      critical: false,
      detail: replyReleaseLabelConfigured ? "A public release label is configured." : "No release date/label is being published; the site correctly stays in generic pre-release mode.",
    },
    {
      id: "sample",
      label: "Book sample",
      state: replySampleConfigured ? "ready" : "optional",
      critical: false,
      detail: replySampleConfigured ? "A public sample/excerpt destination is configured." : "No sample is configured yet; this does not block purchase readiness.",
    },
    {
      id: "hero-art",
      label: "Book hero art",
      state: replyHeroConfigured ? "ready" : "optional",
      critical: false,
      detail: replyHeroConfigured ? "A production hero image is configured." : "The book surface is using the neutral atmospheric fallback; no unapproved lore art is being substituted.",
    },
  ];
}

export function launchReadinessSummary(items = getLaunchReadiness()) {
  const critical = items.filter((item) => item.critical);
  const ready = critical.filter((item) => item.state === "ready").length;
  return {
    criticalReady: ready,
    criticalTotal: critical.length,
    blocking: critical.filter((item) => item.state !== "ready"),
    complete: ready === critical.length,
  };
}
