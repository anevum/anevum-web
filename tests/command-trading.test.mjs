import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Command exposes four canonical operator workspaces", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");

  for (const route of ["/command/operate", "/command/discover", "/command/review", "/command/system"]) {
    assert.match(command, new RegExp(route.replaceAll("/", "\\/")));
  }
  for (const label of ["Operate", "Discover", "Review", "System"]) {
    assert.match(command, new RegExp(">" + label));
  }
  assert.match(command, /function routePage/);
  assert.match(command, /"discover", "research", "graen", "nostra", "velum"/);
  assert.match(command, /"review", "evidence"/);
  assert.match(command, /"system", "terminal", "infrastructure", "iren"/);
  assert.doesNotMatch(command, />Overview</);
  assert.doesNotMatch(command, />Trading</);
});

test("Operate workspace exposes broker truth and current equity trading lanes", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const tracker = readFileSync(new URL("../src/components/CommandAccountTracker.tsx", import.meta.url), "utf8");
  const lanes = readFileSync(new URL("../src/components/CommandTradingLanes.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");

  assert.match(command, /CommandAccountTracker/);
  assert.match(command, /CommandTradingLanes snapshot=\{snapshot\}/);
  assert.match(command, /OPEN POSITIONS/);
  assert.match(command, /RECENT ORDERS/);
  assert.match(command, /positions\.map/);
  assert.match(tracker, /Equity \+ executions/);
  assert.match(tracker, /B = buy · S = sell/);
  assert.match(data, /account_history\?: CommandAccountHistory/);
  assert.match(data, /universe\?: CommandUniverse \| null/);
  assert.match(data, /extended_equity\?: CommandExtendedEquityLane \| null/);
  assert.match(lanes, /EQUITIES \/ LIVE/);
  assert.match(lanes, /EQUITIES \/ EXTENDED 24\/5/);
  assert.doesNotMatch(lanes, /CRYPTO \/ REAL ACCOUNT/);
  assert.doesNotMatch(lanes, /CRYPTO \/ PAPER CANARY/);
  assert.doesNotMatch(lanes, /crypto_live|crypto_paper|CommandCryptoLane|BTC\/USD/);
  assert.match(lanes, /BROKER WRITES/);
  assert.match(lanes, /long U\.S\. equities \/ ETFs/);
});

test("Review workspace owns the deliberate Work handoff", () => {
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const handoff = readFileSync(new URL("../src/components/CommandIrenDock.tsx", import.meta.url), "utf8");
  const review = readFileSync(new URL("../src/components/CommandReviewDeck.tsx", import.meta.url), "utf8");

  assert.match(worker, /proxyTrader\(request, "\/v1\/command\/iren\/status", env\)/);
  assert.match(worker, /proxyTrader\(request, "\/v1\/command\/iren\/command", env\)/);
  assert.match(command, /page === "review"/);
  assert.match(command, /<CommandIrenMaintenance session=\{session\} \/>/);
  assert.match(handoff, /IREN \/ WORK HANDOFF/);
  assert.match(handoff, /OPTIONAL FOCUS FOR THIS WORK PASS/);
  assert.match(handoff, /Generate Work prompt/);
  assert.match(handoff, /maintenance prompt: /);
  assert.match(handoff, /maintenance_manifest/);
  assert.match(handoff, /WORK PASS/);
  assert.match(handoff, /Prepare tracked handoff/);
  assert.match(handoff, /Verify tracked handoff/);
  assert.match(review, /AUTONOMY CONTRACT/);
  assert.match(review, /Automatic promotion off/);
});

test("Command shares one canonical IREN observation across workspaces", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const topology = readFileSync(new URL("../src/components/CommandTopology.tsx", import.meta.url), "utf8");
  const terminal = readFileSync(new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url), "utf8");

  assert.match(command, /useCommandObservation\(commandAdmin \? session : null, 3000\)/);
  assert.match(command, /observation=\{controlObservation\}/);
  assert.match(command, /control=\{controlObservation\.snapshot\}/);
  assert.doesNotMatch(topology, /useCommandObservation\(/);
  assert.doesNotMatch(terminal, /useCommandObservation\(/);
});

test("Command network reads are timeout bounded and connection state is terminal", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
  const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");

  assert.match(command, /"LIVE" : "DEGRADED"/);
  assert.match(command, /Observation degraded/);
  assert.match(data, /AbortSignal\.timeout\(10000\)/);
  assert.match(worker, /AbortSignal\.timeout\(10000\)/);
});

test("Command has one raw event drawer and no decorative per-subsystem navigation", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const rawLog = readFileSync(new URL("../src/components/CommandRawLog.tsx", import.meta.url), "utf8");
  const terminal = readFileSync(new URL("../src/components/CommandOperationsTerminal.tsx", import.meta.url), "utf8");
  const topology = readFileSync(new URL("../src/lib/runtime-topology.ts", import.meta.url), "utf8");

  assert.match(command, /CommandRawLog snapshot=\{controlObservation\.snapshot\}/);
  assert.match(topology, /strategy_pipeline\?: StrategyPipelineProjection/);
  assert.match(topology, /control\?: ResearchControlProjection/);
  assert.match(rawLog, /buildCommandEvents\(snapshot, feed\)/);
  assert.doesNotMatch(command, /to="\/command\/graen"/);
  assert.doesNotMatch(command, /to="\/command\/velum"/);
  assert.doesNotMatch(command, /to="\/command\/nostra"/);
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


test("V4.3 active website and Command surfaces cannot resurrect retired crypto or V3 state", () => {
  const activeSources = [
    "../src/App.tsx",
    "../src/pages/HomeCompany.tsx",
    "../src/pages/Architecture.tsx",
    "../src/pages/ResearchHub.tsx",
    "../src/pages/Live.tsx",
    "../src/components/CommandTradingLanes.tsx",
    "../src/components/CommandResearchLab.tsx",
    "../src/data/products.ts",
    "../src/components/Shell.tsx"
  ].map(path => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

  assert.doesNotMatch(activeSources, /BTC|CRYPTO \/|paper canary|RHEN v3/i);
  assert.match(activeSources, /RHEN V4\.3/);
  assert.match(activeSources, /EXTENDED 24\/5|extended equity/i);

  const registry = JSON.parse(readFileSync(new URL("../src/data/releases.json", import.meta.url), "utf8"));
  const current = registry.releases.find((release) => release.slug === registry.currentSlug);
  assert.equal(current.version, "4.3.2");
  assert.equal(current.codename, "MERIDIAN");
  assert.equal(current.sourceCommit, "4d48f6b40d0ed6a001a3ad40170daf142e928756");
  assert.equal(current.productionDeployment, "3c83ae55-5fd9-4c9c-b717-8f817b949b0d");
  assert.match(current.next, /first post-fix live equity cohort/i);
});
