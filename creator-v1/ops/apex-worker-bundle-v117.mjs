// V117: exact-source V116 offline Worker packaging. No provider mutation.
/** Complete offline apex packaging. No provider client or upload operation. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,cpSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyCandidateAssets} from './v095-inactive-candidate-gate.mjs';
import {verifyApexRootAssets} from '../test/v100-apex-root-assets.test.mjs';

export const FRONTEND_SOURCE='a3c94b3ebdc6103347e76f8a5234904978da67e3';
export const FRONTEND_RUN=39887377952;
export const FRONTEND_ARTIFACT=12472563668;
export const WORKER='anevum-apex-prelaunch-gateway';
const PUBLIC='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
const CANDIDATE='86dc4b9d-4020-432a-8a15-e65606f31316';
const DEPLOYMENT='549f57c4-3d29-4b8b-856f-9554cab437e2';
const ACCOUNT='2f7ee83107240152097efd956a4e8335';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const load=path=>JSON.parse(readFileSync(path,'utf8'));
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?
 Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const bindings=x=>[...x].sort((a,b)=>a.name.localeCompare(b.name));
export const baseline=load(new URL('../operations/apex-bundle-runtime-baseline-v117-20261022.json',import.meta.url));

/** Fresh snapshots are required again immediately before a separately authorized upload. */
export function verifyRuntimeSnapshot(s){
 assert.equal(s.accountId,ACCOUNT);
 assert.equal(s.worker,WORKER);
 assert.equal(s.deployment.id,DEPLOYMENT,'Deployment changed; re-review baseline');
 assert.deepEqual(s.deployment.versions,[{version_id:PUBLIC,percentage:100},{version_id:CANDIDATE,percentage:0}]);
 assert.equal(s.publicVersion.id,PUBLIC);
 assert.equal(s.candidateVersion.id,CANDIDATE);
 assert.deepEqual(s.exposure,{enabled:false,previews_enabled:false});
 assert.deepEqual(s.candidateVersion.resources,baseline.candidateVersion.resources,'Immutable candidate resources drift');
 assert.deepEqual(s.publicVersion.resources,baseline.publicVersion.resources,'Rollback resources drift');
 assert.deepEqual(bindings(s.settings.bindings),bindings(baseline.settings.bindings),'Worker settings binding drift');
 assert.deepEqual(bindings(s.settings.bindings),bindings(s.candidateVersion.resources.bindings));
 assert.equal(s.settings.compatibility_date,'2026-10-17');
 assert.deepEqual(s.settings.compatibility_flags,['nodejs_compat']);
 const routes=rs=>rs.map(({pattern,script,request_limit_fail_open})=>({pattern,script,request_limit_fail_open})).sort((a,b)=>a.pattern.localeCompare(b.pattern));
 assert.equal(s.routes.length,40);
 assert.deepEqual(routes(s.routes),routes(baseline.routes),'Route ownership drift');
 const b=s.candidateVersion.resources.bindings;
 assert.equal(b.length,26);
 assert.equal(new Set(b.map(x=>x.name)).size,b.length);
 assert.ok(b.every(x=>['plain_text','secret_text','assets','d1'].includes(x.type)),'Unhandled binding type');
 assert.ok(b.filter(x=>x.type==='secret_text').every(x=>Object.keys(x).sort().join(',')==='name,type'),'Secret values must never enter packaging');
 const vars=Object.fromEntries(b.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
 assert.equal(vars.CANONICAL_XP_TEST_ENABLED,'false');
 assert.equal(vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(vars.CANONICAL_PACKAGE_PROOF_ENABLED,'true');
 assert.equal(vars.ANEVUM_LAUNCH_APPROVED,'true');
 assert.equal(vars.ANEVUM_PRELAUNCH_MODE,'public');
 return {vars,secrets:b.filter(x=>x.type==='secret_text').map(x=>x.name).sort()};
}

export function verifyFrontend(root,manifest){
 assert.equal(manifest.sourceSha,FRONTEND_SOURCE,'Unreviewed frontend source');
 assert.equal(manifest.status,'EXACT_SOURCE_FRONTEND_DRY_RUN');
 assert.equal(manifest.assetBase,'/');
 assert.equal(manifest.runtimePath,'/');
 assert.equal(manifest.entry,'index.html');
 assert.deepEqual(manifest.clientFlags,{VITE_IREN_SPATIAL_GUIDE:true,VITE_NATIVE_CREATOR_STUDIO_V095:true,VITE_PACKAGE_CREATOR_GALLERY_V010:true});
 for(const name of ['uploadedToCloudflare','publicTrafficChanged','databaseModified','productionReleaseApproved','physicalSafariAcceptance','authenticatedFounderReviewerAndMemberAcceptance'])
  assert.equal(manifest[name],false);
 const actual=verifyCandidateAssets(root);
 const normalize=files=>files.map(f=>({path:f.path,bytes:f.bytes,sha256:f.sha256})).sort((a,b)=>a.path.localeCompare(b.path));
 assert.deepEqual(normalize(actual.assets),normalize(manifest.files),'Frontend inventory/bytes differ from tested artifact');
 assert.equal(manifest.assetCount,actual.assets.length);
 assert.equal(verifyApexRootAssets(root).status,'APEX_ROOT_ASSETS_PASS');
 return actual;
}

export function createOfflineConfig(s,repoRoot,assetsRoot){
 const {vars}=verifyRuntimeSnapshot(s);
 const runtime=s.candidateVersion.resources.script_runtime;
 return {
  name:WORKER,account_id:ACCOUNT,main:join(repoRoot,'creator-v1/apex-prelaunch/gateway.mjs'),
  compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags,
  workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
  assets:{directory:assetsRoot,binding:'ASSETS',run_worker_first:true,not_found_handling:'single-page-application'},
  d1_databases:s.candidateVersion.resources.bindings.filter(b=>b.type==='d1').map(b=>({binding:b.name,database_id:b.database_id})),
  vars
 };
}

function sourceIdentity(){
 const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.match(head,/^[a-f0-9]{40}$/);
 execFileSync('git',['merge-base','--is-ancestor',FRONTEND_SOURCE,'HEAD']);
 const allowed=new Set(["creator-v1/ops/apex-worker-bundle-v117.mjs","creator-v1/operations/apex-bundle-runtime-baseline-v117-20261022.json","creator-v1/test/apex-worker-bundle-v117.test.mjs",".github/workflows/v117-integrated-apex-worker-package.yml"]);
 const changes=execFileSync('git',['diff','--name-only',FRONTEND_SOURCE,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert.ok(changes.every(path=>allowed.has(path)),'Unreviewed source/runtime changes: '+changes.filter(path=>!allowed.has(path)).join(','));
 assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=all'],{encoding:'utf8'}).trim(),'','Package requires clean checkout');
 return head;
}

function write(path,value){writeFileSync(path,JSON.stringify(value,null,2)+'\n');}
export function prepare(artifactDir,outputDir){
 const repo=resolve('.'),out=resolve(outputDir),input=resolve(artifactDir);
 const sourceSha=sourceIdentity();
 const frontend=load(join(input,'candidate-manifest.json'));
 const checked=verifyFrontend(join(input,'compiled-web'),frontend);
 const browser=load(join(input,'acceptance.json'));
 assert.equal(browser.status,'PASS');
 assert.ok([320,390,1440].every(width=>browser.results?.some(r=>r.width===width&&r.rootMounted&&r.cssLoaded&&r.cssJsHttp200)));
 mkdirSync(out,{recursive:true});
 const assets=join(out,'compiled-web');
 cpSync(join(input,'compiled-web'),assets,{recursive:true,errorOnExist:true,force:false});
 verifyFrontend(assets,frontend);
 const config=createOfflineConfig(baseline,repo,assets);
 write(join(out,'wrangler.offline.json'),config);
 write(join(out,'frontend-manifest.json'),frontend);
 cpSync(join(input,'acceptance.json'),join(out,'root-browser-acceptance.json'));
 const {secrets}=verifyRuntimeSnapshot(baseline);
 write(join(out,'package-manifest.json'),{
  session:baseline.session,status:'OFFLINE_CONFIG_PREPARED',sourceSha,frontendSourceSha:FRONTEND_SOURCE,
  frontendRun:FRONTEND_RUN,frontendArtifact:FRONTEND_ARTIFACT,frontendManifestSha256:sha(readFileSync(join(out,'frontend-manifest.json'))),
  worker:WORKER,baselineReadAt:baseline.readAt,runtimeBaselineSha256:sha(stable(baseline)),
  assetCount:checked.assets.length,earnedMediaCount:checked.earned_media_count,assetManifestSha256:checked.sha256,
  requiredProviderSecretNames:secrets,secretValuesIncluded:false,secretsPreservedAtProvider:false,
  bindingsReconciledToFrozenSnapshot:true,freshPreUploadReadbackRequired:true,
  rollback:{deploymentId:DEPLOYMENT,publicVersion:PUBLIC,publicPercent:100,previousCandidate:CANDIDATE,candidatePercent:0},
  nativeAuthPinRemediated:false,stagingPublishingReconciled:false,
  workerBundleVerified:false,uploadedToCloudflare:false,publicTrafficChanged:false,
  databaseModified:false,authenticatedAcceptance:false,physicalSafariAcceptance:false,productionReleaseApproved:false
 });
 return {status:'OFFLINE_CONFIG_PREPARED',assetCount:checked.assets.length};
}

export function seal(outputDir){
 const out=resolve(outputDir),m=load(join(out,'package-manifest.json'));
 assert.equal(m.sourceSha,sourceIdentity(),'Source changed during packaging');
 assert.equal(m.runtimeBaselineSha256,sha(stable(baseline)));
 const frontend=load(join(out,'frontend-manifest.json'));
 assert.equal(m.frontendManifestSha256,sha(readFileSync(join(out,'frontend-manifest.json'))));
 verifyFrontend(join(out,'compiled-web'),frontend);
 const config=load(join(out,'wrangler.offline.json'));
 assert.deepEqual(config,createOfflineConfig(baseline,resolve('.'),join(out,'compiled-web')),'Offline config drift');
 const root=join(out,'worker-bundle'),files=[];
 function walk(dir){for(const name of readdirSync(dir)){
  const path=join(dir,name),st=lstatSync(path);
  assert.ok(!st.isSymbolicLink(),'Bundle symlink');
  if(st.isDirectory())walk(path);else{
   assert.ok(st.isFile());const bytes=readFileSync(path);
   files.push({path:relative(root,path),bytes:bytes.length,sha256:sha(bytes)});
  }
 }}
 walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
 assert.ok(files.some(x=>x.path==='gateway.js'&&x.bytes>10000),'Compiled Worker missing');
 // Only syntax/bundle integrity is established here; provider execution is still unverified.
 execFileSync(process.execPath,['--check',join(root,'gateway.js')],{stdio:'pipe'});
 m.status='COMPLETE_OFFLINE_WORKER_PACKAGE';m.workerBundleVerified=true;
 m.providerRuntimeVerified=false;m.bundleFiles=files;m.offlineConfigSha256=sha(readFileSync(join(out,'wrangler.offline.json')));
 write(join(out,'package-manifest.json'),m);
 return {status:m.status,workerBytes:files.reduce((n,f)=>n+f.bytes,0),assets:m.assetCount,productionReleaseApproved:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [command,...args]=process.argv.slice(2);
 if(command==='prepare'&&args.length===2)console.log(JSON.stringify(prepare(...args)));
 else if(command==='seal'&&args.length===1)console.log(JSON.stringify(seal(...args)));
 else throw Error('Use prepare <V110 artifact directory> <new output directory> or seal <output directory>');
}
