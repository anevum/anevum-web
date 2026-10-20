import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const manifest=JSON.parse(readFileSync(new URL('../operations/v095-inactive-baseline-20261020.json',import.meta.url),'utf8'));
export const normalizeRoutes=routes=>routes.map(({pattern,script,request_limit_fail_open})=>({pattern,script,request_limit_fail_open:request_limit_fail_open===true})).sort((a,b)=>a.pattern.localeCompare(b.pattern));
export const signatures=bindings=>bindings.map(({name,type})=>({name,type})).sort((a,b)=>a.name.localeCompare(b.name));
export function validateBaseline({deployment,routes,settings,live,pilot,exposure},baseline=manifest){
  assert.equal(baseline.routes.length,39);
  assert.equal(baseline.routes.filter(x=>x.pattern==='family.anevum.com/*'&&x.script==='anevum-family-holiday-v001').length,1);
  assert.equal(deployment?.id,baseline.deployment.id,'Deployment changed; review before uploading');
  assert.deepEqual(deployment.versions,baseline.deployment.versions,'Traffic distribution changed');
  assert.deepEqual(normalizeRoutes(routes),baseline.routes,'Cloudflare route inventory drift');
  assert.deepEqual(signatures(settings.bindings),baseline.required_binding_signatures,'Current bindings drift');
  assert.equal(live.id,baseline.live_version.id);
  assert.equal(live.resources?.script?.etag,baseline.live_version.etag);
  assert.equal(pilot.id,baseline.prior_inactive_version.id);
  assert.equal(pilot.resources?.script?.etag,baseline.prior_inactive_version.etag);
  assert.deepEqual(exposure,baseline.exposure,'Public preview exposure changed');
  assert.equal(live.resources?.bindings?.length,24);
  assert.equal(pilot.resources?.bindings?.length,26);
  const liveBindings=Object.fromEntries(live.resources.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
  const pilotBindings=Object.fromEntries(pilot.resources.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
  for(const [key,value] of Object.entries(liveBindings))assert.equal(pilotBindings[key],value,'Baseline variable drift: '+key);
  assert.equal(pilotBindings.CANONICAL_PACKAGE_PROOF_ENABLED,'true');
  assert.equal(pilotBindings.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
  assert.equal(pilotBindings.CANONICAL_XP_TEST_ENABLED,'true');
  assert.deepEqual(pilot.resources.script_runtime,baseline.prior_inactive_version.runtime);
  assert.deepEqual(live.resources.script_runtime,pilot.resources.script_runtime);
  return {status:'BASELINE_PASS',routeCount:routes.length,bindings:settings.bindings.length};
}
export function validateUploadedCandidate({before,after,candidate,baseline=manifest}){
  validateBaseline(before,baseline);
  assert.deepEqual(after.deployment,before.deployment,'Version upload changed traffic');
  assert.deepEqual(normalizeRoutes(after.routes),normalizeRoutes(before.routes),'Version upload changed routes');
  assert.deepEqual(signatures(after.settings.bindings),signatures(before.settings.bindings),'Version upload changed bindings');
  assert.deepEqual(after.exposure,before.exposure,'Version upload changed preview exposure');
  assert.notEqual(candidate.id,baseline.live_version.id);
  assert.notEqual(candidate.id,baseline.prior_inactive_version.id);
  assert.deepEqual(signatures(candidate.resources.bindings),signatures(before.pilot.resources.bindings),'Candidate bindings drift');
  assert.deepEqual(candidate.resources.script_runtime,before.pilot.resources.script_runtime,'Candidate runtime drift');
  return {status:'INACTIVE_CANDIDATE_PASS',candidateId:candidate.id};
}
