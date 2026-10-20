import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
 manifest,normalizeRoutes,signatures,plainVars,databaseIds,
 validateBaseline,validateUploadedCandidate,verifyCandidateAssets
} from '../ops/v095-inactive-candidate-gate.mjs';

test('asset manifest refuses the incomplete upload and detects earned media corruption',()=>{
 const root=mkdtempSync(join(tmpdir(),'anevum-candidate-assets-'));
 try{
  mkdirSync(join(root,'evolution/assets'),{recursive:true});
  writeFileSync(join(root,'index.html'),'x'.repeat(2000));
  assert.throws(()=>verifyCandidateAssets(root),/152 earned-media/);
  for(let level=1;level<=30;level++)for(const suffix of ['-scene.gz','-1024.webp','-256.webp','-compact-128.png','-field.svg'])
   writeFileSync(join(root,'evolution/assets/level-'+String(level).padStart(2,'0')+suffix),'x'.repeat(400));
  for(const name of ['height.png','albedo.webp'])writeFileSync(join(root,'evolution/assets',name),'x'.repeat(400));
  writeFileSync(join(root,'evolution/mini-runtime.json'),'x'.repeat(7000));
  const complete=verifyCandidateAssets(root);
  assert.equal(complete.earned_media_count,152);
  assert.equal(complete.assets.length,154);
  writeFileSync(join(root,'evolution/assets/level-30-scene.gz'),'y'.repeat(400));
  assert.notEqual(verifyCandidateAssets(root).sha256,complete.sha256);
  rmSync(join(root,'evolution/assets/level-04-scene.gz'));
  assert.throws(()=>verifyCandidateAssets(root),/152 earned-media/);
 }finally{rmSync(root,{recursive:true,force:true});}
});

