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
  const data = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");

  assert.match(command, /CommandAccountTracker/);
  assert.match(command, /command-view-trading command-panel-orders/);
  assert.match(command, /ACTIVE POSITIONS/);
  assert.match(command, /positions\.map/);
  assert.match(tracker, /command-view-overview command-view-trading/);
  assert.match(tracker, /Equity \+ executions/);
  assert.match(tracker, /B = buy · S = sell/);
  assert.match(tracker, /RECENT FILLS/);
  assert.match(data, /account_history\?: CommandAccountHistory/);
});

test("IREN Command routes through RHEN instead of Foundation", () => {
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
  const dock = readFileSync(new URL("../src/components/CommandIrenDock.tsx", import.meta.url), "utf8");

  assert.match(worker, /proxyTrader\(request, "\/v1\/command\/iren\/status", env\)/);
  assert.match(worker, /proxyTrader\(request, "\/v1\/command\/iren\/command", env\)/);
  assert.doesNotMatch(worker, /FOUNDATION_IREN_COMMAND/);
  assert.match(dock, /Ask IREN…/);
  assert.match(dock, /error[\s\S]*OFFLINE/);
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

test("Command network reads are timeout bounded and connection state is terminal", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");

  assert.match(command, /"DEGRADED" : "OFFLINE"/);
  assert.match(command, /"LIVE"/);
  assert.match(data, /AbortSignal\.timeout\(10000\)/);
  assert.match(worker, /AbortSignal\.timeout\(10000\)/);
});
