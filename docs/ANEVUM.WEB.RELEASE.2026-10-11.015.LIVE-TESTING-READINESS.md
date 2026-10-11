# ANEVUM V5 live testing release

Session: `ANEVUM.WEB.RELEASE.2026-10-11.015.LIVE-TESTING-READINESS`

Continuation of integrated Studio PR #315, commit `5bb83d62501ae6a89d80ca73ddfa3aa7764954b1`.
Master delivery board: #259. January 1, 2027 public launch: #308.

## Scope of this release

Ship the integrated V5 public website and consistent navigation to the existing
`anevum.com` Worker. Keep Google member signup, profiles, saved projects and
follows available. Activate owner Studio for private draft editing and genuine
operations counts. Public editorial publishing stays disabled until real owner
acceptance. This is a website testing release, not completion of all V5 systems.

Private RHEN workspaces, strategy drafts, brokerage linking, order execution,
Commons member posting, moderation pilot and paper observation stay disabled in
production. Meaningful free participation remains a V5 product requirement
(#306); this release does not claim all eight acceptance checks are finished.
No new permanent beta database, Railway service or volume is required.

## Verified production baseline

On October 11, read-only provider checks confirmed:

- Production was Worker `anevum-web-nextgen`, previous version
  `4063408d-74c8-426d-9648-a22f8d322cbf`.
- D1 `anevum-members` has the registered 0001/0002 migrations, one verified
  Studio owner, no Studio tables, and no foreign-key violations.
- The independent ANEVUM Studio Access application exists, allows only
  `anevum.studio@gmail.com`, and covers `/studio*` and
  `/api/member/studio/*`. Its audience matches the source configuration.
- The Command Access audience and allowlist remain separate. The proposed
  `devon@anevum.com` member account has not been registered. Do not invent a
  member or fabricate a RHEN binding to satisfy the deployment guard.
- All four PR #315 workflows passed at its exact reviewed commit.

## Prepared production workflow

The existing **Deploy ANEVUM Production** workflow remains manual and pinned to
the reviewed current main SHA. The added explicit private-recovery input is:
`AUTHORIZE_PRIVATE_PRODUCTION_D1_RECOVERY`.

After exact-main CI and source checks pass, the workflow:

1. Captures the current production Time Travel bookmark and previous Worker
   version. Exports only the pinned production D1.
2. Restores the private SQL in memory in the Actions runner; checks integrity,
   foreign keys, the exact migration ledger, the verified Studio owner and
   preservation of every existing core-table row through a Studio rehearsal.
3. Encrypts the export using the existing organization recovery key held in
   encrypted Actions secrets. Uploads only the encrypted archive and non-PII
   recovery metadata, with 30-day retention. Deletes plaintext in `finally`.
4. Downloads that encrypted artifact again, decrypts/restores it in memory,
   and compares the original digest before any production migration.
5. Rechecks the main SHA, applies only `migrations-studio/0008_studio_editorial.sql`
   and records that explicitly independent migration in the existing ledger.
   It never runs the generic 0003–0007 migration sequence.
6. Privately binds the one verified existing Studio member as the encrypted
   `ANEVUM_STUDIO_OWNER_MEMBER_ID`. It creates no account, secondary admin
   binding or RHEN binding.
7. Verifies production schema, secret names, disabled capability gates and
   source freshness, then deploys the integrated V5 Worker.
8. Checks production pages, Google availability, anonymous member denial,
   dedicated Studio Access challenges, public publication field privacy,
   trading suspension, and responsive public browser evidence.

The old mandatory RHEN secret-name prerequisite now belongs to a future RHEN
activation release. This website release disables its observer flag and keeps
all exact owner-member authorization checks in code. Missing owner binding
still denies private RHEN access; no fallback to Access-only permission exists.

## Authenticated acceptance still required

The owner must sign in using `anevum.studio@gmail.com` and independently pass
Studio Access, then check draft creation, editing, audit receipts and operations
counts. Use a real ordinary member to verify denial and session switching.
The anonymous probe explicitly reports authenticated owner acceptance as pending.
Do not report mock browser tests as real account acceptance. Public publishing
requires its own subsequent tested activation; do not publish test content.

Continue V5 systems work from the deployed website: independent RHEN workspaces,
member discussion/moderation production rollout, integrations, broker approval,
Foundation validation and release recovery. Preserve the January 1 launch board.

## Recovery and incident handling

Use the retained report's exact Worker version to roll back a failed website
deployment. Do not automatically rewind D1 or drop editorial/audit tables: a
database rewind could discard newer member signups. The registered Studio schema
is additive and compatible with the previous Worker. A database restore requires
incident-specific review of new writes since the captured bookmark.

SQLite export recovery proves SQL portability, schema integrity, preservation
and archive recoverability. It does not claim an actual remote production D1
rewind has been performed. Never rewind production solely to test a backup.

## Approved production cutover — October 11, 2026

The owner explicitly approved merge, private recovery, Studio migration/owner
binding and V5 deployment, then specifically approved the one-time branch push
workflow through the GitHub plugin after the browser authentication stalled.
The originally rejected actions were not bypassed while approval was missing.

- Deployed application source: `05a0052b52bc655f45a00fd8c54aec4e872d5dac`
  (merged PR #316), with all three exact-main push checks successful.
- Authorized release trigger: `fa37643a380dd5839192c3e7cf1ac1e83a514bb7`,
  on `release/anevum-v5-approved-production-20261011` only. Do not merge that
  branch. Main retains the manually gated production workflow.
- Cutover run: https://github.com/anevum/anevum-web/actions/runs/38178041192.
  Encrypted recovery, migration rehearsal, uploaded/downloaded archive restore,
  digest check, Studio-only schema/ledger, real owner binding, production
  prerequisites, Worker deployment and all 17 member boundary checks succeeded.
- Live Worker version: `3274dc93-1177-4c59-a61f-db61eb727fc0`, deployment
  `edbb325f-2cd1-4152-82c6-8d52cf48e7ba`, created 2026-10-11 21:52:28 UTC.
- Encrypted recovery artifact: `anevum-production-d1-encrypted-38178041192`,
  artifact ID `11717031192`, retained through November 10. Its report contains
  the exact pre-cutover Worker version and fresh Time Travel bookmark. Keep the
  archive and decryption key private; never expose SQL or member records.
- Provider reads confirm the exact 0001/0002/0008 ledger, both Studio tables,
  zero foreign-key violations, and the encrypted owner binding name. Publishing
  remains false, RHEN observation remains false, and deferred systems flags
  remain false. Public Studio returns an empty published-only collection.

The cutover run finished with a failed post-deployment verification assertion:
it expected the React mount in raw HTML. The app uses an unhydrated HTML shell;
the mount exists only after JavaScript runs. The failure did not invalidate or
undo the successful deployment. PR #317 corrects this probe to verify the
same-origin module graph and Commons V5 bundle, with regression rejection of
missing/old/foreign modules and HTML fallbacks. The corrected read-only live
probe passes all 13 route, Studio privacy and suspension checks. It does not
claim authenticated owner acceptance.

Production desktop/mobile rendering evidence is captured separately by the
credential-free read-only workflow:
https://github.com/anevum/anevum-web/actions/runs/38178381099.
Inspect that run's result and retained public screenshots; never repeat the
production migration or deployment solely to regenerate verification evidence.
The read-only workflow is also manually available for future maintenance.

## Next systems development gates

Continue real owner/ordinary-member Studio acceptance first, including draft
creation/editing, audit receipt, denied ordinary-member access and session
switching. Public publishing requires its own tested activation. The website
release does not complete the wider V5 program: actual disposable Cloudflare D1
restore acceptance, free participation #306, member social/moderation rollout,
independent RHEN/provider/replay validation and integrations remain on #259.
January 1, 2027 remains the public launch target tracked by #308.
