# Founder / moderator access in the ANEVUM profile

Session: `ANEVUM.WEB.PATCH.2026-10-19.001.FOUNDER-PROFILE-STAFF-ACCESS`

## Purpose
Give verified owners and moderators direct navigation to their staff tools through ANEVUM's own signed-in player-card menu and /member personal profile.

Founder user `devon@anevum.com` has an existing verified canonical **owner** grant. The display label "Founder Console" appears only when the verified owner grant belongs to that account. The email is **not** used as an authorization bypass; every permission check resolves the signed-in member ID and active `staff_access_grants` row.

## Production arrangement
The new standalone Worker `anevum-profile-staff-access-v001` proxies the unchanged existing `anevum-native-frame-policy-v001` Worker via `UPSTREAM`. This preserves its `frame-src 'self'` policy fix and all existing app routes. It modifies HTML only on canonical homepage `/` or `/member` (including member subpaths), injecting one same-origin script and CSS. It does not modify uploaded projects, fullscreen players, API responses, staff pages, or other assets.

Specific Worker routes:
- `anevum.com/`
- `anevum.com/member*`
- `anevum.com/__anevum_profile_staff_access_v002.js`
- `anevum.com/__anevum_profile_staff_role_v001`

The dedicated access endpoint delegates authentication to `anevum-apex-prelaunch-gateway`, validates the canonical cookie/session and email-verification status, and queries the production-bound member D1 role grant. Owner returns `{role:"owner",designation:"founder"}` for Devon, reviewer returns `{role:"reviewer"}`, a non-staff verified member returns `{role:null}`, and unsigned/non-verified users receive HTTP 401. On errors the UI remains hidden. The endpoint does not expose the email or account ID. Every staff destination retains its own independent authorization.

The client adds accessible, small navigation links under the verified member card in the Wayfinder navigation drawer and the personal member dashboard toolbar. The personal profile editor includes the same entry, and the owner is distinguished by a cosmetic "FOUNDER · OWNER" badge in the private profile. Reviewer account links go to /staff; owner links go directly to /staff/observatory.

## Safety
- Existing `/staff`, `/staff/projects`, XP, moderation routes, creator uploads and login are untouched.
- No D1 mutation or new analytics tracking.
- No public or anonymous staff navigation; client only renders after role confirmation and fails closed.
- Role changes and account switching invalidate client controls, with rechecks on visibility changes.
- Front-end visibility is convenience only, not an authorization boundary.
- The code is additive and isolated from the main frontend bundle.

## Deployment and verification
`npx wrangler deploy --config wrangler.jsonc` from this directory, or upload a bundled module using the Cloudflare Workers API with compatible service/D1 bindings.

After deployment confirm anonymous `/__anevum_profile_staff_role_v001` returns HTTP 401, static script is served with JS MIME, and homepage/member HTML retains the original CSP and `frame-src 'self'`. Then sign into ANEVUM as the verified owner and confirm the new links display in both places and navigate to the existing staff portal. Sign into a reviewer account and confirm the moderator link. Verify a normal user sees no link. Signed-in acceptance tests cannot be completed without those accounts' browser sessions.

## Rollback
Remove only these four routes, leaving the existing `anevum.com/*` route mapped to `anevum-native-frame-policy-v001`. There are no database changes to revert. Do not unmap or overwrite the current staff portal Workers.
