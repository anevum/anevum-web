# Creator-defined achievements: private definition foundation

Session: `ANEVUM.WEB.BUILD.2026-10-23.001.CREATOR-ACHIEVEMENT-BRIDGE`
Status: **SOURCE ONLY / UNMOUNTED / NO MIGRATION / NO LIVE ISSUANCE**.
Base: Studio #658, `da4bedf06fc6835c7024e1d865dfa818889692c7`.
Owners: #337 recognition, #325 engineering, #658 Studio. Preserve NEXT #679 and accepted V131 #655.

## Implemented source

- A React achievement builder with three starting points: completion, secret discovery, and cumulative useful activity. Stable keys, event keys, bounded totals, secret/visible definitions, six vector project-emblem motifs and optional planned reward labels.
- A clearly labeled, local-only profile/milestone preview. It never reports a game event, persists a grant, creates a public profile entry, delivers an in-app unlock or adds XP.
- A same-origin client and private service for create/list/read/edit/archive/restore/revision history. Current canonical session identity must be supplied by the existing authenticated Worker, never request JSON.
- Additive, unapplied migration 0015: private definitions, bounded revision snapshots and per-account edit counters. Existing XP, recognition, project release and production tables are untouched.
- Stable keys and original create receipts remain immutable. Identical creation retries deduplicate even after edits. A changed payload cannot reuse a creation request ID. Conflicting revision writes return 409. Project review locks and active/retained limits are repeated inside SQL writes, not just in preflight checks.
- Fifty active and one hundred total retained definitions per project; forty write attempts per account per hour; twelve revision snapshots per definition. These are pilot guardrails, not approved commercial tiers.

## What is not connected

The new React route components and service are **not imported by App.tsx or canonical-auth/worker.mjs yet**. Existing routes and production behavior are unchanged. Frontend flag `VITE_CREATOR_ACHIEVEMENTS_V114` and server flag `CANONICAL_CREATOR_ACHIEVEMENTS_V114` are both explicit-true gates in the new components/service, but no environment flags have been set. Migration 0015 has not been applied anywhere except disposable local SQLite fixtures. Migration 0014 remains untouched.

This is not a working public Creator Studio feature yet. The source does not expose a developer SDK, account linking, publisher credentials, a gameplay event endpoint, achievement publication, player issuance, notifications or real profile award rendering. The reward label is descriptive authoring metadata, not an entitlement.

## Integration contract for the next source slice

1. Reconcile #658's current head before changing shared files. Mount the lazy React page at `/studio/:projectId/achievements` and its entry link in the existing private project editor, behind the explicit frontend flag. Keep one Shell, one canonical mark and one IREN. Preserve the keyed account/project remount in StudioAchievementsV114.
2. Import `STUDIO_ACHIEVEMENT_PATH` and `studioAchievements` into the existing canonical Worker. Include the route in its deny-by-default route check, supported-method gate and canonical-session dispatch. Return 404 before auth work unless both Studio and achievement flags are enabled. Preserve host/config/schema checks, foreign-cookie removal, CSRF protection and safeResponse headers. Do not add an anonymous fallback or trust a user ID in JSON.
3. Test the actual Worker using real existing canonical fixture helpers: guest, verified owner, other member, unverified member, disallowed host, cross-origin, expired/revoked session, disabled flags and missing schema. Standalone module tests are not authentication integration proof.
4. Run exact repository TypeScript and default/flagged builds. Inspect compiled desktop 1440px and mobile 390/320px. Complete real browser save/reload, conflict recovery, archive/restore, keyboard, reduced-motion and account-switch acceptance. Confirm default builds do not expose the feature.
5. Before any deployment or database change, perform independent canonical MEMBER_DB backup/restore rehearsal and separate migration/release review. No approved published-project identity is inferred from a private Studio UUID.

## End-to-end member award contract (not implemented)

Creator defines and reviews an achievement -> approved, versioned project release -> linked member uses the game/app -> authenticated, scoped issuer reports the milestone -> server verifies the appropriate evidence class and deduplicates -> immutable member grant -> notification and member-controlled profile showcase.

Creator-reported project marks must remain distinct from ANEVUM-verified honors. Browser JavaScript, iframe messages and a publisher's signature do not independently prove gameplay. No creator-controlled minting of ANEVUM XP, currency, staff privileges or institutional medals. Secrets must never be embedded in a client game ZIP. Any future platform XP requires separately approved evidence, rate policy, reversal and balance tests under #337.

Published definitions require an immutable version registry and a mapping from private Studio project to approved public release. Do not issue player grants against these mutable draft rows. Keep provenance, moderation/revocation, privacy controls, audit/export/deletion and preservation after project archival in the next design. A creator-issued badge should read as earned in a named project, not as an Institute certification.

## Verification in this session

- Node 22.16.0 + real in-memory SQLite: **30/30 standalone model/service tests PASS**. Synthetic parent identity/project rows are explicit; these are not live accounts or Cloudflare D1 acceptance.
- TypeScript 5.8.3 transpilation/parser checks passed for the new TS/TSX sources. This is **not** a full repository typecheck or a production Vite build.
- Browser attempt blocked before page load with `ERR_BLOCKED_BY_ADMINISTRATOR`. No screenshots or passed browser tests are claimed. The attempted local compatibility harness used an explicitly labeled old React 16 runtime, not the repository runtime; it is not release evidence.
- No code merge, production deployment, schema change, account award, notification, provider call, XP change or paid operation was performed.

Run standalone tests from the repository root:

```sh
node --test creator-v1/test/creator-achievements-v114.test.mjs
```

The dedicated CI workflow adds exact-source repository typechecking and a normal build; it is intentionally test-only and has no deployment, database or secret access.
