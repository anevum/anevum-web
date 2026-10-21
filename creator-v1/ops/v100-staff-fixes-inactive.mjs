/**
 * ANEVUM.OPS.RELEASE.2026-10-21.001.V100-STAFF-FIXES-PROTECTED
 * One-use release guard for a new immutable, INACTIVE apex root asset version.
 * The only writer is Wrangler versions upload; this module is GET-only on
 * Cloudflare both before and after that operation. No deployment, route or
 * database writes, and no production/Access authorization is implied.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyCandidateAssets} from './v095-inactive-candidate-gate.mjs';
import {verifyApexRootAssets} from '../test/v100-apex-root-assets.test.mjs';

const REPO='anevum/anevum-web';
const SOURCE='f3655792b3c6621699ae1fb38eeeac7bc887f9f6';
const ACCOUNT='2f7ee83107240152097efd956a4e8335';
const ZONE='8abe27259b5436af5966d3b40d9a3760';
const WORKER='anevum-apex-prelaunch-gateway';
const PUBLIC='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
const CORRECTED='ed44a70c-2adb-4048-a7a5-82e7a457528d';
const BASELINE_DEPLOYMENT='46b2baba-1622-4b91-b27e-a0446ab92720';
const QA_ENTRY='anevum-v095-v096-acceptance-entry';
const QA_ENTRY_VERSION='d7bb6c81-30e0-480f-b9a8-2f12f7a69ab5';
const ROOT='/accounts/'+ACCOUNT+'/workers/scripts/'+WORKER;
const sha256=data=>createHash('sha256').update(data).digest('hex');
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?
 Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
// Wrangler versions upload legitimately updates immutable upload annotations;
// operational settings and bindings must not drift, but attribution may change.
const operationalSettings=s=>Object.fromEntries(Object.entries(s||{}).filter(([key])=>key!=='annotations'));
const routeLock=x=>stable(x.map(r=>({pattern:r.pattern,script:r.script,request_limit_fail_open:r.request_limit_fail_open===true})).sort((a,b)=>a.pattern.localeCompare(b.pattern)));
const signatures=b=>(b||[]).map(x=>({name:x.name,type:x.type})).sort((a,b)=>a.name.localeCompare(b.name));
const d1ids=b=>Object.fromEntries((b||[]).filter(x=>x.type==='d1').map(x=>[x.name,x.database_id]));
const plain=b=>Object.fromEntries((b||[]).filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
function requireEnv(){
 assert.equal(process.env.GITHUB_REPOSITORY,REPO);
 assert.equal(process.env.GITHUB_REF,'refs/heads/ops/v100-staff-fixes-inactive-20261021-001');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15,'Cloudflare credential missing');
}
async function get(path){
 const url='https://api.cloudflare.com/client/v4'+path;
 const response=await fetch(url,{method:'GET',headers:{authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,accept:'application/json'},
  redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Cloudflare readonly GET failed HTTP '+response.status+' for '+path.split('?')[0]);
 const json=await response.json();
 assert.equal(json.success,true,'Cloudflare GET unsuccessful');
 return json.result;
}
async function snapshot(){
 const [deploy,settings,publicVersion,priorVersion,routes,exposure,versions,entry,entryVersion]=await Promise.all([
  get(ROOT+'/deployments'),get(ROOT+'/settings'),get(ROOT+'/versions/'+PUBLIC),
  get(ROOT+'/versions/'+CORRECTED),get('/zones/'+ZONE+'/workers/routes'),
  get(ROOT+'/subdomain'),get(ROOT+'/versions?per_page=100'),
  get('/accounts/'+ACCOUNT+'/workers/scripts/'+QA_ENTRY+'/deployments'),
  get('/accounts/'+ACCOUNT+'/workers/scripts/'+QA_ENTRY+'/versions/'+QA_ENTRY_VERSION)
 ]);
 return {deployment:deploy.deployments?.[0],settings,publicVersion,priorVersion,routes,exposure,
  versions:versions.items||[],entry:entry.deployments?.[0],entryVersion};
}
function verifyBaseline(s){
 assert.equal(s.deployment?.id,BASELINE_DEPLOYMENT,'Apex deployment changed since owner authorization');
 assert.deepEqual(s.deployment.versions,[{version_id:PUBLIC,percentage:100},
  {version_id:CORRECTED,percentage:0}],'100% public / 0% QA pair drift');
 assert.equal(s.entry?.versions?.length,1);
 assert.equal(s.entry.versions[0].version_id,QA_ENTRY_VERSION);
 assert.equal(s.entry.versions[0].percentage,100);
 assert.equal(s.entryVersion?.id,QA_ENTRY_VERSION);
 assert.equal(s.entryVersion.resources?.bindings?.find(x=>x.name==='QA_CANDIDATE')?.text,CORRECTED);
 assert.ok(s.routes.length===40,'Worker route count changed');
 assert.equal(s.routes.filter(x=>x.pattern==='anevum.com/__enter/v095-v096*'&&x.script===QA_ENTRY).length,1);
 assert.equal(s.exposure?.enabled,false);
 assert.equal(s.exposure?.previews_enabled,false);
 assert.equal(s.priorVersion?.id,CORRECTED);
 const runtime=s.priorVersion.resources?.script_runtime;
 assert.equal(runtime?.assets?.base_path,'/','Staging /creator/ asset path forbidden');
 assert.equal(runtime?.assets?.raw_run_worker_first,true);
 assert.equal(runtime.compatibility_date,'2026-10-17');
 assert.deepEqual(runtime.compatibility_flags,['nodejs_compat']);
 assert.equal(s.settings.compatibility_date,'2026-10-17');
 assert.deepEqual(s.settings.compatibility_flags,['nodejs_compat']);
 const bindings=s.priorVersion.resources?.bindings||[];
 assert.equal(bindings.length,26,'Candidate binding signatures changed');
 assert.equal(plain(bindings).CANONICAL_CREATOR_UPLOADS_ENABLED,'false','Creator publishing uploads must stay disabled');
 assert.equal(plain(bindings).CANONICAL_CREATOR_STUDIO_ENABLED,'true');
 assert.equal(plain(bindings).ANEVUM_LAUNCH_APPROVED,'true');
 assert.equal(plain(bindings).ANEVUM_PRELAUNCH_MODE,'public');
 assert.deepEqual(d1ids(bindings),{
  COMMUNITY_DB:'fa96e36d-6257-4883-bf15-074947e11a13',
  MEMBER_DB:'e1d29049-c83b-4534-8355-dc1fa36ba6d8'
 });
 assert.deepEqual(signatures(s.settings.bindings),signatures(bindings),'Current binding types differ from previous private version');
 assert.ok(s.versions.some(x=>x.id===CORRECTED)&&s.versions.some(x=>x.id===PUBLIC));
 return {bindings,runtime};
}
function checkBuild(){
 const dir=resolve(process.env.V100_COMPILED_ROOT||'creator-v1/dist/web');
 const manifest=JSON.parse(readFileSync(process.env.V100_BUILD_RECORD,'utf8'));
 assert.equal(manifest.release_source,SOURCE);
 assert.equal(manifest.entry,'index.html');
 assert.equal(manifest.asset_base,'/');
 assert.deepEqual(manifest.flags,{
  VITE_IREN_SPATIAL_GUIDE:true,VITE_NATIVE_CREATOR_STUDIO_V095:true,VITE_PACKAGE_CREATOR_GALLERY_V010:true
 });
 assert.equal(manifest.syntheticOnly,true);
 assert.equal(manifest.productionActivated,false);
 assert.equal(manifest.authenticatedAcceptance,false);
 assert.equal(manifest.physicalSafariAcceptance,false);
 const assets=verifyCandidateAssets(dir);
 const root=verifyApexRootAssets(dir);
 assert.equal(root.status,'APEX_ROOT_ASSETS_PASS');
 assert.equal(assets.sha256,manifest.asset_manifest_sha256,'Built asset bytes drifted after QA');
 assert.equal(assets.earned_media_count,152);
 return {dir,manifest,assets};
}
function createConfig(s,dir){
 const c=JSON.parse(readFileSync('creator-v1/wrangler.apex-prelaunch.jsonc','utf8'));
 assert.equal(c.name,WORKER);
 assert.equal(c.account_id,ACCOUNT);
 assert.deepEqual(c.routes,[]);
 assert.equal(c.workers_dev,false);
 assert.equal(c.preview_urls,false);
 assert.equal(c.assets.binding,'ASSETS');
 assert.equal(c.assets.run_worker_first,true);
 assert.equal(c.assets.not_found_handling,'single-page-application');
 assert.deepEqual(Object.fromEntries(c.d1_databases.map(x=>[x.binding,x.database_id])),d1ids(s.priorVersion.resources.bindings));
 c.$schema=resolve('node_modules/wrangler/config-schema.json');
 c.main=resolve('creator-v1/apex-prelaunch/gateway.mjs');
 c.assets.directory=dir;
 c.vars=plain(s.priorVersion.resources.bindings);
 assert.equal(c.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 return c;
}
async function before(){
 requireEnv();
 const build=checkBuild(),s=await snapshot();
 verifyBaseline(s);
 const config=createConfig(s,build.dir);
 const result={
  deployment_id:s.deployment.id,selected:s.deployment.versions,route_lock:routeLock(s.routes),
  global_settings_hash:sha256(stable(operationalSettings(s.settings))),version_ids:s.versions.map(x=>x.id),
  binding_signatures:signatures(s.priorVersion.resources.bindings),
  prior_plain_vars:plain(s.priorVersion.resources.bindings),
  prior_d1_ids:d1ids(s.priorVersion.resources.bindings),
  prior_runtime:s.priorVersion.resources.script_runtime,
  build_manifest:build.manifest,
  asset_count:build.assets.assets.length,asset_manifest_sha256:build.assets.sha256
 };
 writeFileSync(process.env.V100_BEFORE_FILE,JSON.stringify(result)+'\n',{mode:0o600});
 writeFileSync(process.env.V100_WRANGLER_FILE,JSON.stringify(config,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({status:'GUARDED_INACTIVE_PREFLIGHT_PASS',source:SOURCE,assets:result.asset_count,
  earned:152,publicPercent:100,previousQaPercent:0,productionAuthorization:false}));
}
async function after(){
 requireEnv();
 const prior=JSON.parse(readFileSync(process.env.V100_BEFORE_FILE,'utf8'));
 const build=checkBuild(),s=await snapshot();
 verifyBaseline(s);
 assert.equal(stable(s.deployment.versions),stable(prior.selected),'Traffic changed during upload');
 assert.equal(s.deployment.id,prior.deployment_id,'Active deployment replaced');
 assert.equal(routeLock(s.routes),prior.route_lock,'Existing 40 routes changed');
 assert.equal(sha256(stable(operationalSettings(s.settings))),prior.global_settings_hash,'Operational Worker settings changed');
 assert.equal(build.assets.sha256,prior.asset_manifest_sha256,'Post-upload assets differ');
 const introduced=s.versions.filter(x=>!prior.version_ids.includes(x.id));
 assert.equal(introduced.length,1,'Exactly one new inactive Worker version required');
 const id=introduced[0].id;
 const candidate=await get(ROOT+'/versions/'+id);
 assert.equal(candidate.id,id);
 assert.deepEqual(signatures(candidate.resources.bindings),prior.binding_signatures,'Secret/binding types drift');
 assert.deepEqual(plain(candidate.resources.bindings),prior.prior_plain_vars,'Public safety flags drift');
 assert.deepEqual(d1ids(candidate.resources.bindings),prior.prior_d1_ids,'D1 identifiers drift');
 assert.deepEqual(candidate.resources.script_runtime,prior.prior_runtime,'Runtime/asset root drift');
 const result={status:'UPLOADED_IMMUTABLE_INACTIVE_ONLY',source_sha:SOURCE,version_id:id,
  public_version:PUBLIC,public_percent:100,old_qa_version:CORRECTED,old_qa_percent:0,
  new_candidate_percent:0,production_deployment_unchanged:true,existing_routes_unchanged:true,
  access_policy_changes:0,secret_values_exposed:false,creator_uploads_enabled:false,
  browser_synthetic_only:true,physical_safari_retetsted:false,authenticated_acceptance:false,
  production_release_approved:false,build_manifest_sha256:build.assets.sha256,
  release_branch:'release/v084-continuance-approved-20261019'};
 writeFileSync(process.env.V100_RECEIPT_FILE,JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({status:result.status,version_id:id,public_traffic:100,new_traffic:0,
  routes_unchanged:true,bindings_unchanged:true,release_approved:false}));
}
/** Read-only independent receipt for the already uploaded + protected
 * merged source. Does not need a prior runner temp snapshot and cannot reupload.
 */
