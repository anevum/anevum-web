-- ANEVUM.WEB.BUILD.2026-10-23.001.CREATOR-ACHIEVEMENT-BRIDGE
-- SOURCE ONLY. No automatic migration, publication, award issuance or XP.
-- Require independent MEMBER_DB backup, restore rehearsal and stage approval.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS member_studio_achievements (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 client_request_id TEXT NOT NULL CHECK(length(client_request_id)=36),
 request_json TEXT NOT NULL CHECK(json_valid(request_json)),
 stable_key TEXT NOT NULL CHECK(length(stable_key) BETWEEN 3 AND 48),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 80),
 description TEXT NOT NULL CHECK(length(description) BETWEEN 10 AND 600),
 trigger_key TEXT NOT NULL CHECK(length(trigger_key) BETWEEN 3 AND 64),
 target_count INTEGER NOT NULL CHECK(typeof(target_count)='integer' AND target_count BETWEEN 1 AND 100000),
 visibility TEXT NOT NULL CHECK(visibility IN ('visible','secret')),
 motif TEXT NOT NULL CHECK(motif IN ('beacon','orbit','spark','atlas','key','constellation')),
 reward_label TEXT NOT NULL DEFAULT '' CHECK(length(reward_label)<=120),
 archived_at INTEGER,
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 updated_at INTEGER NOT NULL CHECK(updated_at>=created_at),
 CHECK(archived_at IS NULL OR archived_at>=created_at),
 UNIQUE(project_id,stable_key),
 UNIQUE(user_id,project_id,client_request_id)
);
CREATE INDEX IF NOT EXISTS idx_studio_achievement_project
 ON member_studio_achievements(user_id,project_id,archived_at,updated_at DESC);
CREATE TABLE IF NOT EXISTS member_studio_achievement_edit_limits (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 window_start INTEGER NOT NULL CHECK(window_start>0),
 requests INTEGER NOT NULL CHECK(requests BETWEEN 1 AND 40)
);
CREATE TABLE IF NOT EXISTS member_studio_achievement_versions (
 achievement_id TEXT NOT NULL REFERENCES member_studio_achievements(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL CHECK(revision>=1),
 snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
 changed_at INTEGER NOT NULL CHECK(changed_at>0),
 PRIMARY KEY(achievement_id,revision)
);
CREATE TRIGGER IF NOT EXISTS studio_achievement_owner_guard
 BEFORE INSERT ON member_studio_achievements
 WHEN NOT EXISTS(SELECT 1 FROM member_studio_projects p WHERE p.id=NEW.project_id AND p.user_id=NEW.user_id)
 BEGIN SELECT RAISE(ABORT,'Achievement project owner mismatch'); END;
CREATE TRIGGER IF NOT EXISTS studio_achievement_identity_guard
 BEFORE UPDATE ON member_studio_achievements
 WHEN NEW.id<>OLD.id OR NEW.project_id<>OLD.project_id OR NEW.user_id<>OLD.user_id
  OR NEW.client_request_id<>OLD.client_request_id OR NEW.stable_key<>OLD.stable_key
  OR NEW.request_json<>OLD.request_json OR NEW.created_at<>OLD.created_at
  OR NEW.revision<>OLD.revision+1
 BEGIN SELECT RAISE(ABORT,'Achievement identity and revision are protected'); END;
CREATE TRIGGER IF NOT EXISTS studio_achievement_version_insert
 AFTER INSERT ON member_studio_achievements
 BEGIN
  INSERT INTO member_studio_achievement_versions(achievement_id,revision,snapshot_json,changed_at)
  VALUES(NEW.id,NEW.revision,json_object(
   'stableKey',NEW.stable_key,'title',NEW.title,'description',NEW.description,
   'triggerKey',NEW.trigger_key,'targetCount',NEW.target_count,
   'visibility',NEW.visibility,'motif',NEW.motif,'rewardLabel',NEW.reward_label,
   'archivedAt',NEW.archived_at),NEW.updated_at);
 END;
CREATE TRIGGER IF NOT EXISTS studio_achievement_version_update
 AFTER UPDATE ON member_studio_achievements
 BEGIN
  INSERT INTO member_studio_achievement_versions(achievement_id,revision,snapshot_json,changed_at)
  VALUES(NEW.id,NEW.revision,json_object(
   'stableKey',NEW.stable_key,'title',NEW.title,'description',NEW.description,
   'triggerKey',NEW.trigger_key,'targetCount',NEW.target_count,
   'visibility',NEW.visibility,'motif',NEW.motif,'rewardLabel',NEW.reward_label,
   'archivedAt',NEW.archived_at),NEW.updated_at);
  DELETE FROM member_studio_achievement_versions WHERE achievement_id=NEW.id AND revision NOT IN (
   SELECT revision FROM member_studio_achievement_versions WHERE achievement_id=NEW.id ORDER BY revision DESC LIMIT 12
  );
 END;
