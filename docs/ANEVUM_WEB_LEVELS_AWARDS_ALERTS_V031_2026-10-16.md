# ANEVUM.WEB.BUILD.2026-10-16.003.LEVELS-AWARDS-ALERTS

Staging: https://a.anevum.com. This release builds on fefb7a55f2e56a9d33e03f54bb65a3ed2033e698. The public countdown on anevum.com stays unchanged. Authentication configuration and the parked email issue remain unchanged.

## Member experience

/thebutton is a temporary XP instrument. Each confirmed press awards 5 XP to the authenticated canonical member. Uncertain requests retry with the same request ID, so a dropped response cannot award the press twice. XP updates the member dashboard, public profile statistics when enabled, the shared level panel and the collection. Animation previews are labeled and never award XP or medals.

The established 60 artifact names now each have a distinct original SVG silhouette, consistent engraved rims, enamel and six finish chapters. Sources are in shared/level-artifacts.json and web/public/assets/levels, reproducible with ops/generate-level-icons-v031.py from the repository root. The collection lives at /levels and displays unlocked state only from server progression. Level one begins with Foundry Spark. Levels continue beyond sixty with the ANEVUM mark as their fallback emblem.

Member progression keeps the existing 25*(level-1)^2 XP thresholds. The older Creator service retains its separate 20x pacing and identity data; no balances, identities, roles or permissions are imported. Canonical First Signal (10 XP) and World Shaper (25 XP) remain one-time saved-activity awards.

The shared ANEVUM notification arrives as the orbital mark, pulses once, expands into a bar, shows an update and closes. It handles saves, service errors, XP, verified level-ups and medals. Earned recognition is durable, has an Updates history and is acknowledged only after presentation/dismissal. Notifications pause while the page is hidden; rapid XP receipts are combined and recognition takes priority over queued receipts. Reduced motion removes the pulse and expansion transition. No sound is enabled.

## Server boundaries

Migration 0005 adds three canonical MEMBER_DB tables: member_xp_events, member_reward_notifications and member_notification_receipts. Old milestones are retained and their historical popups are baselined. Existing Worker rollback remains compatible with these additive tables. Test XP stays separately attributable in the ledger and member export; no reset is performed by this release.

/api/v1/member/progression and /notifications are authenticated reads. /notifications/ack validates ownership and advances an acknowledgment watermark monotonically. /xp-test is a fixed-value POST requiring a verified session, claimed member profile, exact Origin and server flag CANONICAL_XP_TEST_ENABLED=true. The new flag is set only in the V031 staging configuration. A single SQL insert enforces a 120 accepted press/minute/member allowance and unique user/request ID. Clients cannot supply XP, a target member or a level. There is no effect on voting, moderation or financial accounts.

Notifications are derived from saved milestones and XP, deduplicated per member/award or level. Inbox reads repair missing derived notices after transient storage faults. Public profiles retain their existing opt-in and show-stats controls. All member and notification reads remain no-store.

## Verification and release

TypeScript, production/staging builds, full Creator V1 regression suite, cinematic checks and progression tests cover fixed XP, concurrent duplicate requests, atomic allowance, independent users, ownership checks, level thresholds, disabled test flag, Origin/session boundaries and all sixty unique SVGs.

CI browser acceptance runs the compiled app with genuine Better Auth, synthetic email and temporary SQLite in Chrome and WebKit. It covers signup, profile images, wall/community flows, thirteen actual button presses, persisted 100 total XP/level three, live level-up notifications, preview medals, a full automatic close cycle, history, reload, sixty loaded icons, reduced motion and 1440/390/320px layouts. No live member writes are used for acceptance.

The staging workflow verifies exact source and the active V030 Worker before applying the additive migration and publishing. It preserves secrets, bindings and routes, checks the XP flag after deployment, validates anonymous isolation, source asset parity and the unchanged apex, and rolls back the Worker on a failed live check.

## V031 release correction: independently applied D1 schema

The GitHub Actions Cloudflare token lacks D1 import and SQL query permissions, so the initial guarded releases stopped *before* replacing the Worker. An authorized Cloudflare D1 connection independently recorded the isolated staging database Time Travel bookmark, applied migration 0005 with its original constraints, and verified all three tables, existing milestone baseline, zero staging test XP and a clean foreign-key check. No production data, member identity, routing or signup permissions were changed.

The guarded workflow pins the original migration blob SHA, never retries unauthorized D1 import/query calls, and now requires the deployed Worker's existing public health response to report `progressionReady: true` only when the member schema really exists. The existing route, D1 binding, secret, active V030 Worker version, owner-account isolation, signup, Chrome+WebKit fixture and post-release parity checks remain mandatory. A failing health or smoke check triggers the existing automatic Worker rollback. This is a staging-only release accommodation, not a general policy of skipping future migrations.
