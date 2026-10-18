-- IREN V004: one-time canonical founder authorization guard.
-- Installed only after 0011_staff_roles.sql. Does not create or change any user,
-- staff grant, review decision, profile, billing record or session.
CREATE UNIQUE INDEX IF NOT EXISTS staff_single_active_owner
ON staff_access_grants(role) WHERE role='owner' AND revoked_at IS NULL;

-- The sole bootstrap must be requested as an existing verified member,
-- with grant actor == subject. No public API can create founder grants.
CREATE TRIGGER IF NOT EXISTS staff_owner_insert_guard
BEFORE INSERT ON staff_access_grants
WHEN NEW.role='owner'
BEGIN
 SELECT CASE WHEN NEW.revoked_at IS NOT NULL
   OR NEW.granted_by IS NOT NEW.member_id
   OR (SELECT COUNT(*) FROM "user" WHERE id=NEW.member_id AND emailVerified=1)<>1
   OR (SELECT COUNT(*) FROM staff_access_grants WHERE role='owner' AND revoked_at IS NULL)>0
 THEN RAISE(ABORT,'IREN owner bootstrap refused') END;
END;

CREATE TRIGGER IF NOT EXISTS staff_owner_bootstrap_audit
AFTER INSERT ON staff_access_grants
WHEN NEW.role='owner' AND NEW.revoked_at IS NULL
BEGIN
 INSERT INTO staff_access_audit(id,actor_id,member_id,action,created_at)
 VALUES(lower(hex(randomblob(16))),NEW.granted_by,NEW.member_id,
        'bootstrap-owner',NEW.created_at);
END;

-- Prevent accidental role changes and silent owner revocation.
CREATE TRIGGER IF NOT EXISTS staff_owner_update_guard
BEFORE UPDATE ON staff_access_grants
WHEN OLD.role='owner' OR NEW.role='owner'
BEGIN
 SELECT RAISE(ABORT,'IREN owner requires independent recovery procedure');
END;
