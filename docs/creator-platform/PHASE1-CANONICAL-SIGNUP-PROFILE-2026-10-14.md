# ANEVUM Phase 1 — canonical signup → first member profile

**Review-only implementation** — 2026-10-14. Based on verified V007 creator site branch `build/community-profile-showcase-v007-20261014`; integration of the **existing Better Auth member engine**, not another third-party identity service. No hosted staging activation, provider enrollment, migration, account merge, email delivery, signup enablement, DNS or apex deployment is implied.

## Scope completed in source

| Surface | Contract |
| --- | --- |
| `/join`, `/sign-in` | Cinematic invitation sign-in, same-origin capability discovery. Only Google is offered, and only if the canonical **same backend** advertises availability. Email, GitHub, Apple, Microsoft, passkey remain disabled—not faux signup |
| `/member` | Session-bound private first-session profile claim; creates one reserved/unique immutable `@handle`; server-verified display name and biography; privacy starts private, publication requires a second explicit save |
| `/@handle` | Read-only, sanitized, **opt-in** member-world intro; works for a legitimate member with zero projects. Private/unverified/nonexistent member worlds all return the same unavailable state. No email, session, member ID, XP, saved items, RHEN, payment or staff metadata |
| `GET /api/member/creator-profile` | Private canonical Better Auth account profile; never member-selected ID |
| `POST /api/member/creator-profile` | Claim handle once and only for session user; name/bio validated, no user-provided visibility on creation |
| `PATCH /api/member/creator-profile` | Strict revision-match metadata update with explicit `private`/`public`, owner ID from verified session, 20 writes/hour per member |
| `GET/HEAD /api/v1/members/:handle` | Anonymous read with no cookies, sanitized DTO, positive public opt-in and email-verification check |
| `migrations/0005_member_creator_profiles.sql` | Only proposed Better Auth **member** database schema. Foreign-keyed to `user.id` (not Creator V1 account ID); unique case-insensitive handles; private default, revision, created/updated timestamps and edit-limit table |
| `src/server/member.mjs` | Canonical endpoint and Better Auth `databaseHooks.user.create.before` gate **only** for `a.anevum.com`: uninvited identities cannot create new accounts. Existing V5 Google signin remains untouched |
| `creator-v1/web/a-staging-worker.mjs` | Strict limited route adapter for exactly `/api/auth/*`, `/api/member/availability`, `/api/member/session`, `/api/member/creator-profile`, and anonymous `/api/v1/members/:handle`. All other member/staff/RHEN/owner APIs remain blocked. Auth responses preserve secure HttpOnly cookies; anonymous public projections deliberately strip cookies |

## Identity is not yet merged with Creator V1

Two systems remain separate in unreleased source. Canonical Better Auth uses an isolated `MEMBER_DB` and `user.id`; Creator V1's older invitation-only OTP and publish/XP ledger use `COMMUNITY_DB` and distinct member IDs. **There is NO automatic linking based on identical email or handle.** Do not copy hashed sessions or token cookies between these stores.

When staging activates this new canonical experience, *freeze/disable legacy Creator OTP enrollment first*. Reconcile existing reserved Creator handles before allowing invitation-based claims. New members' `/@handle` identity is their actual canonical owner key. Their Creator V1 posts/projects/XP/award selection will not magically transfer; a separately approved dual-auth proof and a replay-safe linking/migration table will be required. Preserve founder RHEN and staff entitlements in independently verified role boundaries throughout.

The legacy `/account` and `/create` Creator V1 draft routes are still separately gated; new canonical onboarding intentionally routes only `/member` and `/@handle` until Creator workflows are reconciled.

## Provisioning gate (NOT executed)

1. Explicit owner approval for a **new, dedicated staging Better Auth D1**; do not bind the older `anevum-members-preview` or the Creator V1 `anevum-creator-v1-staging` as the canonical `MEMBER_DB`. Back up and rehearse restore on disposable copies before any migration.
2. Apply reviewed standalone baseline `migrations/0001_member_platform.sql` and additive `migrations/0005_member_creator_profiles.sql` to that **new** staged member D1. Confirm foreign key, privacy default, unique handles, rate-limit and delete-cascade behavior. Do not run in production or a RHEN D1.
3. Create and verify a *staging-only* Google OAuth client for exact `https://a.anevum.com/api/auth/callback/google`. Provision Better Auth secret, client credentials, and separate invite-allowlist secret using Cloudflare secrets—not source. Require Google's verified email. Existing V5 credentials and owner login must not be migrated implicitly.
4. Configure the dedicated `a.anevum.com` Worker with both existing public `COMMUNITY_DB` and new isolated `MEMBER_DB`; stage flags remain **off** until the owner authorizes activation. Compare exact Cloudflare deployment and binding state first. No cookie proxy to `next.anevum.com`; all canonical login and profile requests are same-origin. Use the inert sample config in `PHASE1-CANONICAL-STAGING-CONFIG.example.jsonc` for a review starting point, never as an automatic release artifact.
5. After separately authorized activation, verify invite-only Google login on an actual browser with two ordinary users and a third uninvited user. User A chooses a handle, gets default private page; explicitly publishes; user B views A but cannot change A. Revoke/expire session, test OAuth callback host/state, cookie scope, sign-out, failed provider, stale revision, handle collision, user erasure, export/recovery and mobile device. Verify the existing privileged owner account retains its own protected systems.
6. Keep `anevum.com` on the construction/countdown page until January 1, 2027 and explicit launch approval.

## Verification and current limits

Focused tests in `tests/phase1-canonical-creator-profile.test.mjs` run against ephemeral in-memory SQLite and fixture users; the Creator V1 CI workflow also builds and checks the React routes and legacy V007 design. All invite/Google readiness claims require the same canonical backend to attest availability; the onboarding deliberately fails closed if credentials, D1 or invitation flag are missing.

The V007 selected award and artifact showcase is **not yet attached** to new Better Auth accounts; it still uses Creator V1's separate verified ledger. Phase 1 therefore renders zero invented awards/XP and public member worlds without requiring an approved publication. Complete avatar/banner media, community contributions, account transfer and other social features follow authenticated staged acceptance, and are not a prerequisite to claiming a private profile.

**Release decision:** SOURCE REVIEW ONLY. No user signup or public profile has been activated. Staging database/API/auth changes need separate owner authorization before deployment; do not merge draft PRs automatically.
