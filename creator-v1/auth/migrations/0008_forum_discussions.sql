-- Creator V1 COMMUNITY DISCUSSIONS / ISOLATED STAGING ONLY.
-- Reserved after 0007_discovery_preferences (unreleased separate member feature).
-- No public site, old V5 database or production D1 may receive this migration.
-- Posts do not appear publicly until a Cloudflare Access-verified staff review.
CREATE TABLE IF NOT EXISTS forum_threads (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
  room TEXT NOT NULL CHECK(room IN ('arcade','workshop','lab','commons')),
  author_member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 5 AND 110),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','visible','hidden')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  visible_at INTEGER,
  CHECK(updated_at>=created_at)
);
CREATE INDEX IF NOT EXISTS idx_forum_threads_visible ON forum_threads(room,status,visible_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_member_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS forum_posts (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
  thread_id TEXT NOT NULL REFERENCES forum_threads(id) ON DELETE RESTRICT,
  author_member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 2 AND 2400),
  starter INTEGER NOT NULL DEFAULT 0 CHECK(starter IN (0,1)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','visible','hidden')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  CHECK(reviewed_at IS NULL OR reviewed_at>=created_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_one_starter ON forum_posts(thread_id) WHERE starter=1;
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id,status,created_at,id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_member ON forum_posts(author_member_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_review ON forum_posts(status,created_at);
CREATE TABLE IF NOT EXISTS forum_reports (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
  post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE RESTRICT,
  reporter_member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK(reason IN ('spam','harassment','unsafe','copyright','other')),
  details TEXT NOT NULL DEFAULT '' CHECK(length(details)<=500),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','dismissed')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  UNIQUE(post_id,reporter_member_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_reports_queue ON forum_reports(status,created_at);
CREATE TABLE IF NOT EXISTS forum_moderation_events (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
  post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE RESTRICT,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('approve','hide')),
  reason TEXT NOT NULL CHECK(length(reason) BETWEEN 12 AND 600),
  from_status TEXT NOT NULL CHECK(from_status IN ('pending','visible','hidden')),
  to_status TEXT NOT NULL CHECK(to_status IN ('visible','hidden')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_forum_moderation_post ON forum_moderation_events(post_id,created_at DESC);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0008_forum_discussions');
