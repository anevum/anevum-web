/** One-use inactive upload guard. Provider operations in this module are GET-only. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {baseline,verifyRuntimeSnapshot,verifyFrontend,createOfflineConfig} from './apex-worker-bundle-v112.mjs';

export const SOURCE='bb5893b6890d5a6d3f64412730053b6ca0816b02';
export const ARTIFACT=12466999553;
export const RUN=39874021110;
export const DIGEST='adfc23af088ebf9b9a3996a4de3fb11cc3261cb5c424cb8de55325ede7876f60';
export const PACKAGE_HASH='4e77b5008e7650e92c9360761a429990bae1194c381b5526cbe90b825c3789e8';
export const BUNDLE_HASH='1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99';
export const BRANCH='ops/platform-inactive-v113-20261022-001';
export const MESSAGE='release(v113): upload exact inactive apex only';
export const UPLOAD_MESSAGE='V113 inactive only; source '+SOURCE+'; bundle '+BUNDLE_HASH;
const REPO='anevum/anevum-web';
const ACCOUNT=baseline.accountId;
const ROOT='/accounts/'+ACCOUNT+'/workers/scripts/'+baseline.worker;
const hash=b=>createHash('sha256').update(b).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const write=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{mode:0o600});
const plain=bs=>Object.fromEntries(bs.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
const signature=bs=>bs.map(({name,type})=>({name,type})).sort((a,b)=>a.name.localeCompare(b.name));
const stripScript=v=>({id:v.id,resources:Object.fromEntries(Object.entries(v.resources).filter(([k])=>k!=='script'))});

export function verifyPackage(root){
 const path=join(root,'package-manifest.json'),m=load(path);
 assert.equal(hash(readFileSync(path)),PACKAGE_HASH,'Package manifest is not the approved V112 artifact');
 assert.equal(m.sourceSha,SOURCE);assert.equal(m.status,'COMPLETE_OFFLINE_WORKER_PACKAGE');
 assert.equal(m.workerBundleVerified,true);
 for(const key of ['uploadedToCloudflare','publicTrafficChanged','databaseModified','productionReleaseApproved','authenticatedAcceptance','physicalSafariAcceptance','secretValuesIncluded'])assert.equal(m[key],false);
 assert.equal(m.nativeAuthPinRemediated,false);assert.equal(m.stagingPublishingReconciled,false);
 assert.equal(m.assetCount,395);assert.equal(m.earnedMediaCount,152);
 const frontend=load(join(root,'frontend-manifest.json'));
 assert.equal(hash(readFileSync(join(root,'frontend-manifest.json'))),m.frontendManifestSha256);
 assert.equal(verifyFrontend(join(root,'compiled-web'),frontend).sha256,m.assetManifestSha256);
 assert.equal(hash(readFileSync(join(root,'wrangler.offline.json'))),m.offlineConfigSha256);
 const files=[];
 function visit(dir,rel=''){for(const name of readdirSync(dir)){
  const path=join(dir,name),relative=rel?rel+'/'+name:name,st=lstatSync(path);
  assert.ok(!st.isSymbolicLink(),'Bundle symlink');
  if(st.isDirectory())visit(path,relative);else{assert.ok(st.isFile());const b=readFileSync(path);files.push({path:relative,bytes:b.length,sha256:hash(b)});}
 }}
 visit(join(root,'worker-bundle'));
 assert.deepEqual(files.sort((a,b)=>a.path.localeCompare(b.path)),m.bundleFiles,'Worker module inventory changed');
 assert.equal(hash(readFileSync(join(root,'worker-bundle/gateway.js'))),BUNDLE_HASH);
 return m;
}

export function uploadConfig(root){
 verifyPackage(root);
 const c=createOfflineConfig(baseline,resolve('.'),resolve(root,'compiled-web'));
 c.main=resolve(root,'worker-bundle/gateway.js');c.no_bundle=true;
 return c;
}

export function verifyBefore(s){
 verifyRuntimeSnapshot({...s,publicVersion:stripScript(s.publicVersion),candidateVersion:stripScript(s.candidateVersion)});
 assert.ok(s.versions.some(x=>x.id===baseline.publicVersion.id));
 assert.ok(s.versions.some(x=>x.id===baseline.candidateVersion.id));
 assert.equal(s.versions.length,new Set(s.versions.map(x=>x.id)).size);
 assert.ok(s.versions.every(x=>typeof x.id==='string'&&/^[a-f0-9-]{36}$/.test(x.id)));
 return {deployment:s.deployment,settingsHash:hash(stable(Object.fromEntries(Object.entries(s.settings).filter(([k])=>k!=='annotations')))),routeHash:hash(stable(s.routes.map(({pattern,script,request_limit_fail_open})=>({pattern,script,request_limit_fail_open})).sort((a,b)=>a.pattern.localeCompare(b.pattern)))),versionIds:s.versions.map(x=>x.id),exposure:s.exposure};
}

export function verifyAfter(before,s,candidate){
 const after=verifyBefore(s);
 assert.deepEqual(after.deployment,before.deployment,'Upload changed active deployment');
 assert.equal(after.settingsHash,before.settingsHash,'Upload changed operational settings');
 assert.equal(after.routeHash,before.routeHash,'Upload changed routes');
 assert.deepEqual(after.exposure,before.exposure);
 const added=s.versions.filter(x=>!before.versionIds.includes(x.id));
 assert.equal(added.length,1,'Expected exactly one new immutable version');
 assert.equal(candidate.id,added[0].id);
 assert.ok(!s.deployment.versions.some(x=>x.version_id===candidate.id),'New version must not be deployed');
 assert.equal(candidate.annotations?.['workers/message'],UPLOAD_MESSAGE);
 const r=candidate.resources,expected=baseline.candidateVersion.resources;
 assert.deepEqual(signature(r.bindings),signature(expected.bindings),'Binding/secret signatures changed');
 assert.deepEqual(plain(r.bindings),plain(expected.bindings),'Candidate flags changed');
 const databases=bs=>Object.fromEntries(bs.filter(x=>x.type==='d1').map(x=>[x.name,x.database_id]));
 assert.deepEqual(databases(r.bindings),databases(expected.bindings));
 assert.deepEqual(r.script_runtime,expected.script_runtime);
 assert.match(r.script.etag,/^[a-f0-9]{64}$/);
 assert.notEqual(r.script.etag,s.candidateVersion.resources.script.etag,'Candidate server bundle unchanged from older version');
 return {status:'IMMUTABLE_INACTIVE_APEX_UPLOADED',sourceSha:SOURCE,artifact:ARTIFACT,run:RUN,
  versionId:candidate.id,scriptEtag:r.script.etag,bundleSha256:BUNDLE_HASH,
  deploymentUnchanged:true,publicPercent:100,newVersionInDeployment:false,newVersionTrafficPercent:0,
  routesUnchanged:true,operationalSettingsUnchanged:true,bindingSignaturesPreserved:true,
  secretValuesRetrieved:false,secretSignaturesPreserved:true,creatorUploadsEnabled:false,
  nativeAuthPinRemediated:false,protectedRoutingActivated:false,stagingPublishingReconciled:false,
  authenticatedAcceptance:false,physicalSafariAcceptance:false,productionReleaseApproved:false};
}

async function get(path,github=false){
 const response=await fetch((github?'https://api.github.com':'https://api.cloudflare.com/client/v4')+path,{
  method:'GET',headers:{authorization:'Bearer '+(github?process.env.GH_TOKEN:process.env.CLOUDFLARE_API_TOKEN),accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
 assert.equal(response.ok,true,'Read-only provider request failed HTTP '+response.status);
 const j=await response.json();if(github)return j;
 assert.equal(j.success,true);return j.result;
}
async function snapshot(){
 const [deploy,settings,publicVersion,candidateVersion,exposure,routes,versions]=await Promise.all([
  get(ROOT+'/deployments'),get(ROOT+'/settings'),get(ROOT+'/versions/'+baseline.publicVersion.id),
  get(ROOT+'/versions/'+baseline.candidateVersion.id),get(ROOT+'/subdomain'),
  get('/zones/8abe27259b5436af5966d3b40d9a3760/workers/routes'),get(ROOT+'/versions?per_page=100')
 ]);
 return {accountId:ACCOUNT,worker:baseline.worker,deployment:deploy.deployments[0],settings,publicVersion,candidateVersion,exposure,routes,versions:versions.items};
}
function marker(){
 assert.equal(process.env.GITHUB_REPOSITORY,REPO);assert.equal(process.env.GITHUB_ACTOR,'anevum');
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+BRANCH);assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15);assert.ok(process.env.GH_TOKEN?.length>15);
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
 assert.equal(git('log','-1','--format=%B'),MESSAGE);
 const markerPath='.github/release-approvals/v113-inactive-upload.json';
 assert.equal(git('diff-tree','--no-commit-id','--name-only','-r','HEAD'),markerPath);
 const m=load(markerPath);
 assert.equal(m.reviewed_operations_sha,git('rev-parse','HEAD^'));
 assert.deepEqual(m,{reviewed_operations_sha:m.reviewed_operations_sha,package_source:SOURCE,artifact:ARTIFACT,worker:baseline.worker,
  inactive_upload_only:true,public_promotion:false,route_changes:false,access_changes:false,database_writes:false});
 const allowed=new Set(['.github/workflows/v113-apex-inactive-upload.yml','creator-v1/ops/apex-inactive-upload-v113.mjs','creator-v1/test/apex-inactive-upload-v113.test.mjs','docs/production/v113-inactive-apex-upload-20261022.md']);
 assert.ok(git('diff','--name-only',SOURCE,'HEAD^').split('\n').filter(Boolean).every(x=>allowed.has(x)),'Unreviewed source changes');
 return m.reviewed_operations_sha;
}
async function requireCi(ops){
 const [artifact,run,checks,release]=await Promise.all([
  get('/repos/'+REPO+'/actions/artifacts/'+ARTIFACT,true),get('/repos/'+REPO+'/actions/runs/'+RUN,true),
  get('/repos/'+REPO+'/commits/'+ops+'/check-runs?per_page=100',true),
  get('/repos/'+REPO+'/git/ref/heads/release/v084-continuance-approved-20261019',true)
 ]);
 assert.equal(artifact.digest,'sha256:'+DIGEST);assert.equal(artifact.expired,false);
 assert.equal(artifact.workflow_run.head_sha,SOURCE);
 assert.equal(run.head_sha,SOURCE);assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 for(const name of ['verify-inactive','verify','verified-source','staff-contract','emblem-and-reputation','source']){
  const c=checks.check_runs.find(x=>x.name===name);assert.equal(c?.status,'completed','Missing exact-source CI: '+name);assert.equal(c.conclusion,'success','Failed exact-source CI: '+name);
 }
 execFileSync('git',['merge-base','--is-ancestor',SOURCE,release.object.sha]);
 execFileSync('git',['merge-base','--is-ancestor',ops,release.object.sha]);
}
async function before(root,state,config){
 const ops=marker();await requireCi(ops);verifyPackage(root);
 const s=await snapshot(),record=verifyBefore(s);
 write(state,{...record,operationsSha:ops,packageHash:PACKAGE_HASH});write(config,uploadConfig(root));
 console.log(JSON.stringify({status:'EXACT_BUNDLE_INACTIVE_PREFLIGHT_PASS',assets:395,earnedMedia:152,publicPercent:100,uploadOnly:true}));
}
async function after(root,state,receipt){
 const ops=marker(),prior=load(state);assert.equal(prior.operationsSha,ops);assert.equal(prior.packageHash,PACKAGE_HASH);
 verifyPackage(root);const s=await snapshot();
 const added=s.versions.filter(x=>!prior.versionIds.includes(x.id));assert.equal(added.length,1);
 const candidate=await get(ROOT+'/versions/'+added[0].id);
 const result=verifyAfter(prior,s,candidate);write(receipt,result);console.log(JSON.stringify(result));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [cmd,...args]=process.argv.slice(2);
 if(cmd==='config'&&args.length===2){write(args[1],uploadConfig(resolve(args[0])));console.log('EXACT_PRECOMPILED_UPLOAD_CONFIG=PASS; NO_PROVIDER_CALLS');}
 else if(cmd==='before'&&args.length===3)await before(...args);
 else if(cmd==='after'&&args.length===3)await after(...args);
 else throw Error('Use config <package> <config>, before <package> <state> <config>, after <package> <state> <receipt>');
}