const publicFlags={
 ANEVUM_ACCESS_AUD:'6efab9f2821297fa4c965f18813d78d7433ebf7823a8e9e6d9ecfb7e4b2ccde1',
 ANEVUM_CANONICAL_APEX_ENABLED:'true',ANEVUM_CANONICAL_STAGE_ENABLED:'true',
 ANEVUM_LAUNCH_APPROVED:'true',ANEVUM_PRELAUNCH_MODE:'public',
 CANONICAL_APPLE_ENABLED:'false',CANONICAL_CREATOR_STUDIO_ENABLED:'true',
 CANONICAL_CREATOR_UPLOADS_ENABLED:'false',CANONICAL_EMAIL_ENABLED:'true',
 CANONICAL_GITHUB_ENABLED:'false',CANONICAL_GOOGLE_ENABLED:'false',
 CANONICAL_INVITED_SIGNUP_ENABLED:'false',CANONICAL_MICROSOFT_ENABLED:'false',
 CANONICAL_PACKAGE_PROOF_ENABLED:'true',CANONICAL_PUBLIC_SIGNUP_ENABLED:'true',
 CANONICAL_RECOGNITION_ENABLED:'true',CANONICAL_SCHEMA_APPROVED:'true',
 CANONICAL_XP_TEST_ENABLED:'true'
};
const clone=value=>structuredClone(value);
function bindings(includeProof=true){
 const missing=includeProof?[]:['CANONICAL_PACKAGE_PROOF_ENABLED','CANONICAL_PACKAGE_PROOF_KEY'];
 return manifest.required_binding_signatures.filter(x=>!missing.includes(x.name)).map(x=>{
  if(x.type==='plain_text')return {...x,text:publicFlags[x.name]};
  if(x.type==='d1')return {...x,database_id:manifest.database_ids[x.name]};
  return {...x};
 });
}
const runtime=()=>clone(manifest.prior_inactive_version.runtime);
function base(){
 return {
  deployment:clone(manifest.deployment),
  routes:clone(manifest.routes),
  settings:{bindings:clone(manifest.required_binding_signatures)},
  live:{id:manifest.live_version.id,resources:{script:{etag:manifest.live_version.etag},bindings:bindings(false),script_runtime:runtime()}},
  pilot:{id:manifest.prior_inactive_version.id,resources:{script:{etag:manifest.prior_inactive_version.etag},bindings:bindings(true),script_runtime:runtime()}},
  exposure:clone(manifest.exposure)
 };
}
function candidate(){
 return {id:'12345678-1234-4234-9234-1234567890ab',resources:{
  script:{etag:'f'.repeat(64)},bindings:bindings(true),script_runtime:runtime()
 }};
}
function changed(s,field,expected){
 assert.throws(()=>validateBaseline(s),expected,field);
}
test('manifest pins the merged V095+V096 source, 39 routes, family Worker and zero approval',()=>{
 assert.equal(manifest.source_sha,'d5af32fd8f04b05e0381f7ac12c59d06c0e836a2');
 assert.equal(manifest.routes.length,39);
 assert.equal(manifest.routes.filter(x=>x.pattern==='family.anevum.com/*'&&x.script==='anevum-family-link-v004').length,1);
 assert.equal(manifest.routes.filter(x=>x.pattern.startsWith('anevum.com/studio/alpha')).length,0);
 assert.equal(manifest.approval.production,false);
 assert.equal(manifest.approval.live_traffic_promotion,false);
 assert.equal(manifest.approval.authenticated_acceptance,false);
 assert.equal(manifest.approval.physical_iphone,false);
 assert.deepEqual(manifest.v096_public_guest_alpha.paths,['/studio/alpha','/studio/alpha/']);
});
test('a complete, unchanged live Cloudflare baseline passes',()=>{
 assert.deepEqual(validateBaseline(base()),{status:'BASELINE_PASS',routeCount:39,bindings:26});
});
test('after a version-only upload with unchanged deployment, candidate passes',()=>{
 const b=base();
 assert.deepEqual(validateUploadedCandidate({before:b,after:clone(b),candidate:candidate()}),{
  status:'INACTIVE_CANDIDATE_PASS',candidateId:'12345678-1234-4234-9234-1234567890ab'
 });
});
test('normalizers ignore ordering but not identity',()=>{
 assert.deepEqual(normalizeRoutes([...manifest.routes].reverse()),manifest.routes);
 assert.deepEqual(signatures([...manifest.required_binding_signatures].reverse()),manifest.required_binding_signatures);
 assert.deepEqual(databaseIds(bindings(true)),manifest.database_ids);
 assert.equal(plainVars(bindings(true)).CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
});
test('reject changed deployment ID',()=>{
 const b=base();b.deployment.id='another';changed(b,'deployment',/Deployment changed/);
});
test('reject changed traffic percentages including a supposed 0%-only upload',()=>{
 const b=base();b.deployment.versions[0].percentage=99;changed(b,'percentage',/Traffic distribution changed/);
});
test('reject removed or additional independent route',()=>{
 const b=base();b.routes.pop();changed(b,'removed',/route inventory drift/);
 const c=base();c.routes.push({pattern:'anevum.com/studio/alpha*',script:'unauthorized',request_limit_fail_open:false});
 changed(c,'added',/route inventory drift/);
});
test('reject route retargeting and changed family owner',()=>{
 const b=base();b.routes.find(x=>x.pattern==='family.anevum.com/*').script='wrong-worker';
 changed(b,'retargeted',/route inventory drift/);
});
test('reject missing or changed binding signature',()=>{
 const b=base();b.settings.bindings.pop();changed(b,'missing secret binding',/Current bindings drift/);
});
test('reject changed D1 identities in both active and inactive versions',()=>{
 const b=base();b.live.resources.bindings.find(x=>x.name==='MEMBER_DB').database_id='wrong-db';
 changed(b,'live D1',/D1 database identity changed/);
 const c=base();c.pilot.resources.bindings.find(x=>x.name==='COMMUNITY_DB').database_id='wrong-db';
 changed(c,'pilot D1',/D1 database identity changed/);
});
test('reject creator uploads enabled or launch flag altered',()=>{
 const b=base();b.live.resources.bindings.find(x=>x.name==='CANONICAL_CREATOR_UPLOADS_ENABLED').text='true';
 changed(b,'upload',/Critical public safety flag drift/);
 const c=base();c.pilot.resources.bindings.find(x=>x.name==='ANEVUM_PRELAUNCH_MODE').text='gated';
 changed(c,'launch',/Critical public safety flag drift/);
});
test('reject legacy plain-text variable drift even outside explicitly pinned flags',()=>{
 const b=base();b.pilot.resources.bindings.find(x=>x.name==='CANONICAL_APPLE_ENABLED').text='true';
 changed(b,'feature flag',/Baseline variable drift/);
});
test('reject public preview URL exposure',()=>{
 const b=base();b.exposure.previews_enabled=true;changed(b,'preview',/Public preview exposure changed/);
});
test('reject worker runtime and assets changes',()=>{
 const b=base();b.pilot.resources.script_runtime.assets.raw_run_worker_first=false;
 changed(b,'run worker first',/Candidate|script_runtime|pilot|Expected|deep-equal|deepStrictEqual/);
});
test('reject an inactive candidate upload that altered deployed traffic or routes',()=>{
 const b=base(),after=clone(b);after.deployment.versions[1].percentage=1;
 assert.throws(()=>validateUploadedCandidate({before:b,after,candidate:candidate()}),/Version upload changed traffic/);
 const c=base(),afterRoutes=clone(c);afterRoutes.routes.pop();
 assert.throws(()=>validateUploadedCandidate({before:c,after:afterRoutes,candidate:candidate()}),/Version upload changed routes/);
});
test('reject candidate flag drift, D1 drift, and missing secrets',()=>{
 const b=base(),cc=candidate();cc.resources.bindings.find(x=>x.name==='CANONICAL_CREATOR_UPLOADS_ENABLED').text='true';
 assert.throws(()=>validateUploadedCandidate({before:b,after:clone(b),candidate:cc}),/Critical public safety flag drift/);
 const d=candidate();d.resources.bindings.find(x=>x.name==='COMMUNITY_DB').database_id='unexpected';
 assert.throws(()=>validateUploadedCandidate({before:b,after:clone(b),candidate:d}),/D1 database identity changed/);
 const e=candidate();e.resources.bindings=e.resources.bindings.filter(x=>x.name!=='CANONICAL_PACKAGE_PROOF_KEY');
 assert.throws(()=>validateUploadedCandidate({before:b,after:clone(b),candidate:e}),/Candidate bindings drift/);
});
test('reject a candidate script without a verifiable new fingerprint',()=>{
 const b=base();
 const c=candidate();delete c.resources.script.etag;
 assert.throws(()=>validateUploadedCandidate({before:b,after:clone(b),candidate:c}),/Candidate script etag/);
 const e=candidate();e.resources.script.etag=b.pilot.resources.script.etag;
 assert.throws(()=>validateUploadedCandidate({before:b,after:clone(b),candidate:e}),/identical to old inactive Worker/);
});
test('reject manifest-level fabricated approval or stale source SHA',()=>{
 const b=base(),m=clone(manifest);m.approval.production=true;
 assert.throws(()=>validateBaseline(b,m),/No production approval/);
 const stale=clone(manifest);stale.source_sha='ea1d5e7a402c1e85f9645ea76ced8f8cddbe859f';
 assert.throws(()=>validateBaseline(b,stale),/Unreviewed application source/);
});
