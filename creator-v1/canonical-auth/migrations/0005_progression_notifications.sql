-- ANEVUM.WEB.BUILD.2026-10-16.003.LEVELS-AWARDS-ALERTS
-- Additive staging MEMBER_DB only. Test XP is separately attributable.
CREATE TABLE IF NOT EXISTS member_xp_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 request_id TEXT NOT NULL,
 source TEXT NOT NULL CHECK(source='test_button'),
 amount INTEGER NOT NULL CHECK(amount=5),
 created_at INTEGER NOT NULL,
 UNIQUE(user_id,request_id)
);
CREATE INDEX IF NOT EXISTS member_xp_owner_time ON member_xp_events(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_reward_notifications (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('level','award')),
 reference TEXT NOT NULL,
 level INTEGER,
 created_at INTEGER NOT NULL,
 UNIQUE(user_id,kind,reference)
);
CREATE INDEX IF NOT EXISTS member_reward_owner_id ON member_reward_notifications(user_id,id);
CREATE TABLE IF NOT EXISTS member_notification_receipts (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 through_id INTEGER NOT NULL DEFAULT 0
);
-- Existing milestones remain earned without replaying old popups at deployment.
INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,created_at)
 SELECT user_id,'award',milestone,earned_at FROM member_space_milestones;
INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,level,created_at)
 SELECT user_id,'level','2',2,MAX(earned_at) FROM member_space_milestones
 GROUP BY user_id HAVING SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)>=25;
INSERT OR IGNORE INTO member_notification_receipts(user_id,through_id)
 SELECT user_id,MAX(id) FROM member_reward_notifications GROUP BY user_id;
