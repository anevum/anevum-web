# ANEVUM Creator Uplink V006 — Approved Artwork and Safe Draft Revisions

Session: `ANEVUM.WEB.UPDATE.2026-10-19.002.PUBLISHER-ARTWORK-REVISION-HYGIENE`
Parent: Creator Uplink V005, draft PR #516
Status: implemented on development branch; NOT deployed to production.
Build formats: `.zip` (finished static browser build with root `index.html`) and self-contained `.html`; externally hosted apps remain a separate link workflow.

## Completed development

- Optional authentic creator cover (PNG only) with server-side signature, chunk CRC and dimensions validation: 8-bit RGB/RGBA, noninterlaced, 640–4096 px, no more than 12 megapixels, bounded ratio, max 3 MiB. Recommended 1600×900.
- Each uploaded cover is bound to an immutable release SHA, stored privately in R2 and indexed under reserved `_anevum/cover.png`. The source ZIP may not provide this internal path. Cover bytes count against project storage quotas.
- Studio shelf, private review and the public package archive show the actual creator-uploaded cover for the corresponding release. Without one, ANEVUM retains its clearly institutional vector record plate rather than inventing screenshots or usage metrics.
- `GET /api/v1/packages/covers/:releaseId` serves private cover only to the canonical owner or authorized staff while the immutable release is ready/pending review. Anonymous playback pages can show the cover only when it belongs to the current approved live release. Rejected, revoked, suspended, deleted and replaced releases return 404. The response has strict image MIME, nosniff, no-store and restrictive CSP, without exposing the source bucket.
- The phone UI has an optional native PNG file picker, local preview, size/dimension feedback and accessible error. Picking artwork does not automatically publish it.
- An owner can now discard a `ready`, unsubmitted broken build and re-upload immediately, without needing to send a broken version to staff. A first draft leaves the active shelf; discarding a new version preserves the currently approved project/release and public URL. Pending reviews and approved releases cannot be discarded.
- On discard, the release is revoked and private preview tokens deleted before asset reclamation. Only then are R2 objects removed; D1 asset inventory is removed after confirmed cleanup. A storage outage leaves the release unplayable while preserving object keys as retryable GC evidence.
- Bounded staff-only `POST /api/v1/packages/maintenance/reclaim` with JSON confirmation `{"confirm":"reclaim_revoked_v1"}` retries up to two revoked, unreferenced releases, never a currently live/pending one. The endpoint requires the existing auth/CSRF/staff checks, and is not run automatically.
- Submit's project-state transition now checks the release remains pending_review, mitigating discard/submit races.

## Acceptance coverage

Node22/SQLite-R2 integration verifies actual release-bound cover bytes, private/public roles, revocation on suspension/update, CRC and invalid dimensions, reserved ZIP metadata path, private draft discard, approved-v1 preservation, upload retry, preview invalidation, simulated failed R2 deletion and safe staff GC repair. Synthetic Chromium UI at 320/390/1440px verifies mobile picker, local decoded PNG preview, high-resolution project card crop, staff confirmation and uploader layout. These are not tests using actual authenticated live accounts.

## Verified infrastructure caveat

Read-only Cloudflare account inventory on October 19 reveals previously uploaded V003 control/API and runtime Worker scripts, some with 100% deployment records and workers.dev enabled. This supersedes the older blanket assertion that no V003 runtime script exists. However, a deployment record alone does NOT prove that these Workers run this V006 source, are correctly bound, accept verified member/reviewer sessions, pass live safety checks, or are safe to attach to anevum.com. External staging endpoint health was not established. Current V006 source remains NOT deployed.

`PACKAGE_PUBLIC_PUBLISH_ENABLED` remains OFF by default. No D1/R2 migrations, account or role changes, irreversible publication, production route changes or Worker deployments were made by this work.

## Remaining release gates

1. Verify stage-bound isolated runtime, auth, private preview, content CSP, asset MIME, backups/rollback and exact deployed source hash. Apply any stage-only D1 migration only after inventory and restore rehearsal.
2. Real independent owner A → reviewer B → guest C test using rights-cleared playable ZIP and original cover, including edits/replace and rejected/suspended/revoked states.
3. Real iPhone Safari/Android, desktop, touch/fullscreen/audio, low-end device, keyboard accessibility, error recovery and animation/reduced motion.
4. Integrate approved release identity and genuine artwork into current V091 creator space, Discover, project player and existing staff portal, preserving the live V002 alpha game and every prior user/progression record.
5. Confirm moderation/reporting, copyright appeals, rate/cost limits and controlled garbage-collection operations before broad self-service executable uploads.
