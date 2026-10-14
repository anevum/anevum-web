-- ANEVUM Creator V1: member-owned customizable profile worlds.
-- STAGING SOURCE ONLY. Reserved migration 0010: 0007/0008/0009 draft
-- reconciliation and isolated D1 restore rehearsals are mandatory first.
-- NO migration is applied by merging this file.
CREATE TABLE IF NOT EXISTS member_world_appearances (
  member_id TEXT PRIMARY KEY REFERENCES member_accounts(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
  theme TEXT NOT NULL DEFAULT 'astral' CHECK(theme IN ('astral','ember','verdigris','obsidian')),
  scene TEXT NOT NULL DEFAULT 'portal' CHECK(scene IN ('portal','games','research','creative')),
  section_order TEXT NOT NULL DEFAULT '["work","cabinet","community"]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_world_appearance_public
 ON member_world_appearances(visibility,updated_at)
 WHERE visibility='public';
