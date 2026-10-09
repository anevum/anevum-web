import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validatePrivateResearch, privateResearchEndpoint, privateResearchSchemaReady } from "../src/server/member-research.mjs";

const sample = {
  kind: "hypothesis", title: "Research a measurable market rule",
  researchQuestion: "Does the rule survive realistic transaction costs?",
  method: "Evaluate separate development, validation and untouched holdout periods.",
  sources: "", uncertainty: "high", result: ""
};

test("method-first records exclude authority and cross-account fields", () => {
  assert.deepEqual(validatePrivateResearch(sample), sample);
  assert.throws(() => validatePrivateResearch({ ...sample, userId: "other-member" }));
  assert.throws(() => validatePrivateResearch({ ...sample, role: "moderator" }));
  assert.throws(() => validatePrivateResearch({ ...sample, brokerageAccountId: "owner" }));
  assert.throws(() => validatePrivateResearch({ ...sample, kind: "trading_signal" }));
  assert.throws(() => validatePrivateResearch({ ...sample, expectedVersion: 0 }, true));
});

test("unapproved member private notebook fails closed", async () => {
  const path = "/api/member/research/drafts";
  const request = new Request("https://anevum.com" + path);
  const response = await privateResearchEndpoint(request,
    { ANEVUM_PRIVATE_RESEARCH_ENABLED: "false" }, { id: "member-a" }, path);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(await privateResearchSchemaReady({}), false);
});

test("production and staging keep new capability disabled", () => {
  for (const path of ["wrangler.jsonc", "wrangler.member-staging.jsonc"]) {
    const config = JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
    assert.equal(config.vars.ANEVUM_PRIVATE_RESEARCH_ENABLED, "false");
  }
});
