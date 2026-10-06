import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Research workspace renders the canonical live Research Lab", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const lab = readFileSync(new URL("../src/components/CommandResearchLab.tsx", import.meta.url), "utf8");
  const topology = readFileSync(new URL("../src/lib/runtime-topology.ts", import.meta.url), "utf8");

  assert.match(command, /CommandResearchLab/);
  assert.match(command, /commandPage === "research"/);
  assert.match(command, /snapshot=\{commandObservation\.snapshot\}/);
  assert.match(lab, /snapshot\?\.research\?\.observability/);
  assert.match(topology, /ResearchObservabilityProjection/);
  assert.match(topology, /observability\?: ResearchObservabilityProjection/);
});

test("Research Lab is interactive without mutating runtimes", () => {
  const lab = readFileSync(new URL("../src/components/CommandResearchLab.tsx", import.meta.url), "utf8");

  for (const system of ["GRAEN", "VELUM", "NOSTRA", "RHEN"]) {
    assert.match(lab, new RegExp('"' + system + '"'));
  }
  assert.match(lab, /Pause view/);
  assert.match(lab, /Resume view/);
  assert.match(lab, /onClick=\{\(\) => onSelect\(row\.index\)\}/);
  assert.match(lab, /Evidence-indexed/);
  assert.match(lab, /inactive time is not drawn as flatline space/);
  assert.match(lab, /READ ONLY/);
  assert.match(lab, /Live trading performance is intentionally separate/);
  assert.doesNotMatch(lab, /\bfetch\s*\(/);
  assert.doesNotMatch(lab, /\/v1\/pause|\/v1\/resume|orders\/cancel|position\/close/);
});

test("Research Lab exposes run progress, chart series, metrics, context and event tape", () => {
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
