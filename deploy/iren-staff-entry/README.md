# ANEVUM IREN Command — Staff Entry Repair

Session: `ANEVUM.IREN.PATCH.2026-10-19.001.STAFF-SESSION-ROUTING`
Date: 2026-10-19

## Problem
The old IREN Command SPA displayed **Staff clearance required / Verified apex session required** at `/staff` while `devon@anevum.com` already had an active verified owner grant and live canonical sessions in the D1 database. The old page loaded before its separate staff-ops API had authenticated the browser, leaving a misleading generic denial.

## Safe implementation
A standalone Cloudflare Worker now handles only the exact routes:
- `anevum.com/staff`
- `anevum.com/staff/`

The original IREN Command UI has additionally been retained at the separately mapped `/staff/command` and `/staff/command/` paths. Its isolated `anevum-iren-legacy-command-entry-v001` adapter rewrites only those two requests back to the existing staff app; existing staff-ops APIs and assets remain unchanged. The Observatory's operations links were adjusted to reach this preserved route, not loop back to the /staff entry. This legacy tool can still display its old clearance error if the calling browser lacks a valid member cookie; the current Observatory is the intended main staff workspace.

Both existing review routes (`/staff/projects*`, `/staff/projects/community*`), staff API routes (`/api/v1/member/staff-ops*`), and the Observatory (`/staff/observatory*`) remain assigned to their previous Workers. The general `/staff*` navigation route also remains unchanged for other staff static assets.

The entry verifies the *present browser cookie* with the canonical Better Auth `/api/v1/member/auth/get-session` service binding and checks the member ID's verified, non-revoked owner or reviewer grant in the live D1 database. When verified, it redirects to `/staff/observatory`, where the Observatory independently checks staff access. No email-only bypass, session token guessing, or automatic grant is introduced.

If the browser is not signed in, or has a rejected session, the user sees a branded staff login prompt linking to the existing ANEVUM `/join` route. If authenticated but not staff, the page returns 403 with an explanatory message. If the authentication or database services are down, the page returns 503, not a misleading permanent denial.

## Verification
- Worker source uploaded to Cloudflare as `anevum-iren-staff-entry-v003`; service and D1 bindings confirmed.
- Exact route mappings `anevum.com/staff` and `anevum.com/staff/` created.
- 16 local tests passed (12 authorization checks and four legacy routing checks) for owner, moderator, anonymous, expired and mismatched sessions, error handling and request bounds using fake sessions.
- Unauthenticated live fetches to `/staff`, `/staff/`, `/staff/observatory` and `/staff/projects` were rejected.
- Active `devon@anevum.com` owner grant and two unexpired session rows verified in the canonical D1 database.
- No customer data, XP, user accounts, grants, or project content modified.

## Remaining manual acceptance
Use the **same browser** signed into `devon@anevum.com`, open `/staff`, and confirm redirect to the Observatory dashboard. Confirm its Members and Rewards panels populate. Then test a reviewer account (should have access without owner-only Members/Rewards), and regular member (must have no access). A database session existing does not prove the particular browser possesses that session's cookie.

## Rollback
To roll back the staff-entry change, delete only two new Cloudflare route mappings:
- `anevum.com/staff` → `anevum-iren-staff-entry-v003`
- `anevum.com/staff/` → `anevum-iren-staff-entry-v003`

The pre-existing `anevum.com/staff*` route will then serve the old app, unmodified. Do not modify the canonical D1 records or staff API Worker when rolling back this entry.

## Known issue
The older IREN Command SPA is still available as a Worker and its staff-ops API remains unchanged. The new /staff entry intentionally lands in the newer Observatory because the old SPA displays unreliable clearance messaging. A future integration can migrate remaining operational controls into the Observatory. Do not re-enable retired V5 production workflows to pass unrelated legacy CI tests.

To also withdraw the legacy Command adapter, remove exactly two separate route mappings: `anevum.com/staff/command` and `anevum.com/staff/command/`. No database migration or staff API changes are involved.

## Redacted same-browser staff session diagnostic

Live diagnostic: `https://anevum.com/__anevum_iren_staff_session_status_v001`.

A dedicated Worker uses the same canonical auth and staff-ops service bindings as the live staff application, and independently reads the active verified D1 grant. It returns only the presence of the expected cookie (boolean), canonical session validity, the `owner`/`reviewer`/missing grant classification, the session-expiry value type, and the staff API HTTP status. It does **not** return or log the browser's cookie, user ID, email, member profile, session token, or staff-ops response body. The route is read-only and private/no-store.

An unsigned control probe returned `apexCookiePresent:false` and `canonicalSession:not_signed_in` as expected. A separate synthetic apex service-binding probe returned HTTP 200 with `null` for unsigned and invalid cookies, confirming the service binding itself is functional. These probes do **not** establish the behavior of a signed-in owner's browser.

If signed-in access still fails, visit the diagnostic URL in that same browser and record the redacted status. Values such as `canonicalSession:verified` with `staffApi:http_401` identify a disagreement in the isolated staff API; `canonicalSession:not_signed_in` means this particular browser is not passing the expected canonical cookie. This is the remaining decisive acceptance test. Never request or share session cookies or verification codes.

Two temporary support routes and their unbound Workers were withdrawn after testing: `/__anevum_iren_auth_probe_v001` and `/staff/access-check*`. Only the redacted session-status endpoint remains.
