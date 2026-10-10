# ANEVUM V5 — preview D1 read-only checkpoint and offline migration rehearsal

**Canonical session:** `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
**Master issue:** [#259](https://github.com/anevum/anevum-web/issues/259)  
**Purpose:** advance Alpaca Connect and moderated Commons deployment readiness **without** touching Cloudflare data, OAuth secrets, member access, or brokerage authority.

## Verified read-only Cloudflare checkpoint — October 10, 2026

The connected Cloudflare API returned a successful read-only response for both member D1 database resources, including an independently named **preview** database distinct from production. On the preview D1 resource:

| Check | Actual observed value |
| --- | --- |
| Applied migration ledger | `0001_member_platform.sql`, `0002_member_rhen_drafts.sql`, `0003_member_billing.sql` |
| `member_rhen_workspaces` table | Exists (from an earlier out-of-band staging operation) |
| Registered `0004_member_rhen_workspaces.sql` migration | **No** |
| `member_alpaca_review_*` tables (separate `0005`) | **None** |
| `commons_v5_*` tables (separate `0006`) | **None** |
| Total preview Better Auth users | 2 |
| Total preview private RHEN workspaces | 2 |
| Total preview RHEN drafts | 2 |
| `PRAGMA foreign_key_check` | Zero violations |

Only schema names and aggregate counts were inspected; no user rows, full identities, credentials, sessions, brokerage records or data exports were retrieved or copied into GitHub. No remote SQL write was executed.

Encrypted Worker *secret-name* inventory via Cloudflare API:

| Worker | Google OAuth + Better Auth | Alpaca Connect client ID/secret | Standalone Alpaca token encryption key |
| --- | --- | --- | --- |
| `anevum-member-staging` | Present (all three names) | **Missing both** | **Missing** |
| `anevum-web-nextgen` | Present (all three names) | Present (both names) | **Missing** |

These are **binding-presence checks only**, not validation of secret values, correct callback registration, scopes, or provider OAuth approval. The production bindings are NOT permission to enable production trading or reviewer OAuth. Do not copy credentials from the founder's legacy broker runtime or into a GitHub issue.

## Offline rehearsal — no Cloudflare access

Run `python scripts/verify-v5-preview-schema-rehearsal.py` from the repository root. It reads only the reviewed, immutable Git SQL blobs and creates an in-memory SQLite database.

It simulates exactly the observed starting anomaly: two synthetic, distinct members with separate drafts and existing workspaces, but a ledger ending at `0003`. Then:

1. Re-applies idempotent `0004`, verifies no workspace/member data is erased, and records exactly `0004` in the **in-memory** ledger.
2. Adds isolated OAuth `0005`, verifies preservation of existing members/workspaces/drafts, global broker-account uniqueness and denial of trading or account-write scopes in the schema.
3. Adds isolated social `0006`, verifies distinct post/reply/report/moderation tables, duplicate report rejection and one audit event per report.
4. Deletes one **synthetic** member, proving their private workspace, draft, OAuth connection, reply and report are removed, while another member's post/workspace survive. Staff identifiers are cleared while their moderation audit remains.
5. Requires six reviewed blob SHAs, separate migration catalogs, safe schema-only SQL, exact `0001..0006` sequencing and no foreign-key violations.
6. Emits `PASS_OFFLINE_REHEARSAL_ONLY`. This is not proof of a remote D1 migration or automatic approval to dispatch a workflow.

## Backup export and independent restore proof — October 10

The connected Cloudflare API successfully produced a **preview-only** D1 SQL export, with a signed one-hour download URL and a D1 time-travel bookmark. No production database was queried for row contents. The interactive execution environment could not resolve Cloudflare's signed R2 export hostname, so **the generated export was NOT retrieved, decrypted, restored, retained or accepted as a verified backup here**. A time-travel bookmark alone is not an independently restorable SQL backup.

To close this gate, this draft includes:

- `scripts/verify-v5-preview-export-backup.py`: fail-closed private SQL in-memory SQLite restore, exact 0001–0003 ledger verification, integrity and FK checks, two distinct member workspace owners, SHA-256 digest and optional authenticated Fernet encryption/decryption. No names, emails, row contents or SQL are ever printed.
- `.github/workflows/v5-preview-d1-backup-restore.yml`: manual exact-`main`-SHA, preview-only D1 export; download into restricted runner scratch; restore and encrypt; upload **only Fernet ciphertext** for 30 days; download the stored encrypted artifact and independently decrypt/retest it before asserting backup readiness. It requires an owner-maintained GitHub Actions encrypted secret named `ANEVUM_PREVIEW_BACKUP_FERNET_KEY`; never paste that key into an issue, chat, screenshot or release log. The workflow is **DRAFT on an unmerged branch** and cannot currently be manually dispatched from the main workflow list.
- The V5 full CI runs `python scripts/verify-v5-preview-export-backup.py selftest` with **synthetic** users and negative safety cases. This is source validation only, not a live backup.

The encrypted artifact is retained for 30 days, not indefinitely. Do not start the remote 0004/0005 migrations until a real export-backup workflow has completed successfully, the encrypted stored artifact is confirmed restorable, the recovery key custody and rollback window are reviewed, the current preview row/count/ledger state still matches, and the operator separately approves each change.

### Automatic deployment guard

The current production workflow on `main` still auto-deploys on pushes. The V5 integrated candidate now removes that trigger, replacing it with an exact reviewed main SHA, manual confirmation and independently confirmed rollback input, plus a live `git ls-remote` main HEAD guard. Its staging Worker bootstrap is independently manual-only and rejects a stale main head. **These safety gates are only on the V5 draft until reviewed/merged.** Do not merge the full release candidate while the live production workflow can still auto-release an unaccepted site; the main-branch workflow and obsolete Vercel integration must first be reconciled.

## Actual migration authorization remains a separate gate

- [ ] Re-check preview and production D1 identity and counts immediately before migration.
- [ ] Verify a restorable preview backup and approved exact source/blob SHA; **do not claim that a time-travel bookmark alone is a verified independent restore**.
- [ ] Review and explicitly approve `0004` registration against the already populated workspace table.
- [ ] Independently approve the `0005` OAuth review migration, stage-only callback, three stage-only secret bindings and encryption-key custody.
- [ ] Keep `0006` separate until moderator operations, UGC Terms/Privacy, retention and support process are approved.
- [ ] Preserve member counts, row identity, FK integrity and backup rollback through every manual preview-only step.
- [ ] Stage real two-member Better Auth, broker OAuth authorization and moderator denial/allow tests **after** authorized migrations.
- [ ] Only then record the non-Loom authorization disclosure → acknowledged consent → genuine provider connection → masked linked status video; confirm paper-account acceptance with Alpaca.
- [ ] Do not merge production, enable live account orders, modify the founder's private brokerage scope or use user-generated content to trigger trade actions.

**Release state:** This branch contains only an offline schema rehearsal and documentation. Production, staging D1 data, OAuth flags, broker credentials, owner RHEN execution and external communications are unchanged.
