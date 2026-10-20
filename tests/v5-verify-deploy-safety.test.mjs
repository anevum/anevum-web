import {assertRetiredProductionWorkflow} from "./helpers/retired-production-contract.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("V5 verification never deploys the production Worker", () => {
  const verify = read(".github/workflows/anevum-verify.yml");
  assert.doesNotMatch(verify, /run:\s*npx wrangler deploy\b/);
  assert.doesNotMatch(verify, /cloudflare\/wrangler-action@/);
  assert.doesNotMatch(verify, /- name: Deploy production to Cloudflare\b/);
  assert.match(verify, /Enforce one guarded production Worker deployment/);
});

test("archived V5 release has no production deployment authority", () => {
  assertRetiredProductionWorkflow(read(".github/workflows/deploy-production.yml"));
});
