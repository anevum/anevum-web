import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {baseline,verifyRuntimeSnapshot,createOfflineConfig,verifyFrontend,FRONTEND_SOURCE} from '../ops/apex-worker-bundle-v112.mjs';
import {verifyCandidateAssets} from '../ops/v095-inactive-candidate-gate.mjs';

test('offline config reconciles immutable 26 bindings, root assets and closed upload/XP gates',()=>{
 const c=createOfflineConfig(baseline,'/repo','/assets');
 assert.equal(c.vars.CANONICAL_XP_TEST_ENABLED,'false');
 assert.equal(c.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(c.vars.CANONICAL_PACKAGE_PROOF_ENABLED,'true');
 assert.equal(c.vars.ANEVUM_PRELAUNCH_MODE,'public');
 assert.deepEqual(c.routes,[]);
 assert.equal(c.workers_dev,false);assert.equal(c.preview_urls,false);
 assert.equal(c.assets.directory,'/assets');assert.equal(c.assets.run_worker_first,true);
 assert.equal(c.main,'/repo/creator-v1/apex-prelaunch/gateway.mjs');
 assert.equal(c.d1_databases.length,2);
 const secretNames=verifyRuntimeSnapshot(baseline).secrets;
 assert.equal(secretNames.length,5);
 assert.ok(secretNames.every(name=>!(name in c.vars)));
});
test('changed deployment, public weight and rollback version block packaging',()=>{
 for(const change of [s=>s.deployment.id='other',s=>s.deployment.versions[0].percentage=99,s=>s.publicVersion.id='other']){
  const s=structuredClone(baseline);change(s);assert.throws(()=>verifyRuntimeSnapshot(s));
 }
});
test('binding/publishing-gate drift and unknown binding types block packaging',()=>{
 for(const change of [
  s=>s.settings.bindings.find(x=>x.name==='CANONICAL_CREATOR_UPLOADS_ENABLED').text='true',
  s=>s.candidateVersion.resources.bindings.find(x=>x.name==='MEMBER_DB').database_id='other',
  s=>s.candidateVersion.resources.bindings.push({name:'UNKNOWN',type:'service',service:'other'})
 ]){const s=structuredClone(baseline);change(s);assert.throws(()=>verifyRuntimeSnapshot(s));}
});
test('secret material, route retargeting and preview exposure fail closed',()=>{
 for(const change of [
  s=>s.candidateVersion.resources.bindings.find(x=>x.type==='secret_text').text='synthetic-secret',
  s=>s.routes[0].script='other',s=>s.exposure.previews_enabled=true
 ]){const s=structuredClone(baseline);change(s);assert.throws(()=>verifyRuntimeSnapshot(s));}
});

function fixture(){
 const root=mkdtempSync(join(tmpdir(),'apex-worker-package-'));
 const put=(path,data)=>{const p=join(root,path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,data);};
 for(let level=1;level<=30;level++)for(const suffix of ['-scene.gz','-1024.webp','-256.webp','-compact-128.png','-field.svg'])
  put('evolution/assets/level-'+String(level).padStart(2,'0')+suffix,'x'.repeat(301));
 put('evolution/assets/extra-a','x');put('evolution/assets/extra-b','x');
 put('evolution/mini-runtime.json','x'.repeat(6001));
 put('index.html','<div id="root"></div><a>Skip to content</a><link rel="stylesheet" href="/assets/app.css"><script src="/assets/app.js"></script>'+' '.repeat(1001));
 put('assets/app.js','export default 1;');put('assets/app.css','body{}');
 const files=verifyCandidateAssets(root).assets;
 const manifest={sourceSha:FRONTEND_SOURCE,status:'EXACT_SOURCE_FRONTEND_DRY_RUN',assetBase:'/',runtimePath:'/',entry:'index.html',
  clientFlags:{VITE_IREN_SPATIAL_GUIDE:true,VITE_NATIVE_CREATOR_STUDIO_V095:true,VITE_PACKAGE_CREATOR_GALLERY_V010:true},
  uploadedToCloudflare:false,publicTrafficChanged:false,databaseModified:false,productionReleaseApproved:false,
  physicalSafariAcceptance:false,authenticatedFounderReviewerAndMemberAcceptance:false,files,assetCount:files.length};
 return {root,put,manifest,cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('complete frontend inventory is checked against the source-bound retained manifest',()=>{
 const f=fixture();try{assert.equal(verifyFrontend(f.root,f.manifest).earned_media_count,152);}finally{f.cleanup();}
});
test('altered frontend bytes and additional assets cannot silently enter bundle',()=>{
 for(const path of ['assets/app.js','assets/extra.js']){
  const f=fixture();try{f.put(path,'changed');assert.throws(()=>verifyFrontend(f.root,f.manifest),/inventory\/bytes/);}finally{f.cleanup();}
 }
});
test('unreviewed source, incorrect manifest inventory and invented acceptance are rejected',()=>{
 const f=fixture();try{for(const change of [m=>m.sourceSha='a'.repeat(40),m=>m.assetCount++,m=>m.physicalSafariAcceptance=true,m=>m.productionReleaseApproved=true]){
  const m=structuredClone(f.manifest);change(m);assert.throws(()=>verifyFrontend(f.root,m));
 }}finally{f.cleanup();}
});
test('public source maps and omitted earned assets block packaging',()=>{
 const f=fixture();try{f.put('assets/app.js.map','{}');assert.throws(()=>verifyFrontend(f.root,f.manifest),/source map/);}finally{f.cleanup();}
 const g=fixture();try{rmSync(join(g.root,'evolution/assets/level-04-scene.gz'));assert.throws(()=>verifyFrontend(g.root,g.manifest),/152/);}finally{g.cleanup();}
});
