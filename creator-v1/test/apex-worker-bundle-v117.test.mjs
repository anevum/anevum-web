import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {FRONTEND_SOURCE,FRONTEND_RUN,FRONTEND_ARTIFACT,baseline,verifyRuntimeSnapshot,createOfflineConfig} from '../ops/apex-worker-bundle-v117.mjs';
test('V117 exact V116 build provenance',()=>{assert.equal(FRONTEND_SOURCE,'a3c94b3ebdc6103347e76f8a5234904978da67e3');assert.equal(FRONTEND_RUN,39887377952);assert.equal(FRONTEND_ARTIFACT,12472563668);});
test('V117 public traffic and identity snapshot retained',()=>{
 const s=verifyRuntimeSnapshot(baseline);
 assert.equal(baseline.deployment.id,'549f57c4-3d29-4b8b-856f-9554cab437e2');
 assert.deepEqual(baseline.deployment.versions,[{version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},{version_id:'86dc4b9d-4020-432a-8a15-e65606f31316',percentage:0}]);
 assert.equal(baseline.routes.length,40);assert.equal(s.secrets.length,5);
 assert.equal(s.vars.CANONICAL_XP_TEST_ENABLED,'false');assert.equal(s.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
});
test('V117 offline config does not modify access, secrets, D1 or routes',()=>{
 const config=createOfflineConfig(baseline,resolve('.'),resolve('/tmp/synthetic-v117-frontend'));
 assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);assert.deepEqual(config.routes,[]);
 assert.equal(config.d1_databases.length,2);assert.equal(config.assets.run_worker_first,true);
 const code=readFileSync(new URL('../ops/apex-worker-bundle-v117.mjs',import.meta.url),'utf8');
 assert.match(code,/uploadedToCloudflare:false,publicTrafficChanged:false/);
 assert.match(code,/authenticatedAcceptance:false,physicalSafariAcceptance:false,productionReleaseApproved:false/);
});
