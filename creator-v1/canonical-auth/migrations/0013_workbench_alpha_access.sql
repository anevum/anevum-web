-- PRIVATE ALPHA ONLY. Additive; requires reviewed staging backup/restore first.
-- No initial grants, no accounts, no staff roles, no public content are created.
CREATE TABLE IF NOT EXISTS member_workbench_access (
 member_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
 revision INTEGER NOT NULL CHECK(revision>=1),
 expires_at INTEGER NOT NULL,
 updated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 updated_at INTEGER NOT NULL,
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 10 AND 240)
);
CREATE INDEX IF NOT EXISTS idx_workbench_access_active ON member_workbench_access(enabled,expires_at);
CREATE TABLE IF NOT EXISTS member_workbench_access_log (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 member_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
 actor_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 enabled INTEGER NOT NULL,
 revision INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL,
 reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workbench_access_log_actor ON member_workbench_access_log(actor_id,created_at);
-- Successful changes and audit writes are atomic; a no-op creates no event.
CREATE TRIGGER IF NOT EXISTS workbench_access_insert AFTER INSERT ON member_workbench_access
BEGIN
 INSERT INTO member_workbench_access_log(member_id,actor_id,enabled,revision,expires_at,created_at,reason)
 VALUES(NEW.member_id,NEW.updated_by,NEW.enabled,NEW.revision,NEW.expires_at,NEW.updated_at,NEW.reason);
END;
CREATE TRIGGER IF NOT EXISTS workbench_access_update AFTER UPDATE ON member_workbench_access
WHEN NEW.revision<>OLD.revision
BEGIN
 INSERT INTO member_workbench_access_log(member_id,actor_id,enabled,revision,expires_at,created_at,reason)
 VALUES(NEW.member_id,NEW.updated_by,NEW.enabled,NEW.revision,NEW.expires_at,NEW.updated_at,NEW.reason);
END;
