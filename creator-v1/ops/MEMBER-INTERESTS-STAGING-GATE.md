# Creator V1 — private discovery interests staging release gate

Session: `ANEVUM.WEB.BUILD.2026-10-13.014.MEMBER-DISCOVERY-INTERESTS`

**Status: source-only draft, not an authorized deployment.** This extends an invited member's account and adds an isolated staging D1 schema. It is not part of the approved **public-only** React staging release from PR #358.

## Trusted boundaries

- Existing public `anevum.com/*`: Worker `anevum-creator-v1`, production D1 **6c7b5f0c-33db-4b6a-9569-0a6af5e07534** — NEVER TARGET.
- Existing Creator V1 staging member API: `next.anevum.com/api/v1/member/*` Worker `anevum-member-auth-staging`.
- Existing Creator V1 staging read-only React site: `next.anevum.com/creator/*` Worker `anevum-creator-v1-react-staging`.
- Allowed staging D1 **fa96e36d-6257-4883-bf15-074947e11a13**, database name `anevum-creator-v1-staging` in `creator-v1/wrangler.react-staging-path.jsonc`.
- Feature branch (draft PR #360): `feature/creator-v1-member-discovery-interests-20261013`, exact head recorded by current green CI run.
- This migration does NOT alter `projects`, `creator_profiles`, public read-only catalogue queries, roles, signups, billing, votes or XP.

## Mandatory staged sequence (separate operator approval)

1. Review PR #360, its full GitHub Actions `Creator V1 Verify` run, and the identity/privacy integration tests. Preserve the exact reviewed SHA. Never substitute a floating `main` checkout.
2. Confirm Cloudflare routes, account, and the exact staging D1 UUID above. Verify `member_accounts` exists and `member_discovery_preferences` has not already been provisioned. Do not enumerate or export member records into logs.
3. Capture a pre-migration staging D1 restore checkpoint and independently confirm the restore path. Changes to the database require separate authorized execution and recorded rollback evidence.
4. From a verified source checkout, the candidate migration is `creator-v1/auth/migrations/0007_discovery_preferences.sql`. An example of the **staging-only** CLI execution, after validating the Wrangler account/config, is:
   ```sh
   npx wrangler d1 execute anevum-creator-v1-staging --remote --config creator-v1/wrangler.react-staging-path.jsonc --file=creator-v1/auth/migrations/0007_discovery_preferences.sql
   ```
   Never replace this database name/config with production or an unreviewed value. This instruction is documentation, not proof the command was run.
5. Verify `0007_discovery_preferences` in `schema_migrations`, account foreign-key integrity, the no-extra-tables diff and the precise D1 ID. No private rows should appear in the public logs.
6. Independently deploy the **verified member Worker** code with its existing secrets and isolated D1 binding; do not deploy it with the React-only public release workflow. Confirm `/api/v1/member/health` and anonymous `/api/v1/member/interests` = **401**. POST from untrusted origin must = **403**. Other member endpoints must remain unchanged.
7. With two real *invited* identities, prove Member A and B can independently save, read, clear and privately export interests. Confirm neither can read the other's choices, and public `/creators/:handle` and `/creator/api/v1/*` never return preference content. Confirm schema remains available after session refresh.
8. Only then stage the matching `/creator/account/interests` React UI. Verify actual writes at 1440px desktop and 390px/320px phones and accessible keyboard use. Do not turn on public signups or deploy to the apex.
9. Record the exact Member Worker version, D1 checkpoint, React source SHA, deployment ID and tested accounts in private operations evidence. Owner launch acceptance and later public deployment remain independent.

## Rollback and privacy

The safe UI rollback is the immediately previous `anevum-creator-v1-react-staging` version. For member errors, restore the previous verified member Worker version; keep the extra D1 table inert until the failure is diagnosed. **Do not DROP the table or perform a destructive Time Travel restore** without a separately reviewed data-retention decision, since preferences saved after migration must not be silently destroyed. Privacy export includes `section=interests` for recent authenticated sessions; account deletion requests do not by themselves remove data. Foreign-key cascade applies only when an authorized account deletion actually occurs.

## Distinguish approved public UI from this gated member feature

The independently approved public-only Visitor + Field Guide + Portal Launcher package has its own reviewed head `f04a26a23374526321cf2923c5590b414aae4fbf` and can be staged using the manually dispatched workflow now installed on `main`. **PR #360 must not be substituted into that public-only allowlist** before its schema, member Worker and privacy acceptance gates pass.
