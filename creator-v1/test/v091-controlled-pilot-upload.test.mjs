import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,readdirSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PILOT,assertBaseline,assertCandidate,pilotConfig,pilotUploadArguments,requirePilotContext,uploadedVersion,uploadPilot} from '../ops/v091-controlled-pilot-upload.mjs';
const base=JSON.parse(readFileSync(new URL('../wrangler.apex-prelaunch.jsonc',import.meta.url),'utf8'));
const routes=JSON.parse(readFileSync(new URL('../operations/staff-transport-v091.json',import.meta.url),'utf8')).routes;
const secrets=['ANEVUM_PREVIEW_ALLOWED_EMAILS','CANONICAL_BETTER_AUTH_SECRET','CANONICAL_PROTECTED_EMAILS','CANONICAL_RESEND_API_KEY'];
const source={applicationSource:'a'.repeat(40),releaseSource:'b'.repeat(40),sourceTree:'c'.repeat(40)};
const candidateId='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
function fixture(){
 const vars={...base.vars,ANEVUM_PRELAUNCH_MODE:'public',ANEVUM_LAUNCH_APPROVED:'true',CANONICAL_RECOGNITION_ENABLED:'true'};
 const bindings=[...Object.entries(vars).map(([name,text])=>({name,type:'plain_text',text})),
  ...secrets.map(name=>({name,type:'secret_text'})),{name:'ASSETS',type:'assets'},
  ...base.d1_databases.map(d=>({name:d.binding,type:'d1',database_id:d.database_id,id:d.database_id}))];
 const runtime={assets:{not_found_handling:'single-page-application',serve_directly:false,raw_run_worker_first:true,base_path:'/'},compatibility_date:'2026-10-17',compatibility_flags:['nodejs_compat'],usage_model:'standard'};
 const active={id:PILOT.baseline,resources:{bindings,script_runtime:runtime,script:{etag:'baseline'}}};
 return {deployment:{deployments:[{id:'retained-deployment',versions:[{version_id:PILOT.baseline,percentage:100}]}]},
  latest:{items:[{id:PILOT.baseline}]},active,settings:{bindings:structuredClone(bindings),tags:[],tail_consumers:[],logpush:false,placement:{},usage_model:'standard'},
  routes:structuredClone(routes),exposure:{enabled:false,previews_enabled:false}};
}
function candidate(before){return {id:candidateId,annotations:{'workers/tag':'v091-pilot-'+source.applicationSource.slice(0,12),'workers/message':'Controlled pilot upload from '+source.releaseSource+'; no traffic activation'},resources:{script:{etag:'candidate'},script_runtime:structuredClone(before.active.resources.script_runtime),bindings:[...structuredClone(before.active.resources.bindings),{name:PILOT.proofFlag,type:'plain_text',text:'true'},{name:PILOT.proofSecret,type:'secret_text'}]}};}
const context=()=>({GITHUB_REPOSITORY:'anevum/anevum-web',GITHUB_REF:PILOT.branch,GITHUB_WORKFLOW:PILOT.workflow,GITHUB_EVENT_NAME:'push',GITHUB_SHA:source.releaseSource,CLOUDFLARE_ACCOUNT_ID:PILOT.account,VITE_PACKAGE_CREATOR_GALLERY_V010:'true'});
test('pilot rejects unrelated contexts and exposes only a version-upload command',()=>{
 requirePilotContext(context());
 for(const key of Object.keys(context()))assert.throws(()=>requirePilotContext({...context(),[key]:'wrong'}));
 assert.deepEqual(pilotUploadArguments('config','secret',source).slice(0,2),['versions','upload']);
 assert.ok(!pilotUploadArguments('config','secret',source).includes('deploy'));
 assert.throws(()=>uploadedVersion(JSON.stringify({type:'deploy',version_id:candidateId})),/one structured/);
 assert.equal(uploadedVersion(JSON.stringify({type:'version-upload',worker_name:PILOT.worker,version_id:candidateId})),candidateId);
});
test('baseline checks reject staged secrets, split traffic, route drift, exposure and wrong databases',()=>{
 assertBaseline(fixture(),routes);
 const mutations=[
  f=>{f.latest.items[0].id=candidateId;},
  f=>{f.deployment.deployments[0].versions.push({version_id:candidateId,percentage:0});},
  f=>{f.settings.bindings.find(b=>b.name==='CANONICAL_EMAIL_ENABLED').text='false';},
  f=>{f.routes[0].request_limit_fail_open=true;},
  f=>{f.exposure.previews_enabled=true;},
  f=>{for(const bindings of [f.active.resources.bindings,f.settings.bindings])bindings.find(b=>b.name==='MEMBER_DB').database_id='wrong';},
  f=>{for(const bindings of [f.active.resources.bindings,f.settings.bindings])bindings.find(b=>b.name==='CANONICAL_BETTER_AUTH_SECRET').name=PILOT.proofSecret;}
 ];
 for(const mutate of mutations){const f=fixture();mutate(f);assert.throws(()=>assertBaseline(f,routes));}
});
test('candidate retains exact baseline variables, secrets, databases and asset policy with only the proof additions',()=>{
 const f=fixture(),c=candidate(f);assertCandidate(c,f,source);
 const config=pilotConfig(base,f,'/reviewed');
 assert.equal(config.vars.ANEVUM_PRELAUNCH_MODE,'public');assert.equal(config.vars[PILOT.proofFlag],'true');
 assert.equal(config.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(config.assets.directory,'/reviewed/creator-v1/dist/web');
 assert.deepEqual(config.routes,[]);assert.equal(config.workers_dev,false);
 for(const mutate of [
  x=>{x.resources.bindings.find(b=>b.name==='CANONICAL_EMAIL_ENABLED').text='false';},
  x=>{x.resources.bindings.find(b=>b.name==='CANONICAL_BETTER_AUTH_SECRET').name='REPLACED_SECRET';},
  x=>{x.resources.script_runtime.assets.raw_run_worker_first=false;},
  x=>{x.annotations['workers/tag']='unreviewed';}
 ]){const changed=structuredClone(c);mutate(changed);assert.throws(()=>assertCandidate(changed,f,source));}
});
function harness({driftAfter=false,driftBefore=false}={}){
 const f=fixture(),c=candidate(f);let uploaded=false,reads=0,secretValue=null;
 const api=async path=>{
  reads++;
  if(driftBefore&&reads>6&&!uploaded)f.latest.items[0].id=candidateId;
  if(path.endsWith('/versions/'+candidateId))return structuredClone(c);
  let result=path.endsWith('/deployments')?f.deployment:path.endsWith('/versions?per_page=1')?f.latest:
   path.endsWith('/versions/'+PILOT.baseline)?f.active:path.endsWith('/settings')?f.settings:
   path.endsWith('/routes')?f.routes:path.endsWith('/subdomain')?f.exposure:null;
  assert.ok(result,'Only the six reviewed GET paths may be read');return structuredClone(result);
 };
 const runWrangler=(args,output)=>{
  assert.deepEqual(args.slice(0,2),['versions','upload']);
  const secretPath=args[args.indexOf('--secrets-file')+1];
  assert.equal(statSync(secretPath).mode&0o777,0o600);
  const payload=JSON.parse(readFileSync(secretPath,'utf8'));assert.deepEqual(Object.keys(payload),[PILOT.proofSecret]);
  secretValue=payload[PILOT.proofSecret];assert.equal(Buffer.from(secretValue,'base64url').length,64);
  uploaded=true;f.latest.items[0].id=candidateId;f.settings.bindings=structuredClone(c.resources.bindings);
  if(driftAfter)f.deployment.deployments[0].versions[0].version_id=candidateId;
  writeFileSync(output,JSON.stringify({type:'version-upload',worker_name:PILOT.worker,version_id:candidateId})+'\n');
  return {status:0};
 };
 return {api,runWrangler,secret:()=>secretValue,uploaded:()=>uploaded};
}
test('inactive upload checks immediate drift, retains production, and erases the secret without putting it in evidence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pilot-test-'));
 try{
  const h=harness(),result=await uploadPilot({...h,source,reviewedRoutes:routes,baseConfig:base,temporaryRoot:dir});
  assert.equal(result.status,'UPLOADED_INACTIVE');assert.equal(result.activeVersion,PILOT.baseline);
  assert.equal(result.candidateVersion,candidateId);assert.equal(result.authenticatedAcceptance,'PENDING');
  assert.equal(JSON.stringify(result).includes(h.secret()),false);assert.deepEqual(readdirSync(dir),[]);
  const before=harness({driftBefore:true});
  await assert.rejects(uploadPilot({...before,source,reviewedRoutes:routes,baseConfig:base,temporaryRoot:dir}),/Inactive upload/);
  assert.equal(before.uploaded(),false);assert.deepEqual(readdirSync(dir),[]);
  const after=harness({driftAfter:true});
  await assert.rejects(uploadPilot({...after,source,reviewedRoutes:routes,baseConfig:base,temporaryRoot:dir}),/changed active traffic/);
  assert.deepEqual(readdirSync(dir),[]);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('pilot workflow cannot deploy or certify live acceptance and retains gallery-on build evidence',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/v091-controlled-pilot-upload.yml',import.meta.url),'utf8');
 assert.match(workflow,/VITE_PACKAGE_CREATOR_GALLERY_V010: 'true'/);
 assert.match(workflow,/v091-release-acceptance\.mjs --source-only/);
 assert.match(workflow,/v091-controlled-pilot-upload\.mjs --upload/);
 assert.match(workflow,/path: evidence\/v091-pilot\//);
 assert.doesNotMatch(workflow,/workflow_dispatch|wrangler (?:deploy|versions deploy|triggers)|--apply|v091-authenticated\.json/);
 const production=readFileSync(new URL('../../.github/workflows/v084-continuance-production.yml',import.meta.url),'utf8');
 assert.match(production,/node creator-v1\/ops\/v091-release-acceptance\.mjs\n/);
 assert.doesNotMatch(production,/v091-release-acceptance\.mjs --source-only/);
});
