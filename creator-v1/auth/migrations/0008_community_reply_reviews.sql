-- ANEVUM Creator V1 STAGING: reply moderation concurrency + audit.
-- Apply ONLY after 0007_community_post_stream on anevum-creator-v1-staging.
-- Nothing in this migration authorizes a public rollout.
ALTER TABLE community_post_replies ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1);

CREATE TABLE IF NOT EXISTS community_reply_review_events (
 id TEXT PRIMARY KEY NOT NULL,
 reply_id TEXT NOT NULL REFERENCES community_post_replies(id) ON DELETE CASCADE,
 staff_identity TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('publish','reject','hide')),
 from_status TEXT NOT NULL,
 to_status TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 12 AND 800),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_community_reply_review_events
 ON community_reply_review_events(reply_id,created_at DESC);

INSERT OR IGNORE INTO schema_migrations(version) VALUES('0008_community_reply_reviews');
