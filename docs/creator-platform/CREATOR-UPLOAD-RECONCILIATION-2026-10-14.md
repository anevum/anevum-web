# Private Creator Upload Integration — source only

Session: `ANEVUM.WEB.BUILD.2026-10-14.001.CREATOR-UPLOAD-INTEGRATION`
Parent: `2bc898f7624753a486bce321f338e545b22545e8` (canonical production/creator-v1 source at handoff)
Pilot: PR #375 / `a4c144a75757e336fa3d6bb1ac815445811a5177`
Result: Review-only merge-free branch, no provider writes or deployment.

## Confirmed
- Actual staging database (read-only 2026-10-14) has schema_migrations 0001–0006 and no project_assets table.
- Current source already declares `0007_community_post_stream`, `0008_community_reply_reviews`, and `0013_community_post_projects`, with 0010–0012 reserved in a separate integration PR #381.
- This branch renumbers the pilot's obsolete 0007 asset migration as `0014_private_creator_assets`. Nothing runs against staging D1.
- Staged UI includes member-owned project attachment selection, local-only previews, guarded quota reservations, private forced-download and delete. Public site and existing project review/dirty-state behavior remain unchanged.
- Exactly the old Creator member route implements uploads: `CREATOR_UPLOADS_ENABLED='true'` AND private `CREATOR_ASSETS` binding required. Defaults closed. Staging frontend remains GET/HEAD only. Scheduled cleanup is also gated.
- Conservative pilot policy: member total 100 MiB, 20 assets/project, file limits 1/10/20 MiB by allowlisted type.

## Explicit blockers and next build steps
1. Run exact-head CI and review any failures. This code is not staging acceptance.
2. Independent review of code, security, R2 orphan race, lifecycle, reservation abuse, quota enforcement, account export/erasure and rights claims.
3. Prepare isolated backup **and restore**, then independently authorize staging D1 migration and PRIVATE creator quarantine R2 bucket (never reuse profile-media or RHEN).
4. Enforce account-wide 7 GiB original-file budget, real-time 5/6/7 GiB safety thresholds and monitoring. Existing 100 MiB/member alone does not guard account limits.
5. Real member A / staff / independent member B / guest device and permissions acceptance, including suspended users, 401/404 and deletion.
6. `a.anevum.com` is a separate visual staging environment. Do not assume it shares the invited Member API on `next.anevum.com`; keep upload UX disabled until host-specific same-origin identity is verified.
7. No public uploaded-file serving, executable ZIP/playable HTML, scanning claims, shared-session media origin, automatic publication or paid services.

Authority: GitHub issues #325, #329, #332, #333. Package `ANEVUM.WEB.PACKAGE.2026-10-14.001.CREATOR-UPLOAD-STORAGE-HANDOFF`. Preserve community PR #386, active cinematic review PR #388, separate staging PR #391 and signup PR #390.
