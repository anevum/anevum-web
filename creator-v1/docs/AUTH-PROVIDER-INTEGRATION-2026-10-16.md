# ANEVUM / Canonical member access — provider integration

Session: `ANEVUM.WEB.PATCH.2026-10-16.001.PUBLIC-SIGNUP-INTEGRATION`
Origin: https://a.anevum.com
Scope: isolated canonical identity only; NOT RHEN/V5 legacy member DB, Command, or the apex countdown.

## Verified October 16, 2026

- The routed Worker is `anevum-creator-v1-a-staging`, connected to D1 `anevum-canonical-member-staging`.
- Public email-code registration was activated and verified from the live `/api/v1/member/auth-methods` and `/api/v1/member/health` endpoints; both report registration `open`.
- The join page renders OPEN REGISTRATION. Resend sender `auth.anevum.com` is verified; recent POST /emails returned HTTP 200.
- Independent delivery into a new visitor's mailbox, verification, profile claim, and session recovery **are not yet independently revalidated** after changing the public flag.
- Google, GitHub, Apple, and Microsoft still return `available:false`; no corresponding OAuth Client ID/Secret bindings currently exist in the routed Worker. Never claim these providers are live before end-to-end consent/callback tests.

## Provider registration and secrets

Register each OAuth app with an exact callback on the real host. Use the Cloudflare Worker Secrets facility; never place credentials in GitHub, public Vite variables, docs, tests, or chat.

| Provider | Worker secret names | Exact redirect URI |
|---|---|---|
| Google | `CANONICAL_GOOGLE_CLIENT_ID`, `CANONICAL_GOOGLE_CLIENT_SECRET` | `https://a.anevum.com/api/v1/member/auth/callback/google` |
| GitHub | `CANONICAL_GITHUB_CLIENT_ID`, `CANONICAL_GITHUB_CLIENT_SECRET` | `https://a.anevum.com/api/v1/member/auth/callback/github` |
| Microsoft | `CANONICAL_MICROSOFT_CLIENT_ID`, `CANONICAL_MICROSOFT_CLIENT_SECRET` | `https://a.anevum.com/api/v1/member/auth/callback/microsoft` |
| Apple | `CANONICAL_APPLE_CLIENT_ID`, `CANONICAL_APPLE_CLIENT_SECRET` | `https://a.anevum.com/api/v1/member/auth/callback/apple` |

Set the provider's `CANONICAL_<NAME>_ENABLED=true` **only** after provisioning credentials, validating callback domain, and reviewing the deployed code. A provider must be disabled otherwise.

- Google: OAuth Web Application; authorize the exact callback and `https://a.anevum.com` origin, configure consent screen/test/published status.
- GitHub: OAuth App; the "Authorization callback URL" is the exact URI above.
- Microsoft: App registration for personal+organizational accounts using the `common` tenant option already present in source; add Web redirect URI.
- Apple: Apple Developer account, App ID, Sign in with Apple Service ID, Team ID, Key ID, and `.p8` private key are necessary to generate a signed **client-secret JWT**. The JWT has an expiration limit of six months; create a secure secret rotation process, do not store the private key or JWT in GitHub. Configure Service ID with verified domain `a.anevum.com` and the exact return URL. Apple's `form_post` callback requires isolated POST callback handling and `https://appleid.apple.com` in Better Auth trusted origins. Do not activate without a real callback test.

The personal Apple Developer membership is not included in ANEVUM infrastructure and may require a fee. Passkeys are a separate WebAuthn/passkey-plugin project and should remain disabled until credentials, recovery, and browser verification have been implemented.

## Account continuity and constraints

All sign-in methods must use the **same canonical** `user.id`, D1 member profile, XP, awards, and wall. No separate per-provider member records. The auth `account` table stores multiple linked methods for the existing member.

- An existing email-code member must sign in first, then explicitly choose CONNECT [PROVIDER] from their member account. `linkSocial({provider,callbackURL:"/member"})` is routed only for a verified session and allowed configured provider, with a fixed callback path and bounded request body.
- Keep `disableImplicitLinking:true`, `allowDifferentEmails:false`, `allowUnlinkingAll:false`, and `updateUserInfoOnLink:false`. **Never** auto-merge solely on matching email or provider claims. If sign-in returns `account_not_linked`, instruct the visitor to sign in with their existing method and connect it from their account.
- No cross-subdomain cookie sharing, linking to Creator V1 legacy accounts, V5 account merging, elevated roles, RHEN/Stripe entitlements, or implicit Apple relay email re-binding.
- Only enabled providers may be shown on the public join page; the API must remain the source of truth. Account linking must hide entirely while no configured providers are live.

## Pre-activation acceptance for each provider

1. Run `npm install --ignore-scripts`, `npm run check:creator-v1-web`, `npm run build:creator-v1-web`, `node --test creator-v1/test/canonical-auth-worker-v013.test.mjs`, and `(cd creator-v1 && npm test)` from the repository root; use CI on the PR.
2. Verify there is exactly one intended Worker route and one canonical member D1 binding; confirm auth and email secrets are still bound and private. Keep the apex `anevum.com/*` route untouched.
3. Test a never-before-registered identity, failed/expired/replayed code, callback cancellation, and at least one provider authentication with a consented test account. Confirm verified email and a single canonical user row.
4. For a member already enrolled by email, explicitly link the provider, sign out, sign back in using that provider, and confirm the same `user.id`, handle, level, awards, saved content, profile privacy, and deletion controls.
5. Confirm unverified sessions, cross-site link attempts, open redirects, foreign cookies, disabled providers, and duplicate provider ownership cannot create or link accounts.
6. Record source SHA, deployed Worker version, test evidence, and a rollback version before enabling the next provider. Deploy one provider at a time and read `/api/v1/member/auth-methods` after each change.

## Release safety

- The canonical code branch is **not** a deployment authorization. These changes are intentionally held in a draft PR pending test results and real provider credentials.
- Existing historical V031/V041 release workflows explicitly assert `CANONICAL_PUBLIC_SIGNUP_ENABLED=false`. Do not re-run them against today's open-registration Worker or use stale `wrangler.a-progression-v031.jsonc` and similar artifacts to redeploy; they may overwrite the live flags.
- `creator-v1/wrangler.a-signup-staging.jsonc` was updated to preserve public email registration in source, but a deployment must still preserve other live bindings and feature flags. Do not use the historical configuration blindly to replace the current Worker.
