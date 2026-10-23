import test from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {baseline} from '../ops/apex-worker-bundle-v117.mjs';
import {
 PINS,assertOnlyNewPreflightFiles,assertBlocked,
 verifyPackage,localDryRunConfig,verifyProviderReadback,makeDryRunReceipt
} from '../ops/v127-v125-inactive-preflight.mjs';

const packageRoot=process.env.V127_PACKAGE_DIR?resolve(process.env.V127_PACKAGE_DIR):null;
const fourFiles=[
 '.github/workflows/v127-v125-inactive-upload-dryrun.yml',
 'creator-v1/ops/v127-v125-inactive-preflight.mjs',
 'creator-v1/test/v127-v125-inactive-preflight.test.mjs',
 'docs/production/v127-v125-inactive-upload-preflight-20261023.md'
];
const snapshot=()=>({
 readAtSeconds:Math.floor(Date.now()/1000),
 apex:{
  deployment:{id:PINS.originalDeployment,versions:[
   {version_id:PINS.originalPublicVersion,percentage:100},
   {version_id:PINS.originalInactiveVersion,percentage:0}]},
  bindings:structuredClone(baseline.settings.bindings).map(b=>({name:b.name,type:b.type})),
  d1Bindings:structuredClone(baseline.settings.bindings).filter(b=>b.type==='d1').map(b=>({name:b.name,database_id:b.database_id})),
  safetyFlags:{CANONICAL_XP_TEST_ENABLED:'false',CANONICAL_CREATOR_UPLOADS_ENABLED:'false'},
  compatibilityDate:'2026-10-17',compatibilityFlags:['nodejs_compat'],
  routes:structuredClone(baseline.routes).map(r=>({pattern:r.pattern,script:r.script}))
 },
 controller:{
  deployment:{id:'4ab43569-392c-40a0-838f-1745873e0918',versions:[
   {version_id:'9851d9c5-6270-4c4e-a70e-1b82451b170d',percentage:100},
   {version_id:'b957257c-d265-4656-bd97-db6b5da81b71',percentage:0}
  ]},bindingCount:13,authPin:PINS.originalInactiveVersion,publicPublishingEnabled:false
 }
});

test('V127 permits only the four new source-only preflight paths',()=>{
 assert.equal(assertOnlyNewPreflightFiles(fourFiles),true);
 assert.throws(()=>assertOnlyNewPreflightFiles([...fourFiles,'creator-v1/canonical-auth/worker.mjs']),/Exactly four/);
 assert.throws(()=>assertOnlyNewPreflightFiles(fourFiles.slice(0,3)),/Exactly four/);
 assert.throws(()=>assertOnlyNewPreflightFiles([fourFiles[0],fourFiles[1],fourFiles[2],'docs/production/unreviewed.md']),/No UI, auth, Worker/);
});

test('V127 rejects forged provider approval, upload, fresh-readback and production flags',()=>{
 const gates={workerUploaded:false,workerActivated:false,trafficChanged:false,controllerPinChanged:false,
  accessChanged:false,memberDatabaseChanged:false,schemaMigrationApplied:false,
  authenticatedMemberAcceptance:false,physicalSafariAcceptance:false,productionApproved:false,
  freshProviderReadbackComplete:false,newControllerAuthPinVerified:false,packageReadyForPublicTraffic:false,
  immutableV125WorkerVersion:null,secretValuesIncluded:false,workerBundleVerified:true};
 assert.equal(assertBlocked(gates),true);
 for(const key of ['workerUploaded','controllerPinChanged','memberDatabaseChanged','physicalSafariAcceptance','freshProviderReadbackComplete','packageReadyForPublicTraffic']){
  assert.throws(()=>assertBlocked({...gates,[key]:true}),new RegExp(key));
 }
 assert.throws(()=>assertBlocked({...gates,immutableV125WorkerVersion:'pretend-version'}),/no provider version/);
});

