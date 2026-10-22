-- ANEVUM.OPS.MAINT.2026-10-22.001.FINAL-XP-RESET
-- Additive schema only. Do NOT insert the reset epoch during migration.
-- Historical events, milestones, notifications, recognition, purchases and entitlements stay intact.
CREATE TABLE IF NOT EXISTS member_progression_reset_epoch (
 epoch INTEGER PRIMARY KEY CHECK(epoch=1),
 cutoff_event_id INTEGER NOT NULL CHECK(cutoff_event_id>=0),
 cutoff_at INTEGER NOT NULL CHECK(cutoff_at>0),
 applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- New-period rewards are recorded separately rather than overwriting original evidence.
CREATE TABLE IF NOT EXISTS member_progression_epoch_milestones (
 epoch INTEGER NOT NULL REFERENCES member_progression_reset_epoch(epoch),
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 milestone TEXT NOT NULL CHECK(milestone IN ('first_signal','world_shaper')),
 earned_at INTEGER NOT NULL CHECK(earned_at>0),
 PRIMARY KEY(epoch,user_id,milestone)
);
CREATE INDEX IF NOT EXISTS member_progression_epoch_milestones_user
 ON member_progression_epoch_milestones(user_id,epoch);
-- Once the compatible application release is live, activate exactly once:
-- INSERT INTO member_progression_reset_epoch(epoch,cutoff_event_id,cutoff_at)
-- SELECT 1,COALESCE(MAX(id),0),CAST(strftime('%s','now') AS INTEGER) FROM member_xp_events;
-- Do not execute this activation during schema deployment or on an old Worker.
