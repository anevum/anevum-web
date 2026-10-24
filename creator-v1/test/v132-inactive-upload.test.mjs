import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 WORKER,PUBLIC,CONTROL_PUBLIC,GATEWAY,SOURCE,QA_RUN,ARTIFACT,BRANCH,MARKER,MESSAGE,
 verifySnapshot,verifyBundle
} from '../ops/v132-inactive-upload.mjs';
const plainNames=[
 'ANEVUM_ACCESS_AUD','ANEVUM_CANONICAL_APEX_ENABLED','ANEVUM_CANONICAL_STAGE_ENABLED',
 'ANEVUM_LAUNCH_APPROVED','ANEVUM_PRELAUNCH_MODE','CANONICAL_APPLE_ENABLED',
 'CANONICAL_CREATOR_STUDIO_ENABLED','CANONICAL_CREATOR_UPLOADS_ENABLED',
 'CANONICAL_EMAIL_ENABLED','CANONICAL_GITHUB_ENABLED','CANONICAL_GOOGLE_ENABLED',
 'CANONICAL_INVITED_SIGNUP_ENABLED','CANONICAL_MICROSOFT_ENABLED',
 'CANONICAL_PACKAGE_PROOF_ENABLED','CANONICAL_PUBLIC_SIGNUP_ENABLED',
 'CANONICAL_RECOGNITION_ENABLED','CANONICAL_SCHEMA_APPROVED','CANONICAL_XP_TEST_ENABLED'
];
const secrets=['ANEVUM_PREVIEW_ALLOWED_EMAILS','CANONICAL_BETTER_AUTH_SECRET',
 'CANONICAL_PACKAGE_PROOF_KEY','CANONICAL_PROTECTED_EMAILS','CANONICAL_RESEND_API_KEY'];
const version='some-sealed-version';
function fixture(){
 const b=[
  ...plainNames.map(name=>({name,type:'plain_text',text:name==='CANONICAL_CREATOR_UPLOADS_ENABLED'||name==='CANONICAL_XP_TEST_ENABLED'?'false':'true'})),
  ...secrets.map(name=>({name,type:'secret_text'})),
  {name:'ASSETS',type:'assets'},
  {name:'COMMUNITY_DB',type:'d1',id:'fa96e36d-6257-4883-bf15-074947e11a13'},
  {name:'MEMBER_DB',type:'d1',id:'e1d29049-c83b-4534-8355-dc1fa36ba6d8'}
 ];
 return {deployment:{id:'correct-apex',versions:[{version_id:PUBLIC,percentage:100}]},
  controller:{id:'correct-ctrl',versions:[{version_id:CONTROL_PUBLIC,percentage:100}]},
  settings:{compatibility_date:'2026-10-17',bindings:b},
  exposure:{enabled:false,previews_enabled:false},routes:Array.from({length:40},(_,i)=>({id:String(i),pattern:'sub'+i+'.anevum.com/*',script:'existing'})),
  versions:[{id:PUBLIC},{id:version}]};
}
test('inactive upload configuration pins V131 public source and has no promotion path',()=>{
 assert.equal(WORKER,'anevum-apex-prelaunch-gateway');
 assert.equal(GATEWAY,'1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99');
 assert.match(SOURCE,/^[0-9a-f]{40}$/);
 assert.match(BRANCH,/^ops\/v132-/);
 assert.match(MARKER,/v132-collections-inactive-upload\.json$/);
 assert.match(MESSAGE,/inactive only/);
 const source=readFileSync(new URL('../ops/v132-inactive-upload.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/method:\s*'POST'|method:\s*'PUT'|method:\s*'PATCH'|method:\s*'DELETE'|createDeployment|versions deploy/);
 assert.match(source,/activated:false|noPublicTraffic:true/);
 assert.match(source,/eligibleForPromotion:false/);
});
test('snapshot binds V131 untouched, five secrets, two D1 and 100 percent traffic',()=>{
 const result=verifySnapshot(fixture());
 assert.equal(result.bindingNames.length,26);
 assert.equal(result.versions.length,2);
 assert.equal(result.plain.CANONICAL_XP_TEST_ENABLED,'false');
 assert.equal(result.plain.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
});
test('deployment guard rejects changed traffic, database, exposure or disabled flags',()=>{
 const cases=[
  x=>x.deployment.versions[0].percentage=90,
  x=>x.deployment.versions[0].version_id='different',
  x=>x.controller.versions[0].version_id='old',
  x=>x.routes.pop(),
  x=>x.exposure.previews_enabled=true,
  x=>x.exposure.enabled=true,
  x=>x.settings.bindings.find(x=>x.name==='MEMBER_DB').id='different',
  x=>x.settings.bindings.find(x=>x.name==='CANONICAL_XP_TEST_ENABLED').text='true',
  x=>x.settings.bindings.find(x=>x.name==='CANONICAL_CREATOR_UPLOADS_ENABLED').text='true',
  x=>x.settings.bindings.splice(5,1)
 ];
 for(const modify of cases){const state=fixture();modify(state);assert.throws(()=>verifySnapshot(state));}
});
test('payload cannot be accepted without exact successful QA artifact pin',()=>{
 assert.equal(QA_RUN,0);
 assert.equal(ARTIFACT,0);
 const source=readFileSync(new URL('../ops/v132-inactive-upload.mjs',import.meta.url),'utf8');
 assert.match(source,/Number\.isInteger\(QA_RUN\)&&QA_RUN>0/);
 assert.match(source,/assert\.equal\(a\.digest,'sha256:'\+ARTIFACT_DIGEST\)/);
 assert.match(source,/git\('diff-tree','--no-commit-id','--name-only','-r','HEAD'\)/);
 assert.match(source,/assert\.equal\(git\('log','-1','--format=%s'\),MESSAGE\)/);
});
