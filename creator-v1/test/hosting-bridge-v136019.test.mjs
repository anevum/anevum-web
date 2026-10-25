import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectStaticBundle,managedObjectKey,staticFilePath,calculateHostingHeadroom,estimateStandardR2Budget} from '../shared/hosting-contract-v136019.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const SHA='a'.repeat(64);
const ID='be295ade-3b14-4a0a-84ea-000000000001';
const entry={path:'index.html',contentType:'text/html',sizeBytes:123,sha256:SHA};
test('portable release manifest accepts safe static browser files only',()=>{
 const ok=inspectStaticBundle([entry,{path:'assets/ui/logo.png',contentType:'image/png',sizeBytes:124,sha256:SHA}]);
 assert.equal(ok.ok,true);assert.equal(ok.fileCount,2);assert.equal(ok.totalBytes,247);
 assert.equal(Object.isFrozen(ok.files),true);
});
test('hosted object paths reject traversal, hidden, private, and server material',()=>{
 for(const path of ['../index.html','/index.html','x/../index.html','x//y.js','x\\y.js',
  'x/.env','foo/','foo%2Fbar.js','node_modules/index.js','private/config.json',
  'secrets/private.js','file with spaces.js','a?x=1','a#b.js']){
  assert.equal(staticFilePath(path),null,path);
  assert.equal(inspectStaticBundle([{...entry,path}]).ok,false,path);
 }
 const caseCollision=inspectStaticBundle([entry,{...entry,path:'INDEX.HTML'}]);
 assert.equal(caseCollision.ok,false);
 assert.equal(inspectStaticBundle([{...entry,path:'foo.js'}]).ok,false);
 assert.equal(inspectStaticBundle([{...entry,sizeBytes:13*1048576}]).ok,false);
 assert.equal(inspectStaticBundle([{...entry,contentType:'application/javascript'}]).ok,false);
 assert.equal(inspectStaticBundle([{...entry,sha256:'x'}]).ok,false);
 assert.equal(inspectStaticBundle(Array.from({length:181},(_,i)=>({...entry,path:'a/'+i+'.js',contentType:'text/javascript'}))).ok,false);
});
test('immutable keys include phase, owner, project, exact release and hash',()=>{
 const input={ownerId:ID,projectId:ID,releaseId:ID,sha256:SHA,path:'index.html'};
 assert.equal(managedObjectKey(input),'hosted-static/v1/staged/'+ID+'/'+ID+'/'+ID+'/'+SHA+'/index.html');
 assert.equal(managedObjectKey(input,'released'),'hosted-static/v1/released/'+ID+'/'+ID+'/'+ID+'/'+SHA+'/index.html');
 assert.throws(()=>managedObjectKey({...input,path:'../secret'}));
 assert.throws(()=>managedObjectKey({...input,ownerId:'unknown'}));
 assert.throws(()=>managedObjectKey(input,'public'));
});
test('storage headroom is bounded by both private and global quotas',()=>{
 const ok=calculateHostingHeadroom({memberUsedBytes:50,memberLimitBytes:100,
 pilotUsedBytes:90,pilotLimitBytes:100,projectFileCount:19,projectFileLimit:20});
 assert.deepEqual({left:ok.remainingBytes,slots:ok.remainingFiles,canUpload:ok.canQueueFile},{left:10,slots:1,canUpload:true});
 assert.equal(calculateHostingHeadroom({memberUsedBytes:120,memberLimitBytes:100,
 pilotUsedBytes:0,pilotLimitBytes:100,projectFileCount:0,projectFileLimit:20}).remainingBytes,0);
 assert.equal(calculateHostingHeadroom({memberUsedBytes:NaN,memberLimitBytes:100,
 pilotUsedBytes:0,pilotLimitBytes:100,projectFileCount:0,projectFileLimit:20}).ok,false);
});
test('R2 cost planner requires explicit rates and excludes unknown infrastructure',()=>{
 const r=estimateStandardR2Budget({storageGbMonths:100,writeRequests:1_100_000,readRequests:10_000_000},
  {storagePerGbMonth:.015,writesPerMillion:4.5,readsPerMillion:.36,
   includedGbMonths:10,includedWrites:1_000_000,includedReads:10_000_000});
 assert.equal(r.ok,true);assert.equal(r.estimatedStorageAndR2OpsUSD,5.85);
 assert.match(r.excluded,/Workers/);
 assert.equal(estimateStandardR2Budget({storageGbMonths:1,writeRequests:0,readRequests:0},{}).ok,false);
});
test('hosting readout is attached to verified Studio vault, not a public endpoint',()=>{
 const page=read('../web/src/pages/CanonicalStudioPage.tsx');
 const resolver=read('../web/src/lib/studio-hosting-v136019.ts');
 const css=read('../web/src/pages/studio-hosting-v136019.css');
 assert.match(page,/const hosting=studioHostingPaths/);
 assert.match(page,/studioAssets\(project\.id/);
 assert.match(page,/PRIVATE QUARANTINE/);
 assert.match(page,/av019-hosting-options/);
 assert.match(page,/data-hosting-status=\{option\.status\}/);
 assert.match(resolver,/status:'planned'/);
 assert.match(resolver,/nativeStudioEnabled/);
 assert.ok(!/fetch\(|localStorage|sessionStorage|postMessage|setInterval/.test(resolver));
 assert.match(css,/@media\(max-width:710px\)/);
 assert.ok(!/@font-face|@import|url\(\s*https?:/.test(css));
});
