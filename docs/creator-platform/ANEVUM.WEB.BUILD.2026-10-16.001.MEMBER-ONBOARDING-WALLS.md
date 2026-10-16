# ANEVUM.WEB.BUILD.2026-10-16.001.MEMBER-ONBOARDING-WALLS

Continues the actual V027 staging source, `46c79f7680f32a8ab3eb3f6d6db4fef1c7882479`. Keeps the current community homepage and Continuance visual language.

## Member experience

Email verification leads to a short handle/display-name claim. New members enter a real dashboard with optional portrait/banner setup, a skippable welcome, and a persistent completion checklist. `/account` and `/account/edit` resolve to canonical `/member` without requiring a different legacy session.

The dashboard has Dashboard, My wall, Edit profile, Appearance, and Awards & stats sections. Saved profiles remain private until the member explicitly publishes them. Owners can crop/resize/upload/remove a portrait and banner, edit their introduction/theme/interests, post/edit/remove wall entries, feature earned awards, and hide public statistics. Public `/@handle` walls respect profile visibility for every media and data request. Private images are never static assets or public bucket URLs.

## Data and authority

Additive migration `canonical-auth/migrations/0004_member_spaces.sql` belongs ONLY to canonical staging MEMBER_DB `e1d29049-c83b-4534-8355-dc1fa36ba6d8`. Four new tables store two bounded image BLOBs per account, wall entries, display settings and immutable milestones. No existing account/profile/session is rewritten. Retain the previous Worker version for code rollback; additive tables can remain inert after rollback.

Pictures are cropped locally and re-encoded to JPEG before upload, limited to 256 KiB each. Upload API requires a verified session and exact Origin, validates JPEG markers/dimensions and serves with no-store, nosniff, same-origin resource policy and image MIME. There are no arbitrary asset URLs, CSS, SVGs or account IDs in mutation payloads. Initial storage is deliberately bounded for the small staging cohort; move binary media to private object storage before high-volume public onboarding.

Owner wall entries are plain text, limited to 2,000 characters and 50 entries per account. Visitors cannot post to somebody else's wall in this release. All writes share the existing 20 edits/hour per-member allowance. Settings and entry edits check revisions. Public requests never return member IDs, email addresses, settings revisions or unfeatured awards; stats are omitted when hidden. A self-service export includes the owner's wall, settings and image bytes.

Two provisional server-verified canonical milestones: First Signal (first saved wall entry, 10 XP), World Shaper (saved biography plus both images, 25 XP). Each can be earned once; deleting or repeating activity cannot duplicate XP. Level = 1 + floor(sqrt(XP/25)); there is no ceiling. Members select display, never XP, levels, privileges or earned state. This does not link legacy Creator progression, game achievements, publishing privileges or RHEN.

## Verification and outstanding acceptance

Local: TypeScript, Vite production/staging builds, complete Creator V1 regression suite, genuine Better Auth OTP sessions against SQLite/D1 shim, A/B isolation, private/public media and walls, visibility revocation, owned edit/delete, stale revisions, unearned award rejection, idempotent milestones, field limits, CSRF, upload bounds and rate limits.

Browser-control skill is unavailable in this runtime; responsive browser/Safari image crop and visual acceptance cannot be claimed from local source checks. The existing owner-device profile-save 403 remains unproven: preserve V027 Origin defenses, expose safe reason-specific retry guidance, and require an actual successful owner save to close that issue. No owner handle is claimed by deployment or test fixtures.

Staging-only release target: `anevum-creator-v1-a-staging` at `a.anevum.com`. Preserve registration/provider flags, both D1 bindings, auth secrets and current sessions. Public `anevum.com` launch countdown is outside this release.
