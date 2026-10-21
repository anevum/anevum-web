import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,lstatSync} from 'node:fs';
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
// Independently read by reconciliation run 39542451154. Preserve the frozen
// historical manifest; the integrated profile pins this exact later split.
export const integratedBaseline={...manifest,deployment:{
  id:'d4476123-1819-4379-8c59-d035b2841c04',
  versions:[
    {version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},
    {version_id:'3ba8602c-6616-49a4-af29-1efe60ad164a',percentage:0}
  ]
}};
// Independently re-read before preparing the feature-ON variant. Neither
// historical profile is changed; this pins the current 100% public / 0% V100 pair.
export const featureOnBaseline={...manifest,deployment:{
 id:'a2c6bff7-0541-4caf-bdaa-393966d8ca5d',
 versions:[
  {version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},
  {version_id:'8ed503b6-5df6-42a5-a536-63ccf928d25d',percentage:0}
 ]
}};
// The earlier 39613686430 bundle was staging-path-only and failed on real iPhone.
// Require the new exact apex-root artifact and synthetic root browser evidence.
export const FEATURE_ON_QA_HEAD='dec7db94d75240b57341c4357078fc3b1bc3be4e';
export const FEATURE_ON_QA_RUN=39641767946;
export function verifyTestedFeatureOnBuild(root,record){
 assert.equal(record.application_source,'28f163a0015631b1d8eb58922c03596ae8febd22');
 assert.equal(record.harness_source,FEATURE_ON_QA_HEAD);
 assert.equal(record.asset_base,'/','Reject staging-path /creator/ QA artifacts');
 assert.equal(record.runtime_path,'/','Root-route bundle required');
 assert.deepEqual(record.flags,{VITE_IREN_SPATIAL_GUIDE:true,VITE_NATIVE_CREATOR_STUDIO_V095:true,VITE_PACKAGE_CREATOR_GALLERY_V010:true});
 assert.equal(record.syntheticOnly,true);
 assert.equal(record.authenticatedAcceptance,false);
 assert.equal(record.physicalDeviceAcceptance,false);
 assert.equal(record.cloudflareCandidate,null);
 assert.ok(Array.isArray(record.assets)&&record.assets.length>0);
 const seen=new Set();
 for(const asset of record.assets){
  assert.ok(typeof asset.path==='string'&&/^[a-zA-Z0-9_./-]+$/.test(asset.path)&&!asset.path.startsWith('/')&&!asset.path.split('/').some(x=>x==='..'||x==='.'||!x),'Unsafe tested asset path');
  assert.ok(!seen.has(asset.path),'Duplicate tested asset path');seen.add(asset.path);
  let prefix=root;
  for(const part of asset.path.split('/')){prefix=join(prefix,part);assert.ok(!lstatSync(prefix).isSymbolicLink(),'Tested asset symlink');}
  assert.match(asset.sha256,/^[a-f0-9]{64}$/);
  assert.equal(createHash('sha256').update(readFileSync(join(root,asset.path))).digest('hex'),asset.sha256,'Tested asset bytes changed: '+asset.path);
 }
 assert.ok(seen.has('index.html'),'Tested entry document missing');
 // Staging `/creator/assets/*.js` references left React blank on actual Safari.
 // Test the exact HTML copied into the Cloudflare apex assets directory.
 const html=readFileSync(join(root,'index.html'),'utf8');
 const referenced=[...html.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:js|css))"/g)].map(x=>x[1]);
 assert.ok(referenced.some(x=>x.endsWith('.js'))&&referenced.some(x=>x.endsWith('.css')),
   'Root candidate missing compiled JS or CSS');
 for(const path of referenced){
  assert.match(path,/^\/assets\/[a-zA-Z0-9._/-]+\.(?:js|css)$/,'Staging-path assets forbidden in apex root build');
  assert.ok(seen.has(path.slice(1)),'Referenced asset missing in exact QA evidence: '+path);
 }
 return {qa_run:FEATURE_ON_QA_RUN,harness_source:FEATURE_ON_QA_HEAD,files:seen.size,manifest_sha256:createHash('sha256').update(JSON.stringify(record)).digest('hex')};
}
export function verifyFeatureOnFlags(env){
 for(const name of ['VITE_PACKAGE_CREATOR_GALLERY_V010','VITE_NATIVE_CREATOR_STUDIO_V095','VITE_IREN_SPATIAL_GUIDE'])
  assert.equal(env[name],'true','Feature-ON candidate flag mismatch: '+name);
 return {VITE_PACKAGE_CREATOR_GALLERY_V010:true,VITE_NATIVE_CREATOR_STUDIO_V095:true,VITE_IREN_SPATIAL_GUIDE:true};
}
export function verifyFeatureOnQa(run){
 assert.equal(run.id,FEATURE_ON_QA_RUN,'Unreviewed combined QA run');
 assert.equal(run.head_sha,FEATURE_ON_QA_HEAD,'Combined QA source changed');
 assert.equal(run.name,'ANEVUM V100 Apex Root Feature-ON Browser QA');
 assert.equal(run.status,'completed');
 assert.equal(run.conclusion,'success','Combined feature-ON QA must pass');
}
export function validateFeatureOnBaseline(snapshot){
 const result=validateBaseline(snapshot,featureOnBaseline,{allowAcceptanceEntry:true});
 const entry=snapshot.routes.filter(x=>x.pattern==='anevum.com/__enter/v095-v096*');
 assert.equal(entry.length,1,'Feature-ON profile requires the existing protected entry');
 assert.equal(entry[0].script,'anevum-v095-v096-acceptance-entry','Protected entry target drift');
 return result;
}
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

export function validateBaseline({deployment,routes,settings,live,pilot,exposure},baseline=manifest,{allowAcceptanceEntry=false}={}){
  assert.equal(baseline.source_sha,'d5af32fd8f04b05e0381f7ac12c59d06c0e836a2','Unreviewed application source');
  assert.equal(baseline.approval.production,false,'No production approval may be inferred');
  assert.equal(baseline.approval.live_traffic_promotion,false,'No traffic promotion permitted');
  assert.equal(baseline.routes.length,39);
  assert.equal(baseline.routes.filter(x=>x.pattern==='family.anevum.com/*'&&x.script==='anevum-family-link-v004').length,1);
  assert.equal(deployment?.id,baseline.deployment.id,'Deployment changed; review before uploading');
  assert.deepEqual(deployment.versions,baseline.deployment.versions,'Traffic distribution changed');
  // V100 preserves the existing, Access-protected opt-in acceptance entry.
  // It may already exist; this permission never creates or retargets a route.
  const extra=routes.filter(r=>!baseline.routes.some(b=>b.pattern===r.pattern));
  if(allowAcceptanceEntry){
    assert.equal(extra.length,1,'Expected only the existing acceptance entry');
    assert.match(extra[0].pattern,/^anevum\.com\/__enter\/v095-v096\*?$/,'Unexpected additional route');
    assert.ok(typeof extra[0].script==='string'&&extra[0].script,'Acceptance route target missing');
    assert.notEqual(extra[0].request_limit_fail_open,true,'Acceptance route must fail closed');
  }
  assert.deepEqual(normalizeRoutes(allowAcceptanceEntry?routes.filter(r=>!extra.includes(r)):routes),baseline.routes,'Cloudflare route inventory drift');
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
export function validateUploadedCandidate({before,after,candidate,baseline=manifest,allowAcceptanceEntry=false}){
  validateBaseline(before,baseline,{allowAcceptanceEntry});
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
