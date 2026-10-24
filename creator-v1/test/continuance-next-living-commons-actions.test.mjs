import test from "node:test";
import assert from "node:assert/strict";
import {
  previewCommonsAction, explainNextStep, VIEW_COMPONENTS, NEXT_DESTINATION
} from "../web/src/experience/continuance-next/living-commons-action-graph.ts";

const context=(signedIn=false,patch={})=>({
  view:"signals",
  principal:signedIn?{kind:"member",memberId:"member_42"}:{kind:"guest"},
  availability:{publicProjects:"ready",publicThreads:"ready",memberSpace:"ready",assemblies:"closed",...patch}
});
const inspect=(action,signedIn=false,patch={})=>
 previewCommonsAction(context(signedIn,patch),action);

test("the approved review maps exactly eleven view states",()=>{
 assert.equal(Object.keys(VIEW_COMPONENTS).length,11);
});
test("view navigation is local only, not an authorization grant",()=>{
 const r=inspect({kind:"navigate",destination:"atlas"});
 assert.equal(r.status,"local-only");assert.equal(r.requiresCanonicalAuthorization,false);
});
test("unregistered navigation targets are invalid",()=>{
 assert.equal(inspect({kind:"navigate",destination:"staff-console"}).status,"invalid");
});
test("UI composition cannot duplicate or invent components",()=>{
 assert.equal(inspect({kind:"propose-layout",moduleIds:["district-map","district-map"]}).status,"invalid");
 assert.equal(inspect({kind:"propose-layout",moduleIds:["developer-superuser"]}).status,"invalid");
});
test("a proposed layout never stores to the account",()=>{
 const r=inspect({kind:"propose-layout",moduleIds:["signal-board","district-map"]});
 assert.equal(r.status,"local-only");assert.equal(r.willMutateAccount,false);
});
test("member project save cannot bypass canonical server",()=>{
 const r=inspect({kind:"save-project",projectId:"project_1",expectedRevision:4},true);
 assert.equal(r.status,"needs-server");assert.equal(r.requiresCanonicalAuthorization,true);assert.equal(r.gate,"revision");
});
test("guest project save explicitly needs sign-in",()=>{
 assert.equal(inspect({kind:"save-project",projectId:"project_1",expectedRevision:4}).requiresSignIn,true);
});
test("stale/negative revision proposal is invalid",()=>{
 assert.equal(inspect({kind:"save-project",projectId:"project_1",expectedRevision:-1},true).status,"invalid");
});
test("unavailable public project API does not advertise saving",()=>{
 assert.equal(inspect({kind:"save-project",projectId:"project_1",expectedRevision:0},true,{publicProjects:"closed"}).status,"unavailable");
});
test("short reply and bad idempotency key are rejected",()=>{
 assert.equal(inspect({kind:"submit-reply",threadId:"thread_1",body:"hello",idempotencyKey:"once"},true).status,"invalid");
 assert.equal(inspect({kind:"submit-reply",threadId:"thread_1",body:"A specific keyboard accessibility test.",idempotencyKey:""},true).status,"invalid");
});
test("reply requires server-confirmed moderation receipt",()=>{
 const r=inspect({kind:"submit-reply",threadId:"thread_1",body:"A specific keyboard accessibility test.",idempotencyKey:"nonce_42"},true);
 assert.equal(r.status,"needs-server");assert.equal(r.gate,"moderation");assert.match(r.explanation,/unless the server confirms/);
});
test("closed threads reject reactions",()=>{
 const r=inspect({kind:"react-thread",threadId:"thread_1",desiredScore:1,expectedRevision:1},true,{publicThreads:"closed"});
 assert.equal(r.status,"unavailable");
});
test("future collaboration assemblies remain gated",()=>{
 const r=inspect({kind:"join-assembly",assemblyId:"circle_1",consentVersion:"v1"},true);
 assert.equal(r.status,"unavailable");assert.equal(r.willMutateAccount,false);
});
test("member world requires server opt-in and private/missing indistinguishability",()=>{
 const r=inspect({kind:"show-member",handle:"mira"});
 assert.equal(r.status,"needs-server");assert.equal(r.gate,"ownership");assert.equal(r.requiresSignIn,false);
});
test("invalid member handles are rejected",()=>{
 assert.equal(inspect({kind:"show-member",handle:"@Unauthorized"}).status,"invalid");
});
test("earned specimen inspection does not invent an award",()=>{
 const r=inspect({kind:"show-earned-reward",rewardId:"first_signal",memberHandle:"mira"});
 assert.equal(r.status,"needs-server");assert.equal(r.requiresCanonicalAuthorization,true);
});
test("all recommendations are explainable fixed routes",()=>{
 for(const view of Object.keys(NEXT_DESTINATION)){
  const r=explainNextStep({...context(),view});
  assert.equal(r.view,NEXT_DESTINATION[view]);
  assert.match(r.reason,/Not an AI recommendation/);
 }
});
