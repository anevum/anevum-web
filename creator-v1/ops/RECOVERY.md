# Legacy recovery and V1 rollback

Session: ANEVUM.WEB.BUILD.2026-10-11.003.CREATOR-V1-ARCHIVE-CUTOVER

## Verified scope

A consistent snapshot of the legacy **production membership database** was encrypted with AES-256-GCM, written to private R2, fetched back, decrypted, hash checked, and restored into a separate temporary D1 database. All 13 application tables and 10 rows compared equal. SQLite quick_check passed and foreign_key_check returned no violations. The temporary database was deleted. The original database was never written by the recovery procedure.

Platform-owned `_cf*` tables and SQLite internal tables are excluded; application tables, indexes, triggers and views are captured from sqlite_master. A before/after Time Travel bookmark equality check protects against changes during the snapshot. Time Travel bookmarks alone are not the retained archive.

This result does not cover all V5 preview/beta data, every old deployment artifact, Railway history or external broker records. Those sources remain retained, not certified as fully archived. The backup and its key remain in the same Cloudflare account, so this is not off-provider disaster recovery.

## Private recovery inventory

The authoritative manifest is in existing R2 bucket `anevum-rhen-v5-evidence-staging` at `v1-release/2026-10-11/cutover-rollback.json`. It identifies the verified encrypted object, expected plaintext SHA-256, and the key-binding NAME. It contains no plaintext account records or encryption key.

AES key material exists only as a Worker secret binding on the non-public `anevum-archive-keyring` Worker. Do not delete this Worker or its secrets. It has no custom domain or route and has workers.dev/preview URLs disabled. Its handler returns 404.

Two production snapshot objects exist from this session. Only the object identified in the rollback manifest is verified. The earlier object is superseded; do not choose an archive based on filename sorting alone.

## Format and restore requirements

The R2 object is a JSON transport envelope with `success`, `result`, `errors`, and `messages`. `result` contains `format`, `algorithm`, `vault`, `secretName`, a hex-encoded 12-byte IV, a hex-encoded AES-GCM ciphertext, and plaintext SHA-256. Decrypting yields a JSON application snapshot with `schema` and per-table `data` arrays.

A future recovery must use a reviewed, owner-authorized private execution path bound to the existing keyring secret and R2 object. Do not return the key or plaintext snapshot to a public endpoint, commit them, emit them in logs, or create a downloadable public backup. Preserve keys independently before any provider/account closure.

Restore into a NEW, explicitly allowlisted temporary database, never a production database selected from an unchecked argument. Recreate application schema, insert typed values with safe quoting/binding, recreate remaining schema objects, run quick_check and foreign_key_check, and compare every table's canonical records against the decrypted snapshot. Dispose of only the newly created test database. Replacing production data requires a separate reviewed migration, never a side effect of this check.

## Reversible routing

- The apex route ID is recorded in the private manifest. Its previous target was `anevum-web-nextgen`; its new target is `anevum-creator-v1`.
- The retained legacy Worker version is preserved; its code, ASSETS and D1 bindings were not replaced.
- For an owner-approved emergency rollback, first inspect current routing for intervening changes. Restore only the captured apex route target, then verify the old public homepage. This does not require restoring or overwriting D1.
- Preserve the Backstage Access application and archive gateway. The gateway route runs before the old Worker custom-domain origin.
- Generated legacy workers.dev/preview exposure was disabled after successful cutover. Previous settings are recorded at `v1-release/2026-10-11/legacy-exposure-before.json`; do not re-enable them as part of a routine code release.
- The old GitHub production-deploy workflow is intentionally retired. Do not re-enable it to perform V1 releases.

## Remaining acceptance

Unauthenticated live Backstage requests show Cloudflare Access, and signed assertion behavior is covered by synthetic-key tests. A real owner-authenticated browser session has not been tested. This archive intentionally disables member login, Studio, account APIs and trading controls rather than trying to migrate those live workflows.
