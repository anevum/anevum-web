/**
 * ANEVUM V127: V125 immutable version-upload DRY RUN, offline only.
 * Exactly one source-bound V126 artifact is accepted. This module has no
 * Cloudflare client, API token, upload, deploy, route, Access or D1 operation.
 * A future credentialed action requires distinct authorization and fresh
 * readback; nothing in this file authorizes it.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, lstatSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {baseline, createOfflineConfig, verifyRuntimeSnapshot} from './apex-worker-bundle-v117.mjs';

export const PINS=Object.freeze({
  repository:'anevum/anevum-web',
  v125:'6aff161a60d2e86310acf25df4265a8bab326f7d',
  v126:'1bc20950c71b5b2e0a2f6a3b9fe13f2cb849fd69',
  sourceRun:39997196812,
  sourceArtifact:12521290324,
  archiveSha256:'2ca669eca2bd337f282e7007baeac0ed955e14c91e0b635f4fa184f147e6607f',
  workerSha256:'1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99',
  assetInventorySha256:'c27da6da354fb059f8f9c0c50261df126d0740e34a2f338357ad450dbac6fd9d',
  worker:'anevum-apex-prelaunch-gateway',
  originalPublicVersion:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',
  originalInactiveVersion:'86dc4b9d-4020-432a-8a15-e65606f31316',
  originalDeployment:'549f57c4-3d29-4b8b-856f-9554cab437e2'
});
const allowed=new Set([
  '.github/workflows/v127-v125-inactive-upload-dryrun.yml',
  'creator-v1/ops/v127-v125-inactive-preflight.mjs',
  'creator-v1/test/v127-v125-inactive-preflight.test.mjs',
  'docs/production/v127-v125-inactive-upload-preflight-20261023.md'
]);
const hash=x=>createHash('sha256').update(x).digest('hex');
const readJson=path=>JSON.parse(readFileSync(path,'utf8'));
const forbiddenManifestGates=[
  'workerUploaded','workerActivated','trafficChanged','controllerPinChanged',
  'accessChanged','memberDatabaseChanged','schemaMigrationApplied',
  'authenticatedMemberAcceptance','physicalSafariAcceptance','productionApproved',
  'freshProviderReadbackComplete','newControllerAuthPinVerified','packageReadyForPublicTraffic'
];
const isPathSafe=path=>typeof path==='string' && path.length>0 && !path.startsWith('/') &&
  !path.includes('\\') && path.split('/').every(part=>part!=='.' && part!=='..' && part!=='') &&
  !path.endsWith('.map');
const sorted=a=>[...a].sort((x,y)=>x.path.localeCompare(y.path));

export function assertOnlyNewPreflightFiles(paths){
  assert.ok(Array.isArray(paths) && paths.length===allowed.size,'Exactly four V127 preflight files required');
  assert.deepEqual(paths.filter(path=>!allowed.has(path)),[],'No UI, auth, Worker or unrelated source edits');
  assert.equal(new Set(paths).size,allowed.size,'Duplicate or missing V127 file');
  return true;
}
export function guardSource(){
  const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
  const head=git('rev-parse','HEAD');
  assert.match(head,/^[a-f0-9]{40}$/);
  execFileSync('git',['merge-base','--is-ancestor',PINS.v126,head]);
  const changed=git('diff','--name-only',PINS.v126,head).split(/\r?\n/).filter(Boolean);
  assertOnlyNewPreflightFiles(changed);
  assert.equal(git('diff','--name-only','--','creator-v1/web','creator-v1/apex-prelaunch','creator-v1/canonical-auth','site/alpha/v003','package.json'),'','Dirty app or auth source');
  return head;
}

export function inventory(root){
  const dir=resolve(root),files=[];
  const walk=(d)=>{
    for(const name of readdirSync(d)){
      const file=join(d,name),s=lstatSync(file);
      assert.equal(s.isSymbolicLink(),false,'Symlink forbidden in release package');
      if(s.isDirectory())walk(file);
      else{
        assert.equal(s.isFile(),true,'Non-file in release package');
        const path=relative(dir,file).replaceAll('\\','/');
        assert.equal(isPathSafe(path),true,'Unsafe asset path');
        const bytes=readFileSync(file);
        files.push({path,bytes:bytes.length,sha256:hash(bytes)});
      }
    }
  };
  walk(dir);
  return sorted(files);
}
export function assertBlocked(manifest){
  for(const key of forbiddenManifestGates)assert.equal(manifest[key],false,`${key} cannot be accepted`);
  assert.equal(manifest.immutableV125WorkerVersion,null,'Offline package must have no provider version');
  assert.equal(manifest.secretValuesIncluded,false,'Secret value must not enter artifact');
  assert.equal(manifest.workerBundleVerified,true);
  return true;
}
export function verifyPackage(packageRoot){
  const root=resolve(packageRoot);
  assert.ok(existsSync(join(root,'package-manifest.json')),'Missing V126 package manifest');
  assert.deepEqual(readdirSync(root).sort(),['compiled-web','worker-bundle','frontend-manifest.json','package-manifest.json','root-browser-acceptance.json'].sort(),'Unexpected retained package member');
  assert.ok(!existsSync(join(root,'wrangler.offline.synthetic.json')),'Synthetic source config must never be included');
  const manifest=readJson(join(root,'package-manifest.json'));
  assert.equal(manifest.status,'OFFLINE_WORKER_BUNDLE_VERIFIED');
  assert.equal(manifest.sourceSha,PINS.v125);
  assert.equal(manifest.sourceBase,'901dec2324f88af49dae984d668afc8afa6c2734');
  assert.equal(manifest.packagingHead,PINS.v126);
  assert.equal(manifest.worker,PINS.worker);
  assert.equal(manifest.assetCount,395);
  assert.equal(manifest.assetInventorySha256,PINS.assetInventorySha256);
  assertBlocked(manifest);
  assert.equal(manifest.frozenRuntime?.bindingCount,26);
  assert.equal(manifest.frozenRuntime?.routeCount,40);
  assert.equal(manifest.frozenRuntime?.deployment,PINS.originalDeployment);
  assert.equal(manifest.frozenRuntime?.previousPublicVersion,PINS.originalPublicVersion);
  assert.equal(manifest.frozenRuntime?.previousInactiveVersion,PINS.originalInactiveVersion);
  assert.equal(manifest.frozenRuntime?.freshProviderReadbackComplete,false);
  assert.deepEqual([...(manifest.frozenRuntime?.secretNames||[])].sort(),baseline.settings.bindings.filter(b=>b.type==='secret_text').map(b=>b.name).sort());
  assert.equal(hash(readFileSync(join(root,'frontend-manifest.json'))),manifest.frontendManifestSha256);
  assert.equal(hash(readFileSync(join(root,'root-browser-acceptance.json'))),manifest.browserEvidenceSha256);
  const front=readJson(join(root,'frontend-manifest.json'));
  assert.equal(front.type,'V125_EXACT_SOURCE_ROOT');
  assert.equal(front.root,'/');
  assert.equal(front.sourceSha,PINS.v125);
  assert.equal(front.packagingHead,PINS.v126);
  assert.equal(front.codeReadOnly,true);
  assert.equal(front.screenshotsAreSynthetic,true);
  assert.equal(front.assetCount,395);
  assert.equal(front.earnedMediaCount,152);
  assert.deepEqual(front.flags,{VITE_IREN_SPATIAL_GUIDE:true,VITE_NATIVE_CREATOR_STUDIO_V095:true,VITE_PACKAGE_CREATOR_GALLERY_V010:true});
  assert.equal(front.assetInventorySha256,PINS.assetInventorySha256);
  const actual=inventory(join(root,'compiled-web'));
  assert.equal(actual.length,395);
  assert.deepEqual(actual,sorted(front.files),'Any changed, missing or unexpected asset must block upload');
  assert.equal(actual.filter(x=>x.path.startsWith('evolution/assets/')).length,152);
  const html=readFileSync(join(root,'compiled-web/index.html'),'utf8');
  assert.ok(html.includes('<div id="root"></div>'),'React root missing');
  assert.ok(html.includes('/assets/'),'Missing apex-root asset paths');
  assert.equal(html.includes('/creator/assets/'),false,'Staging base leaked into root');
  const workerFiles=inventory(join(root,'worker-bundle'));
  assert.deepEqual(workerFiles,sorted(manifest.workerBundleFiles),'Worker bundle altered');
  const gateway=workerFiles.find(x=>x.path==='gateway.js');
  assert.ok(gateway && gateway.bytes>1_000_000);
  assert.equal(gateway.sha256,PINS.workerSha256);
  const browser=readJson(join(root,'root-browser-acceptance.json'));
  assert.equal(browser.status,'PASS');
  assert.equal(browser.source,'OFFLINE SYNTHETIC APEX ROOT');
  assert.equal(browser.runtimeExceptions,0);
  assert.equal(browser.authenticatedAcceptance,false);
  assert.equal(browser.physicalSafariAcceptance,false);
  assert.equal(browser.productionApproved,false);
  assert.deepEqual(browser.results?.map(x=>x.width).sort((a,b)=>a-b),[320,390,1440]);
  for(const r of browser.results){
    assert.equal(r.rootMounted,true);assert.equal(r.cssLoaded,true);
    assert.equal(r.cssJsHttp200,true);assert.equal(r.syntheticOnly,true);
    assert.equal(r.chromiumNotSafari,true);
  }
  return {root,manifest,assetCount:actual.length,workerSize:gateway.bytes,workerSha256:gateway.sha256};
}

/** Produces a LOCAL config for wrangler versions upload --dry-run ONLY. */
export function localDryRunConfig(packageRoot){
  const p=verifyPackage(packageRoot), frozen=verifyRuntimeSnapshot(baseline);
  assert.equal(frozen.secrets.length,5);
  assert.equal(baseline.settings.bindings.length,26);
  assert.equal(baseline.routes.length,40);
  const config=createOfflineConfig(baseline,resolve('.'),join(p.root,'compiled-web'));
  config.main=join(p.root,'worker-bundle','gateway.js');
  config.no_bundle=true;
  assert.equal(config.name,PINS.worker);
  assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);
  assert.equal(config.assets?.run_worker_first,true);
  assert.deepEqual(config.routes,[]);
  assert.equal(config.d1_databases?.length,2);
  assert.equal(config.vars.CANONICAL_XP_TEST_ENABLED,'false');
  assert.equal(config.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
  assert.ok(!JSON.stringify(config).includes('PACKAGE_PREVIEW_KEY'));
  for(const secretName of frozen.secrets)assert.equal(Object.hasOwn(config.vars,secretName),false,'Secret name in plain vars');
  return config;
}

