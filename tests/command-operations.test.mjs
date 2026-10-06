import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ageLabel, operatorGuidance } from "../src/lib/runtime-topology.ts";

test("ageLabel gives operator-friendly freshness", () => {
  const now = Date.parse("2026-10-02T21:00:00Z");
  assert.equal(ageLabel("2026-10-02T20:59:50Z", now), "10s ago");
  assert.equal(ageLabel("2026-10-02T20:50:00Z", now), "10m ago");
});

test("operator guidance fails closed when canonical state is stale", () => {
  const guidance = operatorGuidance({
    schema_version: "iren_command.v2",
    revision: 1,
    observed_at: "2026-10-02T20:00:00Z",
    stale: true,
    state: "STALE",
    action_required: true,
    topology: null,
    incidents: []
  });
  assert.equal(guidance[0].severity, "critical");
  assert.match(guidance[0].action, /IREN observations/);
});

test("evidence incident points the operator at RHEN Core and spool health", () => {
  const guidance = operatorGuidance({
    schema_version: "iren_command.v2",
    revision: 2,
    observed_at: "2026-10-02T21:00:00Z",
    stale: false,
    state: "DEGRADED",
    action_required: true,
    topology: null,
    incidents: [{ key: "evidence.delivery", severity: "warning", reason: "evidence_delivery_error" }]
  });
  assert.equal(guidance[0].target, "RHEN Core evidence");
  assert.match(guidance[0].action, /spool/);
});

test("live terminal uses the canonical event pipeline and excludes retired BTC canary UI", () => {
  const source = readFileSync(
    new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /snapshot\?\.btc_canary/);
  assert.doesNotMatch(source, /BTC-CANARY-001/);
  assert.match(source, /buildCommandEvents/);
  assert.match(source, /TERMINAL_SYSTEMS/);
  assert.match(source, /current merged window/);
  assert.match(source, /READ ONLY · no execution authority/);
});



test("live terminal keeps runtime health separate from substantive activity", () => {
  const source = readFileSync(
    new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /explicit work signals/);
  assert.match(source, /displayState\(lane\.view\.health\)/);
  assert.match(source, /displayState\(lane\.activityState\)/);
  assert.match(source, /No substantive event/);
  assert.match(source, /waiting for the next executable market cycle/);
  assert.match(source, /waiting for research work/);
});


test("public research uses the unified RHEN runtime", () => {
  const worker = readFileSync(
    new URL("../worker.mjs", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(worker, /rhen-research-agent-production/);
  assert.match(worker, /\/v1\/research\/readiness\/public/);
  assert.match(worker, /\/v1\/research\/theory\/public/);
});


test("operations terminal does not present exhausted research as active work", () => {
  const source = readFileSync(
    new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /ADAPTIVE_PROGRAM_EXHAUSTED/);
  assert.match(source, /reviewRequired/);
  assert.match(source, /REVIEW_REQUIRED/);
  assert.match(source, /Work \/ Codex pass/);
});
