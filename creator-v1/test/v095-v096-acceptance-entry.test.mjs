import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcceptanceEntry,QA_CANDIDATE,QA_COOKIE} from '../ops/v095-v096-acceptance-entry.mjs';
const now=1792533600,env={QA_CANDIDATE,QA_ROUTING_TOKEN:'a'.repeat(64),QA_EXPIRES_AT:String(now+3600)};
const entry=(authorized=true)=>createAcceptanceEntry({identity:async()=>authorized?{email:'synthetic@example.invalid'}:null,now:()=>now});
const request=(path='',options={})=>new Request('https://anevum.com/__enter/v095-v096'+path,options);
const post={method:'POST',headers:{origin:'https://anevum.com','sec-fetch-site':'same-origin'}};
test('real Access validation is required by default; no caller header or cookie enrolls a guest',async()=>{
 const worker=createAcceptanceEntry({now:()=>now});
 for(const headers of [{},{'cf-access-authenticated-user-email':'devon@anevum.com'},{cookie:'CF_Authorization=unsigned'}]){
  const r=await worker.fetch(request('',{headers}),env);assert.equal(r.status,403);assert.equal(r.headers.get('set-cookie'),null);
 }
});
test('the review page does not enroll the browser or leak the routing token',async()=>{
 const r=await entry().fetch(request(),env);assert.equal(r.status,200);
 assert.equal(r.headers.get('set-cookie'),null);assert.match(r.headers.get('x-robots-tag'),/noindex/);
 const text=await r.text();assert.match(text,/Opening this page does not mark acceptance/);assert.ok(!text.includes(env.QA_ROUTING_TOKEN));
});
test('only authorized same-origin POST can set a bounded host-only routing cookie',async()=>{
 const r=await entry().fetch(request('/enable',post),env);assert.equal(r.status,303);
 assert.equal(r.headers.get('location'),'/studio/alpha');
 assert.equal(r.headers.get('set-cookie'),QA_COOKIE+'='+env.QA_ROUTING_TOKEN+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600');
 for(const headers of [{},{origin:'https://evil.invalid'},{origin:'https://anevum.com','sec-fetch-site':'cross-site'}])
  assert.equal((await entry().fetch(request('/enable',{method:'POST',headers}),env)).status,403);
 assert.equal((await entry(false).fetch(request('/enable',post),env)).status,403);
});
test('expired, overlong, malformed or mismatched configuration fails closed',async()=>{
 for(const changed of [{QA_EXPIRES_AT:String(now)},{QA_EXPIRES_AT:String(now+86401)},{QA_ROUTING_TOKEN:'bad'},{QA_CANDIDATE:'other'}]){
  const r=await entry().fetch(request('/enable',post),{...env,...changed});assert.equal(r.status,503);assert.equal(r.headers.get('set-cookie'),null);
 }
});
test('leaving clears only the routing cookie and never needs member credentials',async()=>{
 const r=await entry(false).fetch(request('/leave',post),env);assert.equal(r.status,303);
 assert.equal(r.headers.get('set-cookie'),QA_COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0');
});
test('the entry has no API, query redirect, arbitrary host or GET enrollment surface',async()=>{
 for(const path of ['/enable','/leave','/api'])assert.equal((await entry().fetch(request(path),env)).status,404);
 for(const url of ['https://anevum.com/__enter/v095-v096?next=https://evil.invalid','https://evil.invalid/__enter/v095-v096'])
  assert.equal((await entry().fetch(new Request(url),env)).status,404);
});
