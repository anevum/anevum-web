# Manual member D1 provisioning workflow

This is a one-time operator action for issue #210. The GitHub Actions workflow `.github/workflows/member-d1-provision.yml` is **manual only** and defaults to inspection. It never migrates data, changes bindings, sets OAuth secrets, or enables membership.

## Setup
1. In Cloudflare, create a scoped token on the ANEVUM Cloudflare account granting D1 Write (and only required supporting read access). Do not paste the token into chat.
2. Add it to the `anevum/anevum-web` GitHub Actions repository secrets under the exact name `CLOUDFLARE_D1_TOKEN`. Preserve the existing `CLOUDFLARE_API_TOKEN` Worker deployment secret. `CLOUDFLARE_ACCOUNT_ID` must already exist and identify the deployed ANEVUM account.
3. Open the `Provision ANEVUM Member D1 (Manual)` GitHub Actions workflow and select **Run workflow** on the protected main branch.
4. Run `inspect` first. If it reports permission errors, fix the scoped token before doing anything else.
5. To create absent databases only, select `create-missing`, and enter `CREATE_MEMBER_DATABASES` exactly as the confirmation string. This is a deliberate user action. Existing named databases are not dropped or overwritten.
6. Read the workflow job summary for the verified UUIDs of `anevum-members` (production) and `anevum-members-preview` (preview). The UUIDs are resource identifiers, not secrets, but do not print tokens, cookies, or OAuth client secrets.

## After provisioning
Add the real UUIDs to the production and Preview D1 bindings in `wrangler.jsonc`, plus the separate `wrangler.preview-migrations.jsonc` file. Run `node scripts/verify-member-bindings.mjs --require-config` on the resulting branch and keep `ANEVUM_MEMBERS_ENABLED=false`.
Apply migrations to the preview DB first using `npx wrangler d1 migrations apply MEMBER_DB --remote --config wrangler.preview-migrations.jsonc`, then verify the staging schema. Preview Google OAuth secrets, exact callback, and separate origin must be configured and tested before production.
Only after real staging acceptance, explicit privacy/terms approval, Cloudflare Access path isolation, and operator authorization can production membership be switched on. No RHEN trading or broker-write changes are authorized by this workflow.
