-- REVIEW ONLY. Additive staging migration after 0007_community_post_stream.
-- 0010-0012 are reserved by the member-world/follows/forum integration branch.
-- A project deletion retains the reference so its discussion stays suppressed;
-- it must never silently become an unanchored public post.
CREATE TABLE community_post_projects (
 post_id TEXT PRIMARY KEY NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
 project_id TEXT NOT NULL CHECK(length(project_id) BETWEEN 1 AND 80)
);
CREATE INDEX idx_community_post_projects_project ON community_post_projects(project_id,post_id);
INSERT INTO schema_migrations(version) VALUES('0013_community_post_projects');
