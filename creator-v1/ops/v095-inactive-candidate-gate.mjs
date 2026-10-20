import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

/** Assets are versioned independently of script ETags. A successful upload
 * cannot prove the earned-media tree was included. Fail before uploading. */
export function verifyCandidateAssets(root){
  const earned=join(root,'evolution/assets');
  assert.equal(readdirSync(earned).length,152,'All 152 earned-media assets are required');
  for(let level=1;level<=30;level++)for(const suffix of ['-scene.gz','-1024.webp','-256.webp','-compact-128.png','-field.svg'])
    assert.ok(statSync(join(earned,'level-'+String(level).padStart(2,'0')+suffix)).size>300,'Missing earned level media');
  assert.ok(readFileSync(join(root,'evolution/mini-runtime.json')).length>6000,'Missing earned runtime');
  assert.ok(readFileSync(join(root,'index.html')).length>1000,'Missing compiled application');
  const assets=[];
  function visit(relative=''){
    for(const entry of readdirSync(join(root,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
      const path=relative?relative+'/'+entry.name:entry.name;
      assert.ok(!entry.isSymbolicLink(),'Asset symlinks are forbidden');
      if(entry.isDirectory())visit(path);
      else{
        assert.ok(entry.isFile()&&!path.endsWith('.map'),'Unexpected asset or public source map');
        const bytes=readFileSync(join(root,path));
        assets.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
      }
    }
  }
  visit();
  return {assets,sha256:createHash('sha256').update(JSON.stringify(assets)).digest('hex'),earned_media_count:152};
}

export const manifest=JSON.parse(readFileSync(new URL('../operations/v095-inactive-baseline-20261020.json',import.meta.url),'utf8'));
export const normalizeRoutes=routes=>routes.map(({pattern,script,request_limit_fail_open})=>({pattern,script,request_limit_fail_open:request_limit_fail_open===true})).sort((a,b)=>a.pattern.localeCompare(b.pattern));
export const signatures=bindings=>bindings.map(({name,type})=>({name,type})).sort((a,b)=>a.name.localeCompare(b.name));
export const databaseIds=bindings=>Object.fromEntries(bindings.filter(x=>x.type==='d1').map(x=>[x.name,x.database_id]));
export const plainVars=bindings=>Object.fromEntries(bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
export function assertPinnedResources(resources,baseline=manifest){
  assert.deepEqual(databaseIds(resources.bindings),baseline.database_ids,'D1 database identity changed');
  const vars=plainVars(resources.bindings);
  for(const [key,value] of Object.entries(baseline.required_plain_vars))
    assert.equal(vars[key],value,'Critical public safety flag drift: '+key);
  return vars;
}

export function validateBaseline({deployment,routes,settings,live,pilot,exposure},baseline=manifest){
  assert.equal(baseline.source_sha,'d5af32fd8f04b05e0381f7ac12c59d06c0e836a2','Unreviewed application source');
  assert.equal(baseline.approval.production,false,'No production approval may be inferred');
  assert.equal(baseline.approval.live_traffic_promotion,false,'No traffic promotion permitted');
  assert.equal(baseline.routes.length,39);
  assert.equal(baseline.routes.filter(x=>x.pattern==='family.anevum.com/*'&&x.script==='anevum-family-link-v004').length,1);
  assert.equal(deployment?.id,baseline.deployment.id,'Deployment changed; review before uploading');
  assert.deepEqual(deployment.versions,baseline.deployment.versions,'Traffic distribution changed');
  assert.deepEqual(normalizeRoutes(routes),baseline.routes,'Cloudflare route inventory drift');
  assert.equal(routes.filter(x=>x.pattern.startsWith('anevum.com/studio/alpha')).length,0,'Existing public alpha route must be reviewed independently');
  assert.deepEqual(signatures(settings.bindings),baseline.required_binding_signatures,'Current bindings drift');
  assert.equal(live.id,baseline.live_version.id);
  assert.equal(live.resources?.script?.etag,baseline.live_version.etag);
  assert.equal(pilot.id,baseline.prior_inactive_version.id);
  assert.equal(pilot.resources?.script?.etag,baseline.prior_inactive_version.etag);
  assert.deepEqual(exposure,baseline.exposure,'Public preview exposure changed');
  assert.equal(live.resources?.bindings?.length,24);
  assert.equal(pilot.resources?.bindings?.length,26);
  const liveBindings=assertPinnedResources(live.resources,baseline);
  const pilotBindings=assertPinnedResources(pilot.resources,baseline);
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
  const vars=assertPinnedResources(candidate.resources,baseline);
  assert.deepEqual(vars,plainVars(before.pilot.resources.bindings),'Candidate plain-text variables diverge from approved 0% pilot');
  assert.match(candidate.resources.script?.etag||'',/^[a-f0-9]{64}$/,'Candidate script etag missing or malformed');
  assert.notEqual(candidate.resources.script?.etag,before.live.resources.script?.etag,'Candidate script identical to old active Worker');
  assert.notEqual(candidate.resources.script?.etag,before.pilot.resources.script?.etag,'Candidate script identical to old inactive Worker');
  assert.deepEqual(candidate.resources.script_runtime,before.pilot.resources.script_runtime,'Candidate runtime drift');
  return {status:'INACTIVE_CANDIDATE_PASS',candidateId:candidate.id};
}
