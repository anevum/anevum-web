import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Command V4 uses four workspaces with a protected review boundary", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const discover = readFileSync(new URL("../src/components/CommandDiscoveryDeck.tsx", import.meta.url), "utf8");
  const review = readFileSync(new URL("../src/components/CommandReviewDeck.tsx", import.meta.url), "utf8");
  const topology = readFileSync(new URL("../src/lib/runtime-topology.ts", import.meta.url), "utf8");

  for (const label of ["Operate", "Discover", "Review", "System"]) {
    assert.match(command, new RegExp(">" + label));
  }
  assert.match(command, /CommandDiscoveryDeck/);
  assert.match(command, /CommandReviewDeck/);
  assert.match(command, /routePage/);
  assert.match(discover, /CommandResearchLab/);
  assert.match(discover, /MARKET DISCOVERY/);
  assert.match(review, /AUTONOMY CONTRACT/);
  assert.match(review, /DECISION REQUIRED/);
  assert.match(topology, /ResearchControlProjection/);
  assert.match(topology, /RESEARCH_REVIEW_REQUIRED/);
  assert.match(topology, /generate_new_hypothesis_family/);
  assert.match(topology, /promote_live_strategy/);
});

test("Discovery keeps Research Lab interactive without mutating runtimes", () => {
  const lab = readFileSync(new URL("../src/components/CommandResearchLab.tsx", import.meta.url), "utf8");
  const discover = readFileSync(new URL("../src/components/CommandDiscoveryDeck.tsx", import.meta.url), "utf8");

  for (const system of ["GRAEN", "VELUM", "NOSTRA", "RHEN"]) {
    assert.match(lab, new RegExp('"' + system + '"'));
  }
  assert.match(lab, /Pause view/);
  assert.match(lab, /Resume view/);
  assert.match(lab, /onClick=\{\(\) => onSelect\(row\.index\)\}/);
  assert.match(lab, /Evidence-indexed/);
  assert.match(lab, /inactive time is not drawn as flatline space/);
  assert.match(lab, /READ ONLY/);
  assert.doesNotMatch(lab, /orders\/cancel|position\/close/);
  assert.match(discover, /OPTIONS/);
  assert.match(discover, /RESEARCH ONLY/);
  assert.match(discover, /SHORT EQUITIES/);
  assert.match(discover, /LEVERAGE EXPANSION/);
  assert.match(discover, /DISABLED/);
  assert.doesNotMatch(discover, />CRYPTO</);
});

test("Research Lab exposes run progress, charts, metrics, context and event tape", () => {
  const lab = readFileSync(new URL("../src/components/CommandResearchLab.tsx", import.meta.url), "utf8");

  assert.match(lab, /progress_pct/);
  assert.match(lab, /selectedSeries/);
  assert.match(lab, /selectedPoint/);
  assert.match(lab, /research-observability-metrics/);
  assert.match(lab, /Run context/);
  assert.match(lab, /EVENT TAPE/);
  assert.match(lab, /Selected run/);
  assert.match(lab, /poll_seconds/);
});

test("IREN review surface is framed as a deliberate Work handoff", () => {
  const dock = readFileSync(new URL("../src/components/CommandIrenDock.tsx", import.meta.url), "utf8");

  assert.match(dock, /IREN \/ WORK HANDOFF/);
  assert.match(dock, /Generate Work prompt/);
  assert.match(dock, /evidence-backed Work prompt/);
  assert.match(dock, /maintenance prompt/); // backend command remains compatible
  assert.doesNotMatch(dock, /IREN \/ MAINTENANCE/);
});


test("Strategy lifecycle exposes read-only forward evidence readiness", () => {
  const pipeline = readFileSync(new URL("../src/components/CommandStrategyPipeline.tsx", import.meta.url), "utf8");
  const topology = readFileSync(new URL("../src/lib/runtime-topology.ts", import.meta.url), "utf8");

  assert.match(topology, /StrategyEvidenceReadinessProjection/);
  assert.match(topology, /measurement_ready_rate_pct/);
  assert.match(pipeline, /FORWARD EVIDENCE READINESS/);
  assert.match(pipeline, /missing_reference_price_count/);
  assert.match(pipeline, /missing_bar_time_count/);
  assert.match(pipeline, /read only/);
});
