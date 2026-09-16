import { analyticsConfigured } from "./analytics";
import { CANON_PROJECTION_SYNC } from "./canonProjection";
import { legalPublicConfigured } from "./legalConfig";
import { replyLaunchConfigured } from "./launchConfig";
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
      state: replyLaunchConfigured.purchase ? "ready" : "pending",
      critical: true,
      detail: replyLaunchConfigured.purchase
        ? (replyLaunchConfigured.editionSpecific ? "Edition-specific purchase destinations are configured." : "A general live purchase destination is configured without inventing edition-specific links.")
        : "Pre-release mode is active; no purchase destination is configured yet.",
      actionHref: "https://anevum.com/store",
      actionLabel: "OPEN STORE",
    },
    {
      id: "official-cover",
      label: "Official REPLY cover",
      state: replyLaunchConfigured.cover ? "ready" : "pending",
      critical: true,
      detail: replyLaunchConfigured.cover ? "The production book surface is using a configured cover asset." : "The book surface is still using its neutral fallback presentation instead of the final cover.",
      actionHref: "https://anevum.com/the-book",
      actionLabel: "OPEN BOOK",
    },
    {
      id: "public-legal-contact",
      label: "Public legal/contact configuration",
      state: legalPublicConfigured.launch ? "ready" : "pending",
      critical: true,
      detail: legalPublicConfigured.launch
        ? "Public entity, support/privacy contacts, mailing address and account-request channel are configured."
        : "Legal pages are built, but one or more owner-approved public entity/contact/address/request values are still missing.",
      actionHref: "https://anevum.com/contact",
      actionLabel: "OPEN CONTACT",
    },
    {
      id: "ownership-verification",
      label: "Verified ownership XP",
      state: "pending",
      critical: true,
      detail: "No authenticated server-side purchase/code verifier is implemented yet. Purchase XP remains unavailable rather than allowing self-claimed ownership.",
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
      state: replyLaunchConfigured.releaseLabel ? "ready" : "optional",
      critical: false,
      detail: replyLaunchConfigured.releaseLabel ? "A public release label is configured." : "No release date/label is being published; the site correctly stays in generic pre-release mode.",
    },
    {
      id: "sample",
      label: "Book sample",
      state: replyLaunchConfigured.sample ? "ready" : "optional",
      critical: false,
      detail: replyLaunchConfigured.sample ? "A public sample/excerpt destination is configured." : "No sample is configured yet; this does not block purchase readiness.",
    },
    {
      id: "hero-art",
      label: "Book hero art",
      state: replyLaunchConfigured.hero ? "ready" : "optional",
      critical: false,
      detail: replyLaunchConfigured.hero ? "A production hero image is configured." : "The book surface is using the neutral atmospheric fallback; no unapproved lore art is being substituted.",
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
