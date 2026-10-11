# ANEVUM V5 — member sign-in expansion

Session: ANEVUM.WEB.BUILD.2026-10-11.016.MULTI-METHOD-MEMBER-AUTH
Parent program: #259; public opening milestone: #308.

## Current state

Google social sign-in and the member database exist on the live website.
This patch is **source-only**. It does not create provider applications, send real emails,
migrate a database, activate a new method, authorize external integrations, grant broker
permission, or deploy a new Worker. Both new method flags are FALSE in all committed Worker configs.

## Proposed login order

1. Keep Google operational. Add GitHub OAuth and passwordless email one-time codes next.
2. Follow with passkeys (WebAuthn), Microsoft personal accounts and Apple when credentials,
   enrollment and migration/recovery checks are possible.
3. Consider Discord (maker communities), LinkedIn (professional audience), and Reddit
   (community identity) only if users request them. LinkedIn may not provide a verified
   email claim. Reddit may require approval for commercial API usage.
4. Consider SMS phone sign-in only after provider pricing, rate/country/abuse controls,
   account recovery and the required database migration are separately accepted.
5. Defer X, Facebook, Twitch, Spotify and unrelated identity providers until there is
   demonstrated member demand; keep the login page simple on mobile.

### Not a login method

Alpaca Connect must stay **a member-initiated brokerage authorization**, not ANEVUM
registration. A dedicated GitHub account connection for developer projects must likewise
be separate from minimal GitHub sign-in; never request repo write scopes to log in.

## This source increment

- Adds optional GitHub social provider with profile/email read scopes. Requires both
  `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` and
  `ANEVUM_GITHUB_OAUTH_ENABLED=true`. Production callback:
  `https://anevum.com/api/auth/callback/github`.
- Adds gated email sign-in with an eight-digit, ten-minute, three-attempt hashed OTP,
  delivered by Resend from a verified `@anevum.com` sender. Required secrets:
  `ANEVUM_AUTH_RESEND_API_KEY` and `ANEVUM_AUTH_EMAIL_FROM`;
  `ANEVUM_EMAIL_OTP_ENABLED=true` must be explicitly set after delivery tests.
  New outbound email service setup/fees require separate owner approval.
- Adds server-advertised authentication capabilities to the actual sign-in form; methods
  without enabled flags AND credentials are not presented. Existing Google remains
  available if the new capability-check request is unavailable.
- Updates public beta signup copy to offer a method selector instead of promising Google
  alone. Existing callback URLs remain fixed local ANEVUM paths.
- Retains encrypted OAuth tokens, database-backed rate limits, disabled implicit
  account linking, exact user-ID owner binding and independently validated Cloudflare
  Access. Email OTP is disabled for known Studio and RHEN operator addresses at code
  issuance and redemption; these accounts retain their established method.
- Production RHEN brokerage, Commons social pilot and Studio publishing flags remain
  untouched and disabled.

## Release gates

- [ ] Exact-head automated tests, TypeScript, build and browser QA pass.
- [ ] Verify Google login and logout regression with the existing Studio owner.
- [ ] Create a separate ANEVUM GitHub login OAuth app, least-privilege email/profile
      permissions and production callback. Provision Worker secrets; verify identity
      with an independent ordinary member in isolated staging.
- [ ] Verify an approved Resend account and sender/domain DNS; test actual code
      delivery, expiration, resend limits, wrong-code lockout and unknown emails.
- [ ] Verify two real independent users and an existing Google account cannot
      implicitly merge with a GitHub account at the same email. Add explicit
      logged-in account linking later, after recovery and collision checks.
- [ ] Confirm owner/staff OTP denial and Studio/Command access with different
      identities; retain separate founder ID and Access gates.
- [ ] Independently authorize production flag changes and deploy through the
      already-approved manual production process. Do not enable all providers
      or initiate a paid subscription from this source PR.

This work does not alter Alpaca application review, service integration credentials,
public launch gates, or already registered Google-member records.
