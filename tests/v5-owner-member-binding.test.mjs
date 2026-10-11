import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assertOwnerMemberSession,verifyOwnerMemberBinding,OwnerMemberBindingError} from "../src/server/command-owner-binding.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const env={ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED:"true",RHEN_OWNER_EMAIL:"owner@example.test",RHEN_OWNER_MEMBER_ID:"member_owner_12345678"};
const identity={email:"owner@example.test"};
const session={user:{id:"member_owner_12345678",emailVerified:true,email:"owner-gmail@example.test"}};
const rejected=(fn,status)=>assert.throws(fn,e=>e instanceof OwnerMemberBindingError&&e.status===status);
test("exact authenticated owner member plus independent Access identity required",()=>{
  assert.equal(assertOwnerMemberSession(env,identity,session),true);
  for(const access of [{email:"other@example.test"},{}])rejected(()=>assertOwnerMemberSession(env,access,session),403);
  for(const member of [null,{user:{...session.user,id:"different_member_5678"}},{user:{...session.user,emailVerified:false}},{user:{...session.user,emailVerified:"true"}}])rejected(()=>assertOwnerMemberSession(env,identity,member),403);
  assert.equal(assertOwnerMemberSession(env,identity,{user:{...session.user,email:"other-login@example.test"}}),true);
});
test("missing or malformed encrypted owner config fails closed",()=>{
  for(const invalid of [{...env,RHEN_OWNER_MEMBER_ID:""},{...env,RHEN_OWNER_MEMBER_ID:"bad id"},{...env,RHEN_OWNER_EMAIL:"broken"},{...env,RHEN_OWNER_EMAIL:undefined}])rejected(()=>assertOwnerMemberSession(invalid,identity,session),503);
});
test("old deployed Access-only gate stays compatible but never claims owner binding",async()=>{
  for(const flag of [undefined,"false",""])assert.equal(await verifyOwnerMemberBinding(new Request("https://anevum.com/api/command/session"),{...env,ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED:flag},identity),false);
  await assert.rejects(verifyOwnerMemberBinding(new Request("https://anevum.com/api/command/session"),env,identity),e=>e instanceof OwnerMemberBindingError&&e.status===503);
});
test("every operator API shares the dual-bound commandCredential and no client-supplied identity",()=>{
  const worker=source("worker.mjs"),start=worker.indexOf("async function commandCredential("),end=worker.indexOf("async function proxyTrader(",start),section=worker.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.ok(section.indexOf("verifyOwnerMemberBinding(request, env, identity)")>section.indexOf("verifyAccessAssertion(access, env)"));
  assert.match(worker,/owner_member_bound: credential.ownerMemberBound === true/);
  for(const name of ["proxyTrader","proxyCommandStream","proxyOwnerReadOnlyStream","proxyCommandHistory","proxyCommandBootstrap"])assert.match(worker.slice(worker.indexOf("async function "+name+"(")),/commandCredential\(request,\s*env\)/);
});
test("frontend member state reset and owner link require verified owner-bound proof",()=>{
  const home=source("src/pages/MemberHome.tsx"),rhen=source("src/pages/RhenApp.tsx");
  assert.match(home,/key=\{session\?\.user\?\.id \|\| "signed-out"\}/);
  assert.match(home,/next.user.id !== identity\?\.id/);
  assert.match(home,/value\?\.owner_member_bound === true/);
  assert.match(rhen,/value\?\.owner_member_bound === true/);
  assert.match(home,/value\?\.auth_source === "cloudflare_access"/);
  assert.match(rhen,/value\?\.auth_source === "cloudflare_access"/);
});
test("manual V5 production release requires encrypted account binding",()=>{
  const prod=JSON.parse(source("wrangler.jsonc")),stage=JSON.parse(source("wrangler.member-staging.jsonc")),workflow=source(".github/workflows/deploy-production.yml");
  assert.equal(prod.vars.ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED,"true");
  assert.equal(stage.vars.ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED,undefined);
  assert.equal("RHEN_OWNER_MEMBER_ID" in prod.vars,false);
  assert.match(workflow,/\.vars\.ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED == "true"/);
  assert.match(workflow,/BETTER_AUTH_SECRET RHEN_OWNER_MEMBER_ID/);
  assert.match(workflow,/workflow_dispatch:/);
});
