-- ANEVUM.WEB.BUILD.2026-10-16.001.MEMBER-ONBOARDING-WALLS
-- Additive, canonical staging MEMBER_DB only. No legacy identity bridge.
CREATE TABLE IF NOT EXISTS member_space_media (
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 slot TEXT NOT NULL CHECK(slot IN ('avatar','banner')),
 data BLOB NOT NULL CHECK(length(data) BETWEEN 4 AND 262144),
 version INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,slot)
);
CREATE TABLE IF NOT EXISTS member_space_settings (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 featured_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(featured_json)),
 show_stats INTEGER NOT NULL DEFAULT 1 CHECK(show_stats IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS member_wall_posts (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS member_wall_owner ON member_wall_posts(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_space_milestones (
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 milestone TEXT NOT NULL CHECK(milestone IN ('first_signal','world_shaper')),
 earned_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,milestone)
);
