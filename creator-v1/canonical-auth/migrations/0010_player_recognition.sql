-- ANEVUM.WEB.BUILD.2026-10-17.013.PLAYER-CARD-RECOGNITION-SYSTEM
-- SOURCE-ONLY D1 migration. Never apply without backup, schema verification and
-- independent release authorization. Canonical MEMBER_DB, not legacy Creator DB.
-- Existing levels, XP ledger, milestones and member awards are NOT reset.

CREATE TABLE IF NOT EXISTS member_recognition_grants (
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('badge','ribbon','medal')),
 recognition_id TEXT NOT NULL CHECK(length(recognition_id) BETWEEN 2 AND 48),
 earned_at INTEGER NOT NULL CHECK(earned_at>0),
 granted_by TEXT NOT NULL CHECK(length(granted_by)>0),
 evidence_ref TEXT NOT NULL CHECK(length(evidence_ref)>0),
 reviewed_by TEXT,
 revoked_at INTEGER,
 PRIMARY KEY(user_id,kind,recognition_id),
 CHECK(kind='badge' OR (reviewed_by IS NOT NULL AND reviewed_by<>granted_by)),
 CHECK(revoked_at IS NULL OR revoked_at>=earned_at)
);
CREATE INDEX IF NOT EXISTS member_recognition_active
 ON member_recognition_grants(user_id,kind,earned_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS member_recognition_preferences (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 badge_mode TEXT NOT NULL DEFAULT 'automatic'
  CHECK(badge_mode IN ('automatic','curated','hidden')),
 badge_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(badge_ids_json)),
 medal_id TEXT,
 ribbon_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(ribbon_ids_json)),
 aura TEXT NOT NULL DEFAULT 'none'
  CHECK(aura IN ('none','aurora','eclipse','ember','nebula','transcosmic')),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1)
);

-- Preserve prior members' explicit visibility/award choices. Never suddenly
-- expose old achievement inventories simply because a new UI shipped.
-- Members with legacy picked medals retain them as curated badges.
-- Old accounts with no featured badges start hidden and can opt into "Latest".
INSERT OR IGNORE INTO member_recognition_preferences
 (user_id,badge_mode,badge_ids_json,medal_id,ribbon_ids_json,aura)
 SELECT p.user_id,
  CASE WHEN s.featured_json IS NOT NULL AND json_array_length(s.featured_json)>0
       THEN 'curated' ELSE 'hidden' END,
  COALESCE(s.featured_json,'[]'),NULL,'[]','none'
 FROM member_creator_profiles p
 LEFT JOIN member_space_settings s ON s.user_id=p.user_id;

-- The grant table deliberately has no public INSERT/UPDATE route. Distinctions
-- require separately reviewed evidence before issuance. XP and paid supporter
-- cosmetics cannot mint medals or ribbons.
