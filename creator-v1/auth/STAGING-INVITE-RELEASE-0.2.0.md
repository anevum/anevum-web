# ANEVUM V1 — invitation-only staging signup release

**Session:** `ANEVUM.WEB.BUILD.2026-10-11.005.MEMBER-SIGNIN-STAGING`
**Date (America/New_York):** 2026-10-11
**Status:** staging invite login switched on; public production signup is **not** enabled.
**Source:** `build/anevum-v1-newyear-overhaul-20261011`, PR #334.

## Delivered

- Corrected the real Cloudflare Worker route `next.anevum.com/api/v1/member/*`; accessible account page at `/api/v1/member/join`, CSS at `/join.css` and JS at `/join.js` below that route. Removed obsolete `next.anevum.com/join*` deployment route from source configuration.
- Cinematic creator identity page, OTP request/verify, owner-scoped profile, sign-out; this page uses only server responses and no fictitious community activity.
- Strict server-side Turnstile validation on the allowed `next.anevum.com` host, before any invite-check response; no inviting-email enumeration via invalid challenge tokens.
- Explicit `STAGING_JOIN_ENABLED` release switch and `STAGING_INVITE_EMAILS` server-only allowlist, limited to two operator addresses during testing. Uninvited emails receive a generic response without a delivery attempt or account creation. Changing an email in the frontend does not grant access.
- Published Resend transaction template alias `anevum-v1-sign-in-otp`; Worker sends template variables instead of composing unreviewed email text. Each logical code challenge has a separate Resend idempotency key.
- Resend API sending-only credential restricted to the already verified `auth.anevum.com` domain, held in the staging Worker's secret binding. No API key value is written to source, issue comments or public HTTP responses.
- Separate Worker secrets: `AUTH_PEPPER`, `TURNSTILE_SECRET`, `RESEND_API_KEY`, `STAGING_INVITE_EMAILS`, `STAGING_JOIN_ENABLED`.
- No production or archive bindings; only `COMMUNITY_DB` points to `anevum-creator-v1-staging`.
- Node 22 local suite: **20/20 passed**, including OTP expiry/reuse, multi-account isolation, throttling, secret-fail-closed, forged token, cross-origin denial, invitation checks and route correctness.
- Cloudflare uploaded the two modules with explicit inherited secret bindings, preserving keys. Real Cloudflare Browser Rendering loaded the new join page and real health returned `signupEnabled:true` after activating the invite gate.
- Staging database audit after deployment: zero member accounts, zero sessions, zero email challenges. No test member or email was silently created.
- `anevum.com/*` remained on `anevum-creator-v1` with only production community D1.

## Operator acceptance still required

1. An authorized owner must complete a **real browser** staged signup with a challenge, receive the actual email and verify the code; check the secure cookie and profile create/edit/sign-out on the same device.
2. Test with one disallowed email address (its request must not send an email or create an account), and a second browser with no session.
3. Verify accessibility/reduced motion/mobile, OTP delivery/bounce, error recovery, real D1 concurrent requests and post-expiration session revocation. CI passing against local SQLite mocks is **not** equivalent to these tests.
4. Security review: this is an independently implemented authentication prototype using WebCrypto, not Better Auth or another audited provider. Evaluate migration to Better Auth before open registration, plus account export/deletion, lifecycle notices and abuse monitoring.
5. After invited testing, implement member-owned draft/project submission and a separate staff moderation queue before any public publishing. Do not give new member sessions staff roles.
6. Before any production promotion, stage distinct production OAuth/email secrets, run backup/rollback rehearsal and obtain approved release commit with explicit authentication acceptance.

## Immutable product boundaries

- Do not switch public signup on at `anevum.com` based on this staging release.
- Do not connect to RHEN, broker accounts, archived V5 sessions, or user-supplied executable software.
- No paid XP, vote weight or fictional activity; levels/votes only after identity, ownership and moderation.
- Preserve the approved cinematic design and meaningful free participation.
