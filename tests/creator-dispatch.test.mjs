import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogWorker,catalogPage} from '../src/server/creator-dispatch.mjs';
const alice={id:'member-alice',emailVerified:true};
function fixture({user=alice,origin='https://anevum.com',configured=true,studioStatus=200,studio={viewerMemberId:alice.id,role:'owner'}}={}) {
  const calls=[],legacyCalls=[];
  const worker=createCatalogWorker({
    legacy:{async fetch(r){legacyCalls.push({path:new URL(r.url).pathname,method:r.method});return new URL(r.url).pathname==='/api/member/studio/status'?Response.json(studio,{status:studioStatus}):new Response('original route',{status:418});}},
    memberConfigured:()=>configured,resolveMemberOrigin:()=>origin,
    makeMemberAuth:()=>({api:{async getSession(){return user?{user}:null;}}}),
    safeMutation:(r,o)=>r.headers.get('Origin')===o,
    async endpoint(r,e,c){calls.push({path:new URL(r.url).pathname,method:r.method,context:c,body:r.method==='POST'?await r.text():null});return Response.json({ok:true});}
  });
  const request=(path,method='GET',headers={},body)=>worker.fetch(new Request('https://anevum.com'+path,{method,headers,...(body?{body}:{})}),{},{});
  return {request,calls,legacyCalls};
}
test('non-catalog paths delegate unchanged to original Worker',async()=>{
  const f=fixture();for(const path of ['/','/api/auth/get-session','/api/command/session','/api/member/rhen/workspace','/apps/rhen','/studio'])assert.equal((await f.request(path)).status,418);
  assert.equal(f.calls.length,0);assert.equal(f.legacyCalls.length,6);
});
test('public catalog reads need no session but cannot grant reviewer authority',async()=>{
  const f=fixture({user:null});assert.equal((await f.request('/api/catalog/projects')).status,200);assert.equal(f.calls[0].context,undefined);assert.equal(f.legacyCalls.length,0);
});
test('anonymous private access fails before the database endpoint',async()=>{
  const f=fixture({user:null});for(const path of ['/api/catalog/mine','/api/catalog/library','/api/member/studio/catalog'])assert.equal((await f.request(path)).status,401);assert.equal(f.calls.length,0);
});
test('unverified members and unauthorized origins fail closed',async()=>{
  const a=fixture({user:{...alice,emailVerified:false}});assert.equal((await a.request('/api/catalog/mine')).status,401);
  const b=fixture({origin:null});assert.equal((await b.request('/api/catalog/mine')).status,403);assert.equal(b.calls.length,0);
  const c=fixture({configured:false});assert.equal((await c.request('/api/catalog/mine')).status,503);
});
test('cross-origin and missing-Origin mutations are denied',async()=>{
  const f=fixture();for(const headers of [{},{Origin:'https://evil.org'},{Origin:'null'}])assert.equal((await f.request('/api/catalog/mine','POST',headers,'{}')).status,403);assert.equal(f.calls.length,0);
});
test('private request forwards only the authenticated identity',async()=>{
  const f=fixture();assert.equal((await f.request('/api/catalog/mine','POST',{Origin:'https://anevum.com','X-User-ID':'member-bob'},'{"owner_id":"member-bob"}')).status,200);
  assert.deepEqual(f.calls[0].context,{user:alice,reviewer:false});
});
test('Studio authorization failures cannot reach reviewer mutations',async()=>{
  const f=fixture({studioStatus:403});assert.equal((await f.request('/api/member/studio/catalog','GET')).status,403);assert.equal(f.calls.length,0);
  assert.deepEqual(f.legacyCalls,[{path:'/api/member/studio/status',method:'GET'}]);
});
test('Studio status must match the same member and allowed role',async()=>{
  for(const studio of [{viewerMemberId:'member-bob',role:'owner'},{viewerMemberId:alice.id,role:'member'},{role:'owner'}]) {
    const f=fixture({studio});assert.equal((await f.request('/api/member/studio/catalog')).status,403);assert.equal(f.calls.length,0);
  }
});
test('review mapping preserves request body after dual authorization',async()=>{
  const f=fixture();const body='{"expectedRevision":2,"decision":"REJECTED","note":"test note"}';
  assert.equal((await f.request('/api/member/studio/catalog/123','POST',{Origin:'https://anevum.com','Content-Type':'application/json'},body)).status,200);
  assert.equal(f.calls[0].path,'/api/catalog/review/123');assert.equal(f.calls[0].body,body);assert.equal(f.calls[0].context.reviewer,true);
});
test('direct review endpoint cannot bypass independent Studio checks',async()=>{
  const f=fixture();await f.request('/api/catalog/review');assert.equal(f.calls[0].context.reviewer,false);
});
test('catalog routes are explicit and do not capture private RHEN or unrelated URLs',()=>{
  for(const path of ['/discover','/publish','/library','/studio/catalog','/projects/00000000-0000-4000-8000-000000000001'])assert.ok(catalogPage(path));
  for(const path of ['/command','/apps/rhen','/products/rhen','/projects/../../studio','/projects/not-real','/api/catalog/mine'])assert.equal(catalogPage(path),null);
});