/** Future provider GET snapshot validation, deliberately never called by the offline CI. */
export function verifyProviderReadback(snapshot,nowSeconds=Math.floor(Date.now()/1000)){
  assert.ok(snapshot && typeof snapshot==='object');
  assert.ok(Number.isSafeInteger(snapshot.readAtSeconds) && snapshot.readAtSeconds<=nowSeconds && nowSeconds-snapshot.readAtSeconds<=600,'Fresh (<=10 minute) GET-only readback required');
  const a=snapshot.apex,ctrl=snapshot.controller;
  assert.equal(a?.deployment?.id,PINS.originalDeployment);
  assert.deepEqual(a.deployment.versions,[
    {version_id:PINS.originalPublicVersion,percentage:100},
    {version_id:PINS.originalInactiveVersion,percentage:0}
  ]);
  const names=(a.bindings||[]).map(b=>`${b.name}:${b.type}`).sort();
  const frozenNames=baseline.settings.bindings.map(b=>`${b.name}:${b.type}`).sort();
  assert.deepEqual(names,frozenNames,'Binding name/type drift');
  assert.equal(a.routes?.length,40);
  assert.deepEqual((a.d1Bindings||[]).map(b=>[b.name,b.database_id]).sort(),baseline.settings.bindings.filter(b=>b.type==='d1').map(b=>[b.name,b.database_id]).sort(),'D1 identity drift');
  assert.equal(a.safetyFlags?.CANONICAL_XP_TEST_ENABLED,'false');
  assert.equal(a.safetyFlags?.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
  assert.equal(a.compatibilityDate,'2026-10-17');
  assert.deepEqual(a.compatibilityFlags,['nodejs_compat']);
  assert.deepEqual((a.routes||[]).map(r=>[r.pattern,r.script]).sort(),baseline.routes.map(r=>[r.pattern,r.script]).sort(),'Route ownership drift');
  assert.equal(ctrl?.deployment?.id,'4ab43569-392c-40a0-838f-1745873e0918');
  assert.deepEqual(ctrl.deployment.versions,[{version_id:'9851d9c5-6270-4c4e-a70e-1b82451b170d',percentage:100},{version_id:'b957257c-d265-4656-bd97-db6b5da81b71',percentage:0}],'Controller version or exposure drift');
  assert.equal(ctrl.bindingCount,13);
  assert.equal(ctrl.authPin,PINS.originalInactiveVersion,'Existing controller pin unexpected');
  assert.equal(ctrl.publicPublishingEnabled,false);
  return {status:'FROZEN_BASELINE_MATCHES_FRESH_GET',providerWrites:0,publicPercent:100,controllerPublicPercent:100};
}

export function makeDryRunReceipt(packageRoot){
  const p=verifyPackage(packageRoot);
  return {
    session:'ANEVUM.WEB.PACKAGE.2026-10-23.002.V125-INACTIVE-UPLOAD-DRYRUN',
    status:'V127_CONFIG_DRY_RUN_ONLY',
    sourceSha:PINS.v125,packagingHead:PINS.v126,artifactId:PINS.sourceArtifact,
    artifactRun:PINS.sourceRun,artifactZipSha256:PINS.archiveSha256,
    workerSha256:p.workerSha256,assetCount:p.assetCount,
    localWranglerDryRunPassed:true,
    providerSnapshotFresh:false,providerWrites:0,
    cloudflareTokenAvailable:false,
    immutableV125VersionId:null,publicPercentUnchangedByThisJob:true,
    controllerPinChanged:false,controllerVersionUploaded:false,
    protectedAcceptanceDone:false,physicalSafariAcceptance:false,
    ownerReleaseGoNoGo:false,publicDeploymentAuthorized:false,
    safeToRunActualUpload:false,requiresSeparateOwnerApproval:true
  };
}

const save=(path,value)=>{
  assert.equal(existsSync(path),false,'Refuse replacing a local preflight file');
  writeFileSync(path,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
};
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [cmd,...args]=process.argv.slice(2);
  if(cmd==='guard'&&args.length===0)console.log(JSON.stringify({sourceHead:guardSource(),providerWrites:0}));
  else if(cmd==='dryrun-config'&&args.length===2){save(args[1],localDryRunConfig(args[0]));console.log('V127_CONFIG_CHECK=PASS; CLOUDFLARE_TOKEN=NONE');}
  else if(cmd==='receipt'&&args.length===2){save(args[1],makeDryRunReceipt(args[0]));console.log('V127_DRY_RUN_RECEIPT=PASS; UPLOAD=NONE');}
  else throw Error('Use guard | dryrun-config <V126-package-dir> <local-config> | receipt <V126-package-dir> <receipt>');
}
