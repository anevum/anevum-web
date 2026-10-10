import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  FOUNDATION_V5_TRACKING_ID,
  FOUNDATION_WORKSPACE_SCHEMA,
  parsePrivateFoundationWorkspace,
  privateFoundationLanding,
  foundationResearchPresentation,
} from "../src/contracts/anevum-foundation.ts";

const owner = "owner-verified-member-id";
const member = "different-verified-member-id";
const now = "2026-10-09T19:55:00-04:00";
function founder(overrides = {}) {
  return {
    schema_version: FOUNDATION_WORKSPACE_SCHEMA,
    workspace_id: "wrk_companyfounder0001",
    member_id: owner,
    workspace_kind: "FOUNDER_PRIVATE",
    engine_source: "LEGACY_FOUNDER",
    evidence_state: "AWAITING_EVIDENCE",
    execution_permission: "LIVE_AUTHORIZED",
    broker_link_state: "LIVE_APPROVED",
    capabilities: ["VIEW", "RESEARCH"],
    updated_at: now,
    ...overrides,
  };
}
function personal(overrides = {}) {
  return {
    schema_version: FOUNDATION_WORKSPACE_SCHEMA,
    workspace_id: "wrk_personalAAAA0001",
    member_id: member,
    workspace_kind: "MEMBER_PRIVATE",
    engine_source: "RHEN_NEXT",
    evidence_state: "NOT_CONFIGURED",
    execution_permission: "NONE",
    broker_link_state: "NOT_LINKED",
    capabilities: ["VIEW"],
    updated_at: now,
    ...overrides,
  };
}

test("ANEVUM V5 version and wire schema are explicit, not magic display strings", () => {
  assert.equal(FOUNDATION_V5_TRACKING_ID, "ANEVUM.V5.FOUNDATION.2026-10-09.001");
  const schema = JSON.parse(readFileSync(
    new URL("../contracts/foundation/workspace-state.v1.schema.json", import.meta.url),
    "utf8",
  ));
  assert.equal(schema.$id, "https://anevum.com/contracts/foundation/workspace-state.v1.schema.json");
  assert.equal(schema.properties.schema_version.const, FOUNDATION_WORKSPACE_SCHEMA);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.workspace_kind.enum.length, 2);
  const bytes = readFileSync(new URL("../contracts/foundation/workspace-state.v1.schema.json", import.meta.url));
  const gitBlob = createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex");
  assert.equal(gitBlob, "7d351b2e0f4164df097fbf3a864c41ad6c8777b9", "F0 contract drift must produce a versioned schema update in both repos");
});

test("founder legacy terminal route is private and never applied to another member", () => {
  const state = parsePrivateFoundationWorkspace(founder(), owner);
  assert.ok(state);
  assert.equal(privateFoundationLanding(state), "/command/rhen/operate");
  assert.equal(parsePrivateFoundationWorkspace(founder(), member), null);
  assert.equal(Object.isFrozen(state), true);
});

test("member has independent RHEN_NEXT workspace, not legacy founder terminal", () => {
  const state = parsePrivateFoundationWorkspace(personal(), member);
  assert.ok(state);
  assert.equal(privateFoundationLanding(state), "/apps/rhen");
  assert.notEqual(state.workspace_id, founder().workspace_id);
  assert.equal(state.execution_permission, "NONE");
  assert.equal(parsePrivateFoundationWorkspace(personal(), owner), null);
});

test("provider fields, brokerage secrets, private positions and balances fail closed", () => {
  for (const field of ["alpaca_token", "broker_equity", "orders", "positions", "founder_email"]) {
    assert.equal(parsePrivateFoundationWorkspace(personal({ [field]: "PRIVATE" }), member), null);
  }
});

test("member cannot claim live broker rights or legacy founder scope", () => {
  assert.equal(parsePrivateFoundationWorkspace(personal({ execution_permission: "LIVE_AUTHORIZED" }), member), null);
  assert.equal(parsePrivateFoundationWorkspace(personal({ broker_link_state: "LIVE_APPROVED" }), member), null);
  assert.equal(parsePrivateFoundationWorkspace(personal({ engine_source: "LEGACY_FOUNDER" }), member), null);
  assert.equal(parsePrivateFoundationWorkspace(founder({ workspace_kind: "MEMBER_PRIVATE" }), owner), null);
});

test("paper-only requires explicit paper capability, never infers broker approval", () => {
  assert.equal(parsePrivateFoundationWorkspace(personal({ execution_permission: "PAPER_ONLY" }), member), null);
  const paper = parsePrivateFoundationWorkspace(personal({
    execution_permission: "PAPER_ONLY",
    capabilities: ["VIEW", "RESEARCH", "PAPER"],
  }), member);
  assert.ok(paper);
  assert.equal(paper.broker_link_state, "NOT_LINKED");
  assert.equal(privateFoundationLanding(paper), "/apps/rhen");
});

test("missing unknown malformed identities, privileges and duplicated capabilities rejected", () => {
  for (const candidate of [
    personal({ workspace_id: "owner" }),
    personal({ member_id: "" }),
    personal({ updated_at: "now" }),
    personal({ evidence_state: "VALIDATED_ALPHA" }),
    personal({ capabilities: ["VIEW", "VIEW"] }),
    personal({ capabilities: ["LIVE"] }),
    personal({ capabilities: ["VIEW", "RESEARCH", "PAPER", "ADMIN"] }),
    personal({ schema_version: "anevum.workspace-state.v0" }),
  ]) {
    assert.equal(parsePrivateFoundationWorkspace(candidate, member), null);
  }
});

test("reproducible evidence is not surfaced as research available without the capability", () => {
  const no = parsePrivateFoundationWorkspace(personal({ evidence_state: "REPRODUCIBLE" }), member);
  assert.ok(no);
  assert.equal(foundationResearchPresentation(no), "UNAVAILABLE");
  const blocked = parsePrivateFoundationWorkspace(personal({
    evidence_state: "BLOCKED", capabilities: ["VIEW", "RESEARCH"],
  }), member);
  assert.ok(blocked);
  assert.equal(foundationResearchPresentation(blocked), "EVIDENCE_BLOCKED");
  const yes = parsePrivateFoundationWorkspace(personal({
    evidence_state: "REPRODUCIBLE", capabilities: ["VIEW", "RESEARCH"],
  }), member);
  assert.ok(yes);
  assert.equal(foundationResearchPresentation(yes), "RESEARCH_AVAILABLE");
  assert.equal("alpha_validated" in yes, false);
});
