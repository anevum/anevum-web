/**
 * ANEVUM V095/V096 inactive Worker version upload guard.
 * Only reads Cloudflare; Wrangler handles the optional upload in GitHub Actions.
 * Never creates deployments, modifies routes, enables previews or writes data.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,chmodSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {
 manifest,validateBaseline,validateUploadedCandidate,plainVars,databaseIds,signatures,verifyCandidateAssets
} from './v095-inactive-candidate-gate.mjs';

const PIN='d5af32fd8f04b05e0381f7ac12c59d06c0e836a2';
const ALLOWED_META=[
 'creator-v1/ops/v095-v096-acceptance-entry.mjs',
 'creator-v1/test/v095-v096-acceptance-entry.test.mjs',
 '.github/workflows/v096-public-alpha-qa.yml',
 'creator-v1/operations/staff-transport-v091.json',
 'creator-v1/test/staff-transport-release-v091.test.mjs',
 '.github/workflows/v084-continuance-production.yml',
 '.github/workflows/v091-live-readonly-qa.yml',
 '.github/release-evidence/v091-authenticated.json',
 'creator-v1/ops/v091-release-acceptance.mjs',
 'creator-v1/test/v091-release-acceptance.test.mjs',
 '.github/workflows/v095-v096-inactive-preflight.yml',
 '.github/workflows/v095-v096-inactive-upload.yml',
 '.github/release-approvals/v095-v096-inactive-upload.json',
 'creator-v1/operations/v095-inactive-baseline-20261020.json',
 'creator-v1/ops/v095-inactive-candidate-gate.mjs',
 'creator-v1/ops/v095-v096-cloudflare-ops.mjs',
 'creator-v1/test/v095-inactive-candidate-gate.test.mjs'
];
const CF='https://api.cloudflare.com/client/v4';
const worker='/accounts/'+manifest.account_id+'/workers/scripts/'+manifest.script;
const routePath='/zones/'+manifest.zone_id+'/workers/routes';
function fail(message){throw Error('V095_V096_INACTIVE_UPLOAD_BLOCKED: '+message);}
function git(...args){return execFileSync('git',args,{encoding:'utf8'}).trim();}
function readJson(file){return JSON.parse(readFileSync(file,'utf8'));}
function save(file,value){
 writeFileSync(file,JSON.stringify(value,null,2)+'\n',{mode:0o600});
 chmodSync(file,0o600);
}
function checkRepositorySource(){
 assert.equal(process.env.VITE_PACKAGE_CREATOR_GALLERY_V010,'true','Preserve approved package gallery build');
 assert.equal(process.env.VITE_NATIVE_CREATOR_STUDIO_V095,'false','Native Studio rollout is separately gated');
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,manifest.account_id);
 assert.equal(manifest.source_sha,PIN);
 assert.equal(manifest.release_parent_sha,PIN);
 assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
 const changed=git('diff','--name-only',PIN,'HEAD','--','.').split('\n').filter(Boolean);
 const unexpected=changed.filter(x=>!ALLOWED_META.includes(x));
 if(unexpected.length)fail('Application code differs from reviewed source: '+unexpected.join(', '));
 const production=readFileSync('.github/workflows/v084-continuance-production.yml','utf8');
 assert.ok(production.split(/\r?\n/).some(x=>x.trim()==='node creator-v1/ops/v091-release-acceptance.mjs'));
 assert.ok(!production.includes('node creator-v1/ops/v091-release-acceptance.mjs --source-only'));
 const evidence=readJson('.github/release-evidence/v091-authenticated.json');
 assert.equal(evidence.native_candidate_pending,true);
 assert.equal(evidence.verified_at,null);
 for(const x of ['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity'])
   assert.equal(evidence[x],false,'Do not infer human acceptance from source CI: '+x);
 return {HEAD:process.env.GITHUB_SHA,SOURCE:PIN,changed:changed.sort()};
}
async function request(path){
 const token=process.env.CLOUDFLARE_API_TOKEN;
 if(!token||!/^[-a-zA-Z0-9_.]+$/.test(token))fail('CLOUDFLARE_API_TOKEN missing or malformed');
 const response=await fetch(CF+path,{
  method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
  signal:AbortSignal.timeout(20000)
 });
 if(!response.ok)fail('Cloudflare GET '+path.split('?')[0]+' returned '+response.status);
 const body=await response.json();
 if(body.success!==true)fail('Cloudflare GET '+path.split('?')[0]+' returned unsuccessful');
 return body.result;
}
async function readSnapshot(){
 const [deployments,settings,routes,exposure,live,pilot]=await Promise.all([
  request(worker+'/deployments?per_page=1'),
  request(worker+'/settings'),request(routePath),request(worker+'/subdomain'),
  request(worker+'/versions/'+manifest.live_version.id),
  request(worker+'/versions/'+manifest.prior_inactive_version.id)
 ]);
 return {deployment:deployments.deployments?.[0],settings,routes,exposure,live,pilot};
}
function configForUpload(snapshot){
 const c=readJson('creator-v1/wrangler.apex-prelaunch.jsonc');
 assert.equal(c.name,manifest.script);
 assert.equal(c.account_id,manifest.account_id);
 assert.deepEqual(c.routes,[]);
 assert.equal(c.workers_dev,false);
 assert.equal(c.preview_urls,false);
 assert.equal(c.compatibility_date,manifest.prior_inactive_version.runtime.compatibility_date);
 assert.deepEqual(c.compatibility_flags,manifest.prior_inactive_version.runtime.compatibility_flags);
 assert.deepEqual(Object.fromEntries(c.d1_databases.map(x=>[x.binding,x.database_id])),manifest.database_ids);
 assert.equal(c.assets.binding,'ASSETS');
 assert.equal(c.assets.run_worker_first,true);
 assert.equal(c.assets.not_found_handling,'single-page-application');
 c.$schema=resolve('node_modules/wrangler/config-schema.json');
 c.main=resolve('creator-v1/apex-prelaunch/gateway.mjs');
 c.assets.directory=resolve('creator-v1/dist/web');
 // Checked-in config is a deliberately gated bootstrap. The inactive
 // candidate must inherit the actual public deployment's existing flags.
 const piloted=plainVars(snapshot.pilot.resources.bindings);
 c.vars=piloted;
 assert.equal(c.vars.ANEVUM_PRELAUNCH_MODE,'public');
 assert.equal(c.vars.ANEVUM_LAUNCH_APPROVED,'true');
 assert.equal(c.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 return c;
}
async function before(file,configFile){
 const source=checkRepositorySource();
 const build=verifyCandidateAssets('creator-v1/dist/web');
 const snap=await readSnapshot();
 const result=validateBaseline(snap);
 const versionList=await request(worker+'/versions?per_page=100');
 const existing=versionList.items?.map(x=>x.id);
 if(!Array.isArray(existing)||existing.length<2)fail('Version inventory incomplete');
 assert.ok(existing.includes(manifest.live_version.id));
 assert.ok(existing.includes(manifest.prior_inactive_version.id));
 const cfg=configForUpload(snap);
 save(configFile,cfg);
 save(file,{source,baseline:snap,existing,build});
 console.log('INACTIVE_PREFLIGHT_PASS',JSON.stringify({
  source:PIN,routeCount:result.routeCount,bindings:result.bindings,
  deploymentId:snap.deployment.id,active:snap.deployment.versions[0].version_id,
  traffic:[100,0],previewEnabled:false,productionAuthorization:false
 }));
}
async function after(file,receiptFile){
 const source=checkRepositorySource();
 const previous=readJson(file),beforeSnapshot=previous.baseline;
 assert.equal(previous.source.SOURCE,PIN);
 validateBaseline(beforeSnapshot);
 const current=await readSnapshot();
 const items=(await request(worker+'/versions?per_page=100')).items||[];
 const newVersions=items.filter(x=>!previous.existing.includes(x.id));
 if(newVersions.length!==1)fail('Expected exactly one newly uploaded inactive Worker version, got '+newVersions.length);
 const candidate=await request(worker+'/versions/'+newVersions[0].id);
 const valid=validateUploadedCandidate({
  before:beforeSnapshot,after:current,candidate
 });
 const beforeSettings=beforeSnapshot.settings,afterSettings=current.settings;
 for(const k of ['placement','compatibility_date','compatibility_flags','usage_model','tags','tail_consumers','logpush'])
   assert.deepEqual(afterSettings[k],beforeSettings[k],'Global Worker setting changed: '+k);
 assert.deepEqual(current.deployment.versions,manifest.deployment.versions);
 assert.equal(current.routes.length,39);
 assert.equal(current.exposure.enabled,false);
 assert.equal(current.exposure.previews_enabled,false);
 const receipt={
  status:'UPLOADED_INACTIVE_ONLY',source_sha:PIN,
  workflow_source_sha:source.HEAD,worker:manifest.script,
  version_id:valid.candidateId,
  script_etag:candidate.resources.script.etag,
  build:previous.build,
  route_count:39,
  active_version_id:manifest.live_version.id,
  active_traffic_percent:100,candidate_traffic_percent:0,
  current_deployment_id:current.deployment.id,
  binding_signatures:signatures(candidate.resources.bindings),
  bound_databases:databaseIds(candidate.resources.bindings),
  public_alpha_paths:manifest.v096_public_guest_alpha.paths,
  production_activated:false,authenticated_acceptance:false,
  physical_iphone_tested:false,version_urls_enabled:false
 };
 save(receiptFile,receipt);
 console.log('INACTIVE_UPLOAD_VERIFIED',JSON.stringify({source:PIN,version:valid.candidateId,routeCount:39,productionTrafficChanged:false,unverifiedHumanGates:true}));
}
const [mode,arg1,arg2]=process.argv.slice(2);
if(!['before','after'].includes(mode)||!arg1||!arg2||process.argv.length!==5)
 fail('Usage: node v095-v096-cloudflare-ops.mjs before snapshot.json config.json | after snapshot.json receipt.json');
if(mode==='before')await before(arg1,arg2);
else await after(arg1,arg2);
