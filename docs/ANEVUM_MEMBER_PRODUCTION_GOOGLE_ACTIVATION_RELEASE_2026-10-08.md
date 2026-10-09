# ANEVUM.WEB.RELEASE.2026-10-08.005.PRODUCTION-MEMBER-GOOGLE-ACTIVATION

## Release candidate — review required before merge

Production D1 preparation completed successfully on the authorized, manual-only
[workflow #37874315812](https://github.com/anevum/anevum-web/actions/runs/37874315812).
It created nine core member tables and one inactive RHEN draft table. The workflow
verified zero foreign-key violations, production/preview database UUID isolation,
three encrypted Better Auth/Google Worker binding **names**, and that public signup
remained disabled at completion.

This release candidate changes **only** the production member signup toggle
`ANEVUM_MEMBERS_ENABLED=true`. It explicitly preserves:
`ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED=false`, preview origin disablement,
Cloudflare Access owner-only authorization, all RHEN operator endpoints,
production/preview D1 database isolation, and live Railway broker-write authority.

## Security release requirements

1. Owner-reviewed Privacy/Terms; verified separate production Google OAuth Web client
   origin `https://anevum.com`, callback
   `https://anevum.com/api/auth/callback/google` and production Google consent
   screen settings. No OAuth values are stored in the repo.
2. Privately rotate any Better Auth secret previously displayed in a conversation,
   and keep distinct production/staging secrets. GitHub can only check binding
   **names**, not authenticity/independence or Google client values.
3. Two separate real staging users verify profile/export/draft separation,
   logout/deletion, CSRF and rate-limit behavior. Fixture CI and owner-reported
   testing are not independent evidence of all adversarial properties.
4. Manual production D1 migration succeeded, table/foreign-key checks passed and
   preview UUID distinct (see run above).
5. Review this PR and approve public Google account enrollment **separately**.
   Merging automatically deploys the production signup flag and can create real
   user accounts. Do not merge without a deliberate go-live decision.

## Release validation

- PR CI: TypeScript build, offline member/OAuth boundaries, production/preview D1
  binding isolation, RHEN Access route tests, responsive browser QA.
- Deploy preflight: revalidate live production D1 all 10 required tables,
  foreign-key check, exact UUIDs, encrypted Worker secret **names**, production
  flag and disabled draft/trading state **before any production deploy**.
- Post-deploy anonymous probe checks `/api/member/availability` actually returns
  Google available, Better Auth session endpoint, anonymous member API denials,
  public-safe Command, and protected RHEN operator surfaces.
- Then human operator must complete **real authenticated production Google sign-in**
  on `/sign-in`; create a disposable account, save a project, export and delete,
  verify revoked session and Cloudflare owner Access. Do not advertise general
  availability before this real production test.

## Rollback

On any production OAuth/authenticated-isolation failure, immediately disable public
registration by reverting the production `wrangler.jsonc` flag to `false`
and deploying the old source. Existing production member records remain in
production D1 and are **not deleted** by the flag rollback. Do not migrate or
modify production D1 during a rollback. Check any existing signed-in sessions and
document whether they need invalidation. Do not touch RHEN Railway or customer
broker integrations.

This rollout does NOT enable per-member Alpaca OAuth, executable RHEN bots,
payouts, deposits, rewards or expanded trading authority.
