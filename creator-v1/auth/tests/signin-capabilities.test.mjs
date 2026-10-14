import test from "node:test";
import assert from "node:assert/strict";
import {createMemberWorker,memberSignInCapabilities} from "../auth/worker.mjs";
const stage={AUTH_PEPPER:"a".repeat(64),COMMUNITY_DB:{},STAGING_JOIN_ENABLED:"true",RESEND_API_KEY:"restricted-sending-credential",TURNSTILE_SECRET:"challenge-key",STAGING_INVITE_EMAILS:"invitee@example.com"};
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
