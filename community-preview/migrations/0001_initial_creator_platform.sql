-- ANEVUM Creator Platform — isolated preview schema v0001
-- Session: ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PLATFORM-SEPARATION
-- Database: anevum-community-preview ONLY; never apply to V5 member databases.
-- No auth data or private broker state is imported. IDs are assigned server-side.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creator_profiles (
  member_id TEXT PRIMARY KEY NOT NULL,
  handle TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(handle) BETWEEN 3 AND 30),
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  bio TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 1200),
  avatar_url TEXT,
  website_url TEXT,
  is_staff INTEGER NOT NULL DEFAULT 0 CHECK (is_staff IN (0,1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  owner_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE RESTRICT,
  slug TEXT NOT NULL CHECK (length(slug) BETWEEN 3 AND 90),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 280),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 25000),
  category TEXT NOT NULL CHECK (category IN ('tools','games','automation','research','creative','learning','libraries','other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','changes_requested','published','rejected','archived')),
  free_to_use INTEGER NOT NULL DEFAULT 1 CHECK (free_to_use IN (0,1)),
  license_name TEXT,
  source_url TEXT,
  demo_url TEXT,
  ai_disclosure TEXT NOT NULL DEFAULT '',
  human_contribution TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_member_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(status,published_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(status,category,published_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_member_id,created_at DESC);

CREATE TABLE IF NOT EXISTS project_releases (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version TEXT NOT NULL CHECK (length(version) BETWEEN 1 AND 80),
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 10000),
  released_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id,version)
);

CREATE INDEX IF NOT EXISTS idx_project_releases ON project_releases(project_id,released_at DESC);

CREATE TABLE IF NOT EXISTS project_favorites (
  member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(member_id,project_id)
);

CREATE TABLE IF NOT EXISTS project_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 10 AND 4000),
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','removed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id,member_id)
);

CREATE INDEX IF NOT EXISTS idx_project_reviews ON project_reviews(project_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS project_reports (
  id TEXT PRIMARY KEY NOT NULL,
  reporter_member_id TEXT REFERENCES creator_profiles(member_id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('project','review','profile')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 3 AND 120),
  details TEXT NOT NULL DEFAULT '' CHECK (length(details) <= 4000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaged','resolved','dismissed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_reports_queue ON project_reports(status,created_at ASC);

CREATE TABLE IF NOT EXISTS moderation_events (
  id TEXT PRIMARY KEY NOT NULL,
  report_id TEXT REFERENCES project_reports(id) ON DELETE SET NULL,
  moderator_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('request_changes','approve','reject','hide','restore','suspend','unsuspend','note','dismiss')),
  target_type TEXT NOT NULL CHECK (target_type IN ('project','review','profile','report')),
  target_id TEXT NOT NULL,
  rationale TEXT NOT NULL CHECK (length(rationale) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_events ON moderation_events(target_type,target_id,created_at DESC);

INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0001_initial_creator_platform');
