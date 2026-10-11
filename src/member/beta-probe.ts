/** Fail-closed, read-only beta availability projection; never an access grant. */
import { parsePrivateFoundationWorkspace } from "../contracts/anevum-foundation.ts";
import { parsePostPage } from "../commons/discussion-contract.ts";
export type BetaCheck = "account" | "workspace" | "draft" | "discussions";
export type BetaStatus = "available" | "disabled" | "restricted" | "sign-in-required";
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
function invalid(): never { throw new Error("Member beta response could not be verified."); }
export function verifyBetaProbe(kind: BetaCheck, status: number, value: unknown, memberId: string): BetaStatus {
  if (!memberId || memberId.length > 128) return invalid();
  if (status === 503 || status === 404) return "disabled";
  if (status === 403) return "restricted";
  if (status === 401) return "sign-in-required";
  if (status !== 200 || !object(value)) return invalid();
  if (kind === "account") {
    if (!object(value.user) || value.user.id !== memberId || !object(value.profile) ||
        typeof value.profile.displayName !== "string" || !value.profile.displayName.trim() ||
        !Array.isArray(value.savedApps) || !Array.isArray(value.follows)) return invalid();
  } else if (kind === "workspace") {
    if (value.available !== true || !Object.hasOwn(value, "workspace")) return invalid();
    if (value.workspace !== null) {
      const state = parsePrivateFoundationWorkspace(value.workspace, memberId);
      if (!state || state.workspace_kind !== "MEMBER_PRIVATE" || state.engine_source !== "RHEN_NEXT" ||
          state.execution_permission !== "NONE" || state.broker_link_state !== "NOT_LINKED") return invalid();
    }
  } else if (kind === "draft") {
    if (value.available !== true || value.executionEnabled !== false || value.brokerageConnected !== false ||
        !Object.hasOwn(value, "draft") || !(value.draft === null || object(value.draft))) return invalid();
  } else if (kind === "discussions") {
    parsePostPage(value, memberId, "all");
  } else return invalid();
  return "available";
}
