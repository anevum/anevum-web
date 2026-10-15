import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {
 canonicalBetaConfigured,canonicalCreatorSchemaReady,invitedCanonicalEmail,
 verifyInvitedCanonicalCreation,canonicalCreatorMember,canonicalPublicCreator
} from "../src/server/canonical-creator-profile.mjs";
import stage from "../creator-v1/web/a-staging-worker.mjs";

const ORIGIN="https://a.anevum.com";
const path="/api/member/creator-profile";
const headers={"Content-Type":"application/json","Origin":ORIGIN};
const alice={id:"alice",email:"alice@invalid.test",emailVerified:true};
const bob={id:"bob",email:"bob@invalid.test",emailVerified:true};
const outsider={id:"outsider",email:"stranger@invalid.test",emailVerified:true};
const invite="alice@invalid.test,bob@invalid.test";
function create(){
 const db=new DatabaseSync(":memory:");
 db.exec('PRAGMA foreign_keys=ON; CREATE TABLE "user" ("id" TEXT PRIMARY KEY, "emailVerified" INTEGER NOT NULL DEFAULT 0);');
 db.exec(readFileSync(new URL("../migrations/0005_member_creator_profiles.sql",import.meta.url),"utf8"));
 for(const u of [alice,bob,outsider])
  db.prepare('INSERT INTO "user"(id,"emailVerified") VALUES(?,?)').run(u.id,1);
 function stmt(sql,args=[]){return {
  bind(...values){return stmt(sql,values)},
  async all(){return {success:true,results:db.prepare(sql).all(...args)}},
  async first(){return db.prepare(sql).get(...args)||null}
 }}
 const bound={prepare:sql=>stmt(sql)};
 const env={
  MEMBER_DB:bound,COMMUNITY_DB:bound,ASSETS:{fetch:async()=>new Response("ok")},
  ANEVUM_MEMBERS_ENABLED:"true",ANEVUM_MEMBER_PREVIEW_ENABLED:"true",
  MEMBER_PREVIEW_ORIGIN:ORIGIN,ANEVUM_PHASE1_CREATOR_ENABLED:"true",
  ANEVUM_PHASE1_INVITE_ONLY:"true",ANEVUM_PHASE1_INVITE_EMAILS:invite,
  BETTER_AUTH_SECRET:"x".repeat(40),GOOGLE_CLIENT_ID:"test-only",
  GOOGLE_CLIENT_SECRET:"test-only"
 };
 return {env,db,close:()=>db.close()};
}
function request(method="GET",data,pathOverride=path){
 return new Request(ORIGIN+pathOverride,{method,headers:data===undefined?undefined:headers,
  body:data===undefined?undefined:JSON.stringify(data)});
}
function claim(h,u,handle,name="Member",bio="Hello"){
 return canonicalCreatorMember(request("POST",{handle,displayName:name,bio}),h.env,u,ORIGIN,1792000000);
}
function edit(h,u,revision,visibility="public",name="Updated",bio="Welcome"){
 return canonicalCreatorMember(request("PATCH",{displayName:name,bio,visibility,revision}),h.env,u,ORIGIN,1792000100);
}
test("canonical stage feature requires explicit single origin and complete provider setup",()=>{
 const h=create();try{
  assert.equal(canonicalBetaConfigured(h.env,ORIGIN),true);
  for(const env of [
   {...h.env,ANEVUM_PHASE1_CREATOR_ENABLED:"false"},
   {...h.env,ANEVUM_PHASE1_INVITE_ONLY:"false"},
   {...h.env,MEMBER_PREVIEW_ORIGIN:"https://next.anevum.com"},
   {...h.env,MEMBER_DB:null},
   {...h.env,GOOGLE_CLIENT_ID:""},
   {...h.env,BETTER_AUTH_SECRET:"short"},
   {...h.env,ANEVUM_PHASE1_INVITE_EMAILS:""}
  ])assert.equal(canonicalBetaConfigured(env,ORIGIN),false);
  assert.equal(canonicalBetaConfigured(h.env,"https://anevum.com"),false);
  assert.equal(canonicalBetaConfigured(h.env,"https://next.anevum.com"),false);
  assert.equal(invitedCanonicalEmail(h.env,"ALICE@INVALID.TEST"),true);
  assert.equal(invitedCanonicalEmail(h.env,"stranger@invalid.test"),false);
  assert.equal(invitedCanonicalEmail(h.env,"bob@invalid.test"),true);
 }finally{h.close()}
});

test("Better Auth user-create hook denies uninvited identities before any account creation",async()=>{
 const h=create();try{
  const candidate={email:"alice@invalid.test",name:"First member"};
  assert.deepEqual(await verifyInvitedCanonicalCreation(h.env,candidate),{data:candidate});
  for(const email of ["stranger@invalid.test","",null,{},undefined])
   assert.equal(await verifyInvitedCanonicalCreation(h.env,{email}),false);
 }finally{h.close()}
});

test("profile creation claims an immutable unique handle, private by default, no fabricated XP",async()=>{
 const h=create();try{
  assert.equal(await canonicalCreatorSchemaReady(h.env.MEMBER_DB),true);
  const initial=await canonicalCreatorMember(request(),h.env,alice,ORIGIN);
  assert.equal(initial.status,200);
  assert.deepEqual(await initial.json(),{memberId:"alice",profile:null});
  const outcome=await claim(h,alice,"alpha_space","Alpha Creator","A small world");
  assert.equal(outcome.status,201,await outcome.clone().text());
  const created=(await outcome.json()).profile;
  assert.equal(created.visibility,"private");
  assert.equal(created.revision,1);
  assert.equal(created.handle,"alpha_space");
  assert.equal((await claim(h,alice,"another_space")).status,409,"handle immutable");
  assert.equal((await claim(h,bob,"alpha_space")).status,409,"globally unique handle");
  assert.equal((await canonicalPublicCreator(request("GET",undefined,"/api/v1/members/alpha_space"),h.env,ORIGIN,"alpha_space")).status,404);
  assert.equal(JSON.stringify(created).includes("xp"),false);
 }finally{h.close()}
});

test("opt-in requires later deliberate owner update and never exposes private account data",async()=>{
 const h=create();try{
  assert.equal((await claim(h,alice,"alpha_space")).status,201);
  const viewed=await canonicalCreatorMember(request(),h.env,bob,ORIGIN);
  assert.deepEqual((await viewed.json()).profile,null);
  assert.equal((await edit(h,bob,1)).status,409,"cannot update another member");
  const updated=await edit(h,alice,1,"public","Alpha","My work");
  assert.equal(updated.status,200,await updated.clone().text());
  assert.equal((await updated.json()).profile.revision,2);
  const external=await canonicalPublicCreator(request("GET",undefined,"/api/v1/members/alpha_space"),h.env,ORIGIN,"alpha_space");
  assert.equal(external.status,200);
  const raw=await external.text();
  assert.deepEqual(JSON.parse(raw),{profile:{handle:"alpha_space",displayName:"Alpha",bio:"My work",joinedAt:1792000000}});
  assert.doesNotMatch(raw,/alice@invalid|memberId|user_id|revision|emailVerified|session|brok|token|xp/i);
  const head=await canonicalPublicCreator(request("HEAD",undefined,"/api/v1/members/alpha_space"),h.env,ORIGIN,"alpha_space");
  assert.equal(head.status,200);assert.equal(await head.text(),"");
  assert.equal((await edit(h,alice,1)).status,409,"stale revision");
  assert.equal((await edit(h,alice,2,"private")).status,200);
  assert.equal((await canonicalPublicCreator(request("GET",undefined,"/api/v1/members/alpha_space"),h.env,ORIGIN,"alpha_space")).status,404);
 }finally{h.close()}
});

test("forged ownership, unverified email, malformed claims and unsupported methods fail closed",async()=>{
 const h=create();try{
  const rejected=[
   {handle:"admin",displayName:"Hi",bio:""},
   {handle:"Alpha",displayName:"Hi",bio:""},
   {handle:"other",displayName:"",bio:""},
   {handle:"ab",displayName:"Hi",bio:""},
   {handle:"alpha_space",displayName:"Fine",bio:"",ownerId:"bob"},
   {handle:"alpha_space",displayName:"Fine",bio:"abc\nx"}
  ];
  for(const body of rejected){
   const result=await canonicalCreatorMember(request("POST",body),h.env,alice,ORIGIN);
   assert.equal(result.status,400,JSON.stringify(body));
  }
  assert.equal((await canonicalCreatorMember(request("POST",{handle:"visitor",displayName:"Visitor",bio:""}),h.env,outsider,ORIGIN)).status,403);
  assert.equal((await canonicalCreatorMember(request(),h.env,{...alice,emailVerified:false},ORIGIN)).status,403);
  assert.equal((await canonicalCreatorMember(request(),{...h.env,ANEVUM_PHASE1_CREATOR_ENABLED:"false"},alice,ORIGIN)).status,503);
  assert.equal((await canonicalCreatorMember(request(),h.env,alice,"https://evil.example")).status,503);
  assert.equal((await canonicalCreatorMember(request("PUT",{}),h.env,alice,ORIGIN)).status,405);
  assert.equal((await canonicalPublicCreator(request("POST",{}),h.env,ORIGIN,"alpha_space")).status,405);
  assert.equal((await canonicalPublicCreator(request("GET",undefined,"/api/v1/members/admin"),h.env,ORIGIN,"admin")).status,404);
 }finally{h.close()}
});