test('V127 accepts a fresh exact frozen provider identity and rejects drift',()=>{
 const good=snapshot();
 assert.equal(verifyProviderReadback(good).status,'FROZEN_BASELINE_MATCHES_FRESH_GET');
 const wrongAuth=snapshot();wrongAuth.controller.authPin='unreviewed-candidate';
 assert.throws(()=>verifyProviderReadback(wrongAuth),/Existing controller pin/);
 const newRoute=snapshot();newRoute.apex.routes[1].script='unexpected-worker';
 assert.throws(()=>verifyProviderReadback(newRoute),/Route ownership drift/);
 const secretTypeDrift=snapshot();secretTypeDrift.apex.bindings[0].type='secret_text';
 assert.throws(()=>verifyProviderReadback(secretTypeDrift),/Binding name\/type drift/);
 const changedPublic=snapshot();changedPublic.apex.deployment.versions[0].percentage=99;
 assert.throws(()=>verifyProviderReadback(changedPublic),/strictly deep-equal/);
 const driftDb=snapshot();driftDb.apex.d1Bindings[0].database_id='changed';
 assert.throws(()=>verifyProviderReadback(driftDb),/D1 identity drift/);
 const driftFlag=snapshot();driftFlag.apex.safetyFlags.CANONICAL_XP_TEST_ENABLED='true';
 assert.throws(()=>verifyProviderReadback(driftFlag));
 const expired=snapshot();expired.readAtSeconds-=601;
 assert.throws(()=>verifyProviderReadback(expired),/Fresh/);
});

test('V127 manifest and dry-run configuration are never upload authorization',()=>{
 assert.match(PINS.archiveSha256,/^[0-9a-f]{64}$/);
 assert.match(PINS.workerSha256,/^[0-9a-f]{64}$/);
 const s=readFileSync(new URL('../ops/v127-v125-inactive-preflight.mjs',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../../.github/workflows/v127-v125-inactive-upload-dryrun.yml',import.meta.url),'utf8');
 assert.match(workflow,/wrangler versions upload --dry-run --no-bundle/);
 assert.match(workflow,/CLOUDFLARE_API_TOKEN: ''/);
 assert.match(workflow,/CLOUDFLARE_ACCOUNT_ID: ''/);
 assert.doesNotMatch(workflow,/\$\{\{\s*secrets\.CLOUDFLARE/);
 assert.doesNotMatch(s,/method\s*:\s*['"](?:PUT|POST|PATCH|DELETE)['"]/);
 assert.doesNotMatch(workflow,/wrangler versions deploy/);
});

test('V127 verifies all real archived root assets and Worker bytes, then produces local-only config', {skip:!packageRoot},()=>{
 const p=verifyPackage(packageRoot);
 assert.equal(p.assetCount,395);
 assert.equal(p.workerSha256,PINS.workerSha256);
 const config=localDryRunConfig(packageRoot);
 assert.equal(config.no_bundle,true);
 assert.equal(config.workers_dev,false);
 assert.equal(config.preview_urls,false);
 assert.deepEqual(config.routes,[]);
 assert.equal(config.d1_databases.length,2);
 assert.equal(config.assets.run_worker_first,true);
 assert.ok(!Object.keys(config).some(k=>/cloudflare_api_token|secret/i.test(k)));
 assert.equal(config.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 const receipt=makeDryRunReceipt(packageRoot);
 assert.equal(receipt.safeToRunActualUpload,false);
 assert.equal(receipt.publicDeploymentAuthorized,false);
 assert.equal(receipt.requiresSeparateOwnerApproval,true);
 assert.equal(receipt.immutableV125VersionId,null);
 assert.equal(receipt.providerSnapshotFresh,false);
});

test('V127 rejects one mutated Worker byte before any Wrangler command',{skip:!packageRoot},()=>{
 const temp=mkdtempSync(join(tmpdir(),'anevum-v127-tamper-'));
 try{
  cpSync(packageRoot,temp,{recursive:true});
  const gateway=join(temp,'worker-bundle/gateway.js');
  const bytes=readFileSync(gateway);
  bytes[42]^=1;
  writeFileSync(gateway,bytes);
  assert.throws(()=>verifyPackage(temp),/Worker bundle altered|Worker.*sha256/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});