async function auditInactive(){
 requireEnv();
 const next='ed44a70c-2adb-4048-a7a5-82e7a457528d';
 const newEntry='d7bb6c81-30e0-480f-b9a8-2f12f7a69ab5';
 const newLegacy='4699cfd9-d9d0-44f2-b1b2-f56a4627f429';
 const [d,previous,candidate,settings,routes,ex,entry,entryV,legacy,legacyV]=await Promise.all([
  get(ROOT+'/deployments'),get(ROOT+'/versions/'+CORRECTED),
  get(ROOT+'/versions/'+next),get(ROOT+'/settings'),
  get('/zones/'+ZONE+'/workers/routes'),get(ROOT+'/subdomain'),
  get('/accounts/'+ACCOUNT+'/workers/scripts/'+QA_ENTRY+'/deployments'),
  get('/accounts/'+ACCOUNT+'/workers/scripts/'+QA_ENTRY+'/versions/'+newEntry),
  get('/accounts/'+ACCOUNT+'/workers/scripts/anevum-iren-legacy-command-entry-v001/deployments'),
  get('/accounts/'+ACCOUNT+'/workers/scripts/anevum-iren-legacy-command-entry-v001/versions/'+newLegacy)
 ]);
 const versions=d.deployments?.[0]?.versions||[];
 assert.deepEqual(versions,[{version_id:PUBLIC,percentage:100},{version_id:next,percentage:0}],
  'New candidate must remain completely inactive');
 assert.equal(candidate.id,next);
 assert.deepEqual(signatures(candidate.resources?.bindings),signatures(previous.resources?.bindings));
 assert.deepEqual(plain(candidate.resources?.bindings),plain(previous.resources?.bindings));
 assert.deepEqual(d1ids(candidate.resources?.bindings),d1ids(previous.resources?.bindings));
 assert.deepEqual(candidate.resources?.script_runtime,previous.resources?.script_runtime);
 assert.equal(candidate.resources.script_runtime.assets.base_path,'/');
 assert.equal(plain(candidate.resources.bindings).CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.deepEqual(signatures(settings.bindings),signatures(candidate.resources.bindings));
 assert.equal(settings.compatibility_date,'2026-10-17');
 assert.deepEqual(settings.compatibility_flags,['nodejs_compat']);
 assert.equal(ex.enabled,false);
 assert.equal(ex.previews_enabled,false);
 assert.equal(routes.length,40);
 assert.equal(routes.filter(x=>x.pattern==='anevum.com/__enter/v095-v096*'&&x.script===QA_ENTRY).length,1);
 assert.deepEqual(entry.deployments?.[0]?.versions,[{version_id:newEntry,percentage:100}]);
 assert.equal(entryV.id,newEntry);
 const binds=entryV.resources?.bindings||[];
 assert.equal(binds.find(x=>x.name==='QA_CANDIDATE')?.text,next);
 assert.ok(Number(binds.find(x=>x.name==='QA_EXPIRES_AT')?.text)>Date.now()/1000,'Private QA expired');
 assert.deepEqual(binds.filter(x=>x.type==='secret_text').map(x=>x.name).sort(),
  ['ANEVUM_PREVIEW_ALLOWED_EMAILS','QA_ROUTING_TOKEN']);
 assert.deepEqual(legacy.deployments?.[0]?.versions,[
  {version_id:'62692eef-e7fb-479d-88fe-62c5fcaff5f9',percentage:100},
  {version_id:newLegacy,percentage:0}
 ]);
 assert.equal(legacyV.id,newLegacy);
 assert.equal(legacyV.resources?.bindings?.find(x=>x.name==='LEGACY_STAFF')?.service,
  'anevum-iren-apex-staff-v002');
 const output={status:'PROTECTED_CANDIDATE_READBACK_PASS',reviewed_source:SOURCE,
  apex_immutable_version:next,public_percent:100,private_percent:0,
  legacy_immutable_version:newLegacy,legacy_public_percent:100,legacy_private_percent:0,
  protected_entry:newEntry,all_40_routes_preserved:true,d1_and_secret_binding_types_preserved:true,
  creator_uploads_enabled:false,root_base:'/',provider_write_operations:0,
  human_authenticated_acceptance:false,physical_safari_retest:false,production_approved:false};
 console.log(JSON.stringify(output));
}
const cmd=process.argv[2];
if(!['before','after','audit-inactive'].includes(cmd))throw Error('Use before/after/audit-inactive only');
if(cmd==='before')await before();
else if(cmd==='after')await after();
else await auditInactive();
