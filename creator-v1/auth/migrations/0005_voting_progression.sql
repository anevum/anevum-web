-- ANEVUM Creator V1 staging: community votes, append-only audit and XP ledger.
-- Never execute against legacy V5/RHEN databases. Applies after migrations 0001-0004.
-- A rating is an assessment, NOT a moderation or trust decision.
CREATE TABLE IF NOT EXISTS community_project_votes (
  member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 5),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','hidden')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(member_id,project_id)
);
CREATE INDEX IF NOT EXISTS idx_community_vote_summary ON community_project_votes(project_id,status,score);

CREATE TABLE IF NOT EXISTS community_vote_events (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK(action IN ('cast','revise','hide','restore')),
  from_score INTEGER CHECK(from_score IS NULL OR from_score BETWEEN 0 AND 5),
  to_score INTEGER CHECK(to_score IS NULL OR to_score BETWEEN 0 AND 5),
  reason TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_community_vote_events_project ON community_vote_events(project_id,created_at DESC);

CREATE TABLE IF NOT EXISTS community_xp_events (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('vote_first','vote_adjustment','release_approved','review_accepted','jam_completed')),
  target_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount BETWEEN -500 AND 500 AND amount != 0),
  award_day TEXT NOT NULL CHECK(length(award_day)=10),
  created_at INTEGER NOT NULL,
  UNIQUE(member_id,kind,target_id)
);
CREATE INDEX IF NOT EXISTS idx_community_xp_daily ON community_xp_events(member_id,kind,award_day);

INSERT OR IGNORE INTO schema_migrations(version) VALUES('0005_voting_progression');