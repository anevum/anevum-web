-- ANEVUM phase-1 Better Auth member profiles. PROPOSED, not applied.
-- This migration belongs only to a separately approved Better Auth MEMBER_DB,
-- never to Creator V1 staging COMMUNITY_DB or owner RHEN / Command data.
-- Canonical user.id is the only owner key. Claiming a handle is not account linking.
CREATE TABLE IF NOT EXISTS member_creator_profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  handle TEXT NOT NULL COLLATE NOCASE UNIQUE
    CHECK(length(handle) BETWEEN 3 AND 30 AND handle=lower(handle)),
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),
  bio TEXT NOT NULL DEFAULT '' CHECK(length(bio)<=1200),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL CHECK(updated_at>=created_at)
);
CREATE INDEX IF NOT EXISTS idx_member_creator_public
  ON member_creator_profiles(visibility,handle) WHERE visibility='public';

-- Per-member bounded edit allowance. Client cannot select member keys.
CREATE TABLE IF NOT EXISTS member_creator_edit_limits (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  window_start INTEGER NOT NULL,
  requests INTEGER NOT NULL CHECK(requests BETWEEN 1 AND 20)
);
