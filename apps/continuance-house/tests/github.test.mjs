import test from "node:test";
import assert from "node:assert/strict";
import { getPublicWorkflowActivity } from "../src/github.mjs";

const example = {
  workflow_runs: [
    { id: 12345, name: "ANEVUM Verify", html_url: "https://github.com/anevum/anevum-web/actions/runs/12345", status: "completed", conclusion: "success", updated_at: "2026-10-24T10:00:00Z" },
    { id: 777, name: "Unsafe link", html_url: "https://attacker.invalid/actions/runs/777", status: "completed", conclusion: "success", updated_at: "2026-10-24T10:00:00Z" }
  ]
};

test("read-only workflows include verified GitHub links and raw CI state only", async () => {
  const result = await getPublicWorkflowActivity(async () => new Response(JSON.stringify(example), { status: 200 }), 100000);
  assert.equal(result.live, true);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].status, "completed");
  assert.equal(result.items[0].conclusion, "success");
  assert.equal(result.items[0].url, "https://github.com/anevum/anevum-web/actions/runs/12345");
  assert.match(result.note, /not proof/i);
});
test("failed fetch is unknown and never described as production healthy", async () => {
  const result = await getPublicWorkflowActivity(async () => new Response("error", { status: 503 }), 900000);
  assert.equal(result.live, false);
  assert.equal(result.items.length, 0);
  assert.match(result.note, /unavailable/i);
});
test("unknown statuses do not invent success", async () => {
  const run = { ...example.workflow_runs[0], status: "unexpected", conclusion: null };
  const result = await getPublicWorkflowActivity(async () => new Response(JSON.stringify({ workflow_runs: [run] }), { status: 200 }), 1400000);
  assert.equal(result.items[0].status, "unknown");
  assert.equal(result.items[0].conclusion, null);
});
