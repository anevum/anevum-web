/**
 * V118: upload the exact V117 V116 package as one *inactive* immutable Worker
 * version. No deployment, routing, user data, membership or D1 writes.
 *
 * The only provider mutation is Wrangler's "versions upload" inside the
 * separately authorized marker job. This module uses GET requests exclusively.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {baseline,verifyRuntimeSnapshot,verifyFrontend,createOfflineConfig} from './apex-worker-bundle-v117.mjs';

export const REPO='anevum/anevum-web';
export const BASE='356112a94575c988c28efcd9ab083277c3838b80';
export const ARTIFACT=12474282482;
export const RUN=39889939571;
export const BRANCH='ops/v119-v116-inactive-upload-reconciliation-20261023-001';
export const MESSAGE='release(v119): reconcile API-origin V116 Worker immutable inactive only';
export const UPLOAD_MESSAGE='V118 V116 immutable inactive; frontend a3c94b3ebdc6103347e76f8a5234904978da67e3; package 356112a94575c988c28efcd9ab083277c3838b80; no deployment';
const ACCOUNT='2f7ee83107240152097efd956a4e8335';
const ROOT='/accounts/'+ACCOUNT+'/workers/scripts/anevum-apex-prelaunch-gateway';
const ZONE='8abe27259b5436af5966d3b40d9a3760';
const PUBLIC='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
const PRIVATE='86dc4b9d-4020-432a-8a15-e65606f31316';
const SHA256='1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99';
const hash=b=>createHash('sha256').update(b).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,value)=>writeFileSync(p,JSON.stringify(value,null,2)+'\n',{mode:0o600});
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const strip=v=>({...v,resources:Object.fromEntries(Object.entries(v.resources).filter(([k])=>k!=='script'))});
const signature=bs=>bs.map(x=>({name:x.name,type:x.type})).sort((a,b)=>a.name.localeCompare(b.name));
const plain=bs=>Object.fromEntries(bs.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
const d1=bs=>Object.fromEntries(bs.filter(x=>x.type==='d1').map(x=>[x.name,x.database_id]));
const operational=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='annotations'));
const versionSort=xs=>xs.map(x=>x.id).sort();

export function verifyPackage(dir){
 const root=resolve(dir),p=load(join(root,'package-manifest.json'));
 assert.equal(p.status,'COMPLETE_OFFLINE_WORKER_PACKAGE');
 assert.equal(p.sourceSha,BASE);assert.equal(p.frontendSourceSha,'a3c94b3ebdc6103347e76f8a5234904978da67e3');
 assert.equal(p.frontendRun,39887377952);assert.equal(p.frontendArtifact,12472563668);
 assert.equal(p.assetCount,395);assert.equal(p.earnedMediaCount,152);
 assert.equal(p.worker,'anevum-apex-prelaunch-gateway');
 assert.equal(p.workerBundleVerified,true);
 assert.equal(p.uploadedToCloudflare,false);assert.equal(p.publicTrafficChanged,false);
 assert.equal(p.authenticatedAcceptance,false);assert.equal(p.physicalSafariAcceptance,false);
 assert.equal(p.productionReleaseApproved,false);
 assert.equal(p.nativeAuthPinRemediated,false);assert.equal(p.stagingPublishingReconciled,false);
 assert.equal(p.secretValuesIncluded,false);
 const frontend=load(join(root,'frontend-manifest.json'));
 assert.equal(hash(readFileSync(join(root,'frontend-manifest.json'))),p.frontendManifestSha256);
 assert.equal(verifyFrontend(join(root,'compiled-web'),frontend).sha256,p.assetManifestSha256);
 assert.equal(hash(readFileSync(join(root,'wrangler.offline.json'))),p.offlineConfigSha256);
 const file=readFileSync(join(root,'worker-bundle/gateway.js'));
 assert.equal(hash(file),SHA256);
 assert.deepEqual(p.bundleFiles.find(x=>x.path==='gateway.js'),{path:'gateway.js',bytes:file.length,sha256:SHA256});
 const files=[];
 function visit(d,r=''){for(const name of readdirSync(d)){
   const full=join(d,name),rel=r?r+'/'+name:name,s=lstatSync(full);
   assert.equal(s.isSymbolicLink(),false,'Symlink in bundle');
   if(s.isDirectory())visit(full,rel);
   else {assert.equal(s.isFile(),true);const bytes=readFileSync(full);files.push({path:rel,bytes:bytes.length,sha256:hash(bytes)});}
 }}
 visit(join(root,'worker-bundle'));
 assert.deepEqual(files.sort((a,b)=>a.path.localeCompare(b.path)),p.bundleFiles);
 return p;
}

export function uploadConfiguration(dir){
 verifyPackage(dir);
 const c=createOfflineConfig(baseline,resolve('.'),resolve(dir,'compiled-web'));
 c.main=resolve(dir,'worker-bundle/gateway.js');
 c.no_bundle=true;
 return c;
}

export function verifyBefore(s){
 verifyRuntimeSnapshot({...s,publicVersion:strip(s.publicVersion),candidateVersion:strip(s.candidateVersion)});
 assert.equal(s.deployment.id,'549f57c4-3d29-4b8b-856f-9554cab437e2');
 assert.deepEqual(s.deployment.versions,[{version_id:PUBLIC,percentage:100},{version_id:PRIVATE,percentage:0}]);
 assert.ok(s.versions.some(v=>v.id===PUBLIC)&&s.versions.some(v=>v.id===PRIVATE));
 assert.equal(new Set(versionSort(s.versions)).size,s.versions.length);
 assert.equal(s.routes.find(r=>r.pattern==='anevum.com/*')?.script,'anevum-native-frame-policy-v001');
 return {
  deployment:stable(s.deployment),operationalSettings:hash(stable(operational(s.settings))),
  routes:hash(stable(s.routes)),exposure:stable(s.exposure),versionIds:versionSort(s.versions),
  publicScript:hash(stable(s.publicVersion.resources)),privateScript:hash(stable(s.candidateVersion.resources))
 };
}

export function verifyAfter(before,s,candidate){
 const now=verifyBefore(s);
 assert.equal(now.deployment,before.deployment,'Public deployment changed during upload');
 assert.equal(now.operationalSettings,before.operationalSettings,'Worker settings changed');
 assert.equal(now.routes,before.routes,'Route ownership changed');
 assert.equal(now.exposure,before.exposure,'Exposure changed');
 assert.equal(now.publicScript,before.publicScript,'Serving public Worker changed');
 assert.equal(now.privateScript,before.privateScript,'Private Worker changed');
 const added=s.versions.filter(v=>!before.versionIds.includes(v.id));
 assert.equal(added.length,1,'Expected exactly one newly uploaded version');
 assert.equal(candidate.id,added[0].id);
 assert.equal(s.deployment.versions.some(v=>v.version_id===candidate.id),false,'Inactive version received traffic');
 assert.equal(candidate.annotations?.['workers/message'],UPLOAD_MESSAGE);
 assert.deepEqual(signature(candidate.resources.bindings),signature(baseline.candidateVersion.resources.bindings));
 assert.deepEqual(plain(candidate.resources.bindings),plain(baseline.candidateVersion.resources.bindings));
 assert.deepEqual(d1(candidate.resources.bindings),d1(baseline.candidateVersion.resources.bindings));
 assert.deepEqual(candidate.resources.script_runtime,baseline.candidateVersion.resources.script_runtime);
 assert.ok(candidate.resources.script?.etag&&/^[a-f0-9]{64}$/.test(candidate.resources.script.etag));
 return {status:'V116_IMMUTABLE_INACTIVE_UPLOADED',versionId:candidate.id,scriptEtag:candidate.resources.script.etag,
  frontendSourceSha:'a3c94b3ebdc6103347e76f8a5234904978da67e3',packageSourceSha:BASE,
  workerBundleSha256:SHA256,publicVersion:PUBLIC,publicPercent:100,rollbackPreserved:true,
  newVersionPercent:0,publicTrafficChanged:false,routesChanged:false,memberDataChanged:false,
  secretNamesPreserved:true,secretValuesRetrieved:false,
  authPinRemediated:false,authenticatedAcceptance:false,physicalSafariAcceptance:false,
  productionReleaseApproved:false};
}

async function get(path,github=false){
 const token=github?process.env.GH_TOKEN:process.env.CLOUDFLARE_API_TOKEN;
 assert.ok(token?.length>15);
 const res=await fetch((github?'https://api.github.com':'https://api.cloudflare.com/client/v4')+path,{
  method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
  redirect:'error',signal:AbortSignal.timeout(30000)});
 assert.equal(res.ok,true,'Provider GET failed '+res.status+' ('+(github?'GitHub':'Cloudflare')+')');
 const json=await res.json();if(github)return json;
 assert.equal(json.success,true);return json.result;
}
async function snapshot(){
 const [deploy,settings,pub,priv,exposure,routes,vers]=await Promise.all([
  get(ROOT+'/deployments'),get(ROOT+'/settings'),get(ROOT+'/versions/'+PUBLIC),
  get(ROOT+'/versions/'+PRIVATE),get(ROOT+'/subdomain'),
  get('/zones/'+ZONE+'/workers/routes'),get(ROOT+'/versions?per_page=100')
 ]);
 return {accountId:ACCOUNT,worker:baseline.worker,deployment:deploy.deployments[0],
  settings,publicVersion:pub,candidateVersion:priv,exposure,routes,versions:vers.items};
}
function marker(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 assert.equal(process.env.GITHUB_REPOSITORY,REPO);
 assert.equal(process.env.GITHUB_ACTOR,'anevum');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+BRANCH);
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15&&process.env.GH_TOKEN?.length>15);
 assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
 assert.equal(git('log','-1','--format=%B'),MESSAGE);
 const markerPath='.github/release-approvals/v119-v116-inactive-upload.json';
 assert.equal(git('diff-tree','--no-commit-id','--name-only','-r','HEAD'),markerPath);
 const m=load(markerPath);
 const ops=git('rev-parse','HEAD^');
 assert.deepEqual(m,{reviewedOperationsSha:ops,packageSourceSha:BASE,runId:RUN,artifactId:ARTIFACT,
  worker:baseline.worker,allowInactiveUpload:true,allowPublicDeployment:false,
  allowRoutingWrites:false,allowDataWrites:false,allowRoleWrites:false,allowPublicPublishing:false});
 const allowed=new Set([
  '.github/workflows/v118-v116-inactive-upload.yml',
  'creator-v1/ops/apex-inactive-upload-v118.mjs',
  'creator-v1/test/apex-inactive-upload-v118.test.mjs',
  'docs/production/v118-v116-inactive-upload-20261023.md',
  '.github/workflows/v118-v116-inactive-upload.yml',
  'creator-v1/ops/apex-inactive-upload-v118.mjs',
  'creator-v1/test/apex-inactive-upload-v118.test.mjs',
  'docs/production/v119-api-origin-conflict-20261023.md'
 ]);
 const paths=git('diff','--name-only',BASE,ops).split('\n').filter(Boolean);
 assert.ok(paths.every(p=>allowed.has(p)),'Unreviewed modifications before approval marker');
 return ops;
}
async function requireProvenance(ops){
 const [artifact,run,checks,release]=await Promise.all([
  get('/repos/'+REPO+'/actions/artifacts/'+ARTIFACT,true),
  get('/repos/'+REPO+'/actions/runs/'+RUN,true),
  get('/repos/'+REPO+'/commits/'+ops+'/check-runs?per_page=100',true),
  get('/repos/'+REPO+'/git/ref/heads/release/v084-continuance-approved-20261019',true)
 ]);
 assert.equal(artifact.expired,false);assert.equal(artifact.workflow_run.head_sha,BASE);
 assert.equal(run.head_sha,BASE);assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 for(const job of ['verify-inactive','verify','verified-source','emblem-and-reputation','source']){
  const j=checks.check_runs.find(x=>x.name===job);
  assert.equal(j?.conclusion,'success','Missing exact operations CI: '+job);
 }
 execFileSync('git',['merge-base','--is-ancestor',BASE,release.object.sha]);
 execFileSync('git',['merge-base','--is-ancestor',ops,release.object.sha]);
}
async function before(root,state,config){
 const operations=marker();
 await requireProvenance(operations);
 verifyPackage(root);
 const live=await snapshot(),record=verifyBefore(live);
 save(state,{...record,operations,packageHash:hash(readFileSync(join(root,'package-manifest.json')))});
 save(config,uploadConfiguration(root));
 console.log('V118_INACTIVE_PREFLIGHT=PASS; PUBLIC=100; NEW_VERSION=NOT_DEPLOYED');
}
async function after(root,state,receipt){
 const operations=marker(),prior=load(state);
 assert.equal(prior.operations,operations);
 assert.equal(prior.packageHash,hash(readFileSync(join(root,'package-manifest.json'))));
 verifyPackage(root);
 const live=await snapshot();
 const added=live.versions.filter(v=>!prior.versionIds.includes(v.id));
 assert.equal(added.length,1);
 const candidate=await get(ROOT+'/versions/'+added[0].id);
 const result=verifyAfter(prior,live,candidate);
 save(receipt,result);console.log(JSON.stringify(result));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [cmd,...args]=process.argv.slice(2);
 if(cmd==='config'&&args.length===2){save(args[1],uploadConfiguration(args[0]));console.log('V118_CONFIG=PASS; NO_UPLOAD');}
 else if(cmd==='before'&&args.length===3)await before(...args);
 else if(cmd==='after'&&args.length===3)await after(...args);
 else throw Error('Use config <artifact> <config> | before <artifact> <state> <config> | after <artifact> <state> <receipt>');
}
