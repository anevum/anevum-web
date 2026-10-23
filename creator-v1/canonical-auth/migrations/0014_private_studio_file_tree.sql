-- ANEVUM.WEB.BUILD.2026-10-22.002.CREATOR-STUDIO-PERSISTENT-FILE-TREE
-- STAGING CANDIDATE ONLY. This file is intentionally NOT applied automatically.
-- Before any staging/production D1 migration: inventory active schema, encrypted
-- independent backup, restore rehearsal, formal review, and separate rollout.
-- Adds private, editable TEXT source artifacts; NOT a general app runtime.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS member_studio_file_nodes (
 id TEXT PRIMARY KEY NOT NULL CHECK(length(id)=36),
 project_id TEXT NOT NULL REFERENCES member_studio_projects(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 parent_id TEXT REFERENCES member_studio_file_nodes(id) ON DELETE CASCADE,
 parent_key TEXT NOT NULL DEFAULT '' CHECK(parent_key=coalesce(parent_id,'')),
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 name_key TEXT NOT NULL CHECK(length(name_key) BETWEEN 1 AND 80),
 kind TEXT NOT NULL CHECK(kind IN ('folder','text')),
 content TEXT NOT NULL DEFAULT '' CHECK(length(content)<=32768),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
 client_request_id TEXT NOT NULL CHECK(length(client_request_id)=36),
 deleted_at INTEGER,
 created_at INTEGER NOT NULL CHECK(created_at>0),
 updated_at INTEGER NOT NULL CHECK(updated_at>0),
 CHECK(kind='text' OR length(content)=0),
 UNIQUE(user_id,project_id,client_request_id)
);
CREATE INDEX IF NOT EXISTS idx_studio_file_nodes_project
 ON member_studio_file_nodes(user_id,project_id,parent_key,deleted_at,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_file_active_sibling
 ON member_studio_file_nodes(project_id,parent_key,name_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_studio_file_trash
 ON member_studio_file_nodes(user_id,project_id,deleted_at) WHERE deleted_at IS NOT NULL;

-- Defend against moving another project's folder under the current owner.
CREATE TRIGGER IF NOT EXISTS studio_file_insert_parent_guard
 BEFORE INSERT ON member_studio_file_nodes
 WHEN NEW.parent_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM member_studio_file_nodes p
   WHERE p.id=NEW.parent_id AND p.project_id=NEW.project_id
    AND p.user_id=NEW.user_id AND p.kind='folder' AND p.deleted_at IS NULL
 )
 BEGIN SELECT RAISE(ABORT,'Invalid parent folder'); END;
CREATE TRIGGER IF NOT EXISTS studio_file_update_parent_guard
 BEFORE UPDATE OF parent_id ON member_studio_file_nodes
 WHEN NEW.parent_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM member_studio_file_nodes p
   WHERE p.id=NEW.parent_id AND p.project_id=NEW.project_id
    AND p.user_id=NEW.user_id AND p.kind='folder' AND p.deleted_at IS NULL
 )
 BEGIN SELECT RAISE(ABORT,'Invalid parent folder'); END;

-- Immutable revision snapshots. Roll window of 12 versions per file/folder.
-- Files remain private; revisions cannot publish or execute source.
CREATE TABLE IF NOT EXISTS member_studio_file_versions (
 node_id TEXT NOT NULL REFERENCES member_studio_file_nodes(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL CHECK(revision>=1),
 project_id TEXT NOT NULL,
 user_id TEXT NOT NULL,
 parent_id TEXT,
 name TEXT NOT NULL,
 kind TEXT NOT NULL,
 content TEXT NOT NULL,
 deleted_at INTEGER,
 changed_at INTEGER NOT NULL,
 PRIMARY KEY(node_id,revision)
);
CREATE INDEX IF NOT EXISTS idx_studio_file_versions_project
 ON member_studio_file_versions(user_id,project_id,node_id,revision DESC);
CREATE TRIGGER IF NOT EXISTS studio_file_create_revision AFTER INSERT ON member_studio_file_nodes
 BEGIN
  INSERT INTO member_studio_file_versions(node_id,revision,project_id,user_id,parent_id,name,kind,content,deleted_at,changed_at)
  VALUES(NEW.id,NEW.revision,NEW.project_id,NEW.user_id,NEW.parent_id,NEW.name,NEW.kind,NEW.content,NEW.deleted_at,NEW.updated_at);
 END;
CREATE TRIGGER IF NOT EXISTS studio_file_update_revision AFTER UPDATE OF name,name_key,parent_id,parent_key,content,revision,deleted_at ON member_studio_file_nodes
 BEGIN
  INSERT INTO member_studio_file_versions(node_id,revision,project_id,user_id,parent_id,name,kind,content,deleted_at,changed_at)
  VALUES(NEW.id,NEW.revision,NEW.project_id,NEW.user_id,NEW.parent_id,NEW.name,NEW.kind,NEW.content,NEW.deleted_at,NEW.updated_at);
  DELETE FROM member_studio_file_versions WHERE node_id=NEW.id AND revision NOT IN (
   SELECT revision FROM member_studio_file_versions
    WHERE node_id=NEW.id ORDER BY revision DESC LIMIT 12
  );
 END;
