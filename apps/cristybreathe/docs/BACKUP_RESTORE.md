# Backup and restoration

## Personal export

Settings → Export my data retrieves the authenticated account's entries and
preferences from D1. The JSON contains a schema version and timestamps. Store
the downloaded file privately: it contains readable personal text. No other
account's records are included. The API currently limits a single export to
10,000 entries, returning an explicit error above that limit.

Settings → Restore a backup validates the complete file before a transactional
batch, then creates fresh entries under the signed-in account. Existing entries
remain intact. Content, entry metadata and original timestamps are restored;
IDs and revision counters are new. Preferences are included in exports but are
not overwritten during import. Restore accepts 1–500 entries and 2.2 MB per
file. Split a larger export into smaller valid backup objects before importing.
Importing the same file twice creates two copies; it is an additive recovery
operation, not synchronization.

## Administrator SQL backup

Before a schema change, use the authorized Cloudflare API or Wrangler to export
D1 and record its Time Travel bookmark. Keep operational IDs and SQL dumps
outside public Git. The REST export flow is:

1. POST the database `/export` endpoint with `output_format: "polling"`.
2. If active, poll with `output_format: "polling"` and the returned
   `at_bookmark` as `current_bookmark`.
3. On completion, download `result.signed_url` immediately and keep the SQL
   dump private. Do not log or publish the signed URL.
4. Restore the dump into a disposable D1 database using the supported import
   or SQL execution flow. Compare tables, indexes, counts and representative
   synthetic content. D1 may reject diagnostic PRAGMAs such as integrity_check;
   use ordinary SELECTs and sqlite_master for remote verification.
5. Remove the disposable database after evidence is recorded.

Do not test destructive restore against production. For disaster recovery,
restore into a new private database and verify content, ownership and schema
before deliberately switching the Worker binding. Preserve a copy of the
current database. Time Travel retention is plan-dependent; inspect the current
account configuration before relying on a retention window.

## Rollback

Record the active Worker version before deployment. Redeploy that version
through Workers Deployments if rollback is necessary, preserving Access and
the database binding. The current migrations are additive; the earlier Worker
can still read the original fields. Do not drop the new columns during a
rollback. Keep a private SQL snapshot and operational configuration with the
release record.

## Verification on October 29, 2026

An actual Cloudflare D1 export was downloaded. Its schema was restored into a
disposable D1 database. A synthetic entry was inserted, exported, removed with
the disposable schema, and restored from the exported SQL. Its ID, owner,
title, body, revision and indexes were checked successfully using remote
queries. The disposable database was then deleted. Production entries were
not created, removed or overwritten by this restoration test.

Application JSON export/restore was also exercised through the real Worker
code against SQLite, including a second account, timestamp preservation and
all-or-nothing validation of corrupt backups.
