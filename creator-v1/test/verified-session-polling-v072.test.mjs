// ANEVUM.WEB.PATCH.2026-10-18.001.VERIFIED-SESSION-POLLING
// Two authenticated Better Auth sessions behind one synthetic NAT. Isolated
// SQLite and stubbed email only. Never requests production OTP or sessions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalAuthOptions} from '../canonical-auth/auth.mjs';
import worker from '../canonical-auth/worker.mjs';

const ORIGIN='https://anevum.com',AUTH='/api/v1/member/auth',IP='198.51.100.77';
const post=(path,body)=>new Request(ORIGIN+path,{
 method:'POST',headers:{origin:ORIGIN,'sec-fetch-site':'same-origin','cf-connecting-ip':IP,
  'content-type':'application/json'},body:JSON.stringify(body)
});
const sessionGet=cookie=>new Request(ORIGIN+AUTH+'/get-session',{
 method:'GET',headers:{cookie,'cf-connecting-ip':IP,accept:'application/json'}
});
test('V072 exact Better Auth session-check policy is bounded and sensitive sign-in limits stay strict',()=>{
 const f=fixture();
 try{
  const o=canonicalAuthOptions({...f.env,ANEVUM_CANONICAL_APEX_ENABLED:'true',
   CANONICAL_PUBLIC_SIGNUP_ENABLED:'true'});
  assert.equal(o.rateLimit.enabled,true);
  assert.equal(o.rateLimit.storage,'database');
  assert.equal(o.rateLimit.window,60);
  assert.equal(o.rateLimit.max,20);
  assert.deepEqual(o.rateLimit.customRules['/get-session'],{window:60,max:120});
  assert.deepEqual(o.rateLimit.customRules['/sign-in/email-otp'],{window:60,max:5});
  assert.deepEqual(o.rateLimit.customRules['/email-otp/send-verification-otp'],{window:600,max:3});
  assert.deepEqual(o.rateLimit.customRules['/sign-in/social'],{window:60,max:5});
  assert.deepEqual(o.advanced.ipAddress.ipAddressHeaders,['cf-connecting-ip']);
 }finally{f.db.close()}
});

test('V072 two verified cookies sharing a trusted client IP can maintain staff-sized session polling',{timeout:30000},async()=>{
 const f=fixture(),env={...f.env,
  ANEVUM_CANONICAL_APEX_ENABLED:'true',CANONICAL_PUBLIC_SIGNUP_ENABLED:'true',
  CANONICAL_INVITED_SIGNUP_ENABLED:'false'};
 const sent=new Map(),originalFetch=globalThis.fetch;
 globalThis.fetch=async (url,init)=>{
  assert.equal(String(url),'https://api.resend.com/emails');
  const data=JSON.parse(init.body);
  const otp=/verification code is (\d{8})/.exec(data.text)?.[1];
  assert.match(otp||'',/^\d{8}$/);
  sent.set(data.to[0],otp);
  return Response.json({id:'fixture-delivery'},{status:200});
 };
 try{
  const cookies=[];
  for(const email of ['verified_one@fixture.invalid','verified_two@fixture.invalid']){
   const otpSent=await worker.fetch(post(AUTH+'/email-otp/send-verification-otp',{email,type:'sign-in'}),env);
   assert.equal(otpSent.status,200);
   const signed=await worker.fetch(post(AUTH+'/sign-in/email-otp',{email,otp:sent.get(email)}),env);
   assert.equal(signed.status,200);
   const cookie=(signed.headers.get('set-cookie')||'').split(';')[0];
   assert.match(cookie,/anevum_can_apex\.session_token=/);
   cookies.push(cookie);
  }
  assert.notEqual(cookies[0],cookies[1]);
  const ids=new Set();
  for(let i=0;i<90;i++){
   const response=await worker.fetch(sessionGet(cookies[i%2]),env);
   assert.equal(response.status,200,'Legitimate shared-household session poll '+i+' must not lock out staff');
   const data=await response.json();
   assert.equal(data.user.emailVerified,true);
   assert.ok(data.user.id);
   ids.add(data.user.id);
  }
  assert.equal(ids.size,2,'Two distinct verified users remain distinguishable');
  // Rate limiter remains active: exhausting the bounded 120/min session
  // bucket must eventually return a denial, never silently become unlimited.
  let limited=false;
  for(let i=0;i<45;i++){
   const response=await worker.fetch(sessionGet(cookies[i%2]),env);
   if(response.status===429){limited=true;break}
   assert.equal(response.status,200,'No unexpected session errors before bounded throttling');
  }
  assert.equal(limited,true,'Session probes still have a finite per-IP ceiling');
 }finally{
  globalThis.fetch=originalFetch;
  f.db.close();
 }
});
