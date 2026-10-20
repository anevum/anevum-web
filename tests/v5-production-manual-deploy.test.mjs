import {assertRetiredProductionWorkflow} from "./helpers/retired-production-contract.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("retired V5 production dispatch refuses deployment without reading credentials", () => {
  assertRetiredProductionWorkflow(read(".github/workflows/deploy-production.yml"));
});

test("no other GitHub workflow contains an unrestricted production Wrangler deploy", () => {
  const directory = new URL("../.github/workflows/", import.meta.url);
  const allowed = "deploy-production.yml";
  for (const file of readdirSync(directory, "utf8")) {
    if (!/\.ya?ml$/.test(file) || file === allowed) continue;
    const source = read(".github/workflows/" + file);
    // The staging flow is intentionally separate and requires pinned dispatch;
    // no second production Wrangler Action may slip into any workflow.
    assert.doesNotMatch(source, /uses:\s*cloudflare\/wrangler-action@v3/,
      "Unreviewed Wrangler Action in " + file);
  }
});
