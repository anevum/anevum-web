/** V132 inactive-only release verifier.
 * Never changes traffic, routes, Access, controller or DB. Actual upload is
 * performed by a separately gated GitHub Actions wrangler versions upload.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,readdirSync,lstatSync,writeFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
export const ACCOUNT='2f7ee83107240152097efd956a4e8335';
export const ZONE='8abe27259b5436af5966d3b40d9a3760';
export const WORKER='anevum-apex-prelaunch-gateway';
export const CONTROLLER='anevum-package-alpha-v003-control';
export const PUBLIC='44f5971b-4cc9-4e7e-ab6a-1adb6fc5c12e';
export const CONTROL_PUBLIC='b3043430-d957-441d-936a-9928c7d1a15c';
export const ORIGINAL='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
export const GATEWAY='1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99';
export const SOURCE='baa92c0cbdcce71bd0ae5862e574c90ac53d84a9';
export const QA_RUN=40060370329, ARTIFACT=12547361119, ARTIFACT_DIGEST='55ae566dfc7c12d1c55d4b58e27b133cdbc157c9b0b5083b4c26459bece4cc03';
export const BRANCH='ops/v132-collections-inactive-release-20261023-003';
export const MARKER='.github/release-approvals/v132-collections-inactive-upload.json';
export const MESSAGE='release(v132): upload sealed collections candidate inactive only';
const ROOT='/accounts/'+ACCOUNT+'/workers/scripts/'+WORKER;
const CTRL='/accounts/'+ACCOUNT+'/workers/scripts/'+CONTROLLER;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const save=(path,data)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(data,null,2)+'\n',{mode:0o600})};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const bindings=data=>data?.bindings||data?.resources?.bindings||[];
const names=bs=>bs.map(x=>({name:x.name,type:x.type})).sort((a,b)=>a.name.localeCompare(b.name));
const vars=bs=>Object.fromEntries(bs.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
const db=bs=>Object.fromEntries(bs.filter(b=>b.type==='d1').map(b=>[b.name,b.id||b.database_id]));
export function verifyBundle(root){
 const base=resolve(root),manifest=json(join(base,'v132-offline-manifest.json'));
 assert.equal(manifest.source.head,SOURCE);
 assert.equal(manifest.status,'SEALED_OFFLINE_ONLY');
 assert.equal(manifest.existingWorkerV131,GATEWAY);
 assert.equal(manifest.originalEarnedArtworkCount,152);
 assert.equal(manifest.originalAssetCount,395);
 assert.equal(manifest.flags.VITE_MEMBER_COLLECTION_NAV_REVIEW,true);
 assert.equal(manifest.flags.VITE_IREN_SPATIAL_GUIDE,true);
 assert.equal(manifest.uploadAuthorized,false);
 assert.equal(manifest.activated,false);
 assert.equal(manifest.memberDbChanged,false);
 assert.equal(manifest.xpChanged,false);
 assert.equal(hash(readFileSync(join(base,'worker-bundle/gateway.js'))),GATEWAY);
 assert.equal(hash(readFileSync(join(base,'compiled-web/index.html'))),manifest.indexSha256);
 const listing=json(join(base,'v132-asset-inventory.json'));
 assert.equal(listing.length,manifest.candidateAssetCount);
 let media=0;
 for(const file of listing){
  assert.ok(!file.path.startsWith('/')&&!file.path.includes('..')&&!file.path.endsWith('.map'));
  const bytes=readFileSync(join(base,'compiled-web',file.path));
  assert.equal(hash(bytes),file.sha256,'Compiled asset drift: '+file.path);
  if(file.path.startsWith('evolution/assets/'))media++;
 }
 assert.equal(media,152,'Earned-artwork archive incomplete');
 assert.equal(hash(Buffer.from(JSON.stringify(listing))),manifest.candidateAssetsSha256);
 return {source:SOURCE,files:listing.length,earnedMedia:media,gateway:GATEWAY};
}
export function verifyMarker(){
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
 assert.equal(process.env.GITHUB_ACTOR,'anevum');
 assert.equal(process.env.GITHUB_REF,'refs/heads/'+BRANCH);
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
 assert.equal(git('log','-1','--format=%s'),MESSAGE);
 assert.equal(git('diff-tree','--no-commit-id','--name-only','-r','HEAD'),MARKER);
 const marker=json(MARKER),parent=git('rev-parse','HEAD^');
 assert.deepEqual(marker,{parent_ops_sha:parent,release_source_sha:SOURCE,
  qa_run:QA_RUN,artifact_id:ARTIFACT,artifact_sha256:ARTIFACT_DIGEST,
  worker:WORKER,upload_inactive_only:true,activate_traffic:false,
  alter_routes:false,alter_access:false,alter_controller:false,
  mutate_database:false,reset_xp:false,enable_uploads:false});
 git('merge-base','--is-ancestor',SOURCE,parent);
 const files=git('diff','--name-only',SOURCE,parent).split(/\r?\n/).filter(Boolean);
 const safe=new Set([
  'creator-v1/ops/v132-inactive-upload.mjs',
  'creator-v1/test/v132-inactive-upload.test.mjs',
  'docs/production/v132-inactive-upload.md',
  '.github/workflows/v132-inactive-upload.yml'
 ]);
 for(const p of files)assert.ok(safe.has(p),'Unreviewed upload source: '+p);
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15);
 assert.ok(process.env.GH_TOKEN?.length>15);
 assert.ok(Number.isInteger(QA_RUN)&&QA_RUN>0&&Number.isInteger(ARTIFACT)&&ARTIFACT>0);
 assert.match(ARTIFACT_DIGEST,/^[0-9a-f]{64}$/);
 return {parent,marker};
}
async function request(path,github=false){
 const url=(github?'https://api.github.com':'https://api.cloudflare.com/client/v4')+path;
 const response=await fetch(url,{method:'GET',headers:{Authorization:'Bearer '+(github?process.env.GH_TOKEN:process.env.CLOUDFLARE_API_TOKEN),Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(25000)});
 assert.ok(response.ok,'Readonly provider GET failed: '+response.status+' '+path);
 const data=await response.json();
 if(github)return data;
 assert.equal(data.success,true,'Cloudflare response unsuccessful: '+path);
 return data.result;
}
export async function verifyQa(){
 const [run,a]=await Promise.all([
  request('/repos/anevum/anevum-web/actions/runs/'+QA_RUN,true),
  request('/repos/anevum/anevum-web/actions/artifacts/'+ARTIFACT,true)
 ]);
 assert.equal(run.head_sha,SOURCE);assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 assert.equal(a.digest,'sha256:'+ARTIFACT_DIGEST);assert.equal(a.expired,false);
 assert.equal(a.workflow_run.head_sha,SOURCE);
 assert.match(a.name,/^anevum-v132-release-package-/);
 return {run:QA_RUN,artifact:ARTIFACT,digest:ARTIFACT_DIGEST};
}
export async function snapshot(){
 const [deploy,ctrl,settings,exposure,routes,versions]=await Promise.all([
  request(ROOT+'/deployments'),request(CTRL+'/deployments'),
  request(ROOT+'/settings'),request(ROOT+'/subdomain'),
  request('/zones/'+ZONE+'/workers/routes'),request(ROOT+'/versions?per_page=100')
 ]);
 return {deployment:deploy.deployments?.[0],controller:ctrl.deployments?.[0],
  settings,exposure,routes,versions:versions.items};
}
export function verifySnapshot(s){
 assert.deepEqual(s.deployment.versions,[{version_id:PUBLIC,percentage:100}],'Unexpected public Worker');
 assert.deepEqual(s.controller.versions,[{version_id:CONTROL_PUBLIC,percentage:100}],'Unexpected controller');
 assert.equal(s.routes.length,40,'Production routes changed');
 assert.equal(s.exposure.enabled,false);assert.equal(s.exposure.previews_enabled,false);
 const b=bindings(s.settings);assert.equal(b.length,26,'Worker binding count drift');
 assert.equal(b.filter(x=>x.type==='secret_text').length,5);
 assert.equal(b.filter(x=>x.type==='assets').length,1);
 assert.deepEqual(db(b),{
  COMMUNITY_DB:'fa96e36d-6257-4883-bf15-074947e11a13',
  MEMBER_DB:'e1d29049-c83b-4534-8355-dc1fa36ba6d8'
 });
 const v=vars(b);
 assert.equal(v.CANONICAL_XP_TEST_ENABLED,'false');
 assert.equal(v.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.ok(Array.isArray(s.versions)&&s.versions.some(x=>x.id===PUBLIC));
 assert.equal(s.settings.compatibility_date,'2026-10-17');
 return {deployment:s.deployment,controller:s.controller,
  operationalSettingsSha256:hash(Buffer.from(stable(Object.fromEntries(Object.entries(s.settings).filter(([k])=>k!=='annotations')))),
  routesSha256:hash(Buffer.from(stable(s.routes.map(x=>({pattern:x.pattern,script:x.script,request_limit_fail_open:x.request_limit_fail_open})).sort((a,b)=>a.pattern.localeCompare(b.pattern))))),
  exposure:s.exposure,versions:s.versions.map(x=>x.id),bindingNames:names(b),db:db(b),plain:v};
}
export function config(root,state){
 const c=json('creator-v1/wrangler.apex-prelaunch.jsonc'),b=state.snapshot;
 c.$schema=resolve('node_modules/wrangler/config-schema.json');
 c.main=resolve(root,'worker-bundle/gateway.js');
 c.no_bundle=true;
 c.assets.directory=resolve(root,'compiled-web');
 c.routes=[];c.workers_dev=false;c.preview_urls=false;
 c.vars=b.plain;
 c.d1_databases=c.d1_databases.map(x=>({...x,database_id:state.snapshot.db[x.binding]}));
 assert.equal(c.name,WORKER);assert.equal(c.account_id,ACCOUNT);
 return c;
}
async function before(root,outState,outConfig){
 const mark=verifyMarker(),qa=await verifyQa(),bundle=verifyBundle(root);
 const snap=await snapshot(),locked=verifySnapshot(snap);
 save(outState,{source:SOURCE,mark,qa,bundle,snapshot:locked,controller:snap.controller});
 save(outConfig,config(root,{snapshot:locked}));
 console.log(JSON.stringify({status:'V132_INACTIVE_UPLOAD_PREFLIGHT_PASS',source:SOURCE,
  worker:WORKER,publicVersion:PUBLIC,trafficPct:100,bindingCount:26,
  workerPreserved:true,earnedMedia:152,unsafeActions:0}));
}
async function after(root,statePath,receiptPath){
 verifyMarker();verifyBundle(root);
 const before=json(statePath),current=await snapshot(),after=verifySnapshot(current);
 assert.deepEqual(after.deployment,before.snapshot.deployment,'Production traffic drift');
 assert.deepEqual(after.controller,before.controller,'Controller changed');
 assert.equal(after.operationalSettingsSha256,before.snapshot.operationalSettingsSha256,'Settings drift');
 assert.equal(after.routesSha256,before.snapshot.routesSha256,'Routes drift');
 assert.deepEqual(after.exposure,before.snapshot.exposure,'Workers.dev/preview state changed');
 const added=after.versions.filter(x=>!before.snapshot.versions.includes(x));
 assert.equal(added.length,1,'Expected exactly one new immutable version');
 const candidate=await request(ROOT+'/versions/'+added[0]);
 assert.equal(candidate.id,added[0]);
 assert.deepEqual(names(bindings(candidate)),before.snapshot.bindingNames,'Candidate binding drift');
 assert.deepEqual(db(bindings(candidate)),before.snapshot.db,'Candidate D1 identity drift');
 assert.ok(!after.deployment.versions.some(x=>x.version_id===candidate.id));
 save(receiptPath,{status:'UPLOADED_INACTIVE_ONLY',source:SOURCE,worker:WORKER,version:candidate.id,
  publicVersion:PUBLIC,publicPercent:100,controllerVersion:CONTROL_PUBLIC,controllerPercent:100,
  bindingCount:26,earnedMedia:152,routeCount:40,noPublicTraffic:true,noDatabaseWrites:true,
  physicalSafariReviewed:false,memberAccountReviewed:false,eligibleForPromotion:false});
 console.log(JSON.stringify({status:'UPLOAD_INACTIVE_VERIFIED',candidate:candidate.id,publicUnchanged:true}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [cmd,...args]=process.argv.slice(2);
 if(cmd==='before'&&args.length===3)await before(...args);
 else if(cmd==='after'&&args.length===3)await after(...args);
 else if(cmd==='check'&&args.length===1){console.log(JSON.stringify(verifyBundle(args[0])));}
 else throw Error('Use before <package> <state> <upload-config> / after <package> <state> <receipt> / check <package>');
}
