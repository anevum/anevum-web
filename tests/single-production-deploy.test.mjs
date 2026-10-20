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
 const deploy=flow.indexOf("npx wrangler deploy --config creator-v1/wrangler.v089.generated.json --keep-vars");
 assert.ok(gates>0&&deploy>gates,"authenticated acceptance precedes deployment");
 assert.match(flow,/git diff --exit-code [a-f0-9]{40} HEAD/);
 assert.match(flow,/v091-staff-transport.mjs --apply/);
 assert.match(flow,/Verify or repair the five pinned staff identity Workers/);
 assert.match(flow,/PREVIOUS_WORKER_ROLLBACK=PASS/);
 assert.doesNotMatch(flow,/d1 migrations apply/);
 assert.equal((flow.match(/npx wrangler deploy\b/g)||[]).length,1);
});
test("retirement checks reject accidental deployment, credential access and success exits",()=>{
 const retired=read(".github/workflows/deploy-production.yml");
 for(const unsafe of [retired.replace("exit 1","exit 0"),retired+"\n  deploy:\n    runs-on: ubuntu-latest\n",retired.replace("exit 1","npx wrangler deploy\n          exit 1"),retired.replace("exit 1","echo \"${{ secrets.CLOUDFLARE_API_TOKEN }}\"\n          exit 1")])
  assert.throws(()=>assertRetiredProductionWorkflow(unsafe));
});
