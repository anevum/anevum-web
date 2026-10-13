-- ANEVUM Creator V1: invited-only alpha discussion foundation.
-- STAGING ONLY after 0003-0006. Never apply to public production, RHEN or V5.
-- Migration requires a staging backup/restore rehearsal before execution.
CREATE TABLE IF NOT EXISTS community_threads (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 author_member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE RESTRICT,
 room TEXT NOT NULL CHECK(room IN ('arcade','workshop','lab','commons')),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 120),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 20 AND 3000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','visible','hidden','rejected')),
 request_id TEXT NOT NULL CHECK(length(request_id)=32),
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 reviewed_at INTEGER,
 UNIQUE(author_member_id,request_id)
);
CREATE INDEX IF NOT EXISTS idx_alpha_threads_room_visible
 ON community_threads(room,status,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS community_replies (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 thread_id TEXT NOT NULL REFERENCES community_threads(id) ON DELETE RESTRICT,
 author_member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE RESTRICT,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 2000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','visible','hidden','rejected')),
 request_id TEXT NOT NULL CHECK(length(request_id)=32),
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 reviewed_at INTEGER,
 UNIQUE(author_member_id,request_id)
);
CREATE INDEX IF NOT EXISTS idx_alpha_replies_thread_visible
 ON community_replies(thread_id,status,created_at ASC,id ASC);
CREATE TABLE IF NOT EXISTS community_discussion_reports (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 reporter_member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE RESTRICT,
 target_kind TEXT NOT NULL CHECK(target_kind IN ('thread','reply')),
 target_id TEXT NOT NULL CHECK(length(target_id)=32),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 12 AND 500),
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
 created_at INTEGER NOT NULL, resolved_at INTEGER,
 resolver_identity TEXT, resolution_reason TEXT,
 UNIQUE(reporter_member_id,target_kind,target_id)
);
CREATE INDEX IF NOT EXISTS idx_alpha_reports_queue
 ON community_discussion_reports(status,created_at ASC);
CREATE TABLE IF NOT EXISTS community_discussion_moderation_events (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 target_kind TEXT NOT NULL CHECK(target_kind IN ('thread','reply')),
 target_id TEXT NOT NULL CHECK(length(target_id)=32),
 moderator_identity TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('approve','hide','reject','resolve_report')),
 from_status TEXT NOT NULL, to_status TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 12 AND 800),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alpha_moderation_target
 ON community_discussion_moderation_events(target_kind,target_id,created_at DESC);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0007_alpha_discussions');
