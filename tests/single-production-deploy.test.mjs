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
test("retirement checks reject accidental deployment, credential access and success exits",()=>{
 const retired=read(".github/workflows/deploy-production.yml");
 for(const unsafe of [retired.replace("exit 1","exit 0"),retired+"\n  deploy:\n    runs-on: ubuntu-latest\n",retired.replace("exit 1","npx wrangler deploy\n          exit 1"),retired.replace("exit 1","echo \"${{ secrets.CLOUDFLARE_API_TOKEN }}\"\n          exit 1")])
  assert.throws(()=>assertRetiredProductionWorkflow(unsafe));
});
