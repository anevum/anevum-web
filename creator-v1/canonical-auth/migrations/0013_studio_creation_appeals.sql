-- ANEVUM.WEB.BUILD.2026-10-18.021.CREATION-APPEALS-SECOND-REVIEW
-- SOURCE ONLY. NO production D1 writes, role changes or automatic restoration.
-- Apply after reviewed 0011 and 0012, with backup/rollback verification.
PRAGMA foreign_keys=ON;

-- One owner-authored appeal for each independently documented takedown.
-- A historical case cannot be silently rewritten or anonymously removed.
CREATE TABLE IF NOT EXISTS member_studio_publication_appeals(
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 project_id TEXT NOT NULL UNIQUE
  REFERENCES member_studio_publication_takedowns(project_id) ON DELETE CASCADE,
 owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 reason_code TEXT NOT NULL
  CHECK(reason_code IN ('ownership','false_positive','missing_context','other')),
 statement TEXT NOT NULL CHECK(length(statement) BETWEEN 40 AND 2000),
 filed_at INTEGER NOT NULL CHECK(filed_at>0)
);
CREATE INDEX IF NOT EXISTS idx_studio_appeal_owner
 ON member_studio_publication_appeals(owner_id,filed_at DESC);

-- A decision is append-once, separate from the request.
-- The application checks reviewer != owner, takedown officer, original approver.
-- An accepted appeal is a referral for NEW rights/republication review;
-- no publication status or recognition grant is changed here.
CREATE TABLE IF NOT EXISTS member_studio_appeal_decisions(
 appeal_id TEXT PRIMARY KEY NOT NULL
  REFERENCES member_studio_publication_appeals(id) ON DELETE CASCADE,
 reviewer_id TEXT NOT NULL CHECK(length(reviewer_id) BETWEEN 1 AND 100),
 decision TEXT NOT NULL
  CHECK(decision IN ('upheld','eligible_for_re_review')),
 explanation TEXT NOT NULL CHECK(length(explanation) BETWEEN 40 AND 1800),
 decided_at INTEGER NOT NULL CHECK(decided_at>0)
);
CREATE INDEX IF NOT EXISTS idx_studio_appeal_decisions_reviewed
 ON member_studio_appeal_decisions(decided_at DESC);

-- Author and reviewer actions receive independent limits; never reuse XP,
-- review, invite, profile or public posting rate limit storage.
CREATE TABLE IF NOT EXISTS member_studio_appeal_limits(
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('file','review')),
 window_start INTEGER NOT NULL CHECK(window_start>0),
 requests INTEGER NOT NULL CHECK(requests BETWEEN 1 AND 10),
 PRIMARY KEY(actor_id,action)
);

-- Explicitly no DELETE/UPDATE trigger, publication reinstatement,
-- XP grant, award restoration, reviewer self-service or role inheritance.
