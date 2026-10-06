import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Command exposes four canonical operator workspaces", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");

  for (const route of ["/command/overview", "/command/trading", "/command/research", "/command/system"]) {
    assert.match(command, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.match(command, /if \(\["trading", "live", "performance", "evidence", "rhen"\]\.includes\(segment\)\) return "trading"/);
  assert.match(command, /if \(\["research", "graen", "nostra", "velum"\]\.includes\(segment\)\) return "research"/);
  assert.match(command, /if \(\["system", "terminal", "infrastructure", "iren"\]\.includes\(segment\)\) return "system"/);
  assert.doesNotMatch(command, /to="\/command\/iren"/);
  assert.doesNotMatch(command, /to="\/command\/graen"/);
});

test("Trading workspace exposes private broker account tracking and executions", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const tracker = readFileSync(new URL("../src/components/CommandAccountTracker.tsx", import.meta.url), "utf8");
  const lanes = readFileSync(new URL("../src/components/CommandTradingLanes.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");

  assert.match(command, /CommandAccountTracker/);
  assert.match(command, /CommandTradingLanes snapshot=\{snapshot\}/);
  assert.match(command, /command-view-trading command-panel-orders/);
  assert.match(command, /ACTIVE POSITIONS/);
  assert.match(command, /positions\.map/);
  assert.match(tracker, /command-view-overview command-view-trading/);
  assert.match(tracker, /Equity \+ executions/);
  assert.match(tracker, /B = buy · S = sell/);
  assert.match(tracker, /RECENT FILLS/);
  assert.match(data, /account_history\?: CommandAccountHistory/);
  assert.match(data, /crypto_live\?: CommandCryptoLane \| null/);
  assert.match(data, /crypto_paper\?: CommandCryptoLane \| null/);
  assert.match(lanes, /EQUITIES \/ LIVE/);
  assert.match(lanes, /CRYPTO \/ REAL ACCOUNT/);
  assert.match(lanes, /CRYPTO \/ PAPER CANARY/);
  assert.match(lanes, /PAPER AUTONOMOUS/);
  assert.match(lanes, /broker_writes_allowed/);
  assert.match(lanes, /BROKER WRITES/);
});

test("IREN maintenance is embedded in System and requests Codex prompts from IREN", () => {
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const maintenance = readFileSync(new URL("../src/components/CommandIrenDock.tsx", import.meta.url), "utf8");

  assert.match(worker, /proxyTrader\(request, "\/v1\/command\/iren\/status", env\)/);
  assert.match(worker, /proxyTrader\(request, "\/v1\/command\/iren\/command", env\)/);
  assert.match(command, /<CommandIrenMaintenance session=\{session\} \/>/);
  assert.doesNotMatch(command, /<CommandIrenDock session=\{session\} \/>/);
  assert.match(maintenance, /IREN \/ MAINTENANCE/);
  assert.match(maintenance, /FOCUS FOR NEXT CODEX PASS/);
  assert.match(maintenance, /Generate Codex prompt/);
  assert.match(maintenance, /maintenance prompt: /);
  assert.match(maintenance, /maintenance_prompt/);
  assert.match(maintenance, /Copy generated prompt/);
  assert.match(maintenance, /Prepare tracked handoff/);
  assert.match(maintenance, /Verify tracked handoff/);
  assert.doesNotMatch(maintenance, /buildMaintenancePrompt/);
  assert.doesNotMatch(maintenance, /iren-dock-handle/);
  assert.doesNotMatch(maintenance, /DETERMINISTIC CONTROL/);
});

test("Command shares one canonical IREN observation across operator workspaces", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const topology = readFileSync(new URL("../src/components/CommandTopology.tsx", import.meta.url), "utf8");
  const terminal = readFileSync(new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url), "utf8");

  assert.match(command, /useCommandObservation\(commandAdmin \? session : null, 3000\)/);
  assert.match(command, /observation=\{commandObservation\}/);
  assert.doesNotMatch(topology, /useCommandObservation\(/);
  assert.doesNotMatch(terminal, /useCommandObservation\(/);
});

test("Command telemetry normalizes legacy event envelopes and exposes tracking state", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");

  assert.match(command, /runtimeEnvelope/);
  assert.match(command, /runtimePayload/);
  assert.match(command, /scanEnvelope/);
  assert.match(command, /health\.events_24h \?\? health\.events_observed/);
  assert.match(command, /RUNTIME PROVENANCE/);
  assert.match(command, /DECISION STREAM/);
  assert.match(command, /LATEST EVENT/);
});


test("Command network reads are timeout bounded and connection state is terminal", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");

  assert.match(command, /"DEGRADED" : "OFFLINE"/);
  assert.match(command, /"LIVE"/);
  assert.match(data, /AbortSignal\.timeout\(10000\)/);
  assert.match(worker, /AbortSignal\.timeout\(10000\)/);
});


test("Command strategy lifecycle uses the canonical private projection and one raw log", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const pipeline = readFileSync(new URL("../src/components/CommandStrategyPipeline.tsx", import.meta.url), "utf8");
  const rawLog = readFileSync(new URL("../src/components/CommandRawLog.tsx", import.meta.url), "utf8");
  const terminal = readFileSync(new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url), "utf8");
  const topology = readFileSync(new URL("../src/lib/runtime-topology.ts", import.meta.url), "utf8");

  assert.match(command, /CommandStrategyPipeline snapshot=\{commandObservation\.snapshot\}/);
  assert.match(command, /CommandRawLog snapshot=\{commandObservation\.snapshot\}/);
  assert.match(pipeline, /snapshot\?\.strategy_pipeline/);
  assert.doesNotMatch(pipeline, /active_strategy/);
  assert.match(pipeline, /manual_approval_required/);
  assert.match(pipeline, /signals_enabled/);
  assert.match(pipeline, /broker_writes_allowed/);
  assert.match(pipeline, /Signals live · manual approval/);
  assert.match(topology, /strategy_pipeline\?: StrategyPipelineProjection/);
  assert.match(rawLog, /buildCommandEvents\(snapshot, feed\)/);
  assert.doesNotMatch(terminal, /className="terminal-stream"/);
  assert.doesNotMatch(terminal, /BTC-CANARY-001/);
});


test("Command deployment config has no retired Foundation or Vercel runtime path", () => {
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
  const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const verify = readFileSync(new URL("../.github/workflows/anevum-verify.yml", import.meta.url), "utf8");
  const deploy = readFileSync(new URL("../.github/workflows/deploy-production.yml", import.meta.url), "utf8");

  for (const source of [worker, wrangler, verify, deploy]) {
    assert.doesNotMatch(source, /foundation-ingest-staging/i);
    assert.doesNotMatch(source, /IREN_COMMAND_URL/);
    assert.doesNotMatch(source, /vercel/i);
  }
  assert.match(deploy, /Deploy to Cloudflare Workers/);
});
