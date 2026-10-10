-- ANEVUM V5: durable per-member RHEN_NEXT workspace identity (no brokerage authority).
-- Applied to preview D1 first; production use remains separately gated.
-- Member IDs are server-derived Better Auth identities, never client-supplied.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_rhen_workspaces (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  workspace_id TEXT NOT NULL UNIQUE
    CHECK (length(workspace_id) = 36 AND substr(workspace_id, 1, 4) = 'wrk_'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
