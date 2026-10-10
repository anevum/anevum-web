// Browser-only acceptance of the current authenticated member's persistent
// RHEN_NEXT workspace. Runs only on the isolated staging origin and never sends
// credentials, raw member IDs or workspace IDs to third-party services.
import { parsePrivateFoundationWorkspace, type FoundationWorkspaceState } from "../contracts/anevum-foundation.ts";

export const WORKSPACE_STAGING_ORIGIN = "https://anevum-member-staging.devonakins.workers.dev";
export type WorkspaceStagingProof = {
  passed: true;
  checks: readonly string[];
  // SHA-256 prefix of the randomly generated workspace identifier, not a credential.
  proofCode: string;
};
export type WorkspaceStagingStep =
  | "SESSION" | "INITIAL_READ" | "CREATE" | "REPLAY"
  | "DENY_QUERY" | "DENY_BODY" | "FINAL_READ" | "EXPORT" | "PROOF";

export class WorkspaceStagingFailure extends Error {
  constructor(
    public readonly step: WorkspaceStagingStep,
    public readonly reason: string
  ) {
    super("Staging private workspace check failed.");
    this.name = "WorkspaceStagingFailure";
  }
}

type JSONRecord = Record<string, unknown>;

function record(value: unknown): JSONRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JSONRecord : null;
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function requestOptions(method: "GET" | "POST", body?: string): RequestInit {
  return {
    method, credentials: "same-origin", cache: "no-store", redirect: "manual",
    ...(body === undefined ? {} : {
      headers: { "Content-Type": "application/json" },
      body
    })
  };
}
function isPrivate(response: Response): boolean {
  return (response.headers.get("cache-control") || "").includes("no-store") &&
    (response.headers.get("x-robots-tag") || "").includes("noindex");
}
async function readResponse(fetcher: typeof fetch, path: string,
  method: "GET" | "POST" = "GET", body?: string): Promise<JSONRecord> {
  const response = await fetcher(path, requestOptions(method, body));
  if (response.status !== 200) throw new Error("STAGING_HTTP_" + response.status);
  assert(isPrivate(response), "STAGING_PRIVATE_HEADERS_MISSING");
  assert((response.headers.get("content-type") || "").includes("application/json"),
    "STAGING_RESPONSE_NOT_JSON");
  const result: unknown = await response.json();
  const parsed = record(result);
  assert(parsed !== null, "Private workspace returned an invalid object.");
  return parsed;
}
function approvedWorkspace(data: JSONRecord, memberId: string,
  required: boolean): FoundationWorkspaceState | null {
  assert(data.available === true && Object.hasOwn(data, "workspace"),
    "RHEN private workspace service is not available.");
  if (data.workspace === null && !required) return null;
  const workspace = parsePrivateFoundationWorkspace(data.workspace, memberId);
  assert(workspace !== null, "Workspace identity did not match the current member.");
  assert(workspace.workspace_kind === "MEMBER_PRIVATE" &&
    workspace.engine_source === "RHEN_NEXT" &&
    workspace.evidence_state === "NOT_CONFIGURED" &&
    workspace.execution_permission === "NONE" &&
    workspace.broker_link_state === "NOT_LINKED" &&
    workspace.capabilities.length === 1 &&
    workspace.capabilities[0] === "VIEW",
    "Staging RHEN workspace has unexpected privileges.");
  return workspace;
}
async function ensureDenied(fetcher: typeof fetch, path: string,
  method: "GET" | "POST", body?: string): Promise<void> {
  const response = await fetcher(path, requestOptions(method, body));
  if (response.status !== 400) throw new Error("STAGING_EXPECTED_DENIAL_HTTP_" + response.status);
  assert(isPrivate(response), "STAGING_DENIAL_PRIVATE_HEADERS_MISSING");
}

/**
 * Explicitly provisions a durable staging-only workspace after checking the
 * current Better Auth session. Two separate browsers can compare proofCodes:
 * different codes mean different workspace identifiers (not a comprehensive
 * proof of cross-user isolation). Never paste session cookies into ChatGPT.
 */
