import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assertRetiredProductionWorkflow} from "./helpers/retired-production-contract.mjs";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("legacy verification is read-only and V5 production dispatch always refuses",()=>{
 const verify=read(".github/workflows/anevum-verify.yml");
 assert.doesNotMatch(verify,/run:\s*npx wrangler deploy\b|cloudflare\/wrangler-action@/);
 assert.match(verify,/Enforce single guarded production Worker deployment/);
 assertRetiredProductionWorkflow(read(".github/workflows/deploy-production.yml"));
});
test("current Continuance production authority retains source, acceptance and rollback guards",()=>{
 const flow=read(".github/workflows/v084-continuance-production.yml");
 assert.match(flow,/group: anevum-v084-guarded-apex-production/);
 assert.match(flow,/cancel-in-progress: false/);
 assert.match(flow,/release\/v084-continuance-approved-20261019/);
 const gates=flow.indexOf("node creator-v1/ops/v091-release-acceptance.mjs");
 const prepare=flow.indexOf('node "$RUNNER_TEMP/v091-promotion-guard.mjs" prepare');
 const promote=flow.indexOf('node "$RUNNER_TEMP/v091-promotion-guard.mjs" promote');
 assert.ok(gates>0&&prepare>gates&&promote>prepare,"authenticated acceptance precedes guarded candidate promotion");
 assert.match(flow,/git diff --exit-code [a-f0-9]{40} HEAD/);
 assert.match(flow,/run: node creator-v1\/ops\/v091-staff-transport.mjs\s*\n/);
 assert.doesNotMatch(flow,/v091-staff-transport.mjs --apply/);
 assert.match(flow,/Verify preserved staff identity Workers without changing them/);
 assert.match(flow,/node "\$RUNNER_TEMP\/v091-promotion-guard\.mjs" rollback/);
 assert.match(flow,/RECORDED_PILOT_RESTORED/);
 assert.match(flow,/rollback unconfirmed/);
 assert.match(flow,/node "\$RUNNER_TEMP\/v091-promotion-guard\.mjs" postflight/);
 assert.doesNotMatch(flow,/d1 migrations apply/);
 assert.doesNotMatch(flow,/npx wrangler (?:deploy|versions upload)\b/);
 assert.equal((flow.match(/node "\$RUNNER_TEMP\/v091-promotion-guard\.mjs" promote/g)||[]).length,1);
});
test("retirement checks reject accidental deployment, credential access and success exits",()=>{
 const retired=read(".github/workflows/deploy-production.yml");
 for(const unsafe of [retired.replace("exit 1","exit 0"),retired+"\n  deploy:\n    runs-on: ubuntu-latest\n",retired.replace("exit 1","npx wrangler deploy\n          exit 1"),retired.replace("exit 1","echo \"${{ secrets.CLOUDFLARE_API_TOKEN }}\"\n          exit 1")])
  assert.throws(()=>assertRetiredProductionWorkflow(unsafe));
});
