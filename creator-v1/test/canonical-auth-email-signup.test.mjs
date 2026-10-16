import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {canonicalConfigState,permitCanonicalUserCreation} from "../canonical-auth/policy.mjs";
import {canonicalAuthOptions} from "../canonical-auth/auth.mjs";
import {createCanonicalStageWorker} from "../canonical-auth/worker.mjs";
const ORIGIN="https://a.anevum.com";
const tables=["user","session","account","verification","rateLimit","canonical_identity_manifest","member_creator_profiles","member_creator_edit_limits"];
const db={prepare(sql){return {bind(){return this},async all(){
 if(sql.includes("sqlite_master"))return {success:true,results:tables.map(name=>({name}))};
 if(sql.includes("PRAGMA table_info(member_creator_profiles)"))return {success:true,results:["user_id","handle","display_name","bio","visibility","revision","headline","world_theme","focus_json"].map(name=>({name}))};
 if(sql.includes("canonical_identity_manifest"))return {success:true,results:[{issuer:"anevum-better-auth-staging-v1",migration:"0001_canonical_better_auth_core"}]};
 return {success:true,results:[]};
},async first(){return null}}},async batch(){return []}};
function env(extra={}){return {ANEVUM_CANONICAL_STAGE_ENABLED:"true",CANONICAL_SCHEMA_APPROVED:"true",
 CANONICAL_EMAIL_ENABLED:"true",CANONICAL_GOOGLE_ENABLED:"false",CANONICAL_INVITED_SIGNUP_ENABLED:"true",
 CANONICAL_BETTER_AUTH_SECRET:"s".repeat(48),CANONICAL_RESEND_API_KEY:"r".repeat(48),
 CANONICAL_PROTECTED_EMAILS:"owner@fixture.invalid",CANONICAL_INVITE_EMAILS:"member_a@fixture.invalid,member_b@fixture.invalid",
 MEMBER_DB:db,...extra}}
const post=(path,payload,headers={},method="POST")=>new Request(ORIGIN+path,{method,
 headers:{origin:ORIGIN,"sec-fetch-site":"same-origin","content-type":"application/json",...headers},
 body:JSON.stringify(payload)});
