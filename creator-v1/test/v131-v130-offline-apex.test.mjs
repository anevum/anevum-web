import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 REVIEWED_V130,REVIEWED_V125,REQUIRED_FLAGS,WORKER,APPROVED_PLAYER_FILES,assertReviewedPlayerDelta,
 assertAllowedSourceDelta,verifyFlags,verifyBrowserEvidence,
 verifyFrozenRuntime,validateNeverActivated
} from '../ops/v131-v130-offline-apex.mjs';

const files=[
 '.github/workflows/v131-v130-offline-apex-package.yml',
 'creator-v1/ops/v131-v130-offline-apex.mjs',
 'creator-v1/test/v131-v130-offline-apex.test.mjs',
 'docs/production/v131-v130-offline-apex-20261023.md'
];
const browser=()=>({status:'PASS',source:'OFFLINE SYNTHETIC APEX ROOT',
 runtimeExceptions:0,authenticatedAcceptance:false,physicalSafariAcceptance:false,productionApproved:false,
 results:[320,390,1440].map(width=>({width,rootMounted:true,cssLoaded:true,cssJsHttp200:true,
 syntheticOnly:true,chromiumNotSafari:true,script:'/assets/site.js',style:'/assets/site.css'}))});
const pending=()=>({worker:WORKER,workerUploaded:false,workerActivated:false,trafficChanged:false,
 controllerPinChanged:false,accessChanged:false,memberDatabaseChanged:false,
 schemaMigrationApplied:false,authenticatedMemberAcceptance:false,physicalSafariAcceptance:false,
 productionApproved:false,freshProviderReadbackComplete:false,newControllerAuthPinVerified:false,
 packageReadyForPublicTraffic:false});

test('V131 ties the package to final reviewed V130, not V116 or historical merged source',()=>{
 assert.equal(REVIEWED_V130,'d02f524305213ae785821d8b6d8bfce7948b1eb2');
 assert.equal(REVIEWED_V125,'6aff161a60d2e86310acf25df4265a8bab326f7d');
 assert.equal(Object.keys(REQUIRED_FLAGS).length,3);
 assert.equal(assertAllowedSourceDelta(files),true);
 for(const path of ['creator-v1/web/src/main.tsx','creator-v1/apex-prelaunch/gateway.mjs',
  'creator-v1/canonical-auth/worker.mjs','.github/workflows/v118-v116-inactive-upload.yml'])
  assert.throws(()=>assertAllowedSourceDelta([...files,path]),/Application\/Worker\/auth or unrelated source/);
 assert.throws(()=>assertAllowedSourceDelta([]),/separate review-only packaging change/);
});

test('V131 explicitly preserves exact-on production V116 feature flags in root bundle',()=>{
 assert.deepEqual(verifyFlags({VITE_IREN_SPATIAL_GUIDE:'true',VITE_NATIVE_CREATOR_STUDIO_V095:'true',
  VITE_PACKAGE_CREATOR_GALLERY_V010:'true'}),REQUIRED_FLAGS);
 for(const x of Object.keys(REQUIRED_FLAGS)){
  const flags=Object.fromEntries(Object.keys(REQUIRED_FLAGS).map(y=>[y,'true']));flags[x]='false';
  assert.throws(()=>verifyFlags(flags),/not explicitly enabled/);
 }
});

test('V131 requires complete compiled root 320/390/1440 browser proof; never calls it Safari or auth acceptance',()=>{
 assert.equal(verifyBrowserEvidence(browser()),true);
 for(const width of [320,390,1440]){
  const b=browser();b.results=b.results.filter(x=>x.width!==width);
  assert.throws(()=>verifyBrowserEvidence(b),/actual root capture required/);
 }
 for(const mutate of [b=>b.results[0].cssLoaded=false,b=>b.results[1].cssJsHttp200=false,
  b=>b.authenticatedAcceptance=true,b=>b.physicalSafariAcceptance=true,b=>b.productionApproved=true]){
  const b=browser();mutate(b);assert.throws(()=>verifyBrowserEvidence(b));
 }
});

test('V131 preserves 40 routes, 26 bindings and all frozen public/0% version identities without secrets',()=>{
 const b=verifyFrozenRuntime();
 assert.equal(b.bindingCount,26);assert.equal(b.routeCount,40);
 assert.equal(b.secretNames.length,5);
 assert.equal(b.previousPublicVersion,'93cc7f07-cf39-457e-af69-c9f6f4c02d25');
 assert.equal(b.previousInactiveVersion,'86dc4b9d-4020-432a-8a15-e65606f31316');
});

test('V131 sealed manifest cannot claim upload, staging, migration, physical testing or traffic promotion',()=>{
 assert.equal(validateNeverActivated(pending()),true);
 for(const key of Object.keys(pending()).filter(x=>x!=='worker')){
  const data=pending();data[key]=true;
  assert.throws(()=>validateNeverActivated(data));
 }
 const source=readFileSync(new URL('../ops/v131-v130-offline-apex.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/cloudflare\.request|fetch\(['"]https:\/\/api\.cloudflare\.com/);
 assert.match(source,/offline\.synthetic\.json/);
 assert.match(source,/immutableV130WorkerVersion:null/);
});

test('V131 locks V130 to the exact three-file player repair on V125',()=>{
 assert.equal(APPROVED_PLAYER_FILES.length,3);
 assert.equal(assertReviewedPlayerDelta([...APPROVED_PLAYER_FILES]),true);
 assert.throws(()=>assertReviewedPlayerDelta([...APPROVED_PLAYER_FILES,'creator-v1/apex-prelaunch/gateway.mjs']),/approved mobile-player repair/);
 assert.throws(()=>assertReviewedPlayerDelta(APPROVED_PLAYER_FILES.slice(1)),/approved mobile-player repair/);
});
