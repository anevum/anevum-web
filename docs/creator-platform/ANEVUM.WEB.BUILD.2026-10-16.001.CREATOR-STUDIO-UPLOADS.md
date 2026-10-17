# ANEVUM.WEB.BUILD.2026-10-16.001.CREATOR-STUDIO-UPLOADS

**Status:** V043 private staging candidate / DEVELOPMENT REVIEW ONLY. Not merged, migrated, provisioned, activated or deployed.
**Base lineage:** release/a-v010-player-20261016, rooted in V041 forum stage.

## Built source
- Canonical Better Auth /studio, /studio/new, /studio/:id and restricted /studio/review.
- MEMBER_DB project drafts, assets, limits and staff audit history; no separate Creator V1 member session or identity linking.
- Draft creation idempotency, optimistic revision updates, publication-safe status state, metadata and disclosure editing.
- Explicit owner withdrawal from pending review back to a private draft, plus revision-confirmed draft deletion when no asset records remain. Owners can withdraw quarantined file bytes even while a submission is review-locked.
- Staff-only change requests or rejection. No approval/publication action until a separate public-catalogue bridge exists.
- Quarantined private R2 upload service: PNG/JPEG/WebP/GIF up to 10 MiB; MP3/WAV/ZIP up to 20 MiB; PDF up to 10 MiB; TXT/MD up to 1 MiB. Max 20 assets per project and 100 MiB per account.
- Upload reservations, atomic quota checks, bounded upload stream, MIME and magic checks, SHA-256, private downloads, deletion, lease recovery helper.
- Canonical export includes private Studio metadata. Account closure blocks on remaining R2 asset records to prevent object orphaning.
- Existing canonical worker CSRF, origin, auth and cookie isolation retained.

## Launch flags
CANONICAL_CREATOR_STUDIO_ENABLED must be true and the 0008 canonical private Studio migration must be applied to enable draft API. CANONICAL_CREATOR_UPLOADS_ENABLED must separately be true and CREATOR_ASSETS must be a dedicated PRIVATE R2 binding to enable upload routes. Both flags default absent/OFF in existing Wrangler configuration. All API surfaces fail closed while disabled.

## Security and truth boundary
An uploaded ZIP is not a playable game or PWA. The pilot does not inspect archive contents, scan malware, transcode media or expose any public file URL. Nothing crosses into the approved public project catalogue. The separate /projects/:id unified player still relies on independently published community projects. Staff review is for metadata only and cannot approve executable assets or publish them.

No payments, RHEN, production, signup, Stripe, account balance, XP or supporter entitlement changes. Do not touch the apex anevum.com construction site.

## Staging acceptance steps
1. Verify V041/V010 A-staging baseline, exact active Worker SHA, canonical MEMBER_DB and COMMUNITY_DB bindings, secret inventory and rollback.
2. Resolve migration ordering (forum and supporter migration 0006 collision and pending 0007 saved works) before applying the additive 0008 migration to MEMBER_DB. Take backup and test disposable restore first.
3. Provision a dedicated private R2 bucket rather than reusing public/profile/RHEN storage. Measure spending and set caps.
4. Run Node isolated SQLite and fake R2 tests, full npm test, production Vite build, static security probes and desktop/mobile browser checks.
5. Test real authenticated member A, member B, guest and independent reviewer with CSRF, mutation race, upload lease, quota and byte spoofing cases.
6. Owner review and explicit stage authorization: first drafts ON/uploads OFF, then optional private R2 uploads ON. Verify no public app hosting, DNS, production D1 or user XP changes.
7. Rollback by turning feature flags OFF and restoring prior Worker while retaining private asset records for supervised export/erasure.

## Future release work
Add staff asset inspection, malware/ZIP-bomb scanner, secure content processing, immutable approved release manifest, separate registrable-origin HTML5/PWA execution sandbox, public catalogue bridge, versioning/rollback, safe media viewers, account asset export/erasure, rightsholder reports and measured bandwidth limits. Test complete SIGNAL 001 upload and play there before advertising native games.

