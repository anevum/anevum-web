-- ANEVUM Creator V1 P0 / HELD PUBLICATION OUTBOX CANDIDATE
-- UNROUTED / NEVER AUTODISCOVERED BY THE CANONICAL MIGRATION RUNNER.
-- Disposable stage-only schema; do not apply to live MEMBER_DB or COMMUNITY_DB.
-- This records independently reviewed intent, NOT authorization to publish.
-- Initial status is held; SQL has deliberately NO ready/applied/published state.
PRAGMA foreign_keys=ON;

-- This is an independent PRIVATE permission ledger for a future publication
-- reviewer, not cosmetic member_role_grants, XP or a public handle. No grants
-- exist by default; only an explicitly audited admin process may create one.
CREATE TABLE IF NOT EXISTS member_studio_publication_reviewer_grants (
 reviewer_user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 granted_by_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 verified_by_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 evidence_ref TEXT NOT NULL CHECK(length(evidence_ref) BETWEEN 25 AND 240),
 granted_at INTEGER NOT NULL CHECK(granted_at>0),
 revoked_at INTEGER,
 CHECK(granted_by_user_id<>verified_by_user_id),
 CHECK(reviewer_user_id<>granted_by_user_id AND reviewer_user_id<>verified_by_user_id),
 CHECK(revoked_at IS NULL OR revoked_at>=granted_at)
);
CREATE INDEX IF NOT EXISTS idx_member_studio_publication_reviewer_active
 ON member_studio_publication_reviewer_grants(reviewer_user_id,granted_at)
 WHERE revoked_at IS NULL;

-- A direct DB seed must contain two distinct VERIFIED grantors. No API or
-- operator grant writer is provided by this prototype.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_grant_guard
 BEFORE INSERT ON member_studio_publication_reviewer_grants
 WHEN NOT EXISTS (
   SELECT 1 FROM "user" nominee
   JOIN "user" grantor ON grantor.id=NEW.granted_by_user_id
   JOIN "user" approver ON approver.id=NEW.verified_by_user_id
   WHERE nominee.id=NEW.reviewer_user_id AND nominee.emailVerified=1
     AND grantor.emailVerified=1 AND approver.emailVerified=1
     AND nominee.id<>grantor.id AND nominee.id<>approver.id
     AND grantor.id<>approver.id
 )
 BEGIN SELECT RAISE(ABORT,'independent verified reviewer grant required'); END;

CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_grant_immutable
 BEFORE UPDATE OF reviewer_user_id,granted_by_user_id,verified_by_user_id,
   evidence_ref,granted_at ON member_studio_publication_reviewer_grants
 BEGIN SELECT RAISE(ABORT,'reviewer grant evidence is immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_grant_no_rearm
 BEFORE UPDATE OF revoked_at ON member_studio_publication_reviewer_grants
 WHEN OLD.revoked_at IS NOT NULL OR NEW.revoked_at IS NULL
 BEGIN SELECT RAISE(ABORT,'reviewer grant cannot be rearmed'); END;

CREATE TABLE IF NOT EXISTS member_studio_publication_reviews (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 submission_id TEXT NOT NULL UNIQUE REFERENCES member_studio_submissions(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 owner_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 reviewer_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 project_revision INTEGER NOT NULL CHECK(project_revision>=2),
 idempotency_key TEXT NOT NULL UNIQUE CHECK(length(idempotency_key) BETWEEN 55 AND 120),
 fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)=1 AND length(snapshot_json)<=20000),
 reviewer_reason TEXT NOT NULL CHECK(length(reviewer_reason) BETWEEN 12 AND 1200),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held','cancelled')),
 CHECK(reviewer_user_id IS NULL OR reviewer_user_id<>owner_user_id),
 UNIQUE(project_id,project_revision)
);
CREATE INDEX IF NOT EXISTS idx_member_studio_publication_reviews_owner
 ON member_studio_publication_reviews(owner_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_studio_publication_reviews_status
 ON member_studio_publication_reviews(status,created_at,id);

CREATE TABLE IF NOT EXISTS member_studio_publication_outbox (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 review_id TEXT NOT NULL UNIQUE REFERENCES member_studio_publication_reviews(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 idempotency_key TEXT NOT NULL UNIQUE CHECK(length(idempotency_key) BETWEEN 55 AND 120),
 fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 event_type TEXT NOT NULL DEFAULT 'publish_intent' CHECK(event_type='publish_intent'),
 status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held','cancelled')),
 created_at INTEGER NOT NULL CHECK(created_at>0),
 cancelled_at INTEGER,
 CHECK((status='held' AND cancelled_at IS NULL) OR
       (status='cancelled' AND cancelled_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_member_studio_publication_outbox_status
 ON member_studio_publication_outbox(status,created_at,id);

-- The held review and held outbox must be one atomic write; a separate
-- second insert could otherwise leave an orphan on a partial failure.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_review_to_held_outbox
 AFTER INSERT ON member_studio_publication_reviews
 BEGIN
   INSERT INTO member_studio_publication_outbox(
     id,review_id,project_id,idempotency_key,fingerprint,event_type,status,created_at)
   VALUES(NEW.id,NEW.id,NEW.project_id,NEW.idempotency_key,NEW.fingerprint,
     'publish_intent','held',NEW.created_at);
 END;

-- Even a direct SQL insert must be refused unless it cites the currently
-- pending immutable receipt and the independent canonical reviewer exists.
-- No actor in this schema has a way to grant publication rights.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_review_guard
 BEFORE INSERT ON member_studio_publication_reviews
 WHEN NOT EXISTS (
   SELECT 1 FROM member_studio_submissions s
   JOIN member_studio_projects p ON p.id=s.project_id
   JOIN "user" reviewer ON reviewer.id=NEW.reviewer_user_id
   JOIN member_studio_publication_reviewer_grants g
     ON g.reviewer_user_id=reviewer.id AND g.revoked_at IS NULL
     AND g.granted_at<=NEW.created_at
   WHERE NEW.status='held' AND reviewer.emailVerified=1
     AND s.id=NEW.submission_id AND s.project_id=NEW.project_id
     AND s.user_id=NEW.owner_user_id AND s.project_revision=NEW.project_revision
     AND p.id=NEW.project_id AND p.user_id=NEW.owner_user_id
     AND p.status='pending_review' AND p.revision=NEW.project_revision
     AND s.status='pending_review' AND NEW.owner_user_id<>NEW.reviewer_user_id
 )
 BEGIN
   SELECT RAISE(ABORT,'stale or unverified publication receipt');
 END;

-- Fingerprints, receipts and authorship never change after record creation.
-- Only the one-way held -> cancelled transition is permitted.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_review_immutable
 BEFORE UPDATE OF id,submission_id,project_id,owner_user_id,project_revision,
   idempotency_key,fingerprint,snapshot_json,reviewer_reason,created_at
 ON member_studio_publication_reviews
 BEGIN SELECT RAISE(ABORT,'publication review receipt is immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_outbox_immutable
 BEFORE UPDATE OF id,review_id,project_id,idempotency_key,fingerprint,event_type,created_at
 ON member_studio_publication_outbox
 BEGIN SELECT RAISE(ABORT,'held outbox payload is immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_review_no_rearm
 BEFORE UPDATE OF status ON member_studio_publication_reviews
 WHEN OLD.status='cancelled' OR NEW.status<>'cancelled'
 BEGIN SELECT RAISE(ABORT,'cancelled review cannot be rearmed'); END;
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_outbox_no_rearm
 BEFORE UPDATE OF status ON member_studio_publication_outbox
 WHEN OLD.status='cancelled' OR NEW.status<>'cancelled'
 BEGIN SELECT RAISE(ABORT,'cancelled outbox cannot be rearmed'); END;

-- Removing a reviewer must not leave a still-held anonymous approval.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_reviewer_removed
 AFTER UPDATE OF reviewer_user_id ON member_studio_publication_reviews
 WHEN NEW.reviewer_user_id IS NULL
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
     WHERE id=NEW.id AND status='held';
   UPDATE member_studio_publication_outbox
     SET status='cancelled',cancelled_at=NEW.created_at
     WHERE review_id=NEW.id AND status='held';
 END;

-- Grantor/verifier account deletion cascades away the grant, triggering
-- the same held-review cancellation as an explicit grant revocation. This
-- avoids retaining a user's account solely for unpublished review evidence.
-- A future approved audit ledger must separately define non-PII retention.
-- Revocation, removal, or loss of verified identity invalidates outstanding
-- held review rows, even if the creator's submission is unchanged.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_grant_revoked
 AFTER UPDATE OF revoked_at ON member_studio_publication_reviewer_grants
 WHEN NEW.revoked_at IS NOT NULL
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
    WHERE reviewer_user_id=NEW.reviewer_user_id AND status='held';
   UPDATE member_studio_publication_outbox
    SET status='cancelled',cancelled_at=MAX(created_at,NEW.revoked_at)
    WHERE review_id IN (SELECT id FROM member_studio_publication_reviews
     WHERE reviewer_user_id=NEW.reviewer_user_id) AND status='held';
 END;

CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_grant_removed
 AFTER DELETE ON member_studio_publication_reviewer_grants
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
    WHERE reviewer_user_id=OLD.reviewer_user_id AND status='held';
   UPDATE member_studio_publication_outbox
    SET status='cancelled',cancelled_at=MAX(created_at,CAST(strftime('%s','now') AS INTEGER))
    WHERE review_id IN (SELECT id FROM member_studio_publication_reviews
     WHERE reviewer_user_id=OLD.reviewer_user_id) AND status='held';
 END;

CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_reviewer_unverified
 AFTER UPDATE OF emailVerified ON "user"
 WHEN NEW.emailVerified<>1
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
    WHERE reviewer_user_id=NEW.id AND status='held';
   UPDATE member_studio_publication_outbox
    SET status='cancelled',cancelled_at=MAX(created_at,CAST(strftime('%s','now') AS INTEGER))
    WHERE review_id IN (SELECT id FROM member_studio_publication_reviews
     WHERE reviewer_user_id=NEW.id) AND status='held';
 END;

-- A creator withdrawal, re-edit, rejection or staff change-request makes the
-- exact held revision ineligible. This trigger DOES NOT emit a public event.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_project_invalidated
 AFTER UPDATE OF status,revision ON member_studio_projects
 WHEN NEW.status<>'pending_review' OR NEW.revision<>OLD.revision
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
    WHERE project_id=NEW.id AND status='held';
   UPDATE member_studio_publication_outbox
    SET status='cancelled',cancelled_at=NEW.updated_at
    WHERE project_id=NEW.id AND status='held';
 END;

-- Snapshot withdrawal is independently fail-closed even if project state did
-- not change because of a future version's review workflow.
CREATE TRIGGER IF NOT EXISTS trg_member_studio_publication_receipt_invalidated
 AFTER UPDATE OF status ON member_studio_submissions
 WHEN NEW.status<>'pending_review'
 BEGIN
   UPDATE member_studio_publication_reviews SET status='cancelled'
    WHERE submission_id=NEW.id AND status='held';
   UPDATE member_studio_publication_outbox
    SET status='cancelled',cancelled_at=COALESCE(NEW.resolved_at,NEW.submitted_at)
    WHERE review_id IN (
      SELECT id FROM member_studio_publication_reviews
      WHERE submission_id=NEW.id
    ) AND status='held';
 END;
