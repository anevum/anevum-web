-- ANEVUM.IREN.BUILD.2026-10-17.001.MODERATOR-COMMAND-PORTAL
-- Additive, canonical MEMBER_DB staging only. Requires explicit feature toggle and reviewed migration.
-- Never run on RHEN, legacy V5, COMMUNITY_DB, or unrelated production D1.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS staff_invitation_log (
 id TEXT PRIMARY KEY NOT NULL,
 alias TEXT NOT NULL CHECK(length(alias) BETWEEN 1 AND 64),
 channel TEXT NOT NULL CHECK(channel IN ('direct','email','social','other')),
 stage TEXT NOT NULL CHECK(stage IN ('invited','responded','joined','staff-candidate','closed')),
 note TEXT NOT NULL DEFAULT '' CHECK(length(note)<=240),
 created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 updated_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_invitation_stage ON staff_invitation_log(stage,updated_at DESC);

CREATE TABLE IF NOT EXISTS staff_task_log (
 id TEXT PRIMARY KEY NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 4 AND 140),
 stage TEXT NOT NULL CHECK(stage IN ('open','in-progress','blocked','done')),
 priority TEXT NOT NULL CHECK(priority IN ('routine','important','urgent')),
 created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 updated_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_task_stage ON staff_task_log(stage,updated_at DESC);

CREATE TABLE IF NOT EXISTS staff_chat_log (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 id TEXT NOT NULL UNIQUE,
 room TEXT NOT NULL CHECK(room IN ('operations','review','projects')),
 author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 1200),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_chat_room_seq ON staff_chat_log(room,seq DESC);

CREATE TABLE IF NOT EXISTS staff_canvas_log (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 id TEXT NOT NULL UNIQUE,
 room TEXT NOT NULL CHECK(room IN ('operations','review','projects')),
 actor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 event_type TEXT NOT NULL CHECK(event_type IN ('stroke','clear')),
 event_data TEXT NOT NULL CHECK(length(event_data)<=4800),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_canvas_room_seq ON staff_canvas_log(room,seq DESC);

CREATE TABLE IF NOT EXISTS staff_presence (
 member_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 room TEXT NOT NULL CHECK(room IN ('bridge','off')),
 last_seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_presence_last_seen ON staff_presence(room,last_seen_at DESC);

CREATE TABLE IF NOT EXISTS staff_webrtc_signals (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 room TEXT NOT NULL CHECK(room='bridge'),
 sender_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 recipient_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 signal_type TEXT NOT NULL CHECK(signal_type IN ('offer','answer','candidate','leave')),
 signal_data TEXT NOT NULL CHECK(length(signal_data)<=16000),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_signal_recipient ON staff_webrtc_signals(recipient_id,seq ASC);

CREATE TABLE IF NOT EXISTS staff_ops_audit (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 event_type TEXT NOT NULL CHECK(event_type IN ('invite-created','invite-updated','task-created','task-updated','board-cleared')),
 entity_id TEXT NOT NULL,
 actor_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_ops_audit_recent ON staff_ops_audit(seq DESC);

CREATE TABLE IF NOT EXISTS staff_ops_limits (
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 operation TEXT NOT NULL,
 minute_bucket INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(member_id,operation,minute_bucket)
);
