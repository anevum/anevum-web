-- Additive catalog migration; separate from the existing member migration ledger.
-- Run only after an encrypted backup and existing-record recovery verification.
CREATE TABLE IF NOT EXISTS creator_projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  creator TEXT NOT NULL CHECK(length(creator) BETWEEN 2 AND 60),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 100),
  summary TEXT NOT NULL CHECK(length(summary) BETWEEN 15 AND 300),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=4000),
  category TEXT NOT NULL CHECK(category IN ('APP','GAME','TOOL','EXPERIMENT')),
  source_url TEXT,
  live_url TEXT,
  license TEXT NOT NULL DEFAULT 'Not specified',
  preview_enabled INTEGER NOT NULL DEFAULT 0 CHECK(preview_enabled IN (0,1)),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PENDING','PUBLISHED','REJECTED','WITHDRAWN')),
  rights_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(rights_confirmed IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  CHECK(source_url IS NOT NULL OR live_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS creator_projects_public ON creator_projects(status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS creator_projects_owner ON creator_projects(owner_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS creator_project_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES creator_projects(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  revision INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS creator_events_project ON creator_project_events(project_id,created_at DESC);
CREATE TABLE IF NOT EXISTS creator_library (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES creator_projects(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,project_id)
);
