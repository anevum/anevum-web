# ANEVUM — Continuance Institute entity system v1

Session: `ANEVUM.ANEVUM.BUILD.2026-10-16.001.INSTITUTE-ENTITY-LAB`
Date: 2026-10-16
Status: **isolated front-end laboratory, NOT DEPLOYED**

## Scope and identity

The Institute gives automated platform functions distinct official identities, not autonomous human-level authority. All identities must be labeled **Official automated entity** and all demo content must be explicitly marked **synthetic**. Their names are working names: **Observation Node 001 / Vesper** (discovery and recognition) and **Regulation Node 002 / Sable** (triage and moderation communication). Neither is a locked public brand name.

### Observation Node 001

- Identity: aperture, ivory/steel gyroscopic geometry, recording axis. Assets: `observation-node-001.svg`, `observation-node-001.html`.
- State machine: `idle | observe | ceremony`. Use real server event state when connected; demo controls are visual only.
- Workflow: eligible submission -> policy/safety gate -> traceable candidate -> human editorial approval -> idempotent recognition event -> post/award/notification/archive projection.
- No fabricated daily awards when activity is low, no paid boosts, no synthetic likes, and no public record without a source submission and real reviewer provenance.

### Regulation Node 002

- Identity: fractured obsidian monolith with bright, narrow crimson core and slow observation ring. Assets: `regulation-node-002.svg`, `regulation-node-002.html`.
- State machine: `idle | triage | escalation`. Brighter states indicate a *workflow event*, not guilt, danger certainty, or emotion.
- Workflow: report or bounded automated signal -> cautious priority suggestion -> staff-only review queue -> authorized human HIDE/DISMISS with reason -> audit -> permitted notices. The bot never removes posts or reads private staff data using its public identity.
- In the existing repo, `src/commons/CommonsModeration.tsx` calls `/api/member/commons/moderation/reports` and `/reports/:id/resolve`. The server's `src/server/commons-moderation.mjs` verifies BOTH a Better Auth member account and an independently verified matching Cloudflare Access staff identity, and records report-specific audit rows. Keep this security boundary intact.
- Never expose reporter identity, private evidence, content requiring redaction, internal signals/weights, or private moderator dialogue on the public entity profile.

## Architectural boundaries

The existing website backend should own memberships, submissions, reports, posts, award issuance, notifications, and audit records. An optional low-cost Railway scheduled job may later produce *nominations* with a narrowly scoped service credential, but it must not have permission to perform final moderation decisions or issue rewards directly. Start with zero additional always-on Railway compute. Do not create a service until necessary.

Only server-side, authorized writers may emit permanent activity. Untrusted browsers cannot change `state` to mint an award or claim a review resolution. Any future service-to-service webhook must be authenticated, replay resistant, versioned, idempotent and independently rate-limited. Fail closed if permissions or audit storage are unavailable. Logs should avoid raw private report content.

### Proposed event shape (not a deployed API)

```json
{
  "schemaVersion": "anevum.institute.event.v1",
  "eventId": "uuid",
  "kind": "recognition.created | moderation.notice.created",
  "entityId": "observation-node-001 | regulation-node-002",
  "targetId": "verified internal record id",
  "recordedAt": "ISO timestamp",
  "actorAuthority": "server-verified authority",
  "provenanceId": "immutable event / audit id"
}
```

Public projections omit actor credentials, unverified records and sensitive staff fields. The actual event types and schema must be finalized against the production services before wiring.

## Included preview routes

- `/institute/lab/index.html` — static hub; noindex
- `/institute/lab/observation-node-001.html` — inherited observation specimen; noindex
- `/institute/lab/regulation-node-002.html` — regulation specimen and *synthetic* triage; noindex
- `/institute/lab/observation-node-001.svg` and `/institute/lab/regulation-node-002.svg` — SVG animated assets; reduced-motion support

Each HTML is self-contained, contains no API request code, and cannot submit moderation decisions, mint awards, publish posts or create accounts. Do not reuse the demonstration copy as real community content. Publication of the preview itself is a separate decision from production backend integration.

## Definition of done before real bot deployment

1. Confirm names and appearance across site themes and mobile sizes.
2. Provide a verified-system-account profile type, including automated status and provenance.
3. Connect a genuine activity read model with no invented statistics.
4. Define reviewed recognition issuance; ensure uniqueness, corrections and revocation handling.
5. Give moderation only a scoped read/triage interface that **cannot** call the resolution endpoint, and preserve the staff-only audit-backed decision workflow.
6. Test accessible contrast, 32–800 px rendering, reduced motion and battery usage.
7. Add automated abuse, replay and authorization tests, and test production-like environment migrations.
8. Gate backend deployment, notifications and Railway costs behind separate approval.

## Test coverage for this prototype

A static source contract test verifies that preview pages and SVGs exist, scripts do not invoke network APIs, and the mock review cannot disguise itself as live enforcement. XML validity and JavaScript syntax were checked locally. Runtime browser automation was attempted but blocked by the container's browser navigation policy, so cross-browser interaction remains unverified here.