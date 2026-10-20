import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyV091Acceptance,V091_APPLICATION_SOURCE,V091_RELEASE_METADATA,reviewedV091SourceFiles,
 verifyV091SourceScope} from '../ops/v091-release-acceptance.mjs';
const releaseWorkflow=readFileSync(new URL('../../.github/workflows/v084-continuance-production.yml',import.meta.url),'utf8');
const guardMatch=releaseWorkflow.match(/<<'V091_PROMOTION_GUARD'\n([\s\S]+?)\n          V091_PROMOTION_GUARD/);
assert.ok(guardMatch,'The executable promotion guard must be present');
const promotionGuard=await import('data:text/javascript;base64,'+Buffer.from(guardMatch[1].replace(/^          /gm,'')).toString('base64'));
const complete=()=>({source_sha:V091_APPLICATION_SOURCE,founder_staff_session:true,
 reviewer_staff_session:true,creator_journey:true,cross_account_identity:true,
 verified_at:'2026-10-19T00:00:00Z',evidence:['https://github.com/anevum/anevum-web/actions/runs/123']});
test('checked-in V091 acceptance is pinned and stays blocked while any gate is pending',()=>{
 const record=JSON.parse(readFileSync(new URL('../../.github/release-evidence/v091-authenticated.json',import.meta.url),'utf8'));
 assert.equal(record.source_sha,V091_APPLICATION_SOURCE);
 if(['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity'].every(key=>record[key]===true))
  assert.equal(verifyV091Acceptance(record),true);
 else assert.throws(()=>verifyV091Acceptance(record),/unverified/);
});
test('each authenticated gate is mandatory and never accepts truthy text',()=>{
 for(const key of ['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity'])
  for(const value of [false,undefined,'true','fixture','owner'])
   assert.throws(()=>verifyV091Acceptance({...complete(),[key]:value}),/unverified/);
});
test('a different source, future timestamp, missing evidence or credential URL cannot release',()=>{
 assert.throws(()=>verifyV091Acceptance({...complete(),source_sha:'0'.repeat(40)}),/source/);
 for(const verified_at of [null,'not a date','2999-01-01T00:00:00Z'])
  assert.throws(()=>verifyV091Acceptance({...complete(),verified_at}),/timestamp/);
 for(const evidence of [[],['https://evil.invalid/'],['https://github.com/anevum/anevum-web/actions/runs/123?token=secret']])
  assert.throws(()=>verifyV091Acceptance({...complete(),evidence}),/evidence/);
 assert.equal(verifyV091Acceptance(complete()),true);
});
test('repository evidence supports the current release PR without accepting unrelated or credential-bearing URLs',()=>{
 const accepted=[
  'https://github.com/anevum/anevum-web/pull/554#issuecomment-123',
  'https://github.com/anevum/anevum-web/pull/564#issuecomment-456',
  'https://github.com/anevum/anevum-web/actions/runs/123/artifacts/456'
 ];
 for(const ref of accepted){
  assert.equal(verifyV091Acceptance({...complete(),evidence:[ref]}),true);
  for(const value of [' '+ref,ref+'\n',ref+'?token=secret',ref+'#extra'])
   assert.throws(()=>verifyV091Acceptance({...complete(),evidence:[value]}),/evidence/);
 }
 for(const ref of [
  'https://github.com/anevum/anevum-web/pull/565#issuecomment-456',
  'https://github.com/another/anevum-web/pull/564#issuecomment-456',
  'https://github.com/anevum/another/pull/564#issuecomment-456',
  'https://github.com/anevum/anevum-web/pull/564',
  'https://github.com/anevum/anevum-web/pull/564?token=secret#issuecomment-456'
 ])assert.throws(()=>verifyV091Acceptance({...complete(),evidence:[ref]}),/evidence/);
 assert.throws(()=>verifyV091Acceptance({...complete(),reviewer_staff_session:false,evidence:[accepted[1]]}),/unverified: reviewer_staff_session/);
});

