/** Approved V003 pilot preparation. Uploads one inactive apex version only.
 * No deployment, route, schedule, database or acceptance-record write exists here.
 * Secret material stays in a private temporary directory and never enters evidence.
 */
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {verifyV091GitSourceScope} from './v091-release-acceptance.mjs';

export const PILOT=Object.freeze({
 account:'2f7ee83107240152097efd956a4e8335',zone:'8abe27259b5436af5966d3b40d9a3760',
 worker:'anevum-apex-prelaunch-gateway',baseline:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',
 branch:'refs/heads/build/v010-creator-wall-package-link-20261019-001',
 workflow:'ANEVUM V091 Controlled Pilot Version Upload',
 proofFlag:'CANONICAL_PACKAGE_PROOF_ENABLED',proofSecret:'CANONICAL_PACKAGE_PROOF_KEY'
});
const SECRET_NAMES=['ANEVUM_PREVIEW_ALLOWED_EMAILS','CANONICAL_BETTER_AUTH_SECRET','CANONICAL_PROTECTED_EMAILS','CANONICAL_RESEND_API_KEY'];
const DATABASES={COMMUNITY_DB:'fa96e36d-6257-4883-bf15-074947e11a13',MEMBER_DB:'e1d29049-c83b-4534-8355-dc1fa36ba6d8'};
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const sha=x=>createHash('sha256').update(x).digest('hex');
const sorted=x=>[...x].sort((a,b)=>a.name.localeCompare(b.name));
export function bindingLock(bindings){
 assert.ok(Array.isArray(bindings),'Missing Worker bindings');
 assert.equal(new Set(bindings.map(b=>b.name)).size,bindings.length,'Duplicate Worker binding');
 return stable(sorted(bindings.map(b=>b.type==='d1'?{name:b.name,type:b.type,database_id:b.database_id||b.id}:b)));
}
export const routeLock=routes=>stable(routes.map(({pattern,script,request_limit_fail_open})=>({pattern,script,request_limit_fail_open})).sort((a,b)=>a.pattern.localeCompare(b.pattern)));
const exposureLock=x=>stable({enabled:x.enabled,previews_enabled:x.previews_enabled});
const nonVersionedLock=x=>stable(Object.fromEntries(['placement','usage_model','tags','tail_consumers','logpush','observability'].filter(k=>k in x).map(k=>[k,x[k]])));
export function requirePilotContext(context){
 assert.equal(context.GITHUB_REPOSITORY,'anevum/anevum-web','Unexpected repository');
 assert.equal(context.GITHUB_REF,PILOT.branch,'Unexpected pilot branch');
 assert.equal(context.GITHUB_WORKFLOW,PILOT.workflow,'Unexpected upload workflow');
 assert.equal(context.GITHUB_EVENT_NAME,'push','Pilot upload requires the reviewed branch push');
 assert.equal(context.CLOUDFLARE_ACCOUNT_ID,PILOT.account,'Unexpected Cloudflare account');
 assert.equal(context.VITE_PACKAGE_CREATOR_GALLERY_V010,'true','Pilot build must enable the package gallery');
 assert.match(context.GITHUB_SHA||'',/^[a-f0-9]{40}$/,'Missing exact source SHA');
}
function activeVersion(deployment){
 const versions=deployment?.deployments?.[0]?.versions;
 assert.equal(versions?.length,1,'Apex must have one active version');
 assert.equal(versions[0].percentage,100,'Apex must remain at 100% baseline');
 return versions[0].version_id;
}
export function assertBaseline(snapshot,reviewedRoutes){
 assert.equal(activeVersion(snapshot.deployment),PILOT.baseline,'Apex active baseline changed');
 assert.equal(snapshot.latest.items?.[0]?.id,PILOT.baseline,'Inactive upload or secret drift must be reviewed');
 assert.equal(snapshot.active.id,PILOT.baseline);
 const bindings=snapshot.active.resources?.bindings;
 assert.equal(bindings?.length,24,'Expected exactly 24 baseline bindings');
 assert.equal(bindingLock(bindings),bindingLock(snapshot.settings.bindings),'Latest settings differ from active version');
 assert.equal(bindings.filter(b=>b.type==='assets'&&b.name==='ASSETS').length,1);
 assert.deepEqual(bindings.filter(b=>b.type==='secret_text').map(b=>b.name).sort(),SECRET_NAMES);
 assert.deepEqual(Object.fromEntries(bindings.filter(b=>b.type==='d1').map(b=>[b.name,b.database_id||b.id])),DATABASES);
 assert.ok(bindings.every(b=>['plain_text','secret_text','assets','d1'].includes(b.type)),'Unexpected binding type');
 const vars=Object.fromEntries(bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 for(const key of ['ANEVUM_CANONICAL_APEX_ENABLED','ANEVUM_LAUNCH_APPROVED','CANONICAL_SCHEMA_APPROVED','CANONICAL_EMAIL_ENABLED','CANONICAL_RECOGNITION_ENABLED'])assert.equal(vars[key],'true',key);
 assert.equal(vars.ANEVUM_PRELAUNCH_MODE,'public');
 assert.equal(vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.notEqual(vars.CANONICAL_VERIFIED_ROLES_ENABLED,'true');
 assert.notEqual(vars.CANONICAL_REPUTATION_ENABLED,'true');
 assert.ok(!bindings.some(b=>[PILOT.proofFlag,PILOT.proofSecret].includes(b.name)),'Proof binding already exists; do not rotate it');
 assert.equal(snapshot.routes.length,38);
 assert.equal(routeLock(snapshot.routes),routeLock(reviewedRoutes),'Reviewed route inventory changed');
 assert.equal(snapshot.exposure.enabled,false,'workers.dev must stay disabled');
 assert.equal(snapshot.exposure.previews_enabled,false,'Version URLs must stay disabled');
 const runtime=snapshot.active.resources.script_runtime;
 assert.equal(runtime.compatibility_date,'2026-10-17');
 assert.deepEqual(runtime.compatibility_flags,['nodejs_compat']);
 assert.equal(runtime.usage_model,'standard');
 assert.equal(runtime.assets?.not_found_handling,'single-page-application');
 assert.equal(runtime.assets?.raw_run_worker_first,true);
 assert.equal(runtime.assets?.serve_directly,false);
 return vars;
}
export function pilotConfig(base,snapshot,root=ROOT){
 assert.equal(base.name,PILOT.worker);
 assert.equal(base.account_id,PILOT.account);
 assert.deepEqual(base.routes,[]);
 assert.equal(base.workers_dev,false);assert.equal(base.preview_urls,false);
 assert.equal(base.assets?.binding,'ASSETS');assert.equal(base.assets?.run_worker_first,true);
 assert.equal(base.assets?.not_found_handling,'single-page-application');
 assert.deepEqual(Object.fromEntries(base.d1_databases.map(b=>[b.binding,b.database_id])),DATABASES);
 const config=structuredClone(base);
 config.main=resolve(root,'creator-v1/apex-prelaunch/gateway.mjs');
 config.assets.directory=resolve(root,'creator-v1/dist/web');
 config.vars=Object.fromEntries(snapshot.active.resources.bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 config.vars[PILOT.proofFlag]='true';
 config.compatibility_date=snapshot.active.resources.script_runtime.compatibility_date;
 config.compatibility_flags=snapshot.active.resources.script_runtime.compatibility_flags;
 config.send_metrics=false;
 config.upload_source_maps=false;
 return config;
}
export function assertCandidate(candidate,before,source){
 assert.match(candidate.id||'',/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
 assert.notEqual(candidate.id,PILOT.baseline);
 const expected=[...before.active.resources.bindings,
  {name:PILOT.proofFlag,type:'plain_text',text:'true'},
  {name:PILOT.proofSecret,type:'secret_text'}];
 assert.equal(candidate.resources?.bindings?.length,26);
 assert.equal(bindingLock(candidate.resources.bindings),bindingLock(expected),'Candidate binding or variable drift');
 assert.equal(stable(candidate.resources.script_runtime),stable(before.active.resources.script_runtime),'Candidate runtime/assets policy drift');
 assert.equal(candidate.annotations?.['workers/tag'],'v091-pilot-'+source.applicationSource.slice(0,12));
 assert.equal(candidate.annotations?.['workers/message'],'Controlled pilot upload from '+source.releaseSource+'; no traffic activation');
}
export function pilotUploadArguments(config,secret,source){
 return ['versions','upload','--config',config,'--keep-vars','--secrets-file',secret,
  '--tag','v091-pilot-'+source.applicationSource.slice(0,12),
  '--message','Controlled pilot upload from '+source.releaseSource+'; no traffic activation'];
}
export function uploadedVersion(output){
 const entries=output.trim().split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)).filter(x=>x.type==='version-upload');
 assert.equal(entries.length,1,'Expected one structured version-upload result');
 assert.equal(entries[0].worker_name,PILOT.worker);
 assert.match(entries[0].version_id||'',/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
 return entries[0].version_id;
}
async function snapshot(api){
 const base='/accounts/'+PILOT.account+'/workers/scripts/'+PILOT.worker;
 const keys=['deployment','latest','active','settings','routes','exposure'];
 const paths=[base+'/deployments',base+'/versions?per_page=1',base+'/versions/'+PILOT.baseline,base+'/settings','/zones/'+PILOT.zone+'/workers/routes',base+'/subdomain'];
 const results=await Promise.allSettled(paths.map(path=>api(path)));
 for(const result of results)if(result.status==='rejected')throw result.reason;
 return Object.fromEntries(keys.map((key,i)=>[key,results[i].value]));
}
function unchangedProduction(after,before){
 assert.equal(activeVersion(after.deployment),PILOT.baseline,'Upload unexpectedly changed active traffic');
 assert.equal(stable(after.deployment),stable(before.deployment),'Deployment changed while uploading');
 assert.equal(routeLock(after.routes),routeLock(before.routes),'Routes changed while uploading');
 assert.equal(exposureLock(after.exposure),exposureLock(before.exposure),'Worker public exposure changed');
 assert.equal(bindingLock(after.active.resources.bindings),bindingLock(before.active.resources.bindings));
 assert.equal(nonVersionedLock(after.settings),nonVersionedLock(before.settings),'Non-versioned settings changed');
}
/** api accepts a GET path only. runWrangler receives a fixed upload command. */
export async function uploadPilot({api,runWrangler,source,reviewedRoutes,baseConfig,root=ROOT,temporaryRoot=tmpdir()}){
 const before=await snapshot(api);assertBaseline(before,reviewedRoutes);
 const privateDir=mkdtempSync(join(temporaryRoot,'anevum-v091-pilot-'));
 const secretFile=join(privateDir,'secrets.json'),configFile=join(privateDir,'wrangler.json'),outputFile=join(privateDir,'version.jsonl');
 let uploadAttempted=false;
 try{
  writeFileSync(configFile,JSON.stringify(pilotConfig(baseConfig,before,root)),{mode:0o600,flag:'wx'});
  writeFileSync(secretFile,JSON.stringify({[PILOT.proofSecret]:randomBytes(64).toString('base64url')}),{mode:0o600,flag:'wx'});
  const immediate=await snapshot(api);assertBaseline(immediate,reviewedRoutes);
  assert.equal(stable(immediate),stable(before),'Production changed before version upload');
  uploadAttempted=true;
  const result=runWrangler(pilotUploadArguments(configFile,secretFile,source),outputFile);
  // Capture outcome without trusting stdout, which is intentionally not published.
  const candidateId=uploadedVersion(readFileSync(outputFile,'utf8'));
  const candidate=await api('/accounts/'+PILOT.account+'/workers/scripts/'+PILOT.worker+'/versions/'+candidateId);
  assertCandidate(candidate,before,source);
  const after=await snapshot(api);unchangedProduction(after,before);
  assert.equal(after.latest.items?.[0]?.id,candidateId,'Another upload replaced the prepared candidate');
  assert.equal(bindingLock(after.settings.bindings),bindingLock(candidate.resources.bindings));
  assert.equal(result.status,0,'Wrangler upload did not complete successfully');
  return {status:'UPLOADED_INACTIVE',authenticatedAcceptance:'PENDING',
   applicationSource:source.applicationSource,releaseSource:source.releaseSource,sourceTree:source.sourceTree,
   worker:PILOT.worker,candidateVersion:candidateId,activeVersion:PILOT.baseline,activePercentage:100,
   routeCount:after.routes.length,routeSha256:sha(routeLock(after.routes)),
   baselineBindingSha256:sha(bindingLock(before.active.resources.bindings)),candidateBindingSha256:sha(bindingLock(candidate.resources.bindings)),
   candidateBindingCount:26,addedBindings:[PILOT.proofFlag,PILOT.proofSecret],
   galleryBuildEnabled:true,proofIssuerEnabledOnCandidate:true,publicRolesEnabled:false,reputationEnabled:false,
   runtime:candidate.resources.script_runtime,scriptEtag:candidate.resources.script.etag,
   uploadedAt:new Date().toISOString()};
 }catch(error){
  // A client failure can happen after the server accepts the inactive version.
  // Read production again; never retry automatically or rotate the new secret.
  if(uploadAttempted)unchangedProduction(await snapshot(api),before);
  throw error;
 }finally{rmSync(privateDir,{recursive:true,force:true});}
}
function buildManifest(root){
 const directory=join(root,'creator-v1/dist/web'),files=[];
 const visit=(dir,prefix='')=>{for(const item of readdirSync(dir,{withFileTypes:true})){
  const path=join(dir,item.name),name=prefix+item.name;
  if(item.isDirectory())visit(path,name+'/');
  else{assert.ok(item.isFile(),'Non-regular build asset');const content=readFileSync(path);files.push({path:name,bytes:content.length,sha256:sha(content)});}
 }};visit(directory);files.sort((a,b)=>a.path.localeCompare(b.path));
 assert.equal(files.filter(f=>f.path.startsWith('evolution/assets/')).length,152,'Preserved Evolution asset count changed');
 const index=readFileSync(join(directory,'index.html'),'utf8');
 const bundle=index.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
 assert.ok(bundle,'Missing production bundle');
 assert.ok(readFileSync(join(directory,bundle),'utf8').includes('/upload/v3/api/v1/packages/projects'),'Gallery-on code absent from production bundle');
 return {galleryBuildEnabled:true,indexSha256:sha(index),bundle,assets:files};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 assert.deepEqual(process.argv.slice(2),['--upload'],'Only the explicit --upload action is available');
 requirePilotContext(process.env);
 const token=process.env.CLOUDFLARE_API_TOKEN;assert.ok(token,'Missing Cloudflare credential');
 const git=args=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
 assert.equal(git(['rev-parse','HEAD']),process.env.GITHUB_SHA);
 const scope=verifyV091GitSourceScope();
 const source={applicationSource:scope.applicationSource,releaseSource:process.env.GITHUB_SHA,sourceTree:git(['rev-parse','HEAD^{tree}'])};
 const manifest=buildManifest(ROOT);
 const wranglerVersion=JSON.parse(readFileSync(join(ROOT,'node_modules/wrangler/package.json'),'utf8')).version;
 assert.equal(wranglerVersion,'4.135.0','Reviewed strict-inheritance Wrangler version is required');
 const evidence=join(ROOT,'evidence/v091-pilot');mkdirSync(evidence,{recursive:true});
 writeFileSync(join(evidence,'build-manifest.json'),JSON.stringify({...source,node:process.version,wrangler:wranglerVersion,...manifest},null,2)+'\n');
 const api=async path=>{
  const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method:'GET',headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Cloudflare read failed: '+path+' HTTP '+response.status);
  const data=await response.json();if(data.success!==true)throw Error('Cloudflare read rejected: '+path);return data.result;
 };
 const result=await uploadPilot({api,source,reviewedRoutes:JSON.parse(readFileSync(join(ROOT,'creator-v1/operations/staff-transport-v091.json'),'utf8')).routes,
  baseConfig:JSON.parse(readFileSync(join(ROOT,'creator-v1/wrangler.apex-prelaunch.jsonc'),'utf8')),root:ROOT,temporaryRoot:process.env.RUNNER_TEMP||tmpdir(),
  runWrangler:(args,output)=>{
   const result=spawnSync(process.execPath,[join(ROOT,'node_modules/wrangler/bin/wrangler.js'),...args],{cwd:ROOT,encoding:'utf8',timeout:300000,maxBuffer:4*1024*1024,
    env:{...process.env,WRANGLER_OUTPUT_FILE_PATH:output,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG:'error'},stdio:['ignore','pipe','pipe']});
   // Never publish captured Wrangler output: a future CLI error may echo input.
   if(result.error)throw Error('Wrangler version upload could not complete: '+(result.error.code||'process error'));
   if(result.status!==0)throw Error('Wrangler version upload exited '+result.status+'; inspect the latest version before retrying');
   return {status:result.status};
  }});
 writeFileSync(join(evidence,'candidate-version.json'),JSON.stringify(result,null,2)+'\n');
 console.log('V091_PILOT_VERSION_UPLOADED_INACTIVE='+result.candidateVersion);
 console.log('V091_ORDINARY_TRAFFIC_UNCHANGED='+result.activeVersion);
}
