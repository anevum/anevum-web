/**
 * ANEVUM.ANEVUM.UPDATE.2026-10-22.001.PLATFORM-COMPLETION
 * One-use release guard for a new immutable, INACTIVE apex root asset version.
 * The only writer is Wrangler versions upload; this module is GET-only on
 * Cloudflare both before and after that operation. No deployment, route or
 * database writes, and no production/Access authorization is implied.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {verifyCandidateAssets} from './v095-inactive-candidate-gate.mjs';
import {verifyApexRootAssets} from '../test/v100-apex-root-assets.test.mjs';

const REPO='anevum/anevum-web';
const SOURCE='7630a8b2fef77571862a51417499021d4c162bd2';
const ACCOUNT='2f7ee83107240152097efd956a4e8335';
const ZONE='8abe27259b5436af5966d3b40d9a3760';
const WORKER='anevum-apex-prelaunch-gateway';
const PUBLIC='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
const CORRECTED='7b9dbcdf-0fbd-4cbc-8e98-184724324553';
const BASELINE_DEPLOYMENT='a63cfbf0-2217-40c8-b6a9-17e026453094';
const QA_ENTRY='anevum-v095-v096-acceptance-entry';
const QA_ENTRY_VERSION='27befdc9-5238-40e7-b9de-3c2acd542309';
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
 assert.equal(process.env.GITHUB_REF,'refs/heads/ops/platform-candidate-20261022-001');
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
export function verifyBaseline(s){
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
export function createConfig(s,dir){
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
 c.vars={...plain(s.priorVersion.resources.bindings),CANONICAL_XP_TEST_ENABLED:'false'};
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
  candidate_plain_vars:config.vars,
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
 assert.deepEqual(plain(candidate.resources.bindings),prior.candidate_plain_vars,'Public safety flags drift');
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

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const cmd=process.argv[2];
 if(!['before','after'].includes(cmd))throw Error('Use before/after only');
 if(cmd==='before')await before();else await after();
}