test('guarded V091 release stays pinned to precisely the reviewed integrated files',()=>{
 const release=readFileSync(new URL('../../.github/workflows/v084-continuance-production.yml',import.meta.url),'utf8');
 assert.ok(release.includes('git merge-base --is-ancestor '+V091_APPLICATION_SOURCE+' HEAD'));
 assert.ok(release.includes('git diff --exit-code '+V091_APPLICATION_SOURCE+' HEAD'));
 assert.ok(release.includes("':(exclude).github/workflows/v091-live-readonly-qa.yml'"),'Only the reviewed read-only QA workflow may differ as release configuration');
 assert.ok(release.includes("':(exclude).github/workflows/v084-continuance-production.yml'"),'Guard changes must remain separate from reviewed app source');
 const start=release.indexOf("diff -u <(printf '%s\\n' \\");
 const end=release.indexOf('<(git diff --name-only db2b8c0f8f79061adf1677986b87077856204267 HEAD)',start);
 assert.ok(start>=0&&end>start,'A static source-delta allowlist must be present');
 const scope=release.slice(start,end);
 const files=[...scope.matchAll(/^\s*'([^']+)'/gm)].map(match=>match[1]);
 assert.equal(files.length,151,'The candidate contains exactly 151 reviewed source files');
 assert.equal(new Set(files).size,files.length,'No duplicated entries');
 assert.deepEqual(files,[...files].sort(),'Source scope must be deterministic');
 for(const required of [
  '.github/workflows/v091-controlled-pilot-upload.yml',
  'creator-v1/ops/v091-controlled-pilot-upload.mjs',
  'creator-v1/test/v091-controlled-pilot-upload.test.mjs',
  'creator-v1/web/src/components/IrenGuidedContinuance.tsx',
  'creator-v1/web/src/pages/DiscoverPage.tsx',
  'creator-v1/test/package-discovery-browser-v011.mjs',
  'creator-v1/test/package-discovery-v011.test.mjs',
  'site/alpha/v003/unified-creation-bridge-v009.mjs',
  'site/alpha/v003/resource-service.mjs',
  'tests/alpha-package-v004-browser.mjs',
  'creator-v1/web/src/iren-living-v088.css',
  'creator-v1/web/src/iren-guided-v080.css',
  'creator-v1/test/iren-first-contact-v092.test.mjs',
  'creator-v1/web/src/pages/AuraCodexPage.tsx',
  'creator-v1/test/aura-codex-visual-v091.mjs',
  '.github/workflows/v091-aura-codex-browser.yml',
  'creator-v1/test/capture-home-navigation-v079.mjs',
  'creator-v1/web/src/components/MemberPresenceStatus.tsx',
  'creator-v1/test/player-presence-v092.test.mjs',
  'creator-v1/canonical-auth/member-verified-roles.mjs',
  'creator-v1/canonical-auth/migrations/0012_verified_designations_v093.sql',
  'creator-v1/operations/anevum-iren-insignias-v093.mjs',
  'creator-v1/test/staff-verified-designations-v093.test.mjs',
  'creator-v1/wrangler.iren-insignias-v093.jsonc'
 ])assert.ok(files.includes(required),'Reviewed source is missing '+required);
 assert.ok(files.every(file=>!/[?*{}]/.test(file)),'Globs are not allowed in the release scope');
 assert.ok(release.includes("vars.CANONICAL_VERIFIED_ROLES_ENABLED!=='true'"));
 assert.equal(promotionGuard.PIN.original,'93cc7f07-cf39-457e-af69-c9f6f4c02d25');
 assert.equal(promotionGuard.PIN.candidate,'4b5c5d60-6c8f-431a-a16c-b660c8baf650');
 assert.ok(release.includes('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"'));
 assert.match(release,/ANEVUM_LAUNCH_APPROVED/);
 assert.match(release,/CLOUDFLARE_ACCOUNT_ID/);
});

function sourceFixture(){
 const release=readFileSync(new URL('../../.github/workflows/v084-continuance-production.yml',import.meta.url),'utf8');
 return {release,recordedSource:V091_APPLICATION_SOURCE,changedFiles:reviewedV091SourceFiles(release),
   applicationChangedFiles:[],applicationIsAncestor:true,baselineIsAncestor:true};
}
test('source-only scope check requires actual git paths to match every reviewed entry',()=>{
 const input=sourceFixture();
 assert.equal(verifyV091SourceScope(input).changedFiles,input.changedFiles.length);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:[...input.changedFiles,'site/alpha/unreviewed.mjs']}),/differs from git; missing:/);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:input.changedFiles.slice(1)}),/extra:/);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:[...input.changedFiles,input.changedFiles[0]]}),/unique literal paths/);
 assert.throws(()=>verifyV091SourceScope({...input,changedFiles:[...input.changedFiles,'site/alpha/*']}),/unique literal paths/);
});
test('source-only validation allows exactly the five metadata differences and cannot certify authenticated acceptance',()=>{
 const input=sourceFixture(),pending={...complete(),founder_staff_session:false};
 assert.equal(verifyV091SourceScope({...input,applicationChangedFiles:[...V091_RELEASE_METADATA]}).applicationSource,V091_APPLICATION_SOURCE);
 assert.throws(()=>verifyV091Acceptance(pending),/unverified/);
 for(const file of ['creator-v1/web/src/main.tsx','site/alpha/v003/api.mjs','docs/production/unreviewed.md'])
   assert.throws(()=>verifyV091SourceScope({...input,applicationChangedFiles:[...V091_RELEASE_METADATA,file]}),/changed after its source pin/);
 const broadened=input.release.replace("':(exclude)creator-v1/test/v091-release-acceptance.test.mjs'",
   "':(exclude)creator-v1/test/v091-release-acceptance.test.mjs' \\\n            ':(exclude)site/alpha/v003/api.mjs'");
 assert.throws(()=>verifyV091SourceScope({...input,release:broadened}),/exactly the five/);
 const bypass=input.release.replace('node creator-v1/ops/v091-release-acceptance.mjs\n',
   'node creator-v1/ops/v091-release-acceptance.mjs --source-only\n');
 assert.throws(()=>verifyV091SourceScope({...input,release:bypass}),/must run authenticated acceptance/);
});
test('source-only validation fails stale source records, ancestry and nonliteral workflow scope',()=>{
 const input=sourceFixture();
 assert.throws(()=>verifyV091SourceScope({...input,recordedSource:'0'.repeat(40)}),/pin is stale/);
 for(const key of ['applicationIsAncestor','baselineIsAncestor'])
   for(const value of [false,undefined,'true'])
     assert.throws(()=>verifyV091SourceScope({...input,[key]:value}),/must be ancestors/);
 const file=input.changedFiles[0];
 assert.throws(()=>verifyV091SourceScope({...input,release:input.release.replace("'"+file+"' \\","'creator-v1/**' \\")}),/literal file paths/);
 const missingPin=input.release.replace('git merge-base --is-ancestor '+V091_APPLICATION_SOURCE+' HEAD',
   'git merge-base --is-ancestor '+'0'.repeat(40)+' HEAD');
 assert.throws(()=>verifyV091SourceScope({...input,release:missingPin}),/production ancestry pin is stale/);
});
test('read-only CI requires full history and the actual source-scope check before public canary work',()=>{
 const qa=readFileSync(new URL('../../.github/workflows/v091-live-readonly-qa.yml',import.meta.url),'utf8');
 assert.match(qa,/persist-credentials: false\s+fetch-depth: 0/);
 const gate=qa.indexOf('node creator-v1/ops/v091-release-acceptance.mjs --source-only');
 assert.ok(gate>0&&gate<qa.indexOf('name: Verify read-only API checks'));
 assert.doesNotMatch(qa,/CLOUDFLARE_API_TOKEN|wrangler deploy|wrangler versions upload/);
});

