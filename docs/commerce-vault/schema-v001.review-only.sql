-- ANEVUM-owned commerce and private Creator Vault. NO approved payment rail.
-- REVIEW ONLY. No card processor, acquiring bank, payment acceptance or public charges.
-- Apply ONLY after isolated D1 backup/restore, privacy/security tests and separate release approval.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS commerce_orders (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
 product_code TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
 currency TEXT NOT NULL DEFAULT 'USD' CHECK(currency = 'USD'),
 settlement_rail TEXT,
 settlement_reference TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','awaiting_settlement','paid','refunded','canceled')),
 created_at_ms INTEGER NOT NULL,
 settled_at_ms INTEGER,
 updated_at_ms INTEGER NOT NULL,
 CHECK(status NOT IN ('paid','refunded') OR
       (settlement_rail IS NOT NULL AND settlement_reference IS NOT NULL
        AND settled_at_ms IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS commerce_orders_user_idx ON commerce_orders(user_id,created_at_ms DESC);

-- An inbound settlement claim alone is never proof of cleared funds.
CREATE TABLE IF NOT EXISTS commerce_settlement_events (
 rail TEXT NOT NULL,
 external_event_id TEXT NOT NULL,
 settlement_reference TEXT,
 received_at_ms INTEGER NOT NULL,
 independently_verified_at_ms INTEGER,
 PRIMARY KEY(rail,external_event_id)
);
CREATE TABLE IF NOT EXISTS commerce_ledger (
 entry_id TEXT PRIMARY KEY NOT NULL,
 order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE RESTRICT,
 rail TEXT NOT NULL,
 settlement_reference TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('payment','refund')),
 amount_cents INTEGER NOT NULL,
 currency TEXT NOT NULL DEFAULT 'USD',
 recorded_at_ms INTEGER NOT NULL,
 UNIQUE(rail,settlement_reference,kind)
);
CREATE TABLE IF NOT EXISTS commerce_vault_passes (
 order_id TEXT PRIMARY KEY NOT NULL REFERENCES commerce_orders(id) ON DELETE RESTRICT,
 user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
 added_bytes INTEGER NOT NULL CHECK(added_bytes > 0),
 starts_at_ms INTEGER NOT NULL,
 ends_at_ms INTEGER NOT NULL,
 revoked_at_ms INTEGER
);
CREATE INDEX IF NOT EXISTS commerce_passes_active_idx ON commerce_vault_passes(user_id,ends_at_ms,revoked_at_ms);

CREATE TABLE IF NOT EXISTS vault_projects (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
 created_at_ms INTEGER NOT NULL,
 UNIQUE(id,user_id)
);
CREATE INDEX IF NOT EXISTS vault_projects_by_user_idx ON vault_projects(user_id);

CREATE TABLE IF NOT EXISTS vault_usage (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 included_bytes INTEGER NOT NULL DEFAULT 2147483648,
 used_bytes INTEGER NOT NULL DEFAULT 0 CHECK(used_bytes >= 0),
 reserved_bytes INTEGER NOT NULL DEFAULT 0 CHECK(reserved_bytes >= 0),
 updated_at_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS vault_uploads (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL,
 project_id TEXT NOT NULL,
 object_key TEXT NOT NULL UNIQUE,
 filename TEXT NOT NULL,
 content_type TEXT NOT NULL,
 expected_bytes INTEGER NOT NULL CHECK(expected_bytes > 0 AND expected_bytes <= 52428800),
 state TEXT NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','writing','complete','canceled')),
 created_at_ms INTEGER NOT NULL,
 expires_at_ms INTEGER NOT NULL,
 FOREIGN KEY(project_id,user_id) REFERENCES vault_projects(id,user_id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES vault_usage(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS vault_uploads_gc_idx ON vault_uploads(user_id,state,expires_at_ms);

CREATE TABLE IF NOT EXISTS vault_files (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL,
 project_id TEXT NOT NULL,
 upload_id TEXT NOT NULL UNIQUE REFERENCES vault_uploads(id) ON DELETE RESTRICT,
 object_key TEXT NOT NULL UNIQUE,
 filename TEXT NOT NULL,
 content_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes > 0),
 state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','deleting')),
 created_at_ms INTEGER NOT NULL,
 FOREIGN KEY(project_id,user_id) REFERENCES vault_projects(id,user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS vault_files_by_project_idx ON vault_files(user_id,project_id,created_at_ms DESC);

-- No public object URLs. No bank data, card numbers, payment tokens or provider secrets in D1.
-- Member deletion requires verified R2 purge BEFORE account removal: FK cascade alone
-- does NOT remove objects. Keep vault disabled until purge/restore/retention acceptance.

-- IMPORTANT: SQL status and settlement references are bookkeeping fields, NOT
-- independently authenticated proof of payment. Write-side code must require
-- a verified lawful settlement rail and explicit release gate before any paid
-- entitlement is issued; the current contract always refuses fulfillment.
-- Future financial journals must verify debit=credit, idempotency, partial refunds,
-- disputes and customer deletion/legal retention independently before launch.