export async function runWorkspaceStagingProof(
  fetcher: typeof fetch, authenticatedMemberId: string, origin: string,
  onStep?: (step: WorkspaceStagingStep) => void
): Promise<WorkspaceStagingProof> {
  assert(origin === WORKSPACE_STAGING_ORIGIN, "Workspace acceptance is staging-only.");
  assert(typeof authenticatedMemberId === "string" && authenticatedMemberId.length > 0,
    "An authenticated member session is required.");

  let currentStep: WorkspaceStagingStep = "SESSION";
  const advance = (step: WorkspaceStagingStep) => {
    currentStep = step;
    onStep?.(step);
  };
  const checks: string[] = [];
  try {
  advance("SESSION");
  const session = await readResponse(fetcher, "/api/member/session");
  assert(session.authenticated === true &&
    record(session.user)?.id === authenticatedMemberId,
    "The server session does not match this signed-in account.");
  checks.push("Verified Better Auth session matches the current account");

  advance("INITIAL_READ");
  const before = approvedWorkspace(
    await readResponse(fetcher, "/api/member/rhen/workspace"),
    authenticatedMemberId, false
  );
  checks.push("Initial workspace read is private and account-scoped");

  advance("CREATE");
  const created = approvedWorkspace(
    await readResponse(fetcher, "/api/member/rhen/workspace", "POST"),
    authenticatedMemberId, true
  );
  assert(created !== null, "Workspace was not persisted.");
  if (before) assert(before.workspace_id === created.workspace_id,
    "Existing workspace identity unexpectedly changed.");
  checks.push("Staging-only workspace created or safely reused without broker privileges");

  advance("REPLAY");
  const replay = approvedWorkspace(
    await readResponse(fetcher, "/api/member/rhen/workspace", "POST"),
    authenticatedMemberId, true
  );
  assert(replay?.workspace_id === created.workspace_id,
    "Repeated workspace provisioning was not idempotent.");
  checks.push("Repeated provisioning returns the same durable workspace");

  advance("DENY_QUERY");
  await ensureDenied(fetcher, "/api/member/rhen/workspace?member_id=other", "GET");
  advance("DENY_BODY");
  await ensureDenied(fetcher, "/api/member/rhen/workspace", "POST",
    JSON.stringify({ member_id: "other" }));
  checks.push("Client-selected member IDs are rejected for reads and writes");

  advance("FINAL_READ");
  const after = approvedWorkspace(
    await readResponse(fetcher, "/api/member/rhen/workspace"),
    authenticatedMemberId, true
  );
  assert(after?.workspace_id === created.workspace_id,
    "Workspace changed after a rejected tenant-selection attempt.");
  advance("EXPORT");
  const exported = await readResponse(fetcher, "/api/member/export");
  assert(record(exported.identity)?.id === authenticatedMemberId,
    "Export identity did not match the signed-in account.");
  const exportedWorkspace = approvedWorkspace({
    available: true, workspace: exported.rhenWorkspace
  }, authenticatedMemberId, true);
  assert(exportedWorkspace?.workspace_id === created.workspace_id,
    "Export does not contain the current account's persisted workspace.");
  checks.push("Workspace read and account export remain consistent");

  advance("PROOF");
  const digest = await crypto.subtle.digest(
    "SHA-256", new TextEncoder().encode(created.workspace_id)
  );
  const proofCode = Array.from(new Uint8Array(digest).slice(0, 16),
    byte => byte.toString(16).padStart(2, "0")).join("");
  assert(/^[0-9a-f]{32}$/.test(proofCode), "Browser proof generation failed.");
  checks.push("Generated a non-secret comparison fingerprint locally");
  return Object.freeze({ passed: true, checks: Object.freeze(checks), proofCode });
  } catch (error) {
    // No error text or response body crosses this boundary. Only fixed
    // verification step codes and bounded HTTP status numbers are exposed.
    const message = error instanceof Error ? error.message : "";
    const http = /^STAGING_(?:EXPECTED_DENIAL_)?HTTP_([1-5][0-9]{2})$/.exec(message);
    const reason = http ? "HTTP_" + http[1]
      : message === "STAGING_PRIVATE_HEADERS_MISSING" ? "PRIVATE_HEADERS"
      : message === "STAGING_DENIAL_PRIVATE_HEADERS_MISSING" ? "DENIAL_HEADERS"
      : message === "STAGING_RESPONSE_NOT_JSON" ? "RESPONSE_NOT_JSON"
      : message === "The server session does not match this signed-in account." ? "SESSION_MISMATCH"
      : message === "RHEN private workspace service is not available." ? "WORKSPACE_NOT_AVAILABLE"
      : message === "Workspace identity did not match the current member." ? "WORKSPACE_IDENTITY"
      : message === "Staging RHEN workspace has unexpected privileges." ? "UNEXPECTED_PRIVILEGE"
      : message === "Workspace was not persisted." ? "NOT_PERSISTED"
      : message === "Existing workspace identity unexpectedly changed." ? "IDENTITY_CHANGED"
      : message === "Repeated workspace provisioning was not idempotent." ? "NOT_IDEMPOTENT"
      : message === "Workspace changed after a rejected tenant-selection attempt." ? "IDENTITY_CHANGED"
      : message === "Export identity did not match the signed-in account." ? "EXPORT_IDENTITY"
      : message === "Export does not contain the current account's persisted workspace." ? "EXPORT_WORKSPACE"
      : message === "Browser proof generation failed." ? "PROOF_GENERATION"
      : "CHECK_FAILED";
    throw new WorkspaceStagingFailure(currentStep, reason);
  }
}
