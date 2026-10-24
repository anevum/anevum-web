-- ANEVUM.WEB.BUILD.2026-10-23.002.ACHIEVEMENT-BRIDGE-V115
-- SOURCE ONLY / UNAPPLIED. Mandatory MEMBER_DB backup, restore rehearsal,
-- independently verified project publication, staff review, staging approval.
-- This migration MUST follow private Studio 0008 and achievement drafts 0015.
-- Never run on production by merely enabling an environment variable.
-- This creates NO XP, official recognition or automatic publisher approval.
PRAGMA foreign_keys=ON;

-- Trust is provisioned only after a separately reviewed *public* release.
-- Draft Studio status never substitutes for publication and has no write
-- endpoint to activate this row.
CREATE TABLE IF NOT EXISTS member_mark_publishers (
 project_id TEXT PRIMARY KEY NOT NULL CHECK(length(project_id)=36),
 creator_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 release_ref TEXT NOT NULL UNIQUE CHECK(length(release_ref) BETWEEN 8 AND 120),
 public_title TEXT NOT NULL CHECK(length(public_title) BETWEEN 3 AND 100),
 redirect_uri TEXT NOT NULL CHECK(length(redirect_uri) BETWEEN 12 AND 1000),
 status TEXT NOT NULL DEFAULT 'suspended' CHECK(status IN ('approved','suspended','retired')),
 reviewer_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 reviewed_at INTEGER NOT NULL CHECK(reviewed_at>0),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 updated_at INTEGER NOT NULL CHECK(updated_at>=created_at)
);
-- Owner account deletion does not erase other members' history. The
-- approved registration is a review snapshot, not an FK to private Studio.
-- Deleting a private Studio project immediately suspends its publisher.
CREATE TRIGGER IF NOT EXISTS member_mark_publisher_source_deleted
 AFTER DELETE ON member_studio_projects
 BEGIN UPDATE member_mark_publishers SET status='suspended',updated_at=MAX(updated_at,CAST(strftime('%s','now') AS INTEGER))
 WHERE project_id=OLD.id; END;
CREATE TRIGGER IF NOT EXISTS member_mark_publisher_owner
 BEFORE INSERT ON member_mark_publishers
 WHEN NOT EXISTS(SELECT 1 FROM member_studio_projects p
   WHERE p.id=NEW.project_id AND p.user_id=NEW.creator_id)
 BEGIN SELECT RAISE(ABORT,'Publisher project owner mismatch'); END;

-- Hashes of 256-bit server-only credentials. A creator's browser build
-- must never receive the secret or any bearer credential.
CREATE TABLE IF NOT EXISTS member_mark_publisher_keys (
 key_id TEXT PRIMARY KEY NOT NULL CHECK(length(key_id)=36),
 project_id TEXT NOT NULL REFERENCES member_mark_publishers(project_id) ON DELETE CASCADE,
 secret_sha256 TEXT NOT NULL CHECK(length(secret_sha256)=64),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 expires_at INTEGER NOT NULL CHECK(expires_at>created_at),
 revoked_at INTEGER,
 CHECK(revoked_at IS NULL OR revoked_at>=created_at)
);
CREATE INDEX IF NOT EXISTS member_mark_active_keys
 ON member_mark_publisher_keys(project_id,expires_at) WHERE revoked_at IS NULL;

-- A signed-in player explicitly consents. Only the hash of the one-time code
-- persists; a creator can exchange it ONCE with its own confidential key.
CREATE TABLE IF NOT EXISTS member_mark_link_codes (
 code_hash TEXT PRIMARY KEY NOT NULL CHECK(length(code_hash)=64),
 project_id TEXT NOT NULL REFERENCES member_mark_publishers(project_id) ON DELETE CASCADE,
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 redirect_uri TEXT NOT NULL CHECK(length(redirect_uri) BETWEEN 12 AND 1000),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 expires_at INTEGER NOT NULL CHECK(expires_at>created_at),
 consumed_at INTEGER,
 consumed_nonce TEXT UNIQUE,
 CHECK(consumed_at IS NULL OR consumed_at>=created_at)
);
CREATE INDEX IF NOT EXISTS member_mark_recent_codes
 ON member_mark_link_codes(member_id,project_id,created_at DESC);

-- The external creator sees only an opaque link ID, never ANEVUM's member
-- identifier, cookies, OAuth tokens, email or private profile contents.
CREATE TABLE IF NOT EXISTS member_mark_links (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 project_id TEXT NOT NULL REFERENCES member_mark_publishers(project_id) ON DELETE CASCADE,
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL CHECK(created_at>0),
 revoked_at INTEGER,
 UNIQUE(project_id,member_id),
 CHECK(revoked_at IS NULL OR revoked_at>=created_at)
);
CREATE INDEX IF NOT EXISTS member_mark_member_links
 ON member_mark_links(member_id,revoked_at,project_id);

