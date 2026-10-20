# ANEVUM V1 — Staging member identity prototype

**Session:** `ANEVUM.WEB.BUILD.2026-10-11.004.MEMBER-IDENTITY-FOUNDATION`  
**Status:** invitation-only staging sign-in is enabled; public production signup remains disabled, pending independent security and real owner-browser acceptance.  
**Target staging route:** `https://next.anevum.com/api/v1/member/*` on independent Worker `anevum-member-auth-staging`.  
**Staging data:** `anevum-creator-v1-staging` only. Never bind production, archive/V5, or RHEN data.

## Implemented

- Passwordless email sign-in prototype: 8-digit expiring code, one-time consume, 5 attempts maximum, code only stored as HMAC (no plaintext), Resend delivery only when a restricted secret is explicitly configured, Turnstile verification required before sending.
- HMAC-hashed server-side session tokens, `__Host-` Secure/HttpOnly/SameSite=Lax cookie, revocation on sign-out, active-account checks and expiry.
- Per-email and per-IP issuance/verification throttles (keys are keyed hashes, not raw addresses), same-origin write enforcement, bounded request bodies, reserved handles, immutable member IDs, server-owned `is_staff=0` and uniqueness constraints.
- Authenticated `/me`, first-time creator profile setup and updates; public creator project listings are handled by the existing separate read-only catalogue.
- Approved-theme responsive `/join` screen with Turnstile placeholder, genuine disabled-registration state, and code/profile forms gated by API readiness. The static UI is a separate module, built from `ui/` using `node build.mjs`.
- Scheduled cleanup of expired challenges, sessions and limiter entries; no arbitrary app-code execution or private brokerage access.
- No fake creator accounts or publishing permissions; a member cannot call the staff-only Studio.

## Security gate

This is a **staging-only independently implemented auth prototype**, not yet an audited production authentication provider. Before production rollout, compare/replace the session/OTP layer with a reviewed framework such as Better Auth 1.7.5 (already present in the archived repository) or obtain equivalent independent security review. Run concurrency tests against real D1, register/non-register abuse controls, account export/deletion, account recovery, security notifications, provider delivery, backup/restore and real-owner/non-owner browser acceptance. Cloudflare D1 one-query compare-and-swap prevents ordinary OTP reuse; it is not a claim of formally verified distributed consistency.

Required Worker bindings:
- `COMMUNITY_DB`: stage D1 id `fa96e36d-6257-4883-bf15-074947e11a13`.
- `AUTH_PEPPER`: 32-byte random secret encoded as 64 lowercase hex chars, created as Cloudflare Worker secret, never stored in Git/source/logs.
- `TURNSTILE_SECRET`: Turnstile validation secret for exact staging hostname; without it registration is disabled.
- `RESEND_API_KEY`: sending-only key restricted to verified sending domain `auth.anevum.com`; without it registration is disabled. Do not print the token in Git, comments, client code or logs.

### Routes

| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/member/health` | basic staging availability, signup readiness |
| POST | `/api/v1/member/start` | anti-abuse challenge then email OTP; generic 202 |
| POST | `/api/v1/member/verify` | consumes correct OTP, creates account/session; secure cookie |
| GET | `/api/v1/member/me` | authenticated identity and optional public creator handle |
| POST | `/api/v1/member/profile` | creates/updates only signed-in member's creator profile |
| POST | `/api/v1/member/sign-out` | revokes only current session and clears cookie |

### Join interface

The extra route `next.anevum.com/join*` serves `/join`, `/join.css` and `/join.js` from the isolated member Worker. The base preview Worker and main production site remain unchanged. The page checks `/api/v1/member/health`, and accurately displays registration as closed unless both Turnstile and email bindings are configured.

### Local tests

```bash
cd creator-v1
node auth/build.mjs
node --test auth/tests/member-auth.test.mjs
```

Node 22.13+ (`node:sqlite`) runs in-memory deterministic tests. Test email and Turnstile responses are mocked; no actual email sent. Tests do not import third-party code or depend on V5 data.

### Deployment guardrails

1. Apply `0003_member_identity_staging.sql` only to staging D1.
2. Upload this Worker as its own Cloudflare script with **only** staging D1 and Auth pepper; initially omit Resend and Turnstile secrets so public registration fails closed (503).
3. Attach a narrowly scoped `next.anevum.com/api/v1/member/*` route. Keep the public `next.anevum.com` Worker and `anevum.com/*` production Worker unchanged.
4. Verify isolated health, 503 on registration without email providers, 401 on `/me`, no cookie leakage, unchanged preview homepage and no unexpected routes.
5. Configure Turnstile and restricted Resend sending credential after security review; complete actual owner/non-owner UI acceptance on staging before authorizing production registration.

## Next

Add a real accessible join/profile UI on the approved cinematic design, full member account deletion/export, single-member ownership and project draft publishing, then verified vote/XP ledger. Do not add levels or voting before identity and moderation checks.
## Latest staging release (2026-10-11)

See [STAGING-INVITE-RELEASE-0.2.0.md](STAGING-INVITE-RELEASE-0.2.0.md) for the deployed staging configuration and acceptance gates. The signup page and assets are now inside [next.anevum.com/api/v1/member/join](https://next.anevum.com/api/v1/member/join). Email verification uses published Resend template `anevum-v1-sign-in-otp`, a sender-domain-restricted secret and a server-only invitation allowlist. Twenty local identity tests passed. The production site does not share staging secrets or identity tables.

**Staging activation bindings:** `RESEND_API_KEY`, `TURNSTILE_SECRET`, `STAGING_INVITE_EMAILS` and `STAGING_JOIN_ENABLED=true` (last two are server-only Worker secrets). Existing initial deployment instructions above describe the earlier fail-closed state before invited testing was enabled.
