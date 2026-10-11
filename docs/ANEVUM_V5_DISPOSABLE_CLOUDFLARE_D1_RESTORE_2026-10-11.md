# ANEVUM V5 — isolated Cloudflare D1 recovery acceptance

Session: ANEVUM.WEB.BUILD.2026-10-11.008.DISPOSABLE-D1-CLOUD-RESTORE
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001.
WEB reconstruction #265; release authority #259; incremental parent WEB #300
at 8d437eac6a2fcd5ff5eaa3e5e62fdd734b979308.

## Missing proof and what this implementation adds

The earlier v5-preview-d1-backup-restore.yml restored archived preview SQL
into independent local in-memory SQLite. That proves archive integrity, but
not Cloudflare remote D1 import or cleanup.

The new source-only manual workflow
.github/workflows/v5-disposable-d1-restore-acceptance.yml,
with scripts/v5-disposable-d1-restore.py, creates genuine remote D1
restore acceptance after separately authorized main-branch dispatch:

1. Verify exact reviewed main SHA, member/preview database bindings,
   completed same-SHA encrypted backup artifact, independent SQLite
   restoration and private data authorization.
2. Decrypt only in ephemeral runner memory, validate the historical
   0001-0005 preview ledger and the two-member workspace/draft integrity.
   Social migrations 0006/0007 are rejected.
3. Create one fresh otherwise unbound Cloudflare D1 named from the GitHub
   run ID, never a production or preview database UUID.
4. Import through Cloudflare's bounded init, private signed R2 PUT with
   MD5/ETag, ingest and poll sequence. No plaintext artifact.
5. Read only aggregate member/workspace/draft/unique-owner counts,
   migration names, foreign key violations and integrity status from
   the disposable D1. No personal data or credentials are printed.
6. Delete only the exact fresh database after checking its identity
   against an O_EXCL run-owned marker. Verify its absence via API GET.
   The workflow separately retries cleanup with an always-run step.

The workflow requires explicit manual approval strings for remote resource
creation/deletion, temporary private preview data transfer into a disposable
Cloudflare target, reviewed encrypted backup and exact reviewed main SHA.
A PR or ordinary push cannot run the integration operation. The helper
checks these conditions again before creating any resource.

## Limitations and release gates

- This is a SOURCE candidate, not an executed remote D1 restore. Only an
  independently authorized successful manual run with verified deletion
  establishes actual Cloudflare D1 recovery evidence.
- A narrowly scoped D1 API token with create/import/delete permissions is
  needed. Existing read-only/export permissions may be insufficient;
  widening permissions requires separate owner approval.
- Cancellation or runner loss may interrupt cleanup. On any uncertainty,
  inspect the exact created database name (anevum-v5-restore- plus run ID)
  and run-owned UUID, and carry out supervised cleanup. Never target
  ANEVUM production or active preview member databases.
- Encrypted backup remains private under existing retention and key custody.
  No account exports or raw SQL are added to source or public logs.
- This does not authorize production deletion, social migrations 0006/0007,
  moderator access, live trading, brokerage OAuth, or RHEN execution.
- Two real Google member sign-ins, profile/persistence testing,
  cross-member denial, owner identity binding, accessibility and rollback
  acceptance are still independent requirements for the V5 beta release.
- The founder's separate personal PAPER observation remains disabled
  and is not customer Alpaca Connect approval.

No production merge/deploy, database creation, migration, broker connection
or runtime execution was performed by this source PR.
