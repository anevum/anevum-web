# ANEVUM Founder Profile Staff Access — Production Verification

Session: `ANEVUM.WEB.PATCH.2026-10-19.001.FOUNDER-PROFILE-STAFF-ACCESS`

## Live deployment — 2026-10-19

Cloudflare Worker: `anevum-profile-staff-access-v001`.

Added only four scoped production routes:

1. `anevum.com/` — inject the same-origin member-staff script and CSS into the public React shell
2. `anevum.com/member*` — provide staff navigation inside the authenticated member profile
3. `anevum.com/__anevum_profile_staff_access_v002.js` — versioned, cache-safe self-hosted client
4. `anevum.com/__anevum_profile_staff_role_v001` — canonical session and D1 staff-grant check

All other routes remain intact, including `anevum.com/*` bound to `anevum-native-frame-policy-v001`, `anevum.com/staff*` bound to `anevum-iren-staff-navigation-v002`, `anevum.com/staff/observatory*`, and existing project-review routes.

The exact script route and the role endpoint returned HTTP 200 and HTTP 401 respectively for anonymous requests. The site homepage continued rendering normally, and an anonymous `/member` request correctly navigated to `/join`.

The new Worker bindings were verified:

- `UPSTREAM` → `anevum-native-frame-policy-v001` (preserves existing CSP/frame policy and assets)
- `APEX_AUTH` → `anevum-apex-prelaunch-gateway`
- `MEMBER_DB` → the D1 database already bound to canonical apex authentication

No D1 writes were performed. Verification counts after deploy: five accounts, 1,783 historical XP test events, one active owner grant, and one active reviewer grant. Temporary diagnostic routes and obsolete JS/API routes were removed.

## Authorization behavior

The role endpoint must find a valid `anevum_can_apex.session_token` cookie, and the canonical Better Auth session must validate. The backend then checks an active verified `staff_access_grants` record tied to the authenticated user ID. Email does not grant authorization. It is used only to label the already-authorized owner account as `FOUNDER` in the UI.

Client controls fail closed, detect identity changes and hide when signed out. All destination tools independently enforce staff authorization. No automatic grants, invitations, promotions, or XP actions were added.

## Browser acceptance still outstanding

A signed-in owner session was not available in the connected browser profile. Manually verify `devon@anevum.com` sees Founder Console in (1) the homepage member-card section of the Wayfinder menu and (2) My Space personal profile toolbar. The shortcut opens `/staff/observatory`. Verify a reviewer sees Moderator Portal linking to `/staff`. Confirm an ordinary member sees no staff shortcut.

Anonymous access and Cloudflare routes were verified; **do not claim authenticated visual testing has passed**.

## Rollback

Remove only the four new routes above from Cloudflare; the existing `anevum.com/*` Worker continues serving the site without this integration. The standalone Worker may remain unbound. Do not modify any D1 tables or current staff/project routing to roll back.

## CI caveat

The ANEVUM root repository currently has an existing verification mismatch: `tests/single-production-deploy.test.mjs` expects `name: Deploy ANEVUM Production`, while `.github/workflows/deploy-production.yml` is intentionally marked retired. These existing files had matching SHAs on main and the previous Observatory branch. Do not reactivate the retired deploy workflow merely to make CI pass.
