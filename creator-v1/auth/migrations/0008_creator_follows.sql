-- Creator V1 / isolated staging only. Review and apply after 0007.
-- Creator subscriptions confer no XP, staff roles, search rank, or paid benefits.
-- Followers are always bound to authenticated member identity; public channels
-- may include the ANEVUM official profile without an ordinary member account.
CREATE TABLE IF NOT EXISTS member_creator_follows (
  follower_member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  creator_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL CHECK(created_at>=0),
  PRIMARY KEY (follower_member_id, creator_member_id),
  CHECK (follower_member_id<>creator_member_id)
);
CREATE INDEX IF NOT EXISTS idx_member_creator_follows_creator
  ON member_creator_follows(creator_member_id,created_at DESC);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0008_creator_follows');
