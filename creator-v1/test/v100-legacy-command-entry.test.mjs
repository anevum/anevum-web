import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyCommandEntry} from '../operations/anevum-iren-legacy-command-entry-v002.mjs';

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
