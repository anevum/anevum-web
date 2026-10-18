-- ANEVUM.WEB.BUILD.2026-10-18.020.CREATION-TAKEDOWN-AND-PUBLIC-BROWSER
-- SOURCE ONLY. Not applied to production, staging, COMMUNITY_DB or RHEN.
-- Apply to backed-up canonical MEMBER_DB only after explicit 0011 review.
-- A takedown is immutable evidence. Appeals/reinstatement need a separate
-- independent process, never toggled by a single moderator.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS member_studio_publication_takedowns (
 project_id TEXT PRIMARY KEY NOT NULL
  REFERENCES member_studio_publications(project_id) ON DELETE CASCADE,
 submission_id TEXT NOT NULL
  REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 moderator_id TEXT NOT NULL CHECK(length(moderator_id) BETWEEN 1 AND 100),
 reason_code TEXT NOT NULL
  CHECK(reason_code IN ('rights','unsafe_content','malicious_link','impersonation','fraud','other')),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 25 AND 1200),
 taken_down_at INTEGER NOT NULL CHECK(taken_down_at>0),
 CHECK(moderator_id<>owner_id)
);
CREATE INDEX IF NOT EXISTS idx_publication_takedowns_owner
 ON member_studio_publication_takedowns(owner_id,taken_down_at DESC);

CREATE TABLE IF NOT EXISTS member_studio_recognition_revocations (
 project_id TEXT NOT NULL
  REFERENCES member_studio_publication_takedowns(project_id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 kind TEXT NOT NULL DEFAULT 'badge' CHECK(kind='badge'),
 recognition_id TEXT NOT NULL CHECK(recognition_id IN
  ('first_creation','maker_five','maker_twenty')),
 moderator_id TEXT NOT NULL CHECK(length(moderator_id) BETWEEN 1 AND 100),
 reason_code TEXT NOT NULL CHECK(reason_code IN
  ('rights','unsafe_content','malicious_link','impersonation','fraud','other')),
 revoked_at INTEGER NOT NULL CHECK(revoked_at>0),
 PRIMARY KEY(project_id,user_id,kind,recognition_id)
);
CREATE INDEX IF NOT EXISTS idx_studio_revocations_owner
 ON member_studio_recognition_revocations(user_id,revoked_at DESC);

-- Separate safety reviewers, separate rate limit: not forum moderation,
-- creator self-review, a general support role, or inferred account age.
CREATE TABLE IF NOT EXISTS member_studio_safety_limits (
 moderator_id TEXT PRIMARY KEY NOT NULL,
 window_start INTEGER NOT NULL CHECK(window_start>0),
 requests INTEGER NOT NULL CHECK(requests BETWEEN 1 AND 10)
);

-- No trigger automatically restores a removed item, grants medals, modifies
-- XP, deletes quarantined files, or reactivates a revoked mark.
