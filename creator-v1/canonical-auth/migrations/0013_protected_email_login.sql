-- ANEVUM.WEB.PATCH.2026-10-18.001.FOUNDER-OTP-RECOVERY
-- Additive canonical MEMBER_DB migration. Does NOT grant staff privileges,
-- change users, sessions, email delivery provider or existing protected list.
CREATE TABLE IF NOT EXISTS canonical_protected_email_login_allowance (
 email TEXT PRIMARY KEY COLLATE NOCASE NOT NULL,
 approved_by TEXT NOT NULL REFERENCES "user"(id),
 approved_at INTEGER NOT NULL,
 revoked_at INTEGER,
 revoked_by TEXT REFERENCES "user"(id),
 CHECK(email=lower(email)),
 CHECK((revoked_at IS NULL AND revoked_by IS NULL) OR
       (revoked_at IS NOT NULL AND revoked_by IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS canonical_protected_email_login_audit (
 id TEXT PRIMARY KEY NOT NULL,
 email TEXT NOT NULL,
 actor_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
 action TEXT NOT NULL CHECK(action IN ('approved','revoked')),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS canonical_protected_login_audit_recent
 ON canonical_protected_email_login_audit(created_at DESC,id DESC);

-- An authorized administrator must be the current verified canonical owner.
-- An ordinary signup or moderator cannot approve a protected address.
CREATE TRIGGER IF NOT EXISTS canonical_protected_login_authorizer
BEFORE INSERT ON canonical_protected_email_login_allowance
BEGIN
 SELECT CASE WHEN NEW.revoked_at IS NOT NULL
   OR NOT EXISTS(
     SELECT 1 FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id
     WHERE g.member_id=NEW.approved_by AND g.role='owner'
       AND g.revoked_at IS NULL AND u.emailVerified=1
   )
 THEN RAISE(ABORT,'Protected address requires verified owner authorization') END;
END;

-- Approval identities cannot be edited, silently revived or transferred.
-- A revocation must identify another currently verified owner and is audited.
CREATE TRIGGER IF NOT EXISTS canonical_protected_login_revoke_guard
BEFORE UPDATE ON canonical_protected_email_login_allowance
BEGIN
 SELECT CASE WHEN OLD.email IS NOT NEW.email
   OR OLD.approved_by IS NOT NEW.approved_by
   OR OLD.approved_at IS NOT NEW.approved_at
   OR OLD.revoked_at IS NOT NULL
   OR NEW.revoked_at IS NULL
   OR NOT EXISTS(
      SELECT 1 FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id
      WHERE g.member_id=NEW.revoked_by AND g.role='owner'
      AND g.revoked_at IS NULL AND u.emailVerified=1
   )
 THEN RAISE(ABORT,'Protected email allowance is immutable; revocation requires verified owner') END;
END;

CREATE TRIGGER IF NOT EXISTS canonical_protected_login_approval_audit
AFTER INSERT ON canonical_protected_email_login_allowance
BEGIN
 INSERT INTO canonical_protected_email_login_audit(id,email,actor_id,action,created_at)
 VALUES(lower(hex(randomblob(16))),NEW.email,NEW.approved_by,'approved',NEW.approved_at);
END;

CREATE TRIGGER IF NOT EXISTS canonical_protected_login_revoke_audit
AFTER UPDATE OF revoked_at ON canonical_protected_email_login_allowance
WHEN OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL
BEGIN
 INSERT INTO canonical_protected_email_login_audit(id,email,actor_id,action,created_at)
 VALUES(lower(hex(randomblob(16))),NEW.email,NEW.revoked_by,'revoked',NEW.revoked_at);
END;
