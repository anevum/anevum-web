-- ANEVUM.ANEVUM.BUILD.2026-10-17.001.INSTITUTE-DISCOVERY-RUNTIME
-- SOURCE ONLY: staging canonical MEMBER_DB after backup / restore rehearsal.
-- No production deployment. No public bot accounts, XP, awards, moderation or posts.
-- This is a private editorial nomination ledger for verified public catalogue work.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS institute_entities (
 entity_id TEXT PRIMARY KEY NOT NULL
   CHECK(entity_id IN ('observation-node-001','regulation-node-002')),
 principal_kind TEXT NOT NULL DEFAULT 'official_automated_entity'
   CHECK(principal_kind='official_automated_entity'),
 reserved_handle TEXT NOT NULL UNIQUE CHECK(length(reserved_handle) BETWEEN 3 AND 30),
 display_label TEXT NOT NULL CHECK(length(display_label) BETWEEN 3 AND 80),
 provisional INTEGER NOT NULL DEFAULT 1 CHECK(provisional IN (0,1)),
 automated_disclosure TEXT NOT NULL CHECK(length(automated_disclosure) BETWEEN 15 AND 280),
 can_login INTEGER NOT NULL DEFAULT 0 CHECK(can_login=0),
 can_moderate INTEGER NOT NULL DEFAULT 0 CHECK(can_moderate=0),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1))
);

-- Deliberately NOT Better Auth users: there is no password, email, session,
-- user_id or cross-database identity link to accidentally confer privileges.
INSERT OR IGNORE INTO institute_entities
 (entity_id,reserved_handle,display_label,automated_disclosure)
 VALUES
 ('observation-node-001','ci_observation_001','Vesper (provisional)',
  'Official automated Continuance Institute discovery identity. All selections require verified human review.'),
 ('regulation-node-002','ci_regulation_002','Sable (provisional)',
  'Official automated Continuance Institute safety concept. This entity has no independent moderation authority.');

CREATE TABLE IF NOT EXISTS institute_discovery_cycles (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 entity_id TEXT NOT NULL REFERENCES institute_entities(entity_id) ON DELETE RESTRICT,
 week_start INTEGER NOT NULL UNIQUE CHECK(week_start>=0),
 created_at INTEGER NOT NULL CHECK(created_at>0)
);
CREATE INDEX IF NOT EXISTS idx_institute_cycles_date ON institute_discovery_cycles(week_start DESC);

CREATE TABLE IF NOT EXISTS institute_nominations (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 entity_id TEXT NOT NULL REFERENCES institute_entities(entity_id) ON DELETE RESTRICT,
 cycle_id TEXT NOT NULL REFERENCES institute_discovery_cycles(id) ON DELETE RESTRICT,
 source TEXT NOT NULL DEFAULT 'creator_v1_public_catalogue'
   CHECK(source='creator_v1_public_catalogue'),
 project_id TEXT NOT NULL CHECK(length(project_id) BETWEEN 1 AND 80),
 source_published_at TEXT NOT NULL CHECK(length(source_published_at) BETWEEN 10 AND 40),
 source_verified_at INTEGER NOT NULL CHECK(source_verified_at>0),
 status TEXT NOT NULL DEFAULT 'pending_review'
   CHECK(status IN ('pending_review','shortlisted','declined','withdrawn')),
 reviewer_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 review_reason TEXT CHECK(review_reason IN ('editorial_shortlist','not_a_fit','duplicate','ineligible','withdrawn')),
 decided_at INTEGER,
 created_at INTEGER NOT NULL CHECK(created_at>0),
 UNIQUE(entity_id,source,project_id),
 CHECK((status='pending_review' AND reviewer_id IS NULL AND review_reason IS NULL AND decided_at IS NULL)
     OR(status<>'pending_review' AND review_reason IS NOT NULL AND decided_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_institute_nomination_review
 ON institute_nominations(status,created_at,id);
CREATE INDEX IF NOT EXISTS idx_institute_nomination_cycle
 ON institute_nominations(cycle_id,id);

CREATE TABLE IF NOT EXISTS institute_events (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 idempotency_key TEXT NOT NULL UNIQUE CHECK(length(idempotency_key) BETWEEN 16 AND 160),
 entity_id TEXT NOT NULL REFERENCES institute_entities(entity_id) ON DELETE RESTRICT,
 nomination_id TEXT NOT NULL REFERENCES institute_nominations(id) ON DELETE RESTRICT,
 kind TEXT NOT NULL CHECK(kind IN
   ('nomination_created','nomination_shortlisted','nomination_declined','nomination_withdrawn')),
 actor_kind TEXT NOT NULL CHECK(actor_kind IN ('official_automated_entity','verified_reviewer')),
 actor_id TEXT NOT NULL CHECK(length(actor_id) BETWEEN 3 AND 128),
 target_source TEXT NOT NULL DEFAULT 'creator_v1_public_catalogue'
   CHECK(target_source='creator_v1_public_catalogue'),
 target_id TEXT NOT NULL CHECK(length(target_id) BETWEEN 1 AND 80),
 visibility TEXT NOT NULL DEFAULT 'staff_only' CHECK(visibility='staff_only'),
 reason TEXT NOT NULL CHECK(reason IN
   ('published_recently','editorial_shortlist','not_a_fit','duplicate','ineligible','withdrawn')),
 created_at INTEGER NOT NULL CHECK(created_at>0)
);
CREATE INDEX IF NOT EXISTS idx_institute_events_nomination
 ON institute_events(nomination_id,created_at,id);
CREATE INDEX IF NOT EXISTS idx_institute_events_created
 ON institute_events(created_at DESC,id DESC);

-- Append-only audit: history may never be rewritten by the nomination engine.
CREATE TRIGGER IF NOT EXISTS institute_events_immutable_update
 BEFORE UPDATE ON institute_events
 BEGIN SELECT RAISE(ABORT,'Institute event history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS institute_events_immutable_delete
 BEFORE DELETE ON institute_events
 BEGIN SELECT RAISE(ABORT,'Institute event history is immutable'); END;

-- Once a source and project are nominated the provenance must not be replaced.
CREATE TRIGGER IF NOT EXISTS institute_nomination_source_immutable
 BEFORE UPDATE ON institute_nominations
 WHEN NEW.entity_id<>OLD.entity_id OR NEW.cycle_id<>OLD.cycle_id
  OR NEW.source<>OLD.source OR NEW.project_id<>OLD.project_id
  OR NEW.source_published_at<>OLD.source_published_at
  OR NEW.source_verified_at<>OLD.source_verified_at OR NEW.created_at<>OLD.created_at
 BEGIN SELECT RAISE(ABORT,'Institute nomination source is immutable'); END;
