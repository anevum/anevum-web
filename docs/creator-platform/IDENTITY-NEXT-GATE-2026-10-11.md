# ANEVUM V1 — Authentication and release implementation handoff

Session: ANEVUM.ANEVUM.PLAN.2026-10-11.001.NEW-YEAR-LAUNCH-OVERHAUL
Target release: 2027-01-01
Status: next engineering milestone, not deployed member signup.

## Confirmed baseline
- Creator V1 cinematic frontend is live at anevum.com, served by anevum-creator-v1.
- next.anevum.com has its own isolated D1: anevum-creator-v1-staging (fa96e36d-6257-4883-bf15-074947e11a13); production D1 remains separate.
- studio.next.anevum.com hosts an owner-only Access app, a Worker with validated RS256 signed assertion checks, four staging-only bindings (D1 and issuer/audience/allowed emails), owner authoring, editorial review and audit.
- Staff Studio schema 0002 applied. Nine local integration tests pass. Real owner-session UI acceptance still pending.
- Resend auth.anevum.com is verified. Draft template alias anevum-v1-sign-in-otp (Resend template 7b8650fe-b0fe-4827-a0b6-2f4f642c9af5) created but NOT published or wired to production. No emails sent.

## Next implementation order
1. **Dedicated account identity**: review Better Auth 1.7.5 already present in legacy repository, but do not reuse old V5 database, sessions, OAuth secrets or user IDs. Create dedicated v1 registration, session, account, verification and anti-abuse tables in the staging community D1. Prefer standards-tested auth implementation instead of inventing new crypto. Define user state transitions, unique verified emails/handles, expiration, revocation, CSRF/origin, independent per-environment secrets, retention and deletion.
2. **Private staging email test**: use verified Resend sender only after setting stage-specific least-privilege credential. Publish reviewed email verification template, issue expiring single-use code, verify it without putting plaintext secrets in D1/logging, rate-limit issue attempts and verification attempts, test expired, reused, wrong-account and concurrent verification failures.
3. **OAuth**: create new V1 GitHub and Google callback origins/scopes and state/PKCE checks. GitHub public repository import and OAuth login are separate privileges; do not request broad repo access for login.
4. **Ownership**: link auth principal to creator_profile via immutable member id and normalized unique handle. A public is_staff DB flag must never be sufficient for admin authority. Staging Studio continues to use Cloudflare Access; public creator sessions should not read private staff endpoints.
5. **Creator publishing**: move draft/edit/submit to scoped authenticated member identities; keep publish/reject/changes requests in protected editorial controls. Preserve project version/release history, audit actor, reserved slug handling, content limits and verified external links.
6. **Community integrity**: one active member vote per eligible project, no self-votes, edit replaces prior score, idempotent transaction XP ledger with reversal capability, separate moderator permissions, report queue, publication gating and appeals.
7. **Mobile journey and compliance**: full newcomer/creator/tester walkthrough, settings, account recovery/export/deletion, terms/privacy/reporting, WAF/Turnstile, metrics and monitored rollback.

## Staging / production checks
- Never attach a staging write-enabled Worker to production community D1. Production remains read-only until identity acceptance.
- Separate stage and production auth secrets, OAuth callbacks, email credentials, D1 schemas, backups and versioned migration checks.
- Do not use mock activity or browser-local votes for release readiness.
- Do not import RHEN or V5 auth/broker data.
- Review user-supplied code execution and generated media independently.
- Launch readiness requires real signed-in owner and non-owner browser tests, not just fixture-signed JWTs.
- GitHub source work is on branch build/anevum-v1-newyear-overhaul-20261011; keep the approved cinematic identity.

## Jan 1 nonblocking ideas
Creator release diaries, newcomer First Launch Arcade, challenge jams, collectible artifact levels, accessible phone-first catalogue, review quality awards, collections, contributor attribution and selected GitHub verified source links. Delay third-party binary hosting, paid marketplace payouts, complex Discord syncing and autonomous coding agents until after core publishing and safety is stable.
