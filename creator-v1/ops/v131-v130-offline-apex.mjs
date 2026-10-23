/** V131: build and seal the exact reviewed V130 apex Worker, OFFLINE ONLY.
 * A source-provenance compiler, not an upload, deployment, Access, D1 or auth tool.
 * GitHub PR runs use no Cloudflare credentials and retain no synthetic config.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cpSync,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {baseline,verifyRuntimeSnapshot,createOfflineConfig} from './apex-worker-bundle-v117.mjs';
import {verifyApexRootAssets} from '../test/v100-apex-root-assets.test.mjs';
import {verifyCandidateAssets} from './v095-inactive-candidate-gate.mjs';

export const REVIEWED_V130='d02f524305213ae785821d8b6d8bfce7948b1eb2';
export const REVIEWED_V125='6aff161a60d2e86310acf25df4265a8bab326f7d';
export const WORKER='anevum-apex-prelaunch-gateway';
export const REQUIRED_FLAGS={
 VITE_IREN_SPATIAL_GUIDE:true,
 VITE_NATIVE_CREATOR_STUDIO_V095:true,
 VITE_PACKAGE_CREATOR_GALLERY_V010:true
};
const ALLOWED_FILES=new Set([
 '.github/workflows/v131-v130-offline-apex-package.yml',
 'creator-v1/ops/v131-v130-offline-apex.mjs',
 'creator-v1/test/v131-v130-offline-apex.test.mjs',
 'docs/production/v131-v130-offline-apex-20261023.md'
]);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const write=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n');
const mustBeFalse=['workerUploaded','workerActivated','trafficChanged','controllerPinChanged','accessChanged',
 'memberDatabaseChanged','schemaMigrationApplied','authenticatedMemberAcceptance',
 'physicalSafariAcceptance','productionApproved'];

export const APPROVED_PLAYER_FILES=Object.freeze(["creator-v1/web/src/components/IsolatedProjectViewport.tsx","creator-v1/web/src/pages/native-creator-v095.css","creator-v1/test/capture-native-creator-v095.mjs"]);
export function assertReviewedPlayerDelta(paths){
 assert.ok(Array.isArray(paths),'Missing reviewed V130 player source delta');
 assert.deepEqual([...paths].sort(),[...APPROVED_PLAYER_FILES].sort(),
  'V130 must include ONLY the approved mobile-player repair on V125');
 return true;
}
export function assertAllowedSourceDelta(paths){
 assert.ok(Array.isArray(paths));
 assert.ok(paths.length>0,'A separate review-only packaging change is required');
 const unreviewed=paths.filter(path=>!ALLOWED_FILES.has(path));
 assert.deepEqual(unreviewed,[],'Application/Worker/auth or unrelated source changed since V130');
 return true;
}
export function sourceIdentity(){
 const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.match(head,/^[a-f0-9]{40}$/,'Missing immutable packaging source HEAD');
 execFileSync('git',['merge-base','--is-ancestor',REVIEWED_V125,REVIEWED_V130],{stdio:'pipe'});
 execFileSync('git',['merge-base','--is-ancestor',REVIEWED_V130,head],{stdio:'pipe'});
 const playerDelta=execFileSync('git',['diff','--name-only',REVIEWED_V125,REVIEWED_V130],{encoding:'utf8'})
  .split(/\r?\n/).filter(Boolean);
 assertReviewedPlayerDelta(playerDelta);
 const changed=execFileSync('git',['diff','--name-only',REVIEWED_V130,head],{encoding:'utf8'})
  .split(/\r?\n/).filter(Boolean);
 assertAllowedSourceDelta(changed);
 // Prevent tracked application edits in the checkout before building; generated
 // public artwork is untracked/ignored and not a change to reviewed source.
 const dirty=execFileSync('git',['diff','--name-only','--',
  'creator-v1/web/src','creator-v1/web/vite.config.ts','creator-v1/apex-prelaunch',
  'creator-v1/canonical-auth','site/alpha/v003','package.json'],{encoding:'utf8'}).trim();
 assert.equal(dirty,'','Uncommitted tracked source edits are forbidden');
 return head;
}
export function verifyFlags(env){
 for(const name of Object.keys(REQUIRED_FLAGS))assert.equal(env[name],'true',`${name} not explicitly enabled`);
 return structuredClone(REQUIRED_FLAGS);
}
export function verifyBrowserEvidence(report){
 assert.equal(report.status,'PASS','Actual compiled site-root Chromium gate required');
 assert.equal(report.source,'OFFLINE SYNTHETIC APEX ROOT');
 assert.equal(report.runtimeExceptions,0);
 assert.equal(report.authenticatedAcceptance,false);
 assert.equal(report.physicalSafariAcceptance,false);
 assert.equal(report.productionApproved,false);
 assert.ok(Array.isArray(report.results),'Root browser results missing');
 for(const width of [320,390,1440]){
  const rows=report.results.filter(x=>x.width===width);
  assert.equal(rows.length,1,`One actual root capture required at ${width}`);
  const row=rows[0];
  assert.equal(row.rootMounted,true);assert.equal(row.cssLoaded,true);
  assert.equal(row.cssJsHttp200,true);assert.equal(row.syntheticOnly,true);
  assert.equal(row.chromiumNotSafari,true);
  assert.ok(row.script?.startsWith('/assets/'));
  assert.ok(row.style?.startsWith('/assets/'));
 }
 return true;
}
export function verifyFrozenRuntime(){
 const result=verifyRuntimeSnapshot(baseline);
 assert.equal(baseline.worker,WORKER);
 assert.equal(baseline.settings.bindings.length,26);
 assert.equal(baseline.routes.length,40);
 assert.equal(result.secrets.length,5);
 assert.equal(result.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(result.vars.CANONICAL_XP_TEST_ENABLED,'false');
 return {secretNames:result.secrets,readAt:baseline.readAt,
  deployment:baseline.deployment.id,
  previousPublicVersion:baseline.deployment.versions[0].version_id,
  previousInactiveVersion:baseline.deployment.versions[1].version_id,
  bindingCount:baseline.settings.bindings.length,routeCount:baseline.routes.length};
}
export function validateNeverActivated(manifest){
 for(const key of mustBeFalse)assert.equal(manifest[key],false,`${key} must remain false`);
 assert.equal(manifest.freshProviderReadbackComplete,false);
 assert.equal(manifest.newControllerAuthPinVerified,false);
 assert.equal(manifest.packageReadyForPublicTraffic,false);
 assert.equal(manifest.worker,WORKER);
 return true;
}
function inventoryBundle(dir){
 const paths=[];
 function walk(root){for(const entry of readdirSync(root,{withFileTypes:true})){
  const path=join(root,entry.name),s=lstatSync(path);
  assert.ok(!s.isSymbolicLink(),'Bundle cannot include symlinks');
  if(s.isDirectory())walk(path);
  else{
   assert.ok(s.isFile(),'Unexpected bundle type');
   const rel=relative(dir,path).replaceAll('\\','/'),bytes=readFileSync(path);
   assert.ok(!rel.includes('..')&&!rel.endsWith('.map'),'Unsafe compiled bundle path');
   paths.push({path:rel,bytes:bytes.length,sha256:hash(bytes)});
  }
 }}
 walk(dir);paths.sort((a,b)=>a.path.localeCompare(b.path));return paths;
}
function assetInventory(dir){
 assert.equal(verifyApexRootAssets(dir).status,'APEX_ROOT_ASSETS_PASS');
 const result=verifyCandidateAssets(dir);
 assert.equal(result.earned_media_count,152);
 return result;
}

/** Requires the already tested, built root assets; never accesses Cloudflare. */
export function prepare(assetRoot,browserJson,packageDir){
 const head=sourceIdentity();const flags=verifyFlags(process.env);const frozen=verifyFrozenRuntime();
 const input=resolve(assetRoot),out=resolve(packageDir);
 assert.ok(existsSync(input)&&existsSync(browserJson),'Missing compiled frontend or browser receipt');
 const browser=json(browserJson);verifyBrowserEvidence(browser);
 const sourceAssets=assetInventory(input);
 mkdirSync(out,{recursive:true});
 const assets=join(out,'compiled-web');
 assert.ok(!existsSync(assets),'Refuse overwriting an existing offline package');
 cpSync(input,assets,{recursive:true,force:false,errorOnExist:true});
 const checked=assetInventory(assets);
 assert.equal(checked.sha256,sourceAssets.sha256,'Copied assets drifted');
 const config=createOfflineConfig(baseline,resolve('.'),assets);
 assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);
 assert.deepEqual(config.routes,[]);
 assert.equal(config.assets.run_worker_first,true);
 assert.equal(config.d1_databases.length,2);
 write(join(out,'wrangler.offline.synthetic.json'),config);
 write(join(out,'root-browser-acceptance.json'),browser);
 write(join(out,'frontend-manifest.json'),{
  type:'V130_EXACT_SOURCE_ROOT',sourceSha:REVIEWED_V130,packagingHead:head,
  root:'/',flags,files:checked.assets,assetCount:checked.assets.length,
  assetInventorySha256:checked.sha256,earnedMediaCount:checked.earned_media_count,
  codeReadOnly:true,screenshotsAreSynthetic:true
 });
 const manifest={
  session:'ANEVUM.WEB.PACKAGE.2026-10-23.003.V130-INTEGRATED-OFFLINE-WORKER',
  status:'OFFLINE_PREPARED',sourceSha:REVIEWED_V130,sourceBase:REVIEWED_V125,
  packagingHead:head,worker:WORKER,assetCount:checked.assets.length,
  assetInventorySha256:checked.sha256,featureFlags:flags,
  frozenRuntime:{...frozen,freshProviderReadbackComplete:false},
  secretValuesIncluded:false,workerBundleVerified:false,
  // A hashed offline build is not an immutable uploaded Worker version.
  immutableV130WorkerVersion:null,workerUploaded:false,workerActivated:false,
  trafficChanged:false,controllerPinChanged:false,accessChanged:false,
  memberDatabaseChanged:false,schemaMigrationApplied:false,
  authenticatedMemberAcceptance:false,physicalSafariAcceptance:false,productionApproved:false,
  freshProviderReadbackComplete:false,newControllerAuthPinVerified:false,
  packageReadyForPublicTraffic:false
 };
 validateNeverActivated(manifest);write(join(out,'package-manifest.json'),manifest);
 return {status:manifest.status,sourceSha:REVIEWED_V130,packagingHead:head,assets:checked.assets.length};
}

