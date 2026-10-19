-- ANEVUM.OPS.PATCH.2026-10-19.001.D1-QUOTA-RECOVERY
-- Canonical MEMBER_DB only. Apply as one reviewed, atomic D1 migration
-- after the daily read quota has recovered; do not touch live on quota exhaustion.
-- Existing immutable XP event IDs and all member accounts remain unchanged.
CREATE TABLE IF NOT EXISTS member_xp_totals (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 xp INTEGER NOT NULL DEFAULT 0 CHECK(xp>=0)
);
-- Backfill once for existing events. An existing materialized total is
-- authoritative on reruns; conflict-ignore avoids accidental duplication.
INSERT OR IGNORE INTO member_xp_totals(user_id,xp)
 SELECT user_id,COALESCE(SUM(amount),0) FROM member_xp_events GROUP BY user_id;
CREATE TRIGGER IF NOT EXISTS member_xp_totals_insert
 AFTER INSERT ON member_xp_events
 BEGIN
  INSERT INTO member_xp_totals(user_id,xp) VALUES(NEW.user_id,NEW.amount)
   ON CONFLICT(user_id) DO UPDATE SET xp=member_xp_totals.xp+excluded.xp;
 END;
CREATE TRIGGER IF NOT EXISTS member_xp_totals_delete
 AFTER DELETE ON member_xp_events
 BEGIN
  UPDATE member_xp_totals SET xp=xp-OLD.amount WHERE user_id=OLD.user_id;
 END;
CREATE TRIGGER IF NOT EXISTS member_xp_totals_update
 AFTER UPDATE OF user_id,amount ON member_xp_events
 BEGIN
  UPDATE member_xp_totals SET xp=xp-OLD.amount WHERE user_id=OLD.user_id;
  INSERT INTO member_xp_totals(user_id,xp) VALUES(NEW.user_id,NEW.amount)
   ON CONFLICT(user_id) DO UPDATE SET xp=member_xp_totals.xp+excluded.xp;
 END;
