// V5 RHEN_NEXT identity allocation only. No broker tokens, trades or execution flags.
// The caller MUST supply the authenticated Better Auth user.id, never a request field.
const WORKSPACE_PATTERN = /^wrk_[a-f0-9]{32}$/;
const UTC_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function requireMemberId(userId) {
  if (typeof userId !== "string" || !userId || userId.length > 128) {
    throw new Error("Verified member ID required.");
  }
}

export async function memberRhenWorkspaceSchemaReady(db) {
  if (!db || typeof db.prepare !== "function") return false;
  try {
    const row = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='member_rhen_workspaces'"
    ).first();
    return row?.name === "member_rhen_workspaces";
  } catch {
    return false;
  }
}

export async function readMemberRhenWorkspace(db, userId) {
  requireMemberId(userId);
  const row = await db.prepare(
    "SELECT workspace_id AS workspaceId, created_at AS createdAt " +
    "FROM member_rhen_workspaces WHERE user_id = ?"
  ).bind(userId).first();
  if (!row) return null;
  if (!WORKSPACE_PATTERN.test(row.workspaceId) ||
      typeof row.createdAt !== "string" ||
      !UTC_TIME_PATTERN.test(row.createdAt) ||
      !Number.isFinite(Date.parse(row.createdAt))) {
    throw new Error("Stored workspace record invalid.");
  }

  // Exact shared workspace-state.v1 projection; no owner privilege or brokerage data.
  return Object.freeze({
    schema_version: "anevum.workspace-state.v1",
    workspace_id: row.workspaceId,
    member_id: userId,
    workspace_kind: "MEMBER_PRIVATE",
    engine_source: "RHEN_NEXT",
    evidence_state: "NOT_CONFIGURED",
    execution_permission: "NONE",
    broker_link_state: "NOT_LINKED",
    capabilities: Object.freeze(["VIEW"]),
    updated_at: row.createdAt
  });
}

export async function createMemberRhenWorkspace(db, userId) {
  requireMemberId(userId);
  // A stored random identifier survives Better Auth secret rotation and reconnects.
  // INSERT OR IGNORE makes concurrent same-member POSTs idempotent.
  const workspaceId = "wrk_" + crypto.randomUUID().replaceAll("-", "");
  await db.prepare(
    "INSERT OR IGNORE INTO member_rhen_workspaces (user_id, workspace_id) VALUES (?, ?)"
  ).bind(userId, workspaceId).run();
  const result = await readMemberRhenWorkspace(db, userId);
  if (!result) throw new Error("Workspace creation was not committed.");
  return result;
}
