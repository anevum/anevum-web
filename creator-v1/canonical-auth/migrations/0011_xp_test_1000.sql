-- ANEVUM.WEB.PATCH.2026-10-19.001.XP-TEST-1000-AND-RESET
-- Preserve historical 5-XP calibration events while allowing the temporary
-- V082 test instrument to award 1,000 XP per confirmed press.
-- This migration does not alter member accounts, milestone XP, badges, or permissions.

PRAGMA defer_foreign_keys = true;

CREATE TABLE member_xp_events_v082 (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 request_id TEXT NOT NULL,
 source TEXT NOT NULL CHECK(source='test_button'),
 amount INTEGER NOT NULL CHECK(amount IN (5,1000)),
 created_at INTEGER NOT NULL,
 UNIQUE(user_id,request_id)
);

INSERT INTO member_xp_events_v082(id,user_id,request_id,source,amount,created_at)
 SELECT id,user_id,request_id,source,amount,created_at
 FROM member_xp_events;

DROP TABLE member_xp_events;
ALTER TABLE member_xp_events_v082 RENAME TO member_xp_events;

CREATE INDEX member_xp_owner_time ON member_xp_events(user_id,created_at DESC);

