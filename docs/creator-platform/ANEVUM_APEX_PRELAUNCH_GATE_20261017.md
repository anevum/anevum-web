# ANEVUM — permanent apex + prelaunch countdown gate

Session: `ANEVUM.WEB.BUILD.2026-10-17.001.APEX-GATED-MIGRATION`
Status: **source candidate only; not routed; public countdown and a.anevum.com remain live**.

## Decision

Use `https://anevum.com` as the permanent canonical application origin now, but keep the current January 1, 2027 countdown public until approval. Do not use an HTML overlay or CSS to conceal the app: unauthenticated requests must never reach application code, API handlers, D1 or static assets. A user-authorized preview is enabled through Cloudflare Access. Only after launch is explicitly approved are public pages and member signup exposed.

## Existing live resources — do not overwrite

- `anevum.com/*` is presently routed to **`anevum-construction-terminal`**. Preserve existing route and rollback worker before cutover.
- `a.anevum.com/*` is routed to **`anevum-creator-v1-a-staging`** and currently allows verified public email registration; **do not disable it during the apex build**.
- Member D1 `e1d29049-c83b-4534-8355-dc1fa36ba6d8`; community D1 `fa96e36d-6257-4883-bf15-074947e11a13`.
- Existing apex Cloudflare Access applications include `anevum.com/studio*` and `anevum.com/command/rhen*`; preserve their protections. **Overlapping Access scopes/cookies must be tested before enabling a full-studio preview**.
- Retained static countdown HTML is copied into `creator-v1/apex-prelaunch/countdown.mjs`. It should be pixel-identical at release; compare the actual public page and a guest response from the candidate.

## Candidate controls

- Config `creator-v1/wrangler.apex-prelaunch.jsonc` names Worker `anevum-apex-prelaunch-gateway`, with no route or public workers.dev URL.
- `assets.run_worker_first=true` is essential: **no asset may bypass the Worker**.
- `ANEVUM_PRELAUNCH_MODE=gated`, `ANEVUM_CANONICAL_APEX_ENABLED=true`, `ANEVUM_LAUNCH_APPROVED=false`.
- `gated`: anonymous GET/HEAD HTML -> countdown; anonymous POST/PUT/PATCH/DELETE -> 405; anonymous API, images, scripts, styles and other file paths -> 404. Cloudflare Access entry `/__enter` requires a separately configured Access app.
- A valid preview needs **a signed JWT** in the `CF_Authorization` cookie from the exact Cloudflare Access team, an exact Access app `aud`, and an exact secret email allowlist. Caller-supplied request headers, fake cookies, query params, and localStorage are not auth.
- `public` requires **both** `ANEVUM_PRELAUNCH_MODE=public` and `ANEVUM_LAUNCH_APPROVED=true`. Neither flag should be enabled before the final launch authorization.

## Cloudflare Access configuration (created; end-to-end owner browser proof pending)

On October 17, 2026, an account-scoped self-hosted Cloudflare Access app **ANEVUM Apex Countdown Private Preview** was created at the path `anevum.com/__enter*` with an exact three-email allow policy. Its audience is pinned as `ANEVUM_ACCESS_AUD` in the candidate Worker configuration. The app returns `login_required` for anonymous visitors. It has not been proven that the issued access cookie covers all platform routes, or that it interoperates with the existing separate Studio/Command Access applications.

The unrouted Worker **anevum-apex-prelaunch-gateway** was successfully deployed as a candidate, with both D1 bindings, static assets, `ANEVUM_PRELAUNCH_MODE=gated`, `ANEVUM_LAUNCH_APPROVED=false` and no public Worker routes. A dedicated, high-entropy `CANONICAL_BETTER_AUTH_SECRET` was generated and stored directly as a Worker secret (the value was never displayed); a secret `ANEVUM_PREVIEW_ALLOWED_EMAILS` matches the protected Access policy. Existing `a.anevum.com` remains untouched. The essential **`CANONICAL_RESEND_API_KEY` and `CANONICAL_PROTECTED_EMAILS`** bindings are still absent, so canonical email auth on this candidate intentionally fails closed. Do not promote the route until these are provisioned and verified.

## Original Cloudflare Access setup checklist (partially complete)

