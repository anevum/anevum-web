-- ANEVUM.WEB.BUILD.2026-10-16.001.COMMUNITY-DISCUSSIONS
-- Additive; canonical a.anevum.com MEMBER_DB ONLY. Never COMMUNITY_DB, V5, RHEN or production.
-- Publication is independently reviewed. Profile privacy is evaluated on EVERY public read.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS member_forum_threads (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 client_request_id TEXT NOT NULL CHECK(length(client_request_id)=36),
 topic TEXT NOT NULL CHECK(topic IN ('games','making','arts','community')),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 120),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 20 AND 5000),
 status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','published','rejected','hidden')),
 created_at INTEGER NOT NULL,
 published_at INTEGER,
 updated_at INTEGER NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
 UNIQUE(author_id,client_request_id)
);
CREATE INDEX IF NOT EXISTS member_forum_thread_public
 ON member_forum_threads(status,published_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS member_forum_thread_owner
 ON member_forum_threads(author_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_forum_replies (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 thread_id TEXT NOT NULL REFERENCES member_forum_threads(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 client_request_id TEXT NOT NULL CHECK(length(client_request_id)=36),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 2000),
 status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','published','rejected','hidden')),
 created_at INTEGER NOT NULL,
 published_at INTEGER,
 updated_at INTEGER NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
 UNIQUE(author_id,client_request_id)
);
CREATE INDEX IF NOT EXISTS member_forum_reply_public
 ON member_forum_replies(thread_id,status,published_at,id);
CREATE INDEX IF NOT EXISTS member_forum_reply_owner
 ON member_forum_replies(author_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_forum_reactions (
 thread_id TEXT NOT NULL REFERENCES member_forum_threads(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(thread_id,user_id)
);
CREATE TABLE IF NOT EXISTS member_forum_reports (
 id TEXT PRIMARY KEY NOT NULL,
 reporter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 target_kind TEXT NOT NULL CHECK(target_kind IN ('thread','reply')),
 target_id TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(reason IN ('spam','harassment','unsafe','other')),
 created_at INTEGER NOT NULL,
 UNIQUE(reporter_id,target_kind,target_id)
);
CREATE INDEX IF NOT EXISTS member_forum_reports_target
 ON member_forum_reports(target_kind,target_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_forum_review_log (
 id TEXT PRIMARY KEY NOT NULL,
 reviewer_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 target_kind TEXT NOT NULL CHECK(target_kind IN ('thread','reply')),
 target_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('publish','reject','hide')),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS member_forum_review_target
 ON member_forum_review_log(target_kind,target_id,created_at DESC);
