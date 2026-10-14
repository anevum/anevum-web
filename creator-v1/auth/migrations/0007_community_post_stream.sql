-- ANEVUM Creator V1 staging-only community posting foundation.
-- Private submissions are NOT public until authenticated staff approval.
-- Apply only to anevum-creator-v1-staging after migrations 0003-0006.
-- Never reuse a legacy or live RHEN/ANEVUM membership database.
CREATE TABLE IF NOT EXISTS community_posts (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 author_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 120),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 20 AND 5000),
 topic TEXT NOT NULL CHECK(topic IN ('games','tools','creative','learning','libraries','research','automation','other')),
 status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','published','rejected','hidden')),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 published_at TEXT,
 CHECK(status <> 'published' OR published_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_community_posts_public
 ON community_posts(status,published_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_queue
 ON community_posts(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_owner
 ON community_posts(author_member_id,created_at DESC);

CREATE TABLE IF NOT EXISTS community_post_votes (
 member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
 post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
 score INTEGER NOT NULL CHECK(score IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(member_id,post_id)
);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_public
 ON community_post_votes(post_id,score);

CREATE TABLE IF NOT EXISTS community_post_replies (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
 post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
 author_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 2000),
 status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','published','hidden')),
 created_at INTEGER NOT NULL,
 published_at TEXT,
 CHECK(status <> 'published' OR published_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_community_post_replies_public
 ON community_post_replies(post_id,status,published_at ASC);

CREATE TABLE IF NOT EXISTS community_post_review_events (
 id TEXT PRIMARY KEY NOT NULL,
 post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
 staff_identity TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('publish','reject','hide')),
 from_status TEXT NOT NULL,
 to_status TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 12 AND 800),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_community_post_review_events
 ON community_post_review_events(post_id,created_at DESC);

INSERT OR IGNORE INTO schema_migrations(version) VALUES('0007_community_post_stream');