export function seal(packageDir){
 const out=resolve(packageDir),manifest=json(join(out,'package-manifest.json'));
 assert.equal(manifest.status,'OFFLINE_PREPARED');
 assert.equal(manifest.sourceSha,REVIEWED_V130);
 assert.equal(manifest.packagingHead,sourceIdentity());
 verifyFlags(process.env);verifyFrozenRuntime();validateNeverActivated(manifest);
 const browser=json(join(out,'root-browser-acceptance.json'));
 verifyBrowserEvidence(browser);
 const frontend=json(join(out,'frontend-manifest.json'));
 assert.equal(frontend.sourceSha,REVIEWED_V130);
 assert.equal(frontend.packagingHead,manifest.packagingHead);
 const assets=assetInventory(join(out,'compiled-web'));
 assert.equal(assets.sha256,frontend.assetInventorySha256);
 assert.equal(assets.sha256,manifest.assetInventorySha256);
 const offlineConfig=json(join(out,'wrangler.offline.synthetic.json'));
 assert.deepEqual(offlineConfig,createOfflineConfig(baseline,resolve('.'),join(out,'compiled-web')),'Offline config drift');
 const bundle=join(out,'worker-bundle');
 assert.ok(existsSync(join(bundle,'gateway.js')),'Compiled Worker missing');
 execFileSync(process.execPath,['--check',join(bundle,'gateway.js')],{stdio:'pipe'});
 const files=inventoryBundle(bundle);
 assert.ok(files.find(f=>f.path==='gateway.js'&&f.bytes>10000),'Compiled gateway too small');
 manifest.status='OFFLINE_WORKER_BUNDLE_VERIFIED';manifest.workerBundleVerified=true;
 manifest.workerBundleFiles=files;
 manifest.frontendManifestSha256=hash(readFileSync(join(out,'frontend-manifest.json')));
 manifest.browserEvidenceSha256=hash(readFileSync(join(out,'root-browser-acceptance.json')));
 manifest.syntheticOfflineConfigSha256=hash(readFileSync(join(out,'wrangler.offline.synthetic.json')));
 validateNeverActivated(manifest);
 write(join(out,'package-manifest.json'),manifest);
 return {status:manifest.status,workerBytes:files.reduce((n,f)=>n+f.bytes,0),assets:assets.assets.length,
  workerUploaded:false,publicReleased:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [command,...args]=process.argv.slice(2);
 if(command==='prepare'&&args.length===3)console.log(JSON.stringify(prepare(...args)));
 else if(command==='seal'&&args.length===1)console.log(JSON.stringify(seal(...args)));
 else throw Error('Use prepare <compiled-root-dir> <root-browser-acceptance.json> <package-dir> or seal <package-dir>');
}
