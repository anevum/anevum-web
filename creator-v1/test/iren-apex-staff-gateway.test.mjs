import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createIrenApexStaffWorker} from '../staff-portal/worker.mjs';

const BASE='https://anevum.com',API='/api/v1/member/staff-ops',REVIEW='/api/v1/member/forum-review';
const make=(path,method='GET',body,headers={})=>new Request(BASE+path,{
 method,
 headers:{...(body===undefined?{}:{'content-type':'application/json'}),...headers},
 body:body===undefined?undefined:JSON.stringify(body)
});
function setup(){
 const f=fixture();
 for(const file of ['0006_member_community_forums.sql','0010_staff_command.sql','0011_staff_roles.sql'])
  f.db.exec(readFileSync(new URL('../canonical-auth/migrations/'+file,import.meta.url),'utf8'));
 f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
  .run('founder','Founder Test','founder@synthetic.invalid',1,'2026-10-17T12:00:00.000Z','2026-10-17T12:00:00.000Z');
 f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
  .run('outsider','Outsider Test','outsider@synthetic.invalid',1,'2026-10-17T12:30:00.000Z','2026-10-17T12:30:00.000Z');
 f.db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES('founder','owner','founder',1234,1234)").run();
 const log=[],router=createIrenApexStaffWorker();
 const env={...f.env,CANONICAL_STAFF_OPS_ENABLED:'true',CANONICAL_FORUM_ENABLED:'true',
  APEX_AUTH:{async fetch(request){
   log.push({endpoint:new URL(request.url).pathname,cookie:request.headers.get('cookie'),
    leaked:request.headers.get('authorization')!==null});
   if(request.headers.get('cookie')==='auth=owner')return Response.json({
    session:{userId:'founder',id:'synthetic-signed-session'},user:{id:'founder',emailVerified:true}});
   if(request.headers.get('cookie')==='auth=outsider')return Response.json({
    session:{userId:'outsider',id:'synthetic-signed-session'},user:{id:'outsider',emailVerified:true}});
   if(request.headers.get('cookie')==='auth=unverified')return Response.json({
    session:{userId:'founder',id:'synthetic-signed-session'},user:{id:'founder',emailVerified:false}});
   return Response.json({session:null,user:null});
  }},
  ASSETS:{async fetch(request){
   const path=new URL(request.url).pathname;
   log.push({asset:path});
   if(path==='/index.html')return new Response('<!DOCTYPE html><html><body>STAFF PREVIEW</body></html>',{headers:{'content-type':'text/html; charset=utf-8'}});
   if(path==='/assets/index.js')return new Response('console.log("synthetic")',{headers:{'content-type':'application/javascript'}});
   return new Response('Not Found',{status:404});
  }}
 };
 return {...f,env,router,log,call:(path,method='GET',body,headers={})=>router.fetch(make(path,method,body,headers),env)};
}
const json=async r=>r.json();

test('IREN V002 isolated Worker: only the exact permanent domain and staff paths are routable',async()=>{
 const f=setup();try{
  for(const path of ['/', '/join','/community','/assets/index.js','/staffing','/api/v1/member/auth/get-session','/api/v1/member/supporter']){
   assert.equal((await f.call(path)).status,404,path);
  }
  assert.equal((await f.router.fetch(new Request('https://a.anevum.com/staff'),f.env)).status,404);
  assert.equal((await f.router.fetch(new Request('http://anevum.com/staff'),f.env)).status,404);
  const html=await f.call('/staff');
  assert.equal(html.status,200);
  assert.match(await html.text(),/STAFF PREVIEW/);
  assert.match(html.headers.get('content-security-policy'),/default-src 'none'/);
  assert.match(html.headers.get('permissions-policy'),/camera=\(self\)/);
  assert.match(html.headers.get('cache-control'),/no-store/);
  const asset=await f.call('/staff/assets/index.js');
  assert.equal(asset.status,200);
  assert.match(asset.headers.get('cache-control'),/immutable/);
  assert.ok(f.log.some(r=>r.asset==='/assets/index.js'));
  assert.equal((await f.call('/staff/assets/test/too/deep.js')).status,404);
 }finally{f.db.close()}
});

