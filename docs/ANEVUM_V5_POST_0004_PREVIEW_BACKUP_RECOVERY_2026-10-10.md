# ANEVUM V5 — Recoverable preview backup after workspace migration 0004

**Session:** `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
**Master queue:** [#259](https://github.com/anevum/anevum-web/issues/259)  
**Scope:** Preview D1 encrypted backup/restore validation only. Source-only release-safety patch; no deploy or D1 writes.

## Why this change is necessary

On October 10, manual [preview migration #38085958128](https://github.com/anevum/anevum-web/actions/runs/38085958128) succeeded and Cloudflare independently confirmed the preview migration ledger now records 0001–0004 while retaining two members, two separate RHEN workspaces and two drafts, with zero foreign-key violations. The previously merged backup helper only recognized the older 0001–0003 snapshot and would reject a legitimate new export after 0004.

The verifier now accepts exactly three approved, consecutive migration-lineage states for privately restored SQL: 0001–0003, 0001–0004, or 0001–0005. A reviewer 0005 ledger row is accepted **only** when the exact three reviewer tables exist, and the tables without that row fail closed. Unknown, skipped, reordered and Commons-social schema states fail closed. Synthetic selftests cover each valid stage, broken lineage, partial reviewer schema, unexpected social migration, identity loss and malicious SQLite ATTACH.

The **backup workflow itself requires a ledger count of at least four** both before encryption and after re-downloading/decrypting the GitHub artifact. It cannot label a historical pre-0004 snapshot as a new post-0004 recovery point. This preserves the separate existing same-source-SHA and isolated-preview UUID rules.

## After this source-only patch is reviewed and merged

1. Read current **new** `main` SHA. Do not reuse the old `9963b01e...` reviewed SHA once main changes.
2. Manually dispatch [encrypted preview backup/restore](https://github.com/anevum/anevum-web/actions/workflows/v5-preview-d1-backup-restore.yml) on the exact new `main`. Verify the ciphertext artifact, independent SQLite restore and retention. No plaintext export should be retained.
3. Separately owner-authorize [paper reviewer schema 0005](https://github.com/anevum/anevum-web/actions/workflows/member-alpaca-review-d1-migrate.yml) using new exact main, new backup run ID, and the immutable reviewed blob SHA `40d4d282eeae1630fd89d7b08c975102cff8e341`.
4. Requery preview migration ledger (0001–0005), two members/workspaces/drafts, three reviewer tables, foreign keys and separate production ledger before adding any staging-only Alpaca keys or enabling the reviewer flag.

**Never merge the full website draft #275 to install this helper.** No permanent staging Worker deploy, production D1 migration, social release, real provider connection, order path, or RHEN trading change is permitted by this patch.

**Recovery limitation:** A successful restore into isolated SQLite proves the SQL artifact can be decrypted and executed in that environment. It is not a demonstrated live Cloudflare D1 import/restore, nor a substitute for verified key custody.