-- Immutable reviewed snapshots. Publisher events may only target a snapshot
-- belonging to the publisher's currently approved release_ref. Content can
-- be revoked, never silently rewritten or issued from a private Studio draft.
CREATE TABLE IF NOT EXISTS member_mark_definitions (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 project_id TEXT NOT NULL REFERENCES member_mark_publishers(project_id) ON DELETE RESTRICT,
 release_ref TEXT NOT NULL CHECK(length(release_ref) BETWEEN 8 AND 120),
 stable_key TEXT NOT NULL CHECK(length(stable_key) BETWEEN 3 AND 48),
 trigger_key TEXT NOT NULL CHECK(length(trigger_key) BETWEEN 3 AND 64),
 target_count INTEGER NOT NULL CHECK(target_count BETWEEN 1 AND 100000),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 80),
 description TEXT NOT NULL CHECK(length(description) BETWEEN 10 AND 600),
 motif TEXT NOT NULL CHECK(motif IN ('beacon','orbit','spark','atlas','key','constellation')),
 visibility TEXT NOT NULL CHECK(visibility IN ('visible','secret')),
 reward_label TEXT NOT NULL DEFAULT '' CHECK(length(reward_label)<=120),
 reviewer_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 reviewed_at INTEGER NOT NULL CHECK(reviewed_at>0),
 revoked_at INTEGER,
 UNIQUE(project_id,release_ref,stable_key)
);
CREATE TRIGGER IF NOT EXISTS member_mark_definition_immutable
 BEFORE UPDATE ON member_mark_definitions
 WHEN NEW.id<>OLD.id OR NEW.project_id<>OLD.project_id
  OR NEW.release_ref<>OLD.release_ref OR NEW.stable_key<>OLD.stable_key
  OR NEW.trigger_key<>OLD.trigger_key OR NEW.target_count<>OLD.target_count
  OR NEW.title<>OLD.title OR NEW.description<>OLD.description
  OR NEW.motif<>OLD.motif OR NEW.visibility<>OLD.visibility
  OR NEW.reward_label<>OLD.reward_label OR NEW.reviewer_id<>OLD.reviewer_id
  OR NEW.reviewed_at<>OLD.reviewed_at
 BEGIN SELECT RAISE(ABORT,'Published project marks are immutable'); END;
CREATE INDEX IF NOT EXISTS member_mark_release_definitions
 ON member_mark_definitions(project_id,release_ref,revoked_at);

-- Durable replay ledger: event_id is unique within each project. No raw
-- evidence, gameplay payload, private token, or IP address is persisted.
CREATE TABLE IF NOT EXISTS member_mark_events (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 project_id TEXT NOT NULL REFERENCES member_mark_publishers(project_id) ON DELETE RESTRICT,
 link_id TEXT NOT NULL REFERENCES member_mark_links(id) ON DELETE CASCADE,
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 definition_id TEXT NOT NULL REFERENCES member_mark_definitions(id) ON DELETE RESTRICT,
 client_event_id TEXT NOT NULL CHECK(length(client_event_id)=36),
 evidence_digest TEXT NOT NULL CHECK(length(evidence_digest)=64),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 UNIQUE(project_id,client_event_id)
);
CREATE INDEX IF NOT EXISTS member_mark_event_limits
 ON member_mark_events(project_id,member_id,created_at DESC);

CREATE TABLE IF NOT EXISTS member_mark_progress (
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 definition_id TEXT NOT NULL REFERENCES member_mark_definitions(id) ON DELETE RESTRICT,
 count INTEGER NOT NULL CHECK(count BETWEEN 1 AND 100000),
 updated_at INTEGER NOT NULL CHECK(updated_at>0),
 PRIMARY KEY(member_id,definition_id)
);

-- Separate from institutional recognition and XP. All earns can be reversed
-- by audited moderation in a future strictly staff-only service.
CREATE TABLE IF NOT EXISTS member_mark_grants (
 member_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL REFERENCES member_mark_publishers(project_id) ON DELETE RESTRICT,
 stable_key TEXT NOT NULL CHECK(length(stable_key) BETWEEN 3 AND 48),
 definition_id TEXT NOT NULL REFERENCES member_mark_definitions(id) ON DELETE RESTRICT,
 source_event_id TEXT NOT NULL REFERENCES member_mark_events(id) ON DELETE CASCADE,
 earned_at INTEGER NOT NULL CHECK(earned_at>0),
 revoked_at INTEGER,
 PRIMARY KEY(member_id,definition_id),
 UNIQUE(member_id,project_id,stable_key),
 CHECK(revoked_at IS NULL OR revoked_at>=earned_at)
);
CREATE INDEX IF NOT EXISTS member_mark_member_inventory
 ON member_mark_grants(member_id,revoked_at,earned_at DESC);

-- An existing member must OPT IN to displaying anything publicly.
-- No automatic public appearance after linking or earning.
CREATE TABLE IF NOT EXISTS member_mark_preferences (
 member_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 mode TEXT NOT NULL DEFAULT 'hidden' CHECK(mode IN ('hidden','curated')),
 pinned_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(pinned_json)),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1)
);