test('IREN V002 isolated Worker: service-binding identity required, forged headers and expired/unverified sessions denied',async()=>{
 const f=setup();try{
  assert.equal((await f.call(API)).status,401);
  assert.equal((await f.call(API,'GET',undefined,{'x-user-id':'founder'})).status,401);
  assert.equal((await f.call(API,'GET',undefined,{cookie:'auth=outsider'})).status,403);
  assert.equal((await f.call(API,'GET',undefined,{cookie:'auth=unverified'})).status,401);
  const owner=await f.call(API,'GET',undefined,{cookie:'auth=owner',authorization:'Bearer malicious'});
  assert.equal(owner.status,200);
  const payload=await json(owner);
  assert.equal(payload.role,'owner');
  assert.equal(payload.memberMetrics.total,2);
  assert.equal(payload.memberMetrics.verified,2);
  assert.equal(payload.memberMetrics.profiles,0);
  assert.equal(payload.eligibleMembers.length,1);
  assert.equal(payload.eligibleMembers[0].id,'outsider');
  assert.equal(f.log.some(r=>r.leaked),false);
  assert.ok(f.log.some(r=>r.endpoint==='/api/v1/member/auth/get-session'));
  assert.doesNotMatch(JSON.stringify(payload),/@synthetic\.invalid/);
 }finally{f.db.close()}
});

test('IREN V002 isolated Worker: same-origin CSRF guard, audited reviewer grant, chat and revocation',async()=>{
 const f=setup();try{
  const header={cookie:'auth=owner','content-type':'application/json'};
  assert.equal((await f.call(API,'POST',{kind:'message',room:'operations',body:'test'},header)).status,403);
  assert.equal((await f.call(API,'POST',{kind:'staff-grant',memberId:'outsider'},
   {...header,origin:'https://foreign.example'})).status,403);
  assert.equal((await f.call(API,'POST',{kind:'staff-grant',memberId:'outsider'},
   {...header,origin:BASE,'sec-fetch-site':'cross-site'})).status,403);
  const accepted={...header,origin:BASE,'sec-fetch-site':'same-origin'};
  assert.equal((await f.call(API,'POST',{kind:'staff-grant',memberId:'outsider'},accepted)).status,200);
  assert.equal((await f.call(API,'GET',undefined,{cookie:'auth=outsider'})).status,200);
  assert.equal((await f.call(API,'POST',{kind:'message',room:'operations',body:'A staff message'},accepted)).status,201);
  assert.equal((await f.call(API,'POST',{kind:'staff-revoke',memberId:'outsider'},accepted)).status,200);
  assert.equal((await f.call(API,'GET',undefined,{cookie:'auth=outsider'})).status,403);
  assert.deepEqual(f.db.prepare('SELECT action FROM staff_access_audit ORDER BY created_at,id').all().map(x=>x.action).sort(),
   ['grant-reviewer','revoke-reviewer']);
 }finally{f.db.close()}
});

test('IREN V002 isolated Worker: existing independent moderation endpoint uses active canonical staff grant',async()=>{
 const f=setup();try{
  const response=await f.call(REVIEW,'GET',undefined,{cookie:'auth=owner'});
  assert.equal(response.status,200);
  assert.deepEqual((await json(response)).threads,[]);
  assert.equal((await f.call(REVIEW,'GET',undefined,{cookie:'auth=outsider'})).status,403);
  assert.equal((await f.call(REVIEW,'POST',{targetKind:'thread',targetId:'invalid',action:'publish'},
   {cookie:'auth=owner',origin:BASE,'content-type':'application/json'})).status,400);
  f.env.CANONICAL_STAFF_OPS_ENABLED='false';
  assert.equal((await f.call(API,'GET',undefined,{cookie:'auth=owner'})).status,404);
  assert.equal((await f.call('/staff')).status,404);
 }finally{f.db.close()}
});