The immediate QA target is npm run test:studio, then npm test from creator-v1. Passing these synthetic tests does not mean the live deployment is authorized.


## V044 continuation / attachment-first review
- Creators can submit a private game/tool ZIP, image-based artwork, audio, or document without needing an external site. File type must match the project category and must already have a completed quarantined upload. Private MP4 and WebM video files (maximum 20 MiB each) are now accepted as film-review evidence. External HTTPS links remain supported. Video cannot be streamed, transcoded, or publicly rendered from quarantine.
- Readiness is checked on the server and checked a second time atomically in the D1 submission update. Removing an upload never causes a public release; a reviewer sees the new private manifest state.
- Creator Studio reviewers now use CANONICAL_STUDIO_REVIEWER_IDS, independent of forum reviewers. An independent reviewer may inspect only status/size/hash/name metadata, never execute, preview, or download quarantined bytes from the review desk.
- The existing staging Worker scheduled callback additionally runs bounded expired-reservation / abandoned-upload recovery, but remains inert when uploads are disabled or a private R2 binding is missing.
- No new infrastructure, billable bucket, release host, or runtime was provisioned by this code revision. Game packages remain untrusted and unplayable until separate asset inspection and sandbox release gates pass.


## V044 private storage pause semantics
New upload reservations and binary writes stop when CANONICAL_CREATOR_UPLOADS_ENABLED is false, but a signed-in owner can still list existing file metadata. If the private CREATOR_ASSETS binding remains present, existing files can still be downloaded as forced attachments or permanently removed, including on review-locked projects. If R2 is disconnected, metadata remains readable and byte removal is blocked rather than losing the only object reference. The staging expiry reaper continues when new uploads are paused and isolated R2 is still provisioned; it remains inert when the Studio itself or the storage binding is absent.


## Bounded private pilot scope
CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS (comma-separated canonical member UUIDs or IDs) must be present AND nonempty for all private upload writes; the upload flag and dedicated R2 binding alone do not open uploading to the general member population. The API returns the effective per-account upload capability, and the Studio UI uses the authenticated member response rather than trusting the public health endpoint. The pilot ID list must be stored as a secret, not logged, committed, or inferred from member emails, handles, or forum moderator roles. Removing the allowlist disables further reservations/PUTs without removing existing files.

## V046 — aggregate pilot storage guard
Private upload reservations also enforce a 512 MiB total Studio ceiling across **all canonical member accounts**. The quota counts stored, uploading, quarantined, and reserved records until deletion or the bounded expiry cleaner releases them. The server verifies aggregate space inside the D1 reservation statement, not from a client-reported meter. The Studio displays its own account usage and the shared pilot-vault usage. The limit is intentionally lower than commercial-scale storage and must not be raised until real pricing, abuse controls, telemetry, and lifecycle verification are in place. This is a storage-only limit; it does not make packages executable, published, or approved.


## V047: quarantined video ingest
The private upload pilot additionally accepts MP4 (`video/mp4`) and WebM (`video/webm`) files, each capped at 20 MiB. Browser extension/MIME declaration and basic MP4/EBML header signatures are checked, then bytes are stored as private `application/octet-stream`. These checks are **not** malware scanning, decoding, file validation, moderation, or copyright clearance. Video is never embedded, rendered, streamed or played on the ANEVUM origin; safe processing and media playback remain follow-on features behind separate release gates. Video-category projects may submit a quarantined video attachment for metadata review without an external URL.

## V049 — immutable-review guard on owner evidence changes
The member may permanently remove private files at any time, including during a pending submission. If the project is pending review, an asset withdrawal and the transition back to an editable private draft happen in one D1 batch transaction, including a revision increment and clearing submitted_at. The owner UI presents a confirmation explaining that the review queue will be withdrawn and refreshes the project status after erasure. The former revision must not remain actionable in the independent staff queue. If R2 object removal fails, the project stays withdrawn and the deleting asset record is retained for supervised cleanup; no public content is exposed. This is not the immutable approved-release manifest required for a future public publishing system.
