/** ANEVUM V5 FOUNDATION — private workspace presentation contract.
 *
 * This is NOT an authorization system. The server must derive workspace_id,
 * member_id, broker authority and owner scope from the verified session.
 * Client validation prevents stale/malformed/mixed-schema display, not access.
 * No fetch, broker API, billing, Cloudflare variables, or live writes here.
 */
export const FOUNDATION_V5_TRACKING_ID = "ANEVUM.V5.FOUNDATION.2026-10-09.001";
export const FOUNDATION_WORKSPACE_SCHEMA = "anevum.workspace-state.v1";

export type FoundationEvidenceState =
  | "NOT_CONFIGURED" | "AWAITING_EVIDENCE" | "BLOCKED" | "REPRODUCIBLE";
export type FoundationWorkspaceKind = "FOUNDER_PRIVATE" | "MEMBER_PRIVATE";
export type FoundationEngineSource = "LEGACY_FOUNDER" | "RHEN_NEXT";
export type FoundationExecutionPermission = "NONE" | "PAPER_ONLY" | "LIVE_AUTHORIZED";
export type FoundationBrokerLinkState = "NOT_LINKED" | "PENDING" | "READ_ONLY" | "LIVE_APPROVED";
export type FoundationCapability = "VIEW" | "RESEARCH" | "PAPER";

export interface FoundationWorkspaceState {
  schema_version: typeof FOUNDATION_WORKSPACE_SCHEMA;
  workspace_id: string;
  member_id: string;
  workspace_kind: FoundationWorkspaceKind;
  engine_source: FoundationEngineSource;
  evidence_state: FoundationEvidenceState;
  execution_permission: FoundationExecutionPermission;
  broker_link_state: FoundationBrokerLinkState;
  capabilities: readonly FoundationCapability[];
  updated_at: string;
}

const schemaKeys = [
  "schema_version", "workspace_id", "member_id", "workspace_kind",
  "engine_source", "evidence_state", "execution_permission",
  "broker_link_state", "capabilities", "updated_at",
] as const;

const evidenceStates = new Set<FoundationEvidenceState>([
  "NOT_CONFIGURED", "AWAITING_EVIDENCE", "BLOCKED", "REPRODUCIBLE",
]);
const workspaceKinds = new Set<FoundationWorkspaceKind>(["FOUNDER_PRIVATE", "MEMBER_PRIVATE"]);
const engineSources = new Set<FoundationEngineSource>(["LEGACY_FOUNDER", "RHEN_NEXT"]);
const executionPermissions = new Set<FoundationExecutionPermission>(["NONE", "PAPER_ONLY", "LIVE_AUTHORIZED"]);
const brokerLinkStates = new Set<FoundationBrokerLinkState>(["NOT_LINKED", "PENDING", "READ_ONLY", "LIVE_APPROVED"]);
const knownCapabilities = new Set<FoundationCapability>(["VIEW", "RESEARCH", "PAPER"]);

function isOneOf<T extends string>(value: unknown, choices: ReadonlySet<T>): value is T {
  return typeof value === "string" && choices.has(value as T);
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

/** Fail closed: unrecognized fields may contain private fills or credentials. */
export function parsePrivateFoundationWorkspace(
  input: unknown,
  authenticatedMemberId: string,
): FoundationWorkspaceState | null {
  if (!authenticatedMemberId || typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== schemaKeys.length || !schemaKeys.every((key) => Object.hasOwn(record, key))) {
    return null;
  }
  if (
    record.schema_version !== FOUNDATION_WORKSPACE_SCHEMA ||
    typeof record.workspace_id !== "string" ||
    !/^wrk_[A-Za-z0-9_-]{8,64}$/.test(record.workspace_id) ||
    typeof record.member_id !== "string" ||
    record.member_id !== authenticatedMemberId ||
    record.member_id.length > 128 ||
    !isOneOf(record.workspace_kind, workspaceKinds) ||
    !isOneOf(record.engine_source, engineSources) ||
    !isOneOf(record.evidence_state, evidenceStates) ||
    !isOneOf(record.execution_permission, executionPermissions) ||
    !isOneOf(record.broker_link_state, brokerLinkStates) ||
    !isTimestamp(record.updated_at) ||
    !Array.isArray(record.capabilities) ||
    record.capabilities.length > 3 ||
    !record.capabilities.every((c: unknown): c is FoundationCapability => isOneOf(c, knownCapabilities)) ||
    new Set(record.capabilities).size !== record.capabilities.length
  ) return null;

  const kind = record.workspace_kind;
  const source = record.engine_source;
  const permission = record.execution_permission;
  const link = record.broker_link_state;

  if (kind === "MEMBER_PRIVATE" && (
    source !== "RHEN_NEXT" ||
    permission === "LIVE_AUTHORIZED" ||
    link === "LIVE_APPROVED"
  )) return null;
  if (source === "LEGACY_FOUNDER" && kind !== "FOUNDER_PRIVATE") return null;
  if (permission === "PAPER_ONLY" && !record.capabilities.includes("PAPER")) return null;

  // Construct a fresh allowlisted projection, never pass raw provider fields.
  return Object.freeze({
    schema_version: FOUNDATION_WORKSPACE_SCHEMA,
    workspace_id: record.workspace_id,
    member_id: record.member_id,
    workspace_kind: kind,
    engine_source: source,
    evidence_state: record.evidence_state,
    execution_permission: permission,
    broker_link_state: link,
    capabilities: Object.freeze([...record.capabilities]),
    updated_at: record.updated_at,
  });
}

/** Route hint only; actual route/API access must be verified by the Worker. */
export function privateFoundationLanding(state: FoundationWorkspaceState): string {
  return state.workspace_kind === "FOUNDER_PRIVATE" && state.engine_source === "LEGACY_FOUNDER"
    ? "/command/rhen/operate"
    : "/apps/rhen";
}

/** A reproducible evidence file is never proof of profitable trading alpha. */
export function foundationResearchPresentation(state: FoundationWorkspaceState): "UNAVAILABLE" | "EVIDENCE_BLOCKED" | "RESEARCH_AVAILABLE" {
  if (state.evidence_state === "BLOCKED") return "EVIDENCE_BLOCKED";
  if (
    state.evidence_state === "REPRODUCIBLE" &&
    state.capabilities.includes("RESEARCH")
  ) return "RESEARCH_AVAILABLE";
  return "UNAVAILABLE";
}
