# ANEVUM.WEB.BUILD.2026-10-19.002 — Creator Package V004 / Storage Guardian

**Implementation status:** Isolated development in draft PR #562, stacked on V091. **NOT merged, migrated, switched on, deployed or verified with real member sessions.** Exact V003 package Worker source was preserved before V004 development; the currently deployed V003 service is unchanged.

## Creator experience
1. User chooses a .zip or self-contained .html build (maximum 20 MiB compressed) and a project from their creator space.
2. The phone-first private Build Lab identifies the file locally, calculates SHA-256 and invokes a metadata-only preflight: if the current private or public release has the exact verified archive hash and size, it opens the existing build without writing another byte.
3. If different, the existing project keeps its stable ID. The Worker validates the archive, reserves quota atomically, stores immutable release-scoped source and unpacked assets in private R2, then swaps the current **private draft pointer only** after successfully writing all files. Previously approved public releases do not change until staff approves an update.
4. Newly uploaded private test builds last **48 hours**. A creator may **Save draft**, **Replace test build**, **Discard build**, or **Submit for review**. Saved private drafts are durable while account policy and quotas permit. A failed update must never erase the previous good preview.
5. After discard or expiry, D1 marks the release revoked and adds a cleanup job; a bounded scheduled Worker removes the private R2 prefix and then its associated D1 file records. Cleanup errors are retried. Creator and staff meters distinguish storage used from bytes awaiting physical erasure.

## Costs, rates, and limits
- 20 MiB compressed ZIP, 48 MiB expanded, 180 entries, 12 MiB single extracted file. ZIP path, CRC, manifest and content checks derive from deployed V003 parser. Multipart hard-capped at 22 MiB **even if the client omits Content-Length**.
- Creator quota: 100 MiB compressed and 200 MiB estimated physical (original archive + unpacked assets). Shared pilot physical cap: 512 MiB. Both include reserved uploads and pending cleanup. Quota is evaluated in a single D1 insert statement to avoid concurrent overspending.
- One active upload lease per member, 20-minute crash expiry; maximum 10 attempts/hour, 30/day and 300 MiB/day. These are safety limits for alpha, not public paid-tier entitlements. Cloudflare edge request/WAF/abuse protections remain separate.
- Private tests: expire 48 hours after upload. Rejected build objects: eligible for erasure after seven days. Retired private metadata: bounded pruning after 30 days and only after R2 erasure. **All published releases and their immutable payloads remain protected** for public availability and rollback.
- For staging/production, bind per-member edge limiters PACKAGE_PREFLIGHT_RATE (suggested 12 requests per 60 seconds per colo) and PACKAGE_UPLOAD_RATE (suggested 6 requests per 60 seconds per colo), plus origin-level Cloudflare WAF protections. Edge rate-limiting bindings are not globally exact; only D1 imposes the exact member upload budget. Without edge limiters the isolated code still runs, but the public launch gate is incomplete.
- No archive/blob content is stored in D1. Object keys use per-owner/per-project/per-release prefixes under a private R2 bucket. All account and reviewer permissions remain on the trusted Worker origin; creator code runs only in the isolated registrable runtime origin.

## Added routes
- POST /api/v1/packages/preflight — bounded JSON and verified duplicate look-up for the authenticated project owner.
- POST /api/v1/packages/upload — bounded multipart, project/version ownership and atomic resource reservation.
- POST /api/v1/packages/projects/:id/save — protect a ready private draft from expiry.
- POST /api/v1/packages/projects/:id/discard — remove only a ready private build, queue physical erasure.
- GET /api/v1/packages/usage — owner storage and vault meter.
- GET /api/v1/packages/staff/metrics — staff-only aggregate counts, pending cleanup and resource usage.
- Existing submit/review/public player routes retained; no public executable release bypasses review.

## New D1 tables (additive staging migration)
- upload_leases: bounded per-owner single-upload concurrency
- upload_reservations: atomic physical capacity and abandoned-upload receipts
- daily_limits: per-owner daily attempts/ingress
- build_retention: temporary 48-hour tests or saved private draft
- cleanup_jobs: retries with per-release R2 erasure receipts

Migration: creator-v1/package-alpha-v004/migrations/0002_resource_protection.sql

## Release gates
1. Pass all isolated Node22 policy tests, Python SQLite/D1 simulated transaction integration tests, fake R2 cleanup/race scenarios and visual mobile/desktop captures from the dedicated read-only GitHub workflow.
2. Take a tested **backup and restore of staging D1**. Apply V004 additive migration to a dedicated *staging* package database after verifying V003 tables. Use **new** private staging R2 and verified isolated runner origin. Do not apply a migration to the live V003 D1/bucket.
3. Deploy an independent **V004 staging Worker** with AUTH, DB, MEDIA, RUNTIME_HOST, PACKAGE_PREVIEW_KEY, PILOT_IDS, STAFF_IDS and the explicit **PACKAGE_UPLOADS_ENABLED="true"** upload-admission flag (defaults to off). Bind an hourly scheduled trigger for garbage collection. Do not change existing routes until explicit acceptance.
4. Test with two independent authenticated members and reviewer, then rehearse expiry, duplicate, concurrent uploads, owner save/discard, rejection, R2 outages, completed R2 object inventory and publicly available immutable release rollback.
5. Check actual worker CPU, D1 read/write counts, R2 list/delete, retained bytes, budget thresholds and representative iOS Safari + desktop browser journeys. Require the existing V091 release gates and exact-source QA before production cutover.
6. Keep old V003 Worker and route as reversible fallback. Feature shutdown uses PACKAGE_UPLOADS_ENABLED="false" to stop new upload admission while retaining member access to existing project details, Save, Discard, Delete and staff review; do not destroy public releases or prevent queued private cleanup.

## Staff Observatory
Exposed aggregate metrics: physical bytes by account/shared pilot, number of temporary tests, expired tests, queued garbage collections, interrupted reservations, erasure errors. Later polish can surface small, accessible charts in the existing staff Observatory without creating a second dashboard or exposing private filenames/contents.

## Known next gates
- CI/test failures must be fixed and documented.
- This code does **not** authorize public self-service creator uploading, malware-scanned release certification, arbitrary network access in creator apps, or production database changes.
- R2 prefix cleanup must be proven with a real dedicated test bucket before introducing a TTL lifecycle rule; do **not** apply a generic bucket-wide 48-hour object TTL that would delete published releases.
- Canonical Studio quarantine is a separate subsystem; integrating its upload UI with the playable package pipeline remains gated on unified authentication, moderation and release proof.

## Expiration and database compaction hardening (V004 follow-up)

- Server-side expiry is enforced when saving a private test, when submitting it, and whenever a creator opens its private player. Delayed cron processing cannot revive an expired temporary build.
- The creator dashboard labels expired tests explicitly and offers replacement or discard, not misleading Save/Submit controls. The stable project ID and any separately approved live version remain intact.
- The public unauthenticated health endpoint deliberately performs no D1 table checks. Authenticated storage-usage and staff-operations routes perform schema readiness checks.
- Scheduled cleanup also prunes old daily and hourly upload limits, expired upload leases, and deleted project tombstones, in bounded batches. Project rows are pruned **only after** all referenced release rows have passed retention and erasure and no upload reservation remains. Published works and current account projects are ineligible.
- These safeguards are covered by additive disposable-SQLite/fake-R2 regression tests; live staging QA and release approval remain required.
