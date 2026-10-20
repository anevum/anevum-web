# ANEVUM — Permanent-domain prelaunch gateway

Session: `ANEVUM.WEB.BUILD.2026-10-17.001.APEX-PRELAUNCH-GATE`
Status: **CANDIDATE — DO NOT SWITCH APEX ROUTE WITHOUT E2E EVIDENCE**

## What exists today

- Public `anevum.com/*`: the original **anevum-construction-terminal** Worker, with the animated January 1, 2027 countdown. Do not overwrite, delete or alter its route while preparing this change.
- Public `a.anevum.com/*`: **anevum-creator-v1-a-staging**, serving the working Creator V1 React platform and canonical member API. Preserve this as the current functional fallback until the permanent-domain cutover is verified.
- Canonical member D1: `e1d29049-c83b-4534-8355-dc1fa36ba6d8`; community D1: `fa96e36d-6257-4883-bf15-074947e11a13`. New permanent-domain gateway binds those same D1 databases; never merge or create replacement users.
- New Cloudflare Access application: **ANEVUM Apex Countdown Private Preview** (`anevum.com/__enter*`), id `c5e5bef0-43b8-4a4b-bc04-cbf2e0973e8b`, audience `6efab9f2821297fa4c965f18813d78d7433ebf7823a8e9e6d9ecfb7e4b2ccde1`. This app is limited to the explicitly reviewed owner/staff email allowlist and does not cover the entire public hostname.
- Separate existing Access applications also match `anevum.com/studio*` and `anevum.com/command/rhen*`. **Do not delete these blindly**: their policies must be reconciled before attempting a universal public countdown and again before launching a public creator studio.

## The new production-shaped topology

```text
Guest -> https://anevum.com/
    -> Cloudflare Workers apex-prelaunch gateway
    -> ORIGINAL countdown HTML (no API, CSS/JS build assets, uploads or hidden routes)

Approved owner -> https://anevum.com/__enter
    -> Cloudflare Access email verification / application-specific cookie
    -> Gateway validates Access RSA signature + issuer + exact AUD + expiration
       + server-secret owner email allowlist
    -> redirects owner to /
    -> Full Creator V1 frontend, identity, member profiles and features
       on the permanent origin, backed by the existing canonical D1

Launch: explicit TWO-FLAG approval can replace the countdown with the platform.
```

- Only `ANEVUM_PRELAUNCH_MODE=public` AND `ANEVUM_LAUNCH_APPROVED=true` makes the platform public; `gated` with a valid Access JWT is needed for owner preview. Missing flags, unverifiable token, wrong host or invalid JWT fail to countdown/404.
- The Worker executes before **all** static assets with `assets.run_worker_first=true`; no hidden SPA bundle or API is served directly to anonymous visitors.
- Owner preview is **not** based on a query parameter, a frontend overlay, a user-supplied header, a shared plaintext password, or an unsigned `CF_Authorization` cookie.
- `anevum_can_stage` and `anevum_can_apex` sessions have different prefixes and are host-only; existing `a` logins do not silently become apex logins. Existing database user IDs, member handles, XP and awards are retained.
- Unreleased OAuth providers remain disabled. No Stripe subscription billing or webhook routing is assumed active.

## Preparation already performed

1. Saved a new **unrouted** Wrangler deployment config: `creator-v1/wrangler.apex-prelaunch.jsonc`.
2. Preserved the exact current countdown HTML in six small files, with an integrity test against the current routed Worker: SHA-256 `c3528a943c119380a39c567b7a4bba34ef3bcd8f81cf693c409a8d0b8691fe74`.
3. Built apex-bound canonical auth request validation, account-provider callback origin binding, host-only cookies, supporter return URLs, and a strict preview gateway.
4. Created the Cloudflare Access application for `anevum.com/__enter*` with an explicit owner/staff allow policy.
5. Added security tests to the full Creator V1 suite. An exact-head green CI run is required before promotion.

## Owner / operator actions before *routing* production traffic

