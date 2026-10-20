import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {fixture} from './helpers/canonical-fixture.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('both canonical fetch clients override inherited no-referrer without changing same-origin mode',()=>{
 const source=read('web/src/lib/canonical-beta.ts');
 const calls=source.split('const response=await fetch(path,').slice(1);
 assert.equal(calls.length,2);
 for(const call of calls){const options=call.split('if(!response.ok)')[0];assert.match(options,/mode:"same-origin"/);assert.match(options,/referrerPolicy:"same-origin"/);assert.match(options,/redirect:"error"/)}
 const stage=read('web/a-staging-worker.mjs');
 assert.match(stage,/"referrer-policy":"no-referrer"/);
 assert.match(stage,/img-src 'self' data: blob:;/);
 assert.match(stage,/connect-src 'self';/);
 assert.doesNotMatch(stage,/script-src[^;]*blob:/);
});
test('server still rejects null, absent and foreign Origin while corrected browser requests reach auth',async()=>{
 const {db,env}=fixture();let sessions=0;
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async()=>{sessions++;return null}}})});
 try{
  for(const method of ['POST','PATCH','PUT','DELETE'])for(const origin of [null,'null','https://evil.invalid','https://anevum.com']){
   const r=await worker.fetch(new Request('https://a.anevum.com/api/v1/member/creator-profile',{method,headers:{...(origin===null?{}:{origin}),'content-type':'application/json'},body:'{}'}),env);
   assert.equal(r.status,['POST','PATCH'].includes(method)?403:404);
  }
  assert.equal(sessions,0);
  const r=await worker.fetch(new Request('https://a.anevum.com/api/v1/member/creator-profile',{method:'POST',headers:{origin:'https://a.anevum.com','content-type':'application/json'},body:'{}'}),env);
  assert.equal(r.status,401);assert.equal(sessions,1);
 }finally{db.close()}
});
