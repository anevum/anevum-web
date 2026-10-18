# ANEVUM Native Pack V003 -- Audited Staff Text Inspection

Session: ANEVUM.WEB.BUILD.2026-10-18.001.NATIVE-PACK-STAFF-INSPECTION

Branch: build/native-pack-staff-inspection-v003-20261017
Parent: Native Pack V002 private quarantine draft PR #497 (depends on V001 PR #486).
Status: SOURCE-ONLY REVIEW. Not merged, deployed, enabled or migrated.

## What this adds

ANEVUM's existing member/Studio review desk can optionally let an independent reviewer inspect the bounded declarative text contents of a frozen private ANEVUM package without seeing its media bytes, storage location or downloadable object URLs.

Supported synopsis types:

- .anvg: scene titles, short narrative excerpts, choice counts and image-presence indicators.
- .anva: album title, track titles, cover-presence indicator and claimed creator metadata.
- .anvs: episode titles, poster-presence indicator and claimed creator metadata.
- .anvw: image index and captions, no actual image data.
- .anvp: bounded Workbench block types and short excerpts.

The UI uses only React text rendering and a compact Continuance-styled panel. A package remains an untrusted submitted artifact, not playable media approved by moderators. Creator input is never interpolated into HTML, evaluated, embedded in an iframe, or executed as JavaScript.

## Canonical endpoint and permissions

GET /api/v1/member/studio/review/:projectUUID/native/:assetHexId/summary

The endpoint requires:

1. The existing valid canonical-origin session and verified email.
2. Independent member ID inclusion in CANONICAL_STUDIO_REVIEWER_IDS (NOT forum moderation roles).
3. Existing canonical Studio schema and private submission still in pending_review.
4. New independent flag CANONICAL_CREATOR_NATIVE_INSPECTION_ENABLED=true (absent/OFF by default).
5. A dedicated private R2 binding already present with a get capability. No object key or bucket name is serialized.
6. Additional audit-only SQL migration 0010 installed in canonical MEMBER_DB after 0008/0009. If missing, endpoint returns 503 without reading the object.
7. Snapshot asset ID/hash/type/size/name matching the current owner asset and frozen submission. Self-review, stale revisions, revoked submissions, deleted files, mismatched categories or changed hashes are denied.

The Worker reads at most 20 MiB for a verified quarantined asset, rechecks SHA-256, opens it through V001's strict data-only package parser and discards all binary media. The response contains only capped text fields and counts; it omits all object keys, asset paths, binary bytes and direct media URLs.

Before accessing R2, the Worker creates a private inspection-attempt audit row after atomically rechecking the frozen submission and enforcing a 30-attempts-per-hour reviewer limit. Corrupt/mismatched packages and failed reads still consume the quota and retain an attempt record. After an intact package has been read, and the frozen submission rechecked, the same row transitions to a successful view_text_summary action. This prevents repeated invalid reads from bypassing the cost limit. Audit rows contain only reviewer ID, submission ID, project ID, asset ID, SHA-256 and time; no creator text or media bytes are stored.

The text-only response is returned only after the existing attempt row is marked successful and the frozen review still matches. Failed inspections retain their auditable attempted action. A reviewer cannot approve, publish, release, credit XP, copy private media, or bypass the staff review system with this endpoint.

## New source files

- creator-v1/canonical-auth/native-pack-review.mjs -- guarded R2 read, hash check, text projection and atomic audit.
- creator-v1/canonical-auth/migrations/0010_native_inspection_audit.sql -- audit-only schema for staging.
- creator-v1/test/native-pack-staff-v003.test.mjs -- synthetic Better Auth/SQLite/R2 acceptance.
- .github/workflows/native-pack-staff-v003-verify.yml -- isolated verification of V003 plus V002, V001 and Studio.
- Canonical Worker route, Studio review handler, typed API and staff review UI extended.

## Safety and release boundaries

The branch does not enable either V002 native upload or V003 inspection flags. Migration is source-only and MUST NOT be applied to production D1 without a separate backup/restore, approval and staged acceptance.

Parser confirms structure and integrity, NOT malware freedom, third-party copyright, media decodability or content appropriateness. Staff sees creator-provided text that may be offensive or inaccurate. No public media releases or executable HTML5 game origin exist here.

Before staging rollout:

1. Review V001/V002 parents and pass exact-head automated checks.
2. Verify deployed Worker and isolated staging DB/bucket inventory.
3. Back up correct staging MEMBER_DB and run disposable migration/restore tests.
4. Obtain explicit rollout authorization; optionally enable independent staff inspection flag only for authorized reviewer IDs.
5. Test independent real owner, another member, moderator, guest, tampered asset, changed category, withdrawn receipt, missing store and actual mobile Safari. Record rollback evidence.
6. Preserve disabled-by-default values for public uploads, arbitrary executable runtimes, direct XP minting, billing and CDN distribution.
7. Record reviewer access costs before enabling repeated R2 reads.

This is a bounded private-review capability, not a public publishing launch.
