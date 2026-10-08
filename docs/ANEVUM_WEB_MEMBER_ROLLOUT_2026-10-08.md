# ANEVUM.WEB.BUILD.2026-10-08.005.MEMBERS-APP-PLATFORM — rollout
**Status:** Code implemented behind disabled gate; external resource setup and sign-in validation outstanding.  
**Owner-approved identity:** Independent software workshop with RHEN as its first app; public project content does not require login.

## What exists in the repository

- React sign-in and personal My Space/settings; follow/save RHEN, display name, sign out, deletion.
- RHEN app with overview, sanitized public evidence, research, and updates. It is *not* a user brokerage account.
- Server-side D1 member tables and sessions using pinned Better Auth + Google OAuth. Account writes always derive the user ID from the verified server session.
- `/api/member/availability` returns `available:false` until every condition is satisfied.
- Existing Cloudflare Access `/command` and `/api/command/*` remain the only authority for RHEN operator controls. `/apps/rhen/command/*` redirects to that existing protected URL; it never serves private information itself.
- `ANEVUM_MEMBERS_ENABLED=false` by default in `wrangler.jsonc`. No production accounts or OAuth login are claimed.

## External blocker recorded October 8, 2026

GitHub Actions' current Cloudflare deployment token can deploy the Worker but received Cloudflare API **Authentication error 10000** for `/accounts/<id>/d1/database` when running `wrangler d1 list --json`. Consequently, the D1 resources were **not created**, their UUIDs are unknown, no migrations have been applied remotely, and no database binding has been added to `wrangler.jsonc`.

Do not treat the GitHub job's `success` as database provisioning success: that optional exploratory step used `continue-on-error:true`; it has now been removed.

## Setup steps needed before enabling public member accounts

These are one-time operator/provider tasks and require explicit Cloudflare/Google credentials. Do not put tokens in GitHub source or chat.

1. In Cloudflare, use a token restricted to the ANEVUM account with **D1:Edit** (and the existing Worker deploy permissions). The API token is set as `CLOUDFLARE_API_TOKEN` in the repository's GitHub Actions secret store; the current token does not have D1 privileges. Alternatively create the databases in the Cloudflare dashboard with an authorized account, leaving the existing deployment token unchanged.
2. Create **two D1 databases**, `anevum-members` (production) and `anevum-members-preview` (test), and record their real UUIDs. Never assign the production database to a preview Worker. Both can live in the same Cloudflare account.
3. Add the production database to `wrangler.jsonc` after its real UUID exists:
   ```json
   "d1_databases": [{
     "binding": "MEMBER_DB",
     "database_name": "anevum-members",
     "database_id": "<ACTUAL_PRODUCTION_D1_UUID>",
     "migrations_dir": "migrations"
   }]
   ```
   Add the preview database under `previews.d1_databases` when using Cloudflare preview resources, with `binding:"MEMBER_DB"`, its own name, and its own UUID. Use a **separate** preview migration config that targets only preview DB. Never test member data with a production D1 binding.
4. With an authorized Cloudflare token, apply `migrations/0001_member_platform.sql` to **preview first**, then test profile persistence, login, deletion and cross-user isolation. Apply the same migration to production only after the preview result is verified. Wrangler: `npx wrangler d1 migrations apply anevum-members --remote` after binding config is checked. Verify applied migrations and table schema, do not blindly replay SQL.
5. Create a Google OAuth **Web application** credential in Google Cloud. Set the exact authorized redirect URI `https://anevum.com/api/auth/callback/google` and authorized JavaScript origin `https://anevum.com`. Verify the app's consent screen and publish/tester status.
6. Set Cloudflare Worker secrets, not repository variables: `BETTER_AUTH_SECRET` (independent cryptographically generated random value >=32 characters), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Do not publish OAuth secrets in a React bundle or wrangler source. `ANEVUM_MEMBERS_ENABLED` remains false while testing.
7. Review and approve the actual `/privacy` and `/terms` pages for public signup. They are drafts. Verify account deletion, complaint contact address, user data export/access requests, and any retention statements against real provider policies.
8. Validate the deployed preview and production Worker bindings with a secure integration test. Confirm unauthenticated and expired sessions return 401 on member API; cross-member data access fails; direct requests to `/api/command/*` remain 401/403 without Cloudflare Access regardless of Better Auth cookies; all protected routes are noindexed/no-store; OAuth callback state/nonce behavior works; authorized operator controls remain unchanged.
9. Only after a real Google callback round-trip and user-isolation checks pass, enable `ANEVUM_MEMBERS_ENABLED=true` in Cloudflare production deployment configuration, deploy, and verify a new account and account deletion. Do not announce signup earlier.

## Route contract

| Route | Audience |
| --- | --- |
| `/`, `/products`, `/feed`, `/field-notes` | Public |
| `/sign-in`, `/me`, `/me/settings` | Signup/account (gated until fully configured) |
| `/apps/rhen/*` | Member research/evidence app; no user broker connection |
| `/apps/rhen/command/*` | Redirect to the legacy protected Command route |
| `/command/*`, `/api/command/*` | Cloudflare Access-verified RHEN operator only |
| `/api/member/*`, `/api/auth/*` | New member-only backend; gated until enabled |

## Tests and release gates

- `npm run test:members` exercises fail-closed auth responses and explicit Command separation.
- `scripts/verify-member-schema.py` validates migration syntax, ownership, and cascade behavior with SQLite.
- Existing GitHub Actions verifies RHEN operational boundary tests, TypeScript/build, route/SEO/privacy probes, desktop and mobile browser captures, and visual assertions.
- Never introduce multi-user broker write authority while enabling member profiles.
- No new Railway service, Supabase deployment, or payment platform is needed for this release.

## Remaining choices

- Google OAuth production credentials, D1 provisioning permission, migrations and production secret values remain external.
- Legal/privacy drafts require founder approval before public account registration.
- Full account data export and notifications are not offered in the initial UI. Before making a public signup claim, finalize the user's account data access process.
- The broader site design pass beyond Home/Projects can continue independently of signup; it must preserve honest RHEN data.
