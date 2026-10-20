-- ANEVUM V007 REVIEW ONLY. Apply separately to the isolated canonical MEMBER_DB
-- after acceptance of the public-project cross-D1 contract. Never run in
-- COMMUNITY_DB, a production account DB, RHEN, or any legacy member database.
-- No user save, XP event, currency, rating, award or public record is inserted
-- by applying this migration. The feature stays disabled by default.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS member_project_saves (
  member_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  public_project_id TEXT NOT NULL
    CHECK(length(public_project_id)=32 AND public_project_id NOT GLOB '*[^0-9a-f]*'),
  saved_at INTEGER NOT NULL CHECK(saved_at>0),
  PRIMARY KEY(member_user_id,public_project_id)
);
CREATE INDEX IF NOT EXISTS member_project_saves_recent
  ON member_project_saves(member_user_id,saved_at DESC,public_project_id DESC);

CREATE TABLE IF NOT EXISTS member_project_save_rate_limits (
  member_user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  window_start INTEGER NOT NULL CHECK(window_start>0),
  requests INTEGER NOT NULL CHECK(requests BETWEEN 1 AND 60)
);