test("rate limit is per verified account and database cascade preserves deletion semantics",async()=>{
 const h=create();try{
  for(let i=0;i<20;i++){
   const result=await canonicalCreatorMember(request("POST",{handle:"bad",displayName:"U"+i,bio:""}),h.env,alice,ORIGIN,1792000000);
   assert.equal(result.status,i===0?201:409,await result.clone().text());
  }
  assert.equal((await canonicalCreatorMember(request("POST",{handle:"other",displayName:"Hi",bio:""}),h.env,alice,ORIGIN,1792000000)).status,429);
  assert.equal((await claim(h,bob,"bob_world")).status,201,"separate member allotment");
  h.db.prepare('DELETE FROM "user" WHERE id=?').run("alice");
  assert.equal(h.db.prepare("SELECT COUNT(*) AS n FROM member_creator_profiles WHERE user_id='alice'").get().n,0);
  assert.equal(h.db.prepare("SELECT COUNT(*) AS n FROM member_creator_edit_limits WHERE user_id='alice'").get().n,0);
 }finally{h.close()}
});

test("current a.anevum.com remains read-only unless independently enabled and provisioned",async()=>{
 const h=create();try{
  const defaultEnv={ASSETS:h.env.ASSETS,COMMUNITY_DB:h.env.COMMUNITY_DB};
  for(const [path,method] of [
   ["/api/member/availability","GET"],["/api/auth/get-session","GET"],
   ["/api/member/creator-profile","POST"],["/api/v1/members/alpha_space","GET"]
  ]){
   const r=await stage.fetch(new Request(ORIGIN+path,{method}),defaultEnv,{});
   assert.equal(r.status,404,path);
  }
  const blocked=await stage.fetch(new Request(ORIGIN+"/api/member/rhen/workspace"),h.env,{});
  assert.equal(blocked.status,404);
  const protectedRoute=await stage.fetch(new Request(ORIGIN+"/api/member/creator-profile",{method:"DELETE"}),h.env,{});
  assert.equal(protectedRoute.status,405);
  const authPost=await stage.fetch(new Request(ORIGIN+"/api/auth/sign-in/social",{method:"POST",headers:{"Origin":"https://evil.example"}}),defaultEnv,{});
  assert.equal(authPost.status,404,"beta-disabled auth should not return a session cookie");
 }finally{h.close()}
});

test("old Creator OTP and Better Auth canonical records cannot be linked by handle or email",()=>{
 const source=readFileSync(new URL("../creator-v1/web/a-staging-worker.mjs",import.meta.url),"utf8");
 const member=readFileSync(new URL("../src/server/member.mjs",import.meta.url),"utf8");
 const profile=readFileSync(new URL("../src/server/canonical-creator-profile.mjs",import.meta.url),"utf8");
 const migration=readFileSync(new URL("../migrations/0005_member_creator_profiles.sql",import.meta.url),"utf8");
 assert.match(source,/canonicalBetaConfigured/);
 assert.match(source,/\\/api\\/member\\/creator-profile/);
 assert.doesNotMatch(source,/STAGING_JOIN_ENABLED|anevum_stage_sid/);
 assert.match(member,/verifyInvitedCanonicalCreation/);
 assert.match(member,/disableImplicitLinking: true/);
 assert.match(profile,/member_creator_profiles p JOIN/);
 assert.doesNotMatch(profile,/COMMUNITY_DB/);
 const executableSql=migration.split("\n").filter(line=>!line.trim().startsWith("--")).join("\n");
 assert.doesNotMatch(executableSql,/community_xp_events|broker|RHEN|staff_role/i);
});