const fakeId=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function promotionFixture(){
 const g=promotionGuard;
 const bindings=[{name:'ASSETS',type:'assets'},
  {name:'MEMBER_DB',type:'d1',database_id:'fixture-members'},
  {name:'COMMUNITY_DB',type:'d1',database_id:'fixture-community'},
  ...['CANONICAL_BETTER_AUTH_SECRET','CANONICAL_RESEND_API_KEY','CANONICAL_PROTECTED_EMAILS','ANEVUM_PREVIEW_ALLOWED_EMAILS']
   .map(name=>({name,type:'secret_text'})),
  ...Object.entries({ANEVUM_PRELAUNCH_MODE:'public',ANEVUM_LAUNCH_APPROVED:'true',ANEVUM_CANONICAL_APEX_ENABLED:'true',
   CANONICAL_SCHEMA_APPROVED:'true',CANONICAL_EMAIL_ENABLED:'true',CANONICAL_RECOGNITION_ENABLED:'true',CANONICAL_CREATOR_UPLOADS_ENABLED:'false'})
   .map(([name,text])=>({name,type:'plain_text',text}))];
 while(bindings.length<24)bindings.push({name:'FIXTURE_'+bindings.length,type:'plain_text',text:'preserved'});
 const candidateBindings=[...structuredClone(bindings),{name:'CANONICAL_PACKAGE_PROOF_ENABLED',type:'plain_text',text:'true'},
  {name:'CANONICAL_PACKAGE_PROOF_KEY',type:'secret_text'}];
 const routes=Array.from({length:38},(_,i)=>({pattern:'fixture.invalid/'+i,script:'fixture-worker',request_limit_fail_open:false}));
 const snapshot={deployment:{...g.pilot(),id:fakeId(1),annotations:{'workers/message':'Recorded fixture pilot'}},
  latest:{items:[{id:g.PIN.candidate}]},
  original:{id:g.PIN.original,resources:{script:{etag:g.PIN.originalEtag},bindings,script_runtime:structuredClone(g.RUNTIME)}},
  candidate:{id:g.PIN.candidate,resources:{script:{etag:g.PIN.candidateEtag},bindings:candidateBindings,script_runtime:structuredClone(g.RUNTIME)}},
  settings:{bindings:structuredClone(candidateBindings),compatibility_date:g.RUNTIME.compatibility_date,
   compatibility_flags:[...g.RUNTIME.compatibility_flags],usage_model:'standard',placement:{},tags:[],tail_consumers:[],logpush:false},
  routes,exposure:{enabled:false,previews_enabled:false}};
 const pins={...g.PIN,originalBindings:g.sha(g.bindingLock(bindings)),candidateBindings:g.sha(g.bindingLock(candidateBindings)),routes:g.sha(g.routeLock(routes))};
 return {snapshot,pins,reviewedRoutes:structuredClone(routes)};
}
function simulatedCloudflare(fixture){
 const state={current:structuredClone(fixture.snapshot.deployment),posts:[],acknowledgements:[],loseResponse:false,blockRollback:false,wrongPromotion:false,skipRollback:false};
 const api=async(path,{method='GET',body}={})=>{
  assert.doesNotMatch(path,/force=/,'No force query is permitted');
  if(method==='POST'){
   state.posts.push(structuredClone(body));
   if(state.posts.length>1&&state.blockRollback)throw Error('V091 Cloudflare operation blocked (HTTP 400, codes 10220)');
   const result={...structuredClone(body),id:fakeId(state.posts.length+1)};
   if(state.posts.length===1&&state.wrongPromotion)result.versions=[{version_id:promotionGuard.PIN.original,percentage:50},{version_id:promotionGuard.PIN.candidate,percentage:50}];
   if(!(state.posts.length>1&&state.skipRollback))state.current=result;
   if(state.loseResponse){state.loseResponse=false;throw Error('V091 Cloudflare request failed; outcome requires verification');}
   const acknowledgement={id:result.id};state.acknowledgements.push(acknowledgement);
   return acknowledgement;
  }
  if(path.endsWith('/deployments?per_page=1'))return {deployments:[structuredClone(state.current)]};
  if(path.endsWith('/versions?per_page=1'))return structuredClone(fixture.snapshot.latest);
  if(path.endsWith('/versions/'+promotionGuard.PIN.original))return structuredClone(fixture.snapshot.original);
  if(path.endsWith('/versions/'+promotionGuard.PIN.candidate))return structuredClone(fixture.snapshot.candidate);
  if(path.endsWith('/settings'))return structuredClone(fixture.snapshot.settings);
  if(path.endsWith('/workers/routes'))return structuredClone(fixture.snapshot.routes);
  if(path.endsWith('/subdomain'))return structuredClone(fixture.snapshot.exposure);
  throw Error('Unexpected fixture API request');
 };
 return {api,state};
}
async function preparedFixture(){
 const fixture=promotionFixture(),{api,state}=simulatedCloudflare(fixture),saved=[];
 const save=value=>saved.push(structuredClone(value));
 const journal=await promotionGuard.prepare(api,fixture.reviewedRoutes,save,fixture.pins);
 return {...fixture,api,state,saved,save,journal};
}
test('pilot guard accepts only the exact numeric 100/0 pair, independent of order',()=>{
 const g=promotionGuard,expected=g.pilot();
 g.requireDeployment(expected,expected);
 g.requireDeployment({...expected,versions:[...expected.versions].reverse()},expected);
 for(const versions of [expected.versions.slice(0,1),[...expected.versions,expected.versions[1]],
  [expected.versions[0],expected.versions[0]],
  [expected.versions[0],{...expected.versions[1],percentage:0.01}],
  [expected.versions[0],{...expected.versions[1],percentage:'0'}],
  [{...expected.versions[0],percentage:99},expected.versions[1]],
  [expected.versions[0],{...expected.versions[1],version_id:fakeId(99)}]])
  assert.throws(()=>g.requireDeployment({...expected,versions},expected),/deployment/);
});
test('configuration guards normalize D1 aliases and reject changed bindings or staged uploads',()=>{
 const g=promotionGuard,fixture=promotionFixture();
 g.validateSnapshot(fixture.snapshot,fixture.reviewedRoutes,'pilot',fixture.pins);
 for(const list of [fixture.snapshot.original.resources.bindings,fixture.snapshot.candidate.resources.bindings,fixture.snapshot.settings.bindings])
  for(const binding of list.filter(b=>b.type==='d1')){binding.id=binding.database_id;delete binding.database_id;}
 g.validateSnapshot(fixture.snapshot,fixture.reviewedRoutes,'pilot',fixture.pins);
 const mutations=[s=>s.latest.items[0].id=fakeId(8),s=>s.original.resources.bindings[1].id='other-database',
  s=>s.candidate.resources.bindings[7].text='changed',s=>s.candidate.resources.bindings.pop(),
  s=>s.candidate.resources.bindings.push({name:'EXTRA',type:'secret_text'}),
  s=>s.candidate.resources.bindings[1].name=s.candidate.resources.bindings[0].name,
  s=>s.settings.bindings.at(-2).text='false',s=>s.original.resources.script.etag='changed',
  s=>s.candidate.resources.script.etag='changed'];
 for(const mutate of mutations){const changed=structuredClone(fixture.snapshot);mutate(changed);
  assert.throws(()=>g.validateSnapshot(changed,fixture.reviewedRoutes,'pilot',fixture.pins));}
});
test('candidate delta remains exactly the proof flag and key even with separately supplied binding hashes',()=>{
 const g=promotionGuard,f=promotionFixture();
 f.snapshot.candidate.resources.bindings.at(-2).text='false';
 f.snapshot.settings.bindings=structuredClone(f.snapshot.candidate.resources.bindings);
 f.pins.candidateBindings=g.sha(g.bindingLock(f.snapshot.candidate.resources.bindings));
 assert.throws(()=>g.validateSnapshot(f.snapshot,f.reviewedRoutes,'pilot',f.pins),/unreviewed candidate binding delta/);
});
test('runtime, disabled exposure, optional features and all route entries remain guarded',()=>{
 const g=promotionGuard;
 for(const mutate of [s=>s.original.resources.script_runtime.compatibility_date='2099-01-01',
  s=>s.candidate.resources.script_runtime.assets.raw_run_worker_first=false,
  s=>s.settings.compatibility_flags.push('unknown'),s=>s.settings.logpush=true,
  s=>s.exposure.enabled=true,s=>s.exposure.previews_enabled='false',
  s=>s.routes[0].script='different',s=>s.routes[0].request_limit_fail_open=true,s=>s.routes.pop()]){
  const f=promotionFixture();mutate(f.snapshot);assert.throws(()=>g.validateSnapshot(f.snapshot,f.reviewedRoutes,'pilot',f.pins));
 }
 for(const feature of ['CANONICAL_VERIFIED_ROLES_ENABLED','CANONICAL_REPUTATION_ENABLED']){
  const f=promotionFixture();
  for(const bindings of [f.snapshot.original.resources.bindings,f.snapshot.candidate.resources.bindings,f.snapshot.settings.bindings])
   Object.assign(bindings.find(b=>b.name==='FIXTURE_23'),{name:feature,text:'true'});
  f.pins.originalBindings=g.sha(g.bindingLock(f.snapshot.original.resources.bindings));
  f.pins.candidateBindings=g.sha(g.bindingLock(f.snapshot.candidate.resources.bindings));
  assert.throws(()=>g.validateSnapshot(f.snapshot,f.reviewedRoutes,'pilot',f.pins),/optional role or reputation feature enabled/);
 }
});
test('ID-only promotion acknowledgement is persisted and its GET verifies candidate and ownership',async()=>{
 const g=promotionGuard,f=await preparedFixture();
 const deployed=await g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins);
 assert.deepEqual(Object.keys(f.state.acknowledgements[0]),['id']);
 assert.deepEqual(deployed.versions,g.promoted().versions);
 assert.deepEqual(f.state.posts[0].versions,g.promoted().versions);
 assert.equal(f.saved.at(-1).promotedId,f.state.current.id);
 await g.postflight(f.api,f.reviewedRoutes,f.journal,f.pins);
 f.state.current.id=fakeId(99);
 await assert.rejects(g.postflight(f.api,f.reviewedRoutes,f.journal,f.pins),/does not belong/);
});
test('ID-only promotion acknowledgement cannot certify a mismatched GET identifier or marker',async()=>{
 const g=promotionGuard;
 for(const change of [deployment=>deployment.id=fakeId(91),deployment=>deployment.annotations['workers/message']='unrelated']){
  const f=await preparedFixture();
  const inconsistentApi=async(path,options)=>{
   const result=await f.api(path,options);
   if(!options&&path.endsWith('/deployments?per_page=1')&&f.state.posts.length===1)change(result.deployments[0]);
   return result;
  };
  await assert.rejects(g.promote(inconsistentApi,f.reviewedRoutes,f.journal,f.save,f.pins),/promotion readback/);
  assert.equal(f.journal.promotedId,f.state.acknowledgements[0].id,'Acknowledged ownership must be persisted before GET validation');
  assert.equal(f.state.posts.length,1);
 }
});
test('a changed deployment or staged upload fails before any promotion POST',async()=>{
 for(const change of [f=>f.state.current.id=fakeId(9),f=>f.snapshot.latest.items[0].id=fakeId(9)]){
  const f=await preparedFixture();change(f);
  await assert.rejects(promotionGuard.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins));
  assert.equal(f.state.posts.length,0);assert.equal(f.journal.attempted,false);
 }
});
test('ID-only rollback acknowledgement is persisted and its GET verifies the recorded pair and marker',async()=>{
 const g=promotionGuard,f=await preparedFixture();
 await g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins);
 assert.equal(await g.rollback(f.api,f.journal,f.save),'RECORDED_PILOT_RESTORED');
 assert.deepEqual(Object.keys(f.state.acknowledgements[1]),['id']);
 assert.equal(f.saved.at(-1).rollbackId,f.state.current.id);
 assert.deepEqual(f.state.posts[1],{strategy:f.journal.before.strategy,versions:f.journal.before.versions,annotations:f.journal.before.annotations});
 assert.equal(g.deploymentLock(f.state.current),g.deploymentLock(f.journal.before));
});
test('ID-only rollback acknowledgement cannot certify a wrong GET shape or marker',async()=>{
 const g=promotionGuard;
 for(const change of [deployment=>deployment.versions= g.promoted().versions,
  deployment=>deployment.annotations['workers/message']='unrelated']){
  const f=await preparedFixture();await g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins);
  const inconsistentApi=async(path,options)=>{
   const result=await f.api(path,options);
   if(!options&&path.endsWith('/deployments?per_page=1')&&f.state.posts.length===2)change(result.deployments[0]);
   return result;
  };
  await assert.rejects(g.rollback(inconsistentApi,f.journal,f.save),/deployment versions|readback marker/);
  assert.equal(f.saved.at(-1).rollbackId,f.state.acknowledgements[1].id);
  assert.equal(f.state.posts.length,2);
 }
});
test('rollback covers an owned malformed split with no version at 100 percent',async()=>{
 const g=promotionGuard,f=await preparedFixture();f.state.wrongPromotion=true;
 await assert.rejects(g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins),/percentages changed/);
 assert.ok(f.journal.promotedId,'Ownership must survive a failed response postcondition');
 assert.equal(await g.rollback(f.api,f.journal),'RECORDED_PILOT_RESTORED');
});
test('a lost promotion response can be recovered only with its unique marker and intended shape',async()=>{
 const g=promotionGuard,f=await preparedFixture();f.state.loseResponse=true;
 await assert.rejects(g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins),/outcome requires verification/);
 assert.equal(f.journal.promotedId,null);
 assert.equal(await g.rollback(f.api,f.journal),'RECORDED_PILOT_RESTORED');
 const bad=await preparedFixture();bad.state.loseResponse=true;bad.state.wrongPromotion=true;
 await assert.rejects(g.promote(bad.api,bad.reviewedRoutes,bad.journal,bad.save,bad.pins));
 await assert.rejects(g.rollback(bad.api,bad.journal),/ownership is unproven/);
 assert.equal(bad.state.posts.length,1);
});
test('rollback does not overwrite an unrelated external deployment or an ownership-check race',async()=>{
 const g=promotionGuard,f=await preparedFixture();
 await g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins);
 f.state.current.id=fakeId(99);
 await assert.rejects(g.rollback(f.api,f.journal),/external writer/);
 assert.equal(f.state.posts.length,1);
 const raced=await preparedFixture();await g.promote(raced.api,raced.reviewedRoutes,raced.journal,raced.save,raced.pins);
 let reads=0;
 const racingApi=async(path,options)=>{
  if(!options&&path.endsWith('/deployments?per_page=1')&&++reads===2)raced.state.current.id=fakeId(98);
  return raced.api(path,options);
 };
 await assert.rejects(g.rollback(racingApi,raced.journal),/changed during ownership check/);
 assert.equal(raced.state.posts.length,1);
});
test('blocked rollback and mismatched rollback readback fail explicitly without force or retry',async()=>{
 const g=promotionGuard;
 for(const mode of ['blockRollback','skipRollback']){
  const f=await preparedFixture();await g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins);f.state[mode]=true;
  await assert.rejects(g.rollback(f.api,f.journal),mode==='blockRollback'?/10220/:/superseded/);
  assert.equal(f.state.posts.length,2);
 }
});
test('an unattempted promotion requires no rollback write while an attempted outcome must be proven',async()=>{
 const g=promotionGuard,f=await preparedFixture();
 assert.equal(await g.rollback(f.api,f.journal),'NO_PROMOTION_ATTEMPTED');
 f.journal.attempted=true;
 await assert.rejects(g.rollback(f.api,f.journal),/outcome of an unacknowledged promotion/);
 assert.equal(f.state.posts.length,0);
});
test('a stale prior deployment GET cannot report unchanged after an acknowledged promotion',async()=>{
 const g=promotionGuard,f=await preparedFixture();
 await g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins);
 const staleApi=async(path,options)=>!options&&path.endsWith('/deployments?per_page=1')?
  {deployments:[structuredClone(f.journal.before)]}:f.api(path,options);
 await assert.rejects(g.rollback(staleApi,f.journal),/stale or inconclusive after an acknowledged promotion/);
 assert.equal(f.state.posts.length,1,'An uncertain GET must neither report success nor overwrite a deployment');
 assert.equal(f.state.current.id,f.journal.promotedId);
});
test('a lost promotion response followed by a stale prior-ID GET remains explicitly inconclusive',async()=>{
 const g=promotionGuard,f=await preparedFixture();f.state.loseResponse=true;
 await assert.rejects(g.promote(f.api,f.reviewedRoutes,f.journal,f.save,f.pins),/outcome requires verification/);
 const staleApi=async(path,options)=>!options&&path.endsWith('/deployments?per_page=1')?
  {deployments:[structuredClone(f.journal.before)]}:f.api(path,options);
 await assert.rejects(g.rollback(staleApi,f.journal),/outcome of an unacknowledged promotion/);
 assert.equal(f.state.posts.length,1);
 assert.equal(f.state.current.versions[0].version_id,g.PIN.candidate);
});
test('accepted artifact bytes are pinned and the independent JavaScript suffix remains allowed',()=>{
 const g=promotionGuard,bytes=Buffer.from('accepted fixture bytes'),pin={bytes:bytes.length,sha256:g.sha(bytes)};
 g.verifyAsset(bytes,pin);
 assert.throws(()=>g.verifyAsset(Buffer.from('changed fixture bytes!'),pin),/asset/);
 assert.throws(()=>g.verifyAsset(Buffer.concat([bytes,Buffer.from('overlay')]),pin),/length/);
 g.verifyAsset(Buffer.concat([bytes,Buffer.from('overlay')]),pin,{prefix:true});
 assert.throws(()=>g.verifyAsset(Buffer.concat([Buffer.from('changed fixture bytes!'),Buffer.from('overlay')]),pin,{prefix:true}),/asset/);
 assert.deepEqual(g.ASSETS.map(asset=>asset.path),['index.html','assets/index-Cmx71yTs.js','assets/index-CGCMyZTx.css','assets/iren-living-rig-v088-D_p8xTtN.js']);
 assert.equal(g.PIN.manifest,'7efc6d34dccf5d42a4d5727fc1b0078920d5453543b9f8a94798a0acac4e7077');
});
test('served CSS requires the exact compiled prefix and exact authorized suffix with no other bytes',()=>{
 const g=promotionGuard,compiled=Buffer.from('body{color:blue}'),overlay=Buffer.from('/* authorized scoped fixture */');
 const pin={bytes:compiled.length,sha256:g.sha(compiled)},suffix={bytes:overlay.length,sha256:g.sha(overlay)};
 const served=Buffer.concat([compiled,overlay]);
 g.verifyServedCss(served,pin,suffix);
 const changedPrefix=Buffer.from(served);changedPrefix[1]^=1;
 const changedSuffix=Buffer.from(served);changedSuffix[compiled.length+1]^=1;
 const unknownSuffix=Buffer.concat([compiled,Buffer.alloc(overlay.length,120)]);
 for(const invalid of [changedPrefix,changedSuffix,unknownSuffix,served.subarray(0,-1),
  Buffer.concat([served,Buffer.from('extra')]),compiled])
  assert.throws(()=>g.verifyServedCss(invalid,pin,suffix),/stylesheet length|asset hash/);
 assert.equal(g.CSS_OVERLAY.bytes,29686);
 assert.equal(g.CSS_OVERLAY.sha256,'b2e7546bb679dc2cf323aed14706e33066afd1a2b666df8326e938dc8ca2b773');
 assert.equal(g.ASSETS.find(asset=>asset.path.endsWith('.css')).bytes+g.CSS_OVERLAY.bytes,794840);
});
test('production uses candidate promotion and keeps the acceptance gate before all mutations',()=>{
 const guardStart=releaseWorkflow.indexOf('name: Prepare exact candidate promotion guard');
 const acceptance=releaseWorkflow.indexOf('node creator-v1/ops/v091-release-acceptance.mjs\n');
 assert.ok(acceptance>0&&acceptance<guardStart);
 assert.doesNotMatch(releaseWorkflow,/npx wrangler deploy|force=true|select\(\.percentage==100\)/);
 assert.ok(releaseWorkflow.includes('test "$code" != "0" || code=1'));
 assert.ok(releaseWorkflow.includes('V091 promotion did not pass; checking ownership'));
 assert.ok(releaseWorkflow.includes('live.subarray(0,candidate.length).equals(candidate)'));
 assert.ok(releaseWorkflow.includes('live-css "$RUNNER_TEMP/v079-live-style.css"'));
 assert.match(releaseWorkflow,/if curl --fail --silent --show-error --max-time 30 --no-keepalive/);
});
