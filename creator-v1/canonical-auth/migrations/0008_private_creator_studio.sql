-- ANEVUM.WEB.BUILD.2026-10-16.001.CREATOR-STUDIO-UPLOADS
-- REVIEW-ONLY. Canonical A-staging MEMBER_DB only, NEVER legacy COMMUNITY_DB,
-- production, RHEN, Stripe, or public website. Apply only after backup/restore.
-- No release in this migration becomes public or executable.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS member_studio_projects (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  client_request_id TEXT NOT NULL CHECK(length(client_request_id)=36),
  slug TEXT NOT NULL CHECK(length(slug) BETWEEN 3 AND 90),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 100),
  summary TEXT NOT NULL CHECK(length(summary) BETWEEN 10 AND 280),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=8000),
  category TEXT NOT NULL CHECK(category IN
    ('games','tools','creative','music','art','video','writing','learning','research','other')),
  free_to_use INTEGER NOT NULL DEFAULT 1 CHECK(free_to_use IN (0,1)),
  license_name TEXT NOT NULL DEFAULT '' CHECK(length(license_name)<=80),
  source_url TEXT CHECK(source_url IS NULL OR length(source_url)<=1500),
  demo_url TEXT CHECK(demo_url IS NULL OR length(demo_url)<=1500),
  ai_disclosure TEXT NOT NULL DEFAULT '' CHECK(length(ai_disclosure)<=1200),
  human_contribution TEXT NOT NULL DEFAULT '' CHECK(length(human_contribution)<=1200),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN
    ('draft','pending_review','changes_requested','rejected')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
  created_at INTEGER NOT NULL CHECK(created_at>0),
  updated_at INTEGER NOT NULL CHECK(updated_at>0),
  submitted_at INTEGER,
  UNIQUE(user_id,client_request_id),
  UNIQUE(user_id,slug)
);
CREATE INDEX IF NOT EXISTS idx_member_studio_owner
  ON member_studio_projects(user_id,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_member_studio_review
  ON member_studio_projects(status,submitted_at,id);

CREATE TABLE IF NOT EXISTS member_studio_assets (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=32),
  project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  filename TEXT NOT NULL CHECK(length(filename) BETWEEN 1 AND 160),
  extension TEXT NOT NULL CHECK(length(extension) BETWEEN 2 AND 5),
  kind TEXT NOT NULL CHECK(kind IN ('image','audio','document','package')),
  content_type TEXT NOT NULL CHECK(length(content_type) BETWEEN 3 AND 80),
  size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 20971520),
  status TEXT NOT NULL CHECK(status IN ('reserved','uploading','quarantined','deleting')),
  storage_key TEXT NOT NULL UNIQUE CHECK(length(storage_key)<=200),
  sha256 TEXT CHECK(sha256 IS NULL OR length(sha256)=64),
  lease_until INTEGER,
  created_at INTEGER NOT NULL CHECK(created_at>0),
  updated_at INTEGER NOT NULL CHECK(updated_at>0),
  uploaded_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_member_studio_assets_project
  ON member_studio_assets(project_id,user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_studio_assets_account_quota
  ON member_studio_assets(user_id,size_bytes);
CREATE INDEX IF NOT EXISTS idx_member_studio_assets_expiry
  ON member_studio_assets(status,lease_until,created_at);

CREATE TABLE IF NOT EXISTS member_studio_rate_limits (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK(action IN ('project','asset')),
  window_start INTEGER NOT NULL CHECK(window_start>0),
  requests INTEGER NOT NULL CHECK(requests BETWEEN 1 AND 60),
  PRIMARY KEY(user_id,action)
);