const get=path=>new Request(ORIGIN+path);
let calls=[];
const worker=createCanonicalStageWorker({authFactory:()=>({handler:async req=>{
 calls.push({path:new URL(req.url).pathname,cookie:req.headers.get("cookie"),authorization:req.headers.get("authorization"),body:await req.text()});
 return Response.json({ok:true},{headers:{"set-cookie":"__Secure-anevum_can_stage.session_token=example; Path=/; Secure; HttpOnly; SameSite=Lax"}});
},api:{getSession:async()=>null}})});
test("email is gated, protected identities are never invited, passwords and implicit linking are disabled",()=>{
 assert.equal(canonicalConfigState(env()).operational,true);
 assert.equal(canonicalConfigState(env()).invited,true);
 assert.equal(canonicalConfigState(env()).email,true);
 assert.equal(canonicalConfigState(env({CANONICAL_EMAIL_ENABLED:"false"})).operational,false);
 assert.equal(canonicalConfigState(env({CANONICAL_RESEND_API_KEY:null})).operational,false);
 assert.equal(permitCanonicalUserCreation(env(),"member_a@fixture.invalid"),true);
 assert.equal(permitCanonicalUserCreation(env(),"owner@fixture.invalid"),false);
 assert.equal(permitCanonicalUserCreation(env(),"outsider@fixture.invalid"),false);
 const auth=canonicalAuthOptions(env());
 assert.equal(auth.emailAndPassword.enabled,false);
 assert.equal(auth.account.accountLinking.disableImplicitLinking,true);
 assert.equal(auth.plugins.length,1);
 assert.equal(auth.plugins[0].id,"email-otp");
 assert.equal(auth.advanced.crossSubDomainCookies,undefined);
});
test("methods only advertise configured invitation email sign-in",async()=>{
 let response=await worker.fetch(get("/api/v1/member/auth-methods"),env());
 let methods=await response.json();
 assert.equal(methods.registration,"invite-only");
 assert.equal(methods.methods.email.available,true);
 assert.equal(methods.methods.google.available,false);
 response=await worker.fetch(get("/api/v1/member/auth-methods"),env({ANEVUM_CANONICAL_STAGE_ENABLED:"false"}));
 methods=await response.json();
 assert.equal(methods.registration,"closed");
 assert.equal(methods.methods.email.available,false);
});
test("email OTP send and verification are sanitized, host scoped and never forward legacy credentials",async()=>{
 calls=[];
 const prefix="/api/v1/member/auth";
 const sent=await worker.fetch(post(prefix+"/email-otp/send-verification-otp",
  {email:"member_a@fixture.invalid",type:"sign-in"},
  {cookie:"v5_token=private; __Secure-anevum_can_stage.session_token=valid",authorization:"Bearer foreign"}),env());
 assert.equal(sent.status,200);
 assert.equal(calls.at(-1).authorization,null);
 assert.equal(calls.at(-1).cookie,"__Secure-anevum_can_stage.session_token=valid");
 assert.deepEqual(JSON.parse(calls.at(-1).body),{email:"member_a@fixture.invalid",type:"sign-in"});
 const verified=await worker.fetch(post(prefix+"/sign-in/email-otp",
  {email:"member_a@fixture.invalid",otp:"12345678"}),env());
 assert.equal(verified.status,200);
 assert.deepEqual(JSON.parse(calls.at(-1).body),
  {email:"member_a@fixture.invalid",otp:"12345678",name:"ANEVUM MEMBER"});
 assert.match(verified.headers.get("set-cookie")||"",/Secure; HttpOnly/);
});
test("uninvited requests, forged fields, invalid OTP and cross-origin writes are denied",async()=>{
 calls=[];
 const url="/api/v1/member/auth/email-otp/send-verification-otp";
 for(const request of [
  post(url,{email:"outsider@fixture.invalid",type:"sign-in"}),
  post(url,{email:"owner@fixture.invalid",type:"sign-in"}),
  post(url,{email:"member_a@fixture.invalid",type:"sign-in",admin:true}),
  post(url,{email:"member_a@fixture.invalid",type:"sign-in"},{origin:"https://evil.example"}),
  post("/api/v1/member/auth/sign-in/email-otp",{email:"member_a@fixture.invalid",otp:"123456"})
 ]){
  const result=await worker.fetch(request,env());
  assert.ok([200,400,403].includes(result.status),String(result.status));
 }
 assert.equal((await worker.fetch(post("/api/v1/member/creator-profile",
  {displayName:"Forged"},{origin:"https://evil.example"},"PATCH"),env())).status,403);
 assert.equal(calls.length,0);
});
test("isolated profile schema enforces private defaults, unique handles and deletion cascade",()=>{
 const d=new DatabaseSync(":memory:");
 try{
  const read=p=>readFileSync(new URL("../canonical-auth/migrations/"+p,import.meta.url),"utf8");
  d.exec(read("0001_canonical_better_auth_core.sql"));
  d.exec(read("0002_member_creator_profiles.sql"));
  d.exec(read("0003_member_world_personalization.sql"));
  const now=1760481000;
  const insert=(id,email)=>d.prepare('INSERT INTO "user" ("id","name","email","emailVerified","createdAt","updatedAt") VALUES(?,?,?,?,?,?)')
    .run(id,"Test",email,1,now,now);
  insert("member-a","a@fixture.invalid");
  insert("member-b","b@fixture.invalid");
  const profile=d.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)");
  profile.run("member-a","visitor_one","Visitor",now,now);
  assert.equal(d.prepare("SELECT visibility FROM member_creator_profiles WHERE user_id='member-a'").get().visibility,"private");
  assert.throws(()=>profile.run("member-b","VISITOR_ONE","Duplicate",now,now),/UNIQUE/);
  d.prepare("DELETE FROM user WHERE id='member-a'").run();
  assert.equal(d.prepare("SELECT count(*) AS n FROM member_creator_profiles").get().n,0);
 }finally{d.close()}
});