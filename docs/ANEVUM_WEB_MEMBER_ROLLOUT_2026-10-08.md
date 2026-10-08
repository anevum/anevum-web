# ANEVUM.WEB.BUILD.2026-10-08.005.MEMBERS-APP-PLATFORM — rollout

**Status (2026-10-08):** Both D1 databases provisioned and verified. This change binds distinct production/preview databases and introduces preview-only schema migration automation. Real Google OAuth and public signup are **not** enabled.
**Identity:** ANEVUM is an independent software workshop. Command is the member account/program hub; RHEN is its first project, with the private operator RHEN Terminal remaining a distinct authorization domain.

## Verified D1 provisioning

GitHub Actions [run #37836895576](https://github.com/anevum/anevum-web/actions/runs/37836895576) completed successfully in `create-missing` mode using `CLOUDFLARE_D1_TOKEN`, creating both resources. Its Cloudflare inventory returned these UUIDs:

| Environment | D1 name | Verified UUID |
| --- | --- | --- |
| Production | `anevum-members` | `7f0d4c0c-2e85-4900-8504-1347954e1df1` |
| Preview | `anevum-members-preview` | `a537432e-d216-4b31-8b22-19662cc3a44a` |

The earlier Cloudflare token error (10000) was solved by a separate scoped D1 Edit token stored in GitHub Actions. The earlier `--json` unsupported argument to `wrangler d1 create` was fixed and verified. Keep that D1 token separate from the Worker deployment token.

## Deployment and isolation

- `wrangler.jsonc` binds `MEMBER_DB` to **production** D1 under `d1_databases` and to the **preview** D1 under `previews.d1_databases`. These are different real database UUIDs.
- `wrangler.preview-migrations.jsonc` targets only `anevum-members-preview` for remote Wrangler migrations. Do not use the ordinary production Wrangler config to migrate preview.
- `scripts/verify-member-bindings.mjs --require-config` and the binding/isolation tests run on every GitHub PR and main build.
- `.github/workflows/member-preview-d1-migrate.yml` applies only to preview D1 after related files merge to `main`. It requires validated UUIDs from Cloudflare inventory, verifies the production member gate remains false, applies the committed schema, reads back all nine member tables, and checks foreign keys. Its result must be independently inspected; a successful web deployment alone does not prove D1 migration success.
- **No** automated production D1 migration, real account signup, brokerage account binding, payment integration, or Cloudflare Access policy change is part of this release.

## What the member platform contains

- `/me`: new member Command home; saved applications, followed projects, and real project updates (login gated). `/me/settings` handles profile edits, JSON export, sign out, and deletion.
- `/apps/rhen/*`: member research/evidence workspace with sanitized public evidence; it is not a personal broker account or trading controller.
- `/command/rhen/*` and `/api/command/*`: protected RHEN Terminal and operator APIs. Cloudflare Access authorization is **not** conferred by Google/member sign-in.
- `src/server/member.mjs`: disabled-by-default Better Auth Google OAuth identity backend, D1 session tables, ownership-isolated state, and account export/deletion.
- `/api/member/availability` intentionally responds `available:false` until secrets, schema, origin, and explicit activation conditions all pass.

## Remaining activation gates (ordered)

1. Verify merged `wrangler.jsonc` production and preview bindings, normal website deployment, and the **separate** preview migration workflow success. Confirm Cloudflare lists the nine member tables in the preview D1, not the production D1.
2. Configure a stable, dedicated HTTPS staging Worker origin with **preview D1 only**. Set `ANEVUM_MEMBER_PREVIEW_ENABLED=true`, `MEMBER_PREVIEW_ORIGIN`, and the member enablement flag in that **isolated staging Worker only**, never in production. Validate staging's Worker/Google callback paths.
3. Create Google OAuth Web client credentials and configure the correct approved callback(s), including `https://anevum.com/api/auth/callback/google`. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a >=32-character random `BETTER_AUTH_SECRET` using Cloudflare Worker secrets rather than GitHub source or chat.
4. Complete Google login/logout, OAuth callback state, cookie security, expiry, CSRF/origin, member data isolation with two real staging users, JSON export, deletion, and rate limits. Run `scripts/verify-member-staging.mjs` against real distinct staging sessions; fixture-only browser tests do not satisfy this gate.
5. Confirm Cloudflare Access routing allows ordinary members to visit their account Command while continuing to protect `/command/rhen/*` and all `/api/command/*`. Verify ordinary members are explicitly denied operator access.
6. Review `/privacy` and `/terms` against the actual data collection/deletion/retention practices. Obtain owner approval **before real public signup**.
7. After preview security validation and approvals, migrate **production** D1 using the separately verified production binding, set production Worker secrets, explicitly enable `ANEVUM_MEMBERS_ENABLED=true`, and test actual signup/deletion and account isolation.
8. Only advertise the RHEN app as available in the product registry when authenticated member access actually works. Personal Alpaca OAuth, member-specific bots, funding, and rewards are distinct, later regulated workflows.

## Checks

- `npm run test:members` and `node --test tests/member-bindings.test.mjs tests/member-staging.test.mjs tests/member-preview-migration.test.mjs`.
- `node scripts/verify-member-bindings.mjs --require-config` and `python scripts/verify-member-schema.py`.
- GitHub Actions production/preview builds, operational boundary tests, public privacy/noindex checks, and responsive UI/browser QA.

Live RHEN order flow, strategy promotion gates, and current Railway deployment must remain unchanged.