1. **Verify access email recipients** in Cloudflare Zero Trust → Access → Applications → ANEVUM Apex Countdown Private Preview. Keep only approved founder/staff test emails. The separate Worker secret `ANEVUM_PREVIEW_ALLOWED_EMAILS` must contain the **same approved list** as comma-separated addresses. Do not store that list in source control.
2. **Deploy the candidate Worker without a route** using Wrangler and the pinned config. Build with `npm install --ignore-scripts`, `npm run check:creator-v1-web`, `npm run build:creator-v1-web`, `(cd creator-v1 && npm test)`, then `npx wrangler deploy --config creator-v1/wrangler.apex-prelaunch.jsonc`. Confirm Worker name and no routes, no worker.dev and no preview_urls.
3. **Populate the new Worker's secrets directly in Cloudflare** (never paste keys into chat/GitHub):
   - `ANEVUM_PREVIEW_ALLOWED_EMAILS` (same exact Access allowlist; required to unlock preview).
   - `CANONICAL_BETTER_AUTH_SECRET`: high-entropy 32+ character value. The new apex host uses a different cookie namespace; if linked OAuth accounts ever contain token ciphertext on the shared member D1, preserve the old encryption secret or plan secure token migration before changing it.
   - `CANONICAL_RESEND_API_KEY`: scoped to sending `access@auth.anevum.com`.
   - `CANONICAL_PROTECTED_EMAILS`: nonempty owner-address list used by the canonical identity guard.
   - Other forum/Stripe/owner-only secrets only when those features are deliberately activated. Keep all `CANONICAL_*_ENABLED` provider flags OFF until E2E authorization consent/callback tests.
4. **Prepare Google OAuth on the permanent domain.** In the same Google OAuth Web application add authorized origin `https://anevum.com` and redirect `https://anevum.com/api/v1/member/auth/callback/google`. Do not remove `a.anevum.com` entries until it is retired. Repeat for GitHub, Microsoft and Apple in separate provider dashboards.
5. **Verify a real backup** of canonical member D1 and community D1 before changing the apex route. Do not assume source/migration tests replace a recoverable D1 snapshot.
6. **Perform an unrouted test / deployment comparison** or use a dedicated isolated test hostname with matching origin guards, without exposing the production apex. Do not weaken JWT/host checks to test.
7. **Switch only the `anevum.com/*` route** after approvals, preserving the old `anevum-construction-terminal` Worker and a route-version rollback record. Do not delete or edit `a.anevum.com/*` during this step.

## Required live acceptance after route cutover

| Request | Not signed into preview | Owner signed into preview |
|---|---|---|
| GET / | Exact animated original countdown | Creator V1 homepage |
| GET /join, /member, /studio | Countdown (except pre-existing overlapping Access policies) | Actual app with host-only session |
| GET /api/v1/member/health | 404 | Canonical API `ready` |
| GET /api/v1/member/auth-methods | 404 | Email available, OAuth disabled |
| GET /assets/index-*.js | 404 | 200 with actual script bytes |
| POST /api/v1/member/auth/email-otp/send-verification-otp | 405 | Same-origin route and rate-limit checks, tested with consented owner email |
| GET /__enter | Cloudflare Access login | Redirect to / after Access JWT verification |

- Validate iOS/iPhone as well as desktop, including browser reload and refresh, asset loading, owner signout, and use of the OTP code sent to an actual owner inbox. Verify existing member id/profile/awards are unchanged.
- Check that non-owner authenticated Access users, forged JWTs, expired Access sessions, direct URL guesses, and subdomain cookies cannot reach protected assets, APIs or account data.
- Inspect pre-existing `anevum.com/studio*` and `anevum.com/command/rhen*` Access applications: guest routes may show Access login instead of countdown. Reconcile these policies deliberately. Command/RHEN must NEVER become publicly accessible when opening the main creator studio.
- Existing live payments and Stripe callbacks (if later enabled) need an explicit signed-webhook handling plan; blanket prelaunch gating intentionally blocks external webhooks.
- A separate successful fresh external signup-to-profile E2E is required before declaring email onboarding launch-ready.
- Once apex access works, restrict or redirect the old `a.anevum.com` *after* confirming old links, OAuth callbacks, and account continuity. Until then, that old site is publicly reachable.

## Launch and rollback

### Public release

After full review and backup, set both `ANEVUM_PRELAUNCH_MODE=public` and `ANEVUM_LAUNCH_APPROVED=true` on the new gateway. Confirm live signups, profiles, discussions, creative submissions, privacy/deletion, payments, and moderated content. Coordinate removal of the obsolete `/studio*` owner-only Access policy if the creator studio is meant to be open publicly; preserve `/command/rhen*` security.

### Immediate rollback

Restore the `anevum.com/*` Worker route to the untouched `anevum-construction-terminal` script (route id at preparation time `2659b522a96a435db4aadac49dbea8fa`). Do not change D1 tables or migrate member IDs during rollback. Confirm GET / shows the original countdown again and direct member APIs return 404/405. Keep the new unrouted gateway for debugging; do not delete the old Worker.

### Release prohibition

Do **not** run older V031/V041 `a` deployment workflows against this new gateway; some assert an obsolete closed-signup state and/or omit newer member/community bindings. Never route the new gateway while it lacks Access authorization, all needed secrets, or passing end-to-end evidence.
