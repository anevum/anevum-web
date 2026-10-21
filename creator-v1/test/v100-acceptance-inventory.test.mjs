import test from 'node:test';
import assert from 'node:assert/strict';
import {inventory} from '../ops/v100-acceptance-inventory.mjs';
const secret='never-publish-cookie-or-provider-binding';
const read=async(path,json=true)=>{
 if(!json)return '--random-boundary\n'+secret+'\n--random-boundary--';
 if(path.endsWith('/workers/routes'))return [{pattern:'anevum.com/__enter/v095-v096*',script:'fixture'}];
 if(path.endsWith('/settings'))return {bindings:[{name:'QA_ROUTING_TOKEN',type:'plain_text',text:secret},{name:secret,type:'secret_text'}]};
 if(path.endsWith('/deployments'))return {deployments:[{id:'fixture-deployment',versions:[{version_id:'fixture-version',percentage:100}],annotations:secret}]};
 if(path.includes('/versions/'))return {id:path.split('/').at(-1)};
 if(path.includes('/rulesets/'))return {rules:[{expression:secret}]};
 throw Error('Unexpected request');
};
test('only booleans, code digests and deployment IDs leave the audit',async()=>{
 const out=await inventory(read),encoded=JSON.stringify(out);
 assert.equal(out.readOnly,true);assert.equal(out.newCandidateExists,true);
 assert.ok(!encoded.includes(secret));assert.ok(!encoded.includes('random-boundary'));
 assert.ok(!encoded.includes('bindings'));assert.ok(!encoded.includes('annotations'));
 assert.match(out.entry.sourceDigest,/^[a-f0-9]{64}$/);
});
test('source digests do not change with multipart transport boundaries',async()=>{
 const a=await inventory(read),b=await inventory((path,json)=>json===false?Promise.resolve('--other-boundary\n'+secret+'\n--other-boundary--'):read(path,json));
 assert.equal(a.entry.sourceDigest,b.entry.sourceDigest);
});
test('missing or duplicate entry routes stop before inspecting any Worker',async()=>{
 for(const routes of [[],[{pattern:'anevum.com/__enter/v095-v096*'},{pattern:'anevum.com/__enter/v095-v096*'}]]){
  let calls=0;await assert.rejects(()=>inventory(async()=>{calls++;return routes;}));assert.equal(calls,1);
 }
});
