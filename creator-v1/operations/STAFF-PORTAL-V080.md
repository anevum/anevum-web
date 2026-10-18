# ANEVUM — V080 Staff Operations consolidation
Session: ANEVUM.IREN.UPDATE.2026-10-18.001.STAFF-PORTAL-OVERHAUL
Base: release/home-wayfinder-v079-approved-20261018
Status: Implementation brief — deployment not approved or performed.

## Verified production wiring (2026-10-18)
- /staff* -> anevum-staff-review-navigation-v001 -> anevum-iren-apex-staff-v002
- /staff/projects* -> anevum-staff-project-review-v003
- /staff/projects/community* -> anevum-staff-community-review-v001
- /api/v1/alpha/* -> anevum-alpha-uploader-player-v004-staff
- /api/v1/projects* -> anevum-alpha-discovery-adapter-v003
- Alpha upload, review, and staff project services use D1 e1d29049-c83b-4534-8355-dc1fa36ba6d8, with separate canonical Better Auth service binding.
- Alpha private files are stored in R2 anevum-alpha-media-staging.

## Existing behavior verified from deployed source
1. The /staff root wrapper merely injects a floating PROJECT REVIEWS link into the older IREN page. It does not provide the same dashboard.
2. /staff/projects is an independent page and embedded JavaScript app, limited to pending review records (75) and recent published/rejected records (8). It shows a large empty player when no submissions exist.
3. Approval uses browser confirm; rejection uses browser prompt; the latter is inadequate on mobile.
4. /api/v1/alpha/projects/:id/delete is POST and limited to the authenticated creator, only draft or rejected statuses, and only while that creator is in PILOT_IDS. The R2 delete happens after the SQL deletion, so a storage failure can leave orphaned object data.
5. Staff authorization relies on verified canonical member session plus nonrevoked staff_access_grants owner/reviewer. Do not replace it with UI hiding, guessed email matching, or an unconditional owner bypass.

## V080 implementation requirements
### 1. Single operational entry point
- /staff becomes a real operations homepage; /staff/projects is the Projects workspace and /staff/projects/community is the Moderation workspace.
- Keep IREN operator/trading routes separate from publication management.
- Preserve all Access policy, Better Auth session checks, D1 role grants and service bindings.
- Redirect legacy buttons and old project review links into the correct workspace; no second sign-in or duplicate portal chrome.

### 2. Review desk
- Compact search/filter queue by pending status, type, creator and submission date.
- Desktop: fixed-height queue rail, large isolated native project player, metadata/details inspector and decisions area.
- Mobile: Queue and Preview tabs, explicit return to queue, unblocked fullscreen preview, safe-area-aware action dock, no oversized empty player.
- Review an entire playable creation in its sandboxed /play/:id context; never execute uploaded content with staff origin privileges.
- In-page accessible decision dialog with reason and action confirmation, not browser prompt.
- Buttons disabled during requests; retryable error states, stale-item 409 handling, queue refresh and recent audit decisions.
- Avoid changing production publication logic unless independently tested.

### 3. Owner project library and deletion
- Owner-only All Projects view: draft, pending, published, rejected, archived; search by title, creator, status, and ID.
- Two distinct controls: Unpublish/Archive (reversible public visibility change) and Permanently Delete (destructive), with explicit consequences and role checks enforced by server.
- Moderators/reviewers can reject/unpublish only when explicitly authorized; permanent deletion is owner-only.
- All destructive requests must be same-origin, re-authenticated, idempotent, revision-checked, audited, confirmed by exact project title, and resilient to partial D1/R2 failures.
- For pending review: resolve/withdraw current receipt and prevent stale approval.
- For published: revoke Discover listing, /play visibility and public API visibility immediately; handle related votes/comments and audit references without referential integrity violations.
- Implement a recoverable tombstone + R2 cleanup queue before hard purge. No silent replacement of D1 database or dropping of staff grants.
- Staff must see the full project inventory, not just the pending queue. Ordinary creator deletion remains scoped to own data.

### 4. Quality gate
- Verify signed-in owner and reviewer roles; verify nonstaff, unauthenticated and revoked role are denied.
- Seed isolated drafts, pending, published, rejected cases and test review decision races, same-origin/CSRF, mobile focus, 320/390/768/1440 widths, reduced motion, preview, refresh, and audit writes.
- Test archive/unpublish restores and deletion including forced object store failure before any live use.
- Preview first, get owner acceptance, then route cutover and smoke-check production. Do not deploy untested review workers.
- Preserve V079 homepage, V078 player cards, account data, and R2 assets.

## Immediate triage
The screenshot's "No pending projects" is not a delete failure; it is a queue scoped only to pending_review, while the project "Single Drift" appears in recent published decisions. The old /staff clearance screen is a separate routing problem. Do not grant owner access by making staff authorization public.
