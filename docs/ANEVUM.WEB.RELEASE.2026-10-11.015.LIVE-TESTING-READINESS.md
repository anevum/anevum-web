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

- Production is still Worker `anevum-web-nextgen`, previous version
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

## Current release boundary

Automatic approval review rejected downloading a production export into the
development workspace because it includes private member data without specific
authorization. That download was stopped. No production migration, owner secret
provisioning or V5 Worker deployment is authorized by this source checkpoint.

The proposed workflow likewise processes private production data and must not be
run as a workaround for that rejection. Obtain specific authorization for the
encrypted recovery test before dispatching it. The public website remains on
the older release until the guarded production workflow succeeds.
