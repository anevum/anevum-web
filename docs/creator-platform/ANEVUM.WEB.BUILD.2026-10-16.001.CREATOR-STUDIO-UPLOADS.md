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
