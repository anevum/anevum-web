import assert from "node:assert/strict";

// The archived V5 release cannot mutate the apex or member database. Keep its
// runtime and recovery tests, but test the retirement contract for deployment.
export function assertRetiredProductionWorkflow(source) {
  const active=source.split("\n").filter(line=>!/^\s*#/.test(line)).join("\n");
  assert.match(active,/^name: Legacy ANEVUM V5 deployment retired$/m);
  assert.match(active,/^on:\s*\n  workflow_dispatch:\s*\n\s*permissions: \{\}/m);
  assert.doesNotMatch(active,/^\s+(?:push|pull_request|pull_request_target|schedule|workflow_run|inputs):/m);
  assert.doesNotMatch(active,/\buses:|\benv:|secrets\.|wrangler|cloudflare\/|\bd1\b|curl|wget/);
  assert.deepEqual([...active.matchAll(/^  ([a-zA-Z0-9_-]+):/gm)].map(m=>m[1]),["workflow_dispatch","retired"]);
  assert.match(active,/^    timeout-minutes: 1$/m);
  const runs=[...active.matchAll(/^        run: \|\n((?:          .*\n?)+)/gm)];
  assert.equal(runs.length,1,"one refusal step, with no follow-up deployment");
  const commands=runs[0][1].trim().split("\n").map(line=>line.trim());
  assert.equal(commands.at(-1),"exit 1","dispatch must fail closed");
  assert.ok(commands.slice(0,-1).every(line=>/^echo "[^"`$]*"$/.test(line)),"only literal refusal messages may run");
  assert.match(active,/Refuse legacy production deployment/);
}