1. Create a *self-hosted* Access application with a single scoped path `anevum.com/__enter*`. Require an allow policy for the owner's and trusted partner's exact verified email addresses; do not use Everyone or a domain-wide policy.
2. Verify `https://anevum.com/` remains anonymously available as the countdown and `https://anevum.com/__enter` triggers an Access authentication challenge.
3. Take the **audience tag** from the created Access app and set `ANEVUM_ACCESS_AUD` as a plain Worker variable or secret on **the new apex Worker**.
4. Set `ANEVUM_PREVIEW_ALLOWED_EMAILS` as a Worker **secret**, containing only exact Access-approved owner/tester addresses. Never put addresses/secrets in source variables or UI. Keep a documented onboarding/revocation policy.
5. Verify the Cloudflare Access `CF_Authorization` application cookie is sent on requests to the apex root and private app/API paths, not just on `/__enter`. If cookie scope prevents it, revise the Access configuration; never weaken JWT validation.
6. Test existing `anevum.com/studio*` and `anevum.com/command/rhen*` Access applications for overlapping policies. They may set their own audience/cookie and block or replace the preview cookie. Reconcile scopes without removing another active protection.
7. Only then allow the preview redirect `/__enter -> /`.

## Separate apex Worker secret provisioning

The current stage Worker secrets are **not readable through the Cloudflare API**. A new Worker cannot automatically inherit them from another Worker. Re-provision through an authorized secrets manager or the Cloudflare dashboard without placing values in GitHub or ChatGPT:

- `CANONICAL_BETTER_AUTH_SECRET` (preserving it keeps D1-backed sessions cryptographically compatible, but host-only session cookies still require a new login)
- `CANONICAL_RESEND_API_KEY` and `CANONICAL_PROTECTED_EMAILS`
- Any actively enabled forum/reviewer or Stripe integration secrets
- New preview `ANEVUM_PREVIEW_ALLOWED_EMAILS` and `ANEVUM_ACCESS_AUD`

Match the actual Worker D1 bindings and verify the canonical issuer marker. Existing OAuth provider flags must remain **false** until credentials and actual callbacks are tested. Retain the dedicated `a.anevum.com` Worker until migration acceptance.

## Authentication and billing cutover

- Apex sign-in uses `https://anevum.com` as Better Auth baseURL and trusted origin; its cookie prefix is `anevum_can_apex`, with host-only cookies. Existing `a.anevum.com` prefix remains unchanged and cannot grant access on apex.
- Existing `user.id`, member profiles, XP, awards, public walls, and D1 data stay in the same member database, but a user will need to sign in on apex once.
- Register the *new* Google/GitHub/Apple/Microsoft redirect URIs as `https://anevum.com/api/v1/member/auth/callback/<provider>`, alongside the old host only during transition.
- Supporter Checkout/Portal URLs must return to `anevum.com`. Keep billing and Stripe webhooks disabled until separately audited; Cloudflare Access must not intercept a signed server-to-server webhook on public launch.
- Check same-origin CSRF, member signup email codes, expired/replayed OTP, private profile creation, exports/deletion, Member session recovery, and all identity links on apex.

## Mandatory rollback/runbook

1. Record current route ID for `anevum.com/*`, Worker name and full deployment version. Capture anonymous homepage image, `robots.txt`, HTTP headers and favicon behavior.
2. Build the proposed source at an exact SHA, run frontend typecheck/build, `(cd creator-v1 && npm test)`, and `node --test creator-v1/test/apex-prelaunch-gateway.test.mjs`. Run real signed Access browser tests in Chromium/WebKit.
3. Deploy `anevum-apex-prelaunch-gateway` *unrouted*, with its own secrets and ASSETS binding. Do not modify the current countdown Worker.
4. Prove the live candidate's anonymous response is byte/visual-equivalent to the current countdown, including on mobile, and private endpoints return 404/405. Prove authorized preview can load UI, bundled assets, signup API, profile, and Studio without bypasses.
5. Only after the above validations should an operator explicitly update **only** `anevum.com/*` to point at the candidate, preserving `a.anevum.com/*` and all separate protected routes. Validate access immediately after route change.
6. If any unexpected public exposure, login loop, broken CSS, Stripe issue or response mismatch occurs, immediately revert only the apex route to `anevum-construction-terminal`. Do not touch member D1.
7. After acceptance, intentionally redirect, restrict, or retire `a.anevum.com` so it cannot bypass the countdown. Do not disable the only working signup entrance prematurely.
8. At public launch, require separate final approval, D1 backup/restore verification, age/privacy/legal checks, and a production-level member signup/session test before switching both launch flags.

No step here authorizes changing the public apex route without verified controls and owner release signoff.
