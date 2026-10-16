import test from "node:test";
import assert from "node:assert/strict";
import {assessCanonicalErasureIntent,CANONICAL_ERASURE_CONFIRMATION} from "../canonical-auth/erasure.mjs";
import {isProtectedCanonicalEmail} from "../canonical-auth/policy.mjs";

const ORIGIN="https://a.anevum.com";
const now=Date.UTC(2026,9,15,22,0,0);
const env=()=>({
  CANONICAL_ACCOUNT_ERASURE_ENABLED:"true",
  CANONICAL_PROTECTED_EMAILS:"owner@fixture.invalid,staff@fixture.invalid"
});
const session=(email="pilot_a@fixture.invalid",createdAt=new Date(now-90000))=>({
  user:{id:"member-fixture",email,emailVerified:true},
  session:{createdAt}
});
const request=(body,options={})=>new Request(ORIGIN+"/api/v1/member/account-delete",{
  method:"POST",
  headers:{"content-type":"application/json",origin:ORIGIN,"sec-fetch-site":"same-origin"},
  body:typeof body==="string"?body:JSON.stringify(body),...options
});
const correct={email:"pilot_a@fixture.invalid",confirmation:CANONICAL_ERASURE_CONFIRMATION};

test("protected identities and missing protected list fail closed",()=>{
  assert.equal(isProtectedCanonicalEmail(env(),"OWNER@fixture.invalid"),true);
  assert.equal(isProtectedCanonicalEmail(env(),"pilot_a@fixture.invalid"),false);
  assert.equal(isProtectedCanonicalEmail({},"pilot_a@fixture.invalid"),true);
  assert.equal(isProtectedCanonicalEmail(env(),"invalid"),true);
});
test("removal stays unreachable until explicitly and exactly enabled",async()=>{
 const e=env();delete e.CANONICAL_ACCOUNT_ERASURE_ENABLED;
 assert.equal((await assessCanonicalErasureIntent(request(correct),session(),e,now)).status,404);
 e.CANONICAL_ACCOUNT_ERASURE_ENABLED="false";
 assert.equal((await assessCanonicalErasureIntent(request(correct),session(),e,now)).status,404);
});
test("only the verified fresh cookie owner can request native removal",async()=>{
 assert.deepEqual(await assessCanonicalErasureIntent(request(correct),session(),env(),now),{ok:true});
 for(const s of [null,{user:{}},{user:{id:"a",email:"pilot_a@fixture.invalid",emailVerified:false},session:{createdAt:new Date(now)}}]){
  assert.equal((await assessCanonicalErasureIntent(request(correct),s,env(),now)).ok,false);
 }
 assert.equal((await assessCanonicalErasureIntent(request(correct),session("owner@fixture.invalid"),env(),now)).status,403);
 assert.equal((await assessCanonicalErasureIntent(request(correct),session("pilot_a@fixture.invalid",new Date(now-600001)),env(),now)).status,403);
 assert.equal((await assessCanonicalErasureIntent(request(correct),session("pilot_a@fixture.invalid",new Date(now+10000)),env(),now)).status,403);
 assert.equal((await assessCanonicalErasureIntent(request(correct),session("pilot_a@fixture.invalid","untrusted"),env(),now)).status,403);
});
test("exact email and phrase required; no client-controlled member ID or extra fields",async()=>{
 for(const body of [
  {...correct,email:"pilot_b@fixture.invalid"},
  {...correct,confirmation:"DELETE"},
  {...correct,userId:"someone-else"},
  {...correct,role:"staff"},
  {email:correct.email},
  [],
  "invalid",
  "null"
 ]){
   const result=await assessCanonicalErasureIntent(request(body),session(),env(),now);
   assert.equal(result.ok,false);
   assert.equal(result.status,400);
 }
});
test("oversized and incorrectly typed requests fail before any native deletion",async()=>{
 const huge={...correct,unused:"X".repeat(500)};
 assert.equal((await assessCanonicalErasureIntent(request(huge),session(),env(),now)).status,400);
 const wrong=new Request(ORIGIN+"/api/v1/member/account-delete",{
   method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify(correct)
 });
 assert.equal((await assessCanonicalErasureIntent(wrong,session(),env(),now)).status,400);
});
