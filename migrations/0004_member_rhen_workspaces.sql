-- ANEVUM V5: durable per-member RHEN_NEXT workspace identity (no brokerage authority).
-- Sequencing: 0003_member_billing.sql was applied to ANEVUM preview D1
-- by a separate unmerged billing experiment (PR #240). Its presence in the
-- preview migration ledger does not grant approval to ship billing features.
-- 0004 avoids a conflicting 0003 name and preserves existing workspace rows.
-- Never apply this file to production without the independent V5 approval gates.
-- Applied to preview D1 first; production use remains separately gated.
-- Member IDs are server-derived Better Auth identities, never client-supplied.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS member_rhen_workspaces (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  workspace_id TEXT NOT NULL UNIQUE
    CHECK (length(workspace_id) = 36 AND substr(workspace_id, 1, 4) = 'wrk_'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
