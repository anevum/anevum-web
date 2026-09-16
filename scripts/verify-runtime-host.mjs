import assert from "node:assert/strict";
import {
  COMMAND_HOST,
  LATTICE_HOST,
  normalizeRuntimePath,
  resolveRuntimeHostname,
  ROOT_HOST,
  safeDecodeRouteValue,
  WIKI_HOST,
} from "../src/runtimeHost.ts";

assert.equal(resolveRuntimeHostname(ROOT_HOST), ROOT_HOST);
assert.equal(resolveRuntimeHostname(WIKI_HOST), WIKI_HOST);
assert.equal(resolveRuntimeHostname(LATTICE_HOST), LATTICE_HOST);
assert.equal(resolveRuntimeHostname(COMMAND_HOST), COMMAND_HOST);
assert.equal(resolveRuntimeHostname("LOCALHOST"), ROOT_HOST);
assert.equal(resolveRuntimeHostname("anevum-web-git-launch-preview.vercel.app"), ROOT_HOST);
assert.equal(resolveRuntimeHostname("unknown.example"), ROOT_HOST);

assert.equal(normalizeRuntimePath(""), "/");
assert.equal(normalizeRuntimePath("/"), "/");
assert.equal(normalizeRuntimePath("/the-book/"), "/the-book");
assert.equal(normalizeRuntimePath("/wiki/ovara///"), "/wiki/ovara");

assert.equal(safeDecodeRouteValue("Rhenlink%20Record"), "Rhenlink Record");
assert.equal(safeDecodeRouteValue("bad%ZZslug"), "");

console.log("Runtime host contract valid: production hosts preserved, preview/local hosts resolve to ANEVUM root.");
