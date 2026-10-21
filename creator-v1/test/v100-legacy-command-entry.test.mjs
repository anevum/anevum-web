import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyCommandEntry} from '../operations/anevum-iren-legacy-command-entry-v002.mjs';
import nativeStaffEntry from '../operations/anevum-iren-staff-entry-v003.mjs';

const origin='https://anevum.com';
const req=(url,method='GET',headers={})=>new Request(url,{method,headers});

test('both exact legacy Command paths hand off to the staff-verified native entry',async()=>{
 for(const path of ['/staff/command','/staff/command/']){
  const response=legacyCommandEntry(req(origin+path));
  assert.equal(response.status,302);
  assert.equal(response.headers.get('location'),'/staff?view=command');
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  assert.equal(response.headers.get('set-cookie'),null);
  assert.equal(response.headers.get('access-control-allow-origin'),null);
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal(await response.text(),'');
 }
});
test('HEAD follows same scoped 302 without body',async()=>{
 const response=legacyCommandEntry(req(origin+'/staff/command','HEAD'));
 assert.equal(response.status,302);
 assert.equal(await response.text(),'');
});
test('no attacker-supplied next or query reaches the native staff entry',async()=>{
 for(const query of ['?next=https://evil.example/','?view=report&redirect=/admin',
                       '?access_token=fake','?view=command']){
  const response=legacyCommandEntry(req(origin+'/staff/command'+query));
  assert.equal(response.status,302);
  assert.equal(response.headers.get('location'),'/staff?view=command');
  assert.equal(response.headers.get('set-cookie'),null);
 }
});
test('no anonymous or malicious API route is proxied',async()=>{
 for(const path of ['/staff','/staff/observatory','/staff/projects',
  '/staff/command/api','/staff/command/assets/foo.js','/api/v1/member/staff-ops',
  '/api/v1/member/forum-review','/staff/commandx','/staff/command//']){
  assert.equal(legacyCommandEntry(req(origin+path)).status,404,path);
 }
});
test('untrusted origin, scheme, host and embedded credentials never redirect',async()=>{
 for(const url of ['https://evil.example/staff/command','https://anevum.com.evil.example/staff/command',
  'https://user:pass@anevum.com/staff/command','http://anevum.com/staff/command']){
  // WHATWG Request refuses credential-bearing URLs before the Worker can
  // validate them. Feed that malformed URL as a minimal request stub instead.
  const request=url.includes('@')?{url,method:'GET'}:req(url);
  assert.equal(legacyCommandEntry(request).status,404,url);
 }
});
test('GET and HEAD only; no writes or API calls can occur',async()=>{
 for(const method of ['POST','PUT','PATCH','DELETE']){
  assert.equal(legacyCommandEntry(req(origin+'/staff/command',method)).status,405,method);
 }
});
test('legacy adapter does not accept env, binding or request cookies for forwarding',async()=>{
 const response=legacyCommandEntry(req(origin+'/staff/command','GET',{
  cookie:'__Host-anevum_can_apex.session_token=private-cookie',
  authorization:'Bearer must-not-leak',
  'x-cf-access-jwt-assertion':'private-jwt'
 }));
 assert.equal(response.status,302);
 const headers=Object.fromEntries(response.headers);
 assert.equal(JSON.stringify(headers).includes('private-cookie'),false);
 assert.equal(JSON.stringify(headers).includes('private-jwt'),false);
 assert.equal(JSON.stringify(headers).includes('must-not-leak'),false);
 assert.equal(response.headers.get('location'),'/staff?view=command');
});

test('verified owner and reviewer follow legacy path through the real native staff-grant gate',async()=>{
 const sessionCookie='__Host-anevum_can_apex.session_token=synthetic';
 for(const role of ['owner','reviewer']){
  let forwarded=0,roleLookups=0;
  const env={
   APEX_AUTH:{fetch:async()=>Response.json({
    user:{id:'synthetic-member',emailVerified:true},
    session:{id:'synthetic-session',userId:'synthetic-member',
     expiresAt:new Date(Date.now()+60000).toISOString()}
   })},
   MEMBER_DB:{prepare:()=>({bind:()=>({first:async()=>{roleLookups++;return {role};}})})},
   COMMAND:{fetch:async request=>{forwarded++;assert.equal(new URL(request.url).pathname,'/staff');
    return new Response('<main>Command</main>',{status:200,headers:{'content-type':'text/html'}});}}
  };
  const canonical=legacyCommandEntry(req(origin+'/staff/command','GET',{cookie:sessionCookie}));
  assert.equal(canonical.status,302);
  const redirected=new URL(canonical.headers.get('location'),origin);
  assert.equal(redirected.pathname,'/staff');
  assert.equal(redirected.search,'?view=command');
  const result=await nativeStaffEntry.fetch(req(redirected.href,'GET',{cookie:sessionCookie}),env);
  assert.equal(result.status,200);
  assert.match(await result.text(),/Command/);
  assert.equal(forwarded,1);
  assert.equal(roleLookups,1);
 }
});
test('native staff gateway refuses unsigned and unauthorized legacy visitors before Command',async()=>{
 let forwarded=0;
 const env={
  APEX_AUTH:{fetch:async()=>Response.json({user:{id:'member',emailVerified:true},
   session:{id:'session',userId:'member',expiresAt:new Date(Date.now()+60000).toISOString()}})},
  MEMBER_DB:{prepare:()=>({bind:()=>({first:async()=>null})})},
  COMMAND:{fetch:async()=>{forwarded++;return new Response('private staff UI');}}
 };
 for(const [cookie,status] of [['',401],['__Host-anevum_can_apex.session_token=synthetic',403]]){
  const response=await nativeStaffEntry.fetch(req(origin+'/staff?view=command','GET',cookie?{cookie}:{}),env);
  assert.equal(response.status,status);
  assert.equal(forwarded,0);
 }
});
