// IREN staff auth-boundary regression, all identities are synthetic.
// This test never creates a real account, role or public deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createIrenApexStaffWorker} from '../staff-portal/worker.mjs';

const url='https://anevum.com/api/v1/member/staff-ops';
const worker=createIrenApexStaffWorker();
function fakeEnvironment(payload) {
 return {
  CANONICAL_STAFF_OPS_ENABLED:'true',
  APEX_AUTH:{async fetch(){return Response.json(payload)}}
 };
}
test('IREN V003 denies mismatched identities and invalid session responses',async()=>{
 const inFuture=new Date(Date.now()+3600*1000).toISOString();
 const inPast=new Date(Date.now()-3600*1000).toISOString();
 const cases=[
  null,
  {session:null,user:null},
  {session:{id:'s',userId:'one',expiresAt:inFuture},user:{id:'two',emailVerified:true}},
  {session:{id:'s',userId:'one',expiresAt:inFuture},user:{id:'one',emailVerified:false}},
  {session:{id:'s',userId:'one',expiresAt:inFuture},user:{id:12,emailVerified:true}},
  {session:'invalid',user:{id:'one',emailVerified:true}},
  {session:{userId:'one',expiresAt:inFuture},user:{id:'one',emailVerified:true}},
  {session:{id:'s',userId:'one'},user:{id:'one',emailVerified:true}},
  {session:{id:'s',userId:'one',expiresAt:'not-a-date'},user:{id:'one',emailVerified:true}},
  {session:{id:'s',userId:'one',expiresAt:inPast},user:{id:'one',emailVerified:true}}
 ];
 for(const payload of cases){
  const response=await worker.fetch(new Request(url,{headers:{cookie:'synthetic'}}),fakeEnvironment(payload));
  assert.equal(response.status,401,JSON.stringify(payload));
 }
});


test('IREN V005 forwards only valid, Cloudflare-edge client IP to its private session verifier',async()=>{
 const payload={
  session:{id:'synthetic-session',userId:'one',expiresAt:new Date(Date.now()+3600*1000).toISOString()},
  user:{id:'one',emailVerified:true}
 };
 const observed=[];
 const env={CANONICAL_STAFF_OPS_ENABLED:'true',APEX_AUTH:{async fetch(request){
  observed.push({
   ip:request.headers.get('cf-connecting-ip'),
   forwarded:request.headers.get('x-forwarded-for'),
   injectedIdentity:request.headers.get('x-user-id'),
   cookie:request.headers.get('cookie')
  });
  return Response.json(payload);
 }}};
 const make=(ip,edge)=>{
  const request=new Request(url,{headers:{
   cookie:'fixture-session', 'cf-connecting-ip':ip,
   'x-forwarded-for':'192.0.2.200', 'x-user-id':'forged'
  }});
  if(edge)Object.defineProperty(request,'cf',{value:{colo:'MCO'}});
  return request;
 };
 // Without Cloudflare edge metadata, never trust a caller-defined IP claim.
 assert.equal((await worker.fetch(make('198.51.100.42',false),env)).status,403);
 // With edge metadata, forward the bounded IPv4/IPv6 address as Better Auth expects.
 assert.equal((await worker.fetch(make('198.51.100.42',true),env)).status,403);
 assert.equal((await worker.fetch(make('2001:db8::42',true),env)).status,403);
 assert.equal((await worker.fetch(make('invalid::host',true),env)).status,403);
 assert.deepEqual(observed.map(x=>x.ip),[null,'198.51.100.42','2001:db8::42',null]);
 assert.ok(observed.every(x=>x.cookie==='fixture-session'));
 assert.ok(observed.every(x=>x.forwarded===null&&x.injectedIdentity===null),
  'Only the actual signed session cookie and Cloudflare edge IP may cross the service binding');
});
