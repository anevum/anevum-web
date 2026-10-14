import test from "node:test";
import assert from "node:assert/strict";
import {createMemberWorker,memberSignInCapabilities} from "../worker.mjs";
import {PAGE,CLIENT} from "../join.mjs";
const stage={AUTH_PEPPER:"a".repeat(64),COMMUNITY_DB:{prepare(){}},STAGING_JOIN_ENABLED:"true",RESEND_API_KEY:"restricted-sending-credential",TURNSTILE_SECRET:"challenge-key",STAGING_INVITE_EMAILS:"invitee@example.com"};
test("only invited email is ready",()=>{
 const state=memberSignInCapabilities(stage);
 assert.equal(state.registration,"invite-only");
 assert.equal(state.methods.email.available,true);
 for(const id of ["google","github","passkey","microsoft","apple"])assert.equal(state.methods[id].available,false);
 assert.equal(state.linking,"disabled");
});
test("missing credentials close registration",()=>{
 for(const name of ["AUTH_PEPPER","COMMUNITY_DB","STAGING_JOIN_ENABLED","RESEND_API_KEY","TURNSTILE_SECRET","STAGING_INVITE_EMAILS"]){
  const env={...stage};delete env[name];
  assert.equal(memberSignInCapabilities(env).registration,"closed",name);
 }
});
test("same-origin capabilities route does not set cookies",async()=>{
 const worker=createMemberWorker();
 const r=await worker.fetch(new Request("https://next.anevum.com/api/v1/member/auth-methods"),stage);
 assert.equal(r.status,200);assert.equal(r.headers.get("cache-control"),"no-store");
 assert.equal(r.headers.get("set-cookie"),null);
 assert.equal((await r.json()).methods.email.available,true);
 assert.equal((await worker.fetch(new Request("https://a.anevum.com/api/v1/member/auth-methods"),stage)).status,404);
});

test("credential without a usable D1 binding must never advertise signup",()=>{
 const env={...stage,COMMUNITY_DB:{}};
 assert.equal(memberSignInCapabilities(env).methods.email.available,false);
 assert.equal(memberSignInCapabilities(env).registration,"closed");
});
test("capability discovery rejects write methods and foreign hosts",async()=>{
 const worker=createMemberWorker();
 const request=new Request("https://next.anevum.com/api/v1/member/auth-methods",{method:"POST",headers:{origin:"https://next.anevum.com"}});
 const method=await worker.fetch(request,stage);
 assert.equal(method.status,405);
 const foreign=await worker.fetch(new Request("https://a.anevum.com/api/v1/member/auth-methods"),stage);
 assert.equal(foreign.status,404);
});
test("existing invited sign-in offers member workspace after verified profile",()=>{
 assert.match(PAGE,/id="mySpace" hidden href="\/creator\/account"/);
 assert.match(CLIENT,/\$\('mySpace'\)\.hidden=!me\.member\.handle/);
 assert.match(CLIENT,/\$\('mySpace'\)\.hidden=false/);
});

test("health and advertised sign-in capabilities agree under missing storage",async()=>{
 const worker=createMemberWorker();
 const origin="https://next.anevum.com/api/v1/member/health";
 const ready=await worker.fetch(new Request(origin),stage);
 assert.equal(ready.status,200);
 assert.equal((await ready.json()).signupEnabled,true);
 const unavailable=await worker.fetch(new Request(origin),{...stage,COMMUNITY_DB:{}});
 assert.equal(unavailable.status,200);
 assert.equal((await unavailable.json()).signupEnabled,false);
});
