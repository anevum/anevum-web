# ANEVUM V1 0.5.0 — Creator identities and personal libraries

**Session:** `ANEVUM.WEB.BUILD.2026-10-12.002.CREATOR-PROFILES-LIBRARIES`  
**Scope:** isolated preview and invitation-only staging, not open public production.  
**Launch target:** January 1, 2027.

## Delivered

- Public staging creator identity at `/api/v1/member/creators/:handle/view`; profile JSON is `/api/v1/member/creators/:handle` and published work is `/api/v1/member/creators/:handle/projects`.
- Verified identity, never fictional reputation: public creator name, biography, joined date, contribution counts, 60-level earned artifact, and six starter badges.
- Badge criteria: first and fifth eligible active rating, twenty-five eligible active ratings, first and third approved publication, and first versioned release on a published project. These are **derived** from existing trusted records, not new purchasable XP and not staff permissions. A hidden rating no longer satisfies a contribution threshold; archived projects stop counting as current publications.
- Signed-in `/api/v1/member/library/manage` with server-backed library API (`GET /api/v1/member/library`, `POST /api/v1/member/library/:projectId` with `{saved:true|false}`), using preexisting D1 `project_favorites` rather than introducing redundant storage.
- Atomic duplicate-safe saves, per-member reads/writes, same-origin protection and throttling. Saving grants zero XP and no rating influence.
- Library only shows currently published projects by active creators; hidden, archived or future-dated works are not revealed. A member may remove a previously saved item even after it becomes unpublished.
- Creator links are available from the live staging community project directory, and the community header gains direct library navigation.
- Original cinematic theme, responsive profile, artifact and badge cabinet, and mobile-friendly project cards; no hard-coded project counts or fake activity.

## Security boundaries

- Only public profile fields returned. Email addresses, member IDs, session tokens, staff booleans, private drafts and hidden submissions must never appear on public profile APIs.
- Public profiles require an active creator profile and active member account, except the fixed legacy `anevum-official` editorial identity. This exception is a display compatibility rule, not an auth entitlement.
- All saves use the authenticated member from the staging session. Client-supplied member IDs are ignored or rejected; cross-site writes fail.
- Outbound source/demo links are HTTPS-only and opened with `rel="noopener noreferrer"`.
- Production `anevum.com` remains read-only on its separate D1. No archival V5 or RHEN bindings.

## Verification

- 73 local tests passed (the prior 58 plus 15 profile/library integration tests) using real SQLite constraints and signed member sessions, including anonymous, suspended, deleted, cross-origin, draft/future, duplicate save, hidden vote and no-XP abuse cases.
- UI source syntax checked via Node; local responsive screenshots and Cloudflare staging smoke checks still required before live acceptance.
- No new database migration is required: `creator_profiles`, `project_releases`, `project_favorites`, `projects`, `member_accounts`, `community_project_votes` and `community_xp_events` already exist in migrations 0001, 0003 and 0005.

## Release gates

1. Verify latest GitHub CI against branch `build/anevum-v1-newyear-overhaul-20261011`.
2. Deploy the changed member Worker with new `social.mjs` and `social-ui.mjs`, retaining the prior secret bindings and staging D1.
3. Browser-check public profile page, library anonymous denial, social assets, profile response privacy, staging database counts, unchanged production route.
4. Complete a real invited-owner sign-in → project submission → staff review → published project → vote → earned badge → save-to-library walkthrough.
5. Before unrestricted signup, replace or independently review the bespoke authentication stack and complete abuse, accessibility, observability, backup and account deletion/export acceptance.

Do not treat these features as public launch acceptance merely because the fixture-driven tests pass.