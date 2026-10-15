-- ANEVUM V018. Review-only migration for isolated canonical MEMBER_DB.
-- Never apply to legacy Creator, V5, RHEN, or production databases.
-- Public appearance preferences remain hidden until profile visibility = public.
ALTER TABLE member_creator_profiles ADD COLUMN headline TEXT NOT NULL DEFAULT ''
  CHECK(length(headline)<=120);
ALTER TABLE member_creator_profiles ADD COLUMN world_theme TEXT NOT NULL DEFAULT 'continuance'
  CHECK(world_theme IN ('continuance','nocturne','verdant'));
ALTER TABLE member_creator_profiles ADD COLUMN focus_json TEXT NOT NULL DEFAULT '[]'
  CHECK(json_valid(focus_json) AND json_type(focus_json)='array' AND length(focus_json)<=256);
