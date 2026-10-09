# ANEVUM.WEB.BUILD.2026-10-08.003.STAGING-MEMBER-ACCEPTANCE

## Scope

This is a follow-on to #228/#229 and production member readiness #230. It does **not** activate signup, migrate production D1, modify the owner RHEN terminal or enable any brokerage action.

## Shipped in this branch

- A private, staging-only page at `/me/verify`, linked from `/me/settings` **only at the exact deployed staging origin**.
- The page uses the actual signed-in browser session and the preexisting member APIs. It performs seven independent, read-only checks of authenticated identity, member profile identity, JSON export identity, RHEN draft non-execution, inactive rewards, absent member brokerage privileges and denial of the operator API.
- Every browser request is GET with `credentials: same-origin`, `cache: no-store`, and manual redirects; no account tokens, user IDs, cookies, emails or raw account payloads are included in the test report. The page shows the already authenticated user's email for clarity.
- The result is explicitly **not** cross-user isolation proof: operator verification, real two-account draft separation, full export/account deletion and real-cookie adversarial CSRF, expiration and rate limiting remain separate acceptance steps.
- Privacy and Terms now explicitly describe optional, saved RHEN draft names and planned exposure/position limits and their non-executing nature. The account settings description is aligned with this actual data.
- Fixture-based automated tests verify identity mismatch detection, financial authority fail-closed, private caching, protected operator denial and read-only request shape.

## Verified infrastructure as of the release

- Production encrypted secret names and types passed the repeat of [read-only readiness #37871211948](https://github.com/anevum/anevum-web/actions/runs/37871211948). This cannot prove OAuth client validity or private Better Auth secret rotation.
- Production D1 currently has **zero** core member tables; automatic production migration remains forbidden.
- Preview D1 migration #37870434124 and staging OAuth deployment #37870434114 passed.
- `ANEVUM_MEMBERS_ENABLED=false` and `ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED=false` remain explicit production configuration, with RHEN operator Access unchanged.

## Owner acceptance procedure

1. In one browser profile sign into `https://anevum-member-staging.devonakins.workers.dev/me/verify` using Google account A; run the checks and inspect failures. Record **only PASS/FAIL** outcomes; never copy session cookies, account exports or secrets into a GitHub issue.
2. In a separate isolated browser profile sign in with Google account B and repeat. Both sets of checks should pass, and the accounts must be distinct.
3. Save different RHEN draft labels using `/apps/rhen/setup` in A and B, independently reload each, and verify each still sees only its own label and planning limits. Download the JSON account export in each private profile and verify its `identity.id` and `rhenDraft` correspond only to that account. Do not post exports publicly.
4. Test account deletion **only with a disposable staging test account**, recheck invalidated sessions and ensure a separate account remains intact. Inspect real OAuth expiration/CSRF/rate limits through approved, authenticated test infrastructure before public launch.
5. Separately verify the production Google OAuth client's authorized origin and callback; privately rotate the production Better Auth secret if it ever appeared in chat/text; confirm actual two-account acceptance and policy text.

The explicitly gated `.github/workflows/member-production-d1-migrate.yml` remains manual-only and requires its own exact confirmation phrase and independent owner-approved security checkboxes. Its success only creates tables and **does not enable public signup**. Do not mark any gate complete from staged fixtures or a simple account-login confirmation alone.
