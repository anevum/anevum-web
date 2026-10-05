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

test("live terminal renders canonical BTC canary paper safeguards", () => {
  const source = readFileSync(
    new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /snapshot\?\.btc_canary/);
  assert.match(source, /BTC-CANARY-001/);
  assert.match(source, /PAPER ONLY/);
  assert.match(source, /LIVE DISABLED/);
  assert.match(source, /NOT PROMOTED/);
  assert.match(source, /current_return_pct/);
  assert.match(source, /protection_status/);
  assert.match(source, /risk_stop_pct/);
  assert.match(source, /LIVE DECISION PIPELINE/);
  assert.match(source, /momentum_return/);
  assert.match(source, /above_sma/);
  assert.match(source, /desired_long/);
  assert.match(source, /RECENT DECISION CYCLES/);
  assert.match(source, /return_history/);
});



test("live terminal does not present routine heartbeats as substantive work", () => {
  const source = readFileSync(
    new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /Routine health probes are freshness evidence, not substantive activity/);
  assert.match(source, /RUNTIME ACTIVITY/);
  assert.match(source, /RUNTIME HEALTH/);
  assert.match(source, /displayState\(lane\.view\.health\)/);
  assert.match(source, /displayState\(lane\.activityState\)/);
  assert.match(source, /No substantive event/);
});
