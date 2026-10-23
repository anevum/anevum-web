import test from 'node:test';
import assert from 'node:assert/strict';
import {baseline} from '../ops/apex-worker-bundle-v112.mjs';
import {verifyBefore,verifyAfter,UPLOAD_MESSAGE} from '../ops/apex-inactive-upload-v113.mjs';

const NEW='11111111-2222-4333-8444-555555555555';
function snapshot(){
 const s=structuredClone(baseline);
 s.publicVersion.resources.script={etag:'a'.repeat(64)};
 s.candidateVersion.resources.script={etag:'b'.repeat(64)};
 s.versions=[{id:s.publicVersion.id},{id:s.candidateVersion.id}];
 return s;
}
function uploaded(){
 const s=snapshot(),before=verifyBefore(s);
 s.versions.unshift({id:NEW});
 const candidate={id:NEW,annotations:{'workers/message':UPLOAD_MESSAGE},resources:structuredClone(s.candidateVersion.resources)};
 candidate.resources.script.etag='c'.repeat(64);
 return {s,before,candidate};
}
test('one exact inactive version preserves public deployment, routes, secrets and closed uploads',()=>{
 const f=uploaded(),r=verifyAfter(f.before,f.s,f.candidate);
 assert.equal(r.newVersionTrafficPercent,0);assert.equal(r.publicPercent,100);
 assert.equal(r.newVersionInDeployment,false);assert.equal(r.bindingSignaturesPreserved,true);
 assert.equal(r.productionReleaseApproved,false);assert.equal(r.authenticatedAcceptance,false);
 assert.equal(r.nativeAuthPinRemediated,false);assert.equal(r.creatorUploadsEnabled,false);
});
test('baseline drift blocks preflight before a writer can run',()=>{
 for(const mutate of [s=>s.deployment.id='changed',s=>s.settings.bindings.pop(),s=>s.routes.pop(),s=>s.exposure.enabled=true]){
  const s=snapshot();mutate(s);assert.throws(()=>verifyBefore(s));
 }
});
test('zero or two introduced versions are never reported as the intended upload',()=>{
 for(const count of [0,2]){
  const f=uploaded();f.s.versions=f.s.versions.filter(v=>v.id!==NEW);
  for(let i=0;i<count;i++)f.s.versions.push({id:i===0?NEW:'22222222-3333-4444-8555-666666666666'});
  assert.throws(()=>verifyAfter(f.before,f.s,f.candidate),/exactly one/);
 }
});
test('unrequested traffic and active deployment changes fail postflight',()=>{
 const f=uploaded();f.s.deployment.versions[1].version_id=NEW;
 assert.throws(()=>verifyAfter(f.before,f.s,f.candidate));
 const g=uploaded();g.s.deployment.versions[0].percentage=99;
 assert.throws(()=>verifyAfter(g.before,g.s,g.candidate));
});
test('candidate secret loss, added services, flag and database drift are blocked',()=>{
 for(const mutate of [
  c=>c.resources.bindings.splice(c.resources.bindings.findIndex(x=>x.type==='secret_text'),1),
  c=>c.resources.bindings.push({name:'EXTRA_SERVICE',type:'service',service:'other'}),
  c=>c.resources.bindings.find(x=>x.name==='CANONICAL_CREATOR_UPLOADS_ENABLED').text='true',
  c=>c.resources.bindings.find(x=>x.name==='MEMBER_DB').database_id='changed'
 ]){const f=uploaded();mutate(f.candidate);assert.throws(()=>verifyAfter(f.before,f.s,f.candidate));}
});
test('runtime drift, incorrect annotation and unchanged historical bundle are blocked',()=>{
 for(const mutate of [
  c=>c.resources.script_runtime.assets.base_path='/creator/',
  c=>c.annotations['workers/message']='wrong source',
  c=>c.resources.script.etag='b'.repeat(64)
 ]){const f=uploaded();mutate(f.candidate);assert.throws(()=>verifyAfter(f.before,f.s,f.candidate));}
});
test('operational settings and route ownership remain locked across an upload',()=>{
 const f=uploaded();f.s.settings.logpush=true;assert.throws(()=>verifyAfter(f.before,f.s,f.candidate),/settings/);
 const g=uploaded();g.s.routes[0].script='other';assert.throws(()=>verifyAfter(g.before,g.s,g.candidate));
});
test('upload attribution alone may change while operational settings stay identical',()=>{
 const f=uploaded();f.s.settings.annotations={'workers/message':UPLOAD_MESSAGE};
 assert.equal(verifyAfter(f.before,f.s,f.candidate).operationalSettingsUnchanged,true);
});
