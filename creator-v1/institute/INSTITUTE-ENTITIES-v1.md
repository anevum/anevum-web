# ANEVUM — Continuance Institute entity system v1

Session: `ANEVUM.ANEVUM.BUILD.2026-10-16.001.INSTITUTE-ENTITY-LAB`
Status: **isolated preview source, not live, not connected to accounts**

## Source of truth

The current creator-platform workstream lives under `creator-v1/`, not the retired V5 website in the repository root. This feature branch is based on `release/a-studio-v0531-first-action-20261016`. The interactive specimens are static Vite public assets at `creator-v1/web/public/institute/lab/`. These assets are intentionally absent from primary public navigation and marked `noindex`.

The Institute entities are official *automated identities*, not humans or independent enforcement authorities. Names are provisional: **Observation Node 001 / Vesper** and **Regulation Node 002 / Sable**.

## Observation Node 001 — discovery and recognition

The aperture and ivory/steel orbital body appears at three visual intensities: quiescent, discovery, and ceremony. A future real feature event must be tied to a verified submission, eligibility rules, editorial approval, an idempotent issuance identifier, and an archive record. Do not create fabricated daily winners, paid ranking advantages, bot-owned likes, synthetic statistics, or awards without server-issued provenance. Its published profile needs to make automation clear.

The React creator platform already has `creator-v1/web/src/components/AnevumNotifications.tsx` and related progression/notification contracts. Reuse that delivery surface when adding authenticated recognition events. A new UI preview does not authorize minting achievements.

## Regulation Node 002 — moderation triage and notices

The fractured obsidian entity has quiescent, triage and escalation states. Brighter art signals processing urgency, not a verdict, guilt score, or actual threat severity. Its profile must not show reporter identity, sensitive evidence, internal risk signals or private staff discussion.

The **current** creator-platform staff workflow is `creator-v1/web/src/pages/ForumReviewPage.tsx` -> `/api/v1/member/forum-review` -> `creator-v1/canonical-auth/forums.mjs`, with the read model in `creator-v1/canonical-auth/forum-review-console.mjs`. The server grants reviewer access only to a verified member whose user ID appears in `CANONICAL_FORUM_REVIEWER_IDS` or `CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS`; the forum review log records actions. Current actions include publish, reject, hide and dismiss_report, with eligibility restrictions for independently reviewed content. Do not replace this with the retired V5 moderation endpoint.

The current canonical forum API does **not** accept a free-form written justification with every action. Requiring reasons is a proposed enhancement that needs its own migration and tests, not something this prototype claims already exists. Sable must never call the review mutation API as itself or silently escalate its privileges. It may later attach bounded machine-assisted triage metadata to a staff-only queue once authorized, privacy-reviewed and independently tested.

## Future event contract — proposal only

```json
{
  "schemaVersion": "anevum.institute.event.v1",
  "eventId": "uuid",
  "kind": "recognition.created",
  "entityId": "observation-node-001",
  "targetId": "verified internal record id",
  "recordedAt": "ISO timestamp",
  "provenanceId": "immutable audit/event id"
}
```

A future moderation notice uses the same envelope with a different event kind and a restricted recipient, not a public feed event. Finalize schema with current canonical backend before using it.

Only verified backend writers may emit permanent events. Browser art mode, demo controls, fake cases and profile-follow buttons must not create real records. Future service/webhook callers need narrow credentials, replay protection, per-action authorization, rate limits, auditability, and fail-closed behavior. A Railway scheduled job is an optional future nomination source—not required for this static lab and never given final moderator/awards issuance permissions.

## Included preview files

- `creator-v1/web/public/institute/lab/index.html` — Institute hub
- `creator-v1/web/public/institute/lab/observation-node-001.html` — first interactive specimen
- `creator-v1/web/public/institute/lab/regulation-node-002.html` — synthetic moderation exercise
- `creator-v1/web/public/institute/lab/*.svg` — motion-aware artwork including a static no-motion fallback
- `creator-v1/web/public/institute/lab/*-node-00*.mjs` — same-origin interaction modules. The staging Worker sets `script-src 'self'`, so inline HTML scripts must not be used.

These files do not request live backend data or modify users, submissions, awards, or moderation. The web Worker and deployment workflow determine the final staging hostname and URL path; do not assume that a repository file is already online.

## Real integration gate

1. Approve the entity names, silhouettes and accessibility at small sizes/mobile.
2. Introduce an official-automated-profile kind with server-side provenance.
3. Reuse the canonical notification/progression pipeline; no fake stats.
4. Build reviewed recognition nominations with deterministic idempotent issuance.
5. Keep all moderation enforcement behind the existing member reviewer grants and review log.
6. Consider a written-reason/audit extension separately with migrations and tests.
7. Verify staging browser screenshots, asset paths, CSP, reduced motion and authorization.
8. Only then authorize a limited public deployment. No new Railway service or subscription cost is needed for this preview.

## Verification

Static source tests for noindex and absent network mutations passed locally; SVG/XML and inline JavaScript syntax passed. Browser navigation in the execution environment was blocked by administrator policy, so desktop/mobile visual acceptance is outstanding.