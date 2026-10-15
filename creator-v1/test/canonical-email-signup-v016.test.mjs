import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {
 canonicalConfigState,canonicalSchemaReady,permitCanonicalUserCreation
} from "../canonical-auth/policy.mjs";
import {canonicalAuthOptions} from "../canonical-auth/auth.mjs";
import {createCanonicalStageWorker} from "../canonical-auth/worker.mjs";
import {canonicalCreatorSchemaReady} from "../canonical-auth/profile.mjs";

const origin="https://a.anevum.com";
const schema=["user","session","account","verification","rateLimit",
 "canonical_identity_manifest","member_creator_profiles","member_creator_edit_limits"];

function fakeDatabase(profile){
 return {
  prepare(sql){
   let args=[];
   return {
    bind(...values){args=values;return this;},
    async all(){
     if(sql.includes("sqlite_master"))return {success:true,results:schema.map(name=>({name}))};
     if(sql.includes("canonical_identity_manifest WHERE id=1"))
       return {success:true,results:[{issuer:"anevum-better-auth-staging-v1",migration:"0001_canonical_better_auth_core"}]};
     return {success:true,results:[]};
    },
    async first(){
     if(sql.includes("FROM member_creator_profiles WHERE user_id=?"))return profile??null;
     if(sql.includes("JOIN \"user\" u"))return profile?.visibility==="public"?{
      handle:profile.handle,display_name:profile.display_name,bio:profile.bio,created_at:12345
     }:null;
     return null;
    }
   };
  },async batch(){return [];}
 };
}
const fixture=(emailEnabled=true,invited=true,profile=null)=>({
 ANEVUM_CANONICAL_STAGE_ENABLED:"true",CANONICAL_SCHEMA_APPROVED:"true",
 CANONICAL_GOOGLE_ENABLED:"false",CANONICAL_EMAIL_ENABLED:emailEnabled?"true":"false",
 CANONICAL_INVITED_SIGNUP_ENABLED:invited?"true":"false",
 CANONICAL_BETTER_AUTH_SECRET:"a".repeat(48),
 CANONICAL_RESEND_API_KEY:"r".repeat(48),
 CANONICAL_PROTECTED_EMAILS:"owner@fixture.invalid",
 CANONICAL_INVITE_EMAILS:"test_one@fixture.invalid,test_two@fixture.invalid",
 MEMBER_DB:fakeDatabase(profile)
});
const post=(route,body,extraHeaders={})=>new Request(origin+route,{
 method:"POST",headers:{
  Origin:origin,"sec-fetch-site":"same-origin","content-type":"application/json",...extraHeaders
 },body:typeof body==="string"?body:JSON.stringify(body)
});
const get=(route,headers={})=>new Request(origin+route,{headers});
let dispatched=[];
const fakeAuth=()=>({
 async handler(request){
  dispatched.push({path:new URL(request.url).pathname,method:request.method,
   body:request.method==="POST"?await request.text():null,
   cookie:request.headers.get("cookie"),authorization:request.headers.get("authorization")});
  return new Response('{"ok":true}',{headers:{"content-type":"application/json",
   "set-cookie":"__Secure-anevum_can_stage.session_token=fixture; Path=/; HttpOnly; Secure; SameSite=Lax"}});
 },
 api:{async getSession(){return {user:{
  id:"can-a",email:"test_one@fixture.invalid",emailVerified:true,name:"Pilot A"
 }};}}
});
const worker=createCanonicalStageWorker({authFactory:fakeAuth});
const statuses=async(rows,env)=>Promise.all(rows.map(async r=>
 (await worker.fetch(r,env)).status));

test("canonical email-only mode requires the separate secret, schema and protected account list",async()=>{
 const good=fixture();
 assert.equal(canonicalConfigState(good).operational,true);
 assert.equal(canonicalConfigState(good).invited,true);
 assert.equal(canonicalConfigState(good).email,true);
 assert.equal(canonicalConfigState(good).google,false);
 assert.equal(await canonicalSchemaReady(good),true);
 assert.equal(await canonicalCreatorSchemaReady(good.MEMBER_DB),true);
 for(const [key,value] of [
  ["CANONICAL_RESEND_API_KEY","short"],["CANONICAL_SCHEMA_APPROVED","false"],
  ["CANONICAL_PROTECTED_EMAILS",""],["MEMBER_DB",null]
 ]) assert.equal(canonicalConfigState({...good,[key]:value}).operational,false,key);
 assert.equal(canonicalConfigState(fixture(true,false)).invited,false);
 assert.equal(permitCanonicalUserCreation(good,"test_one@fixture.invalid"),true);
 assert.equal(permitCanonicalUserCreation(good,"owner@fixture.invalid"),false);
 assert.equal(permitCanonicalUserCreation(good,"unknown@fixture.invalid"),false);
 const options=canonicalAuthOptions(good);
 assert.deepEqual(options.socialProviders,{});
 assert.equal(options.emailAndPassword.enabled,false);
 assert.equal(options.plugins.length,1);
 assert.equal(options.advanced.crossSubDomainCookies,undefined);
 assert.equal(options.rateLimit.customRules["/email-otp/send-verification-otp"].max,3);
 assert.equal(await options.databaseHooks.user.create.before({email:"unknown@fixture.invalid"}),false);
});

test("real isolated SQLite migrations start with zero accounts and private, unique handles",()=>{
 const db=new DatabaseSync(":memory:");
 const file=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 try{
  db.exec(file("canonical-auth/migrations/0001_canonical_better_auth_core.sql"));
  db.exec(file("canonical-auth/migrations/0002_member_creator_profiles.sql"));
  assert.equal(db.prepare('SELECT count(*) n FROM "user"').get().n,0);
  assert.equal(db.prepare("SELECT count(*) n FROM member_creator_profiles").get().n,0);
  const now=1760481000;
  const insert=db.prepare('INSERT INTO "user"("id","name","email","emailVerified","createdAt","updatedAt") VALUES(?,?,?,?,?,?)');
  insert.run("test-a","Pilot A","test_one@fixture.invalid",1,now,now);
  insert.run("test-b","Pilot B","test_two@fixture.invalid",1,now,now);
  db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,?,?)")
   .run("test-a","first_pilot","Pilot A","",now,now);
  const own=db.prepare("SELECT visibility FROM member_creator_profiles WHERE user_id='test-a'").get();
  assert.equal(own.visibility,"private");
  assert.throws(()=>db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,?,?)")
   .run("test-b","first_pilot","Pilot B","",now,now),/UNIQUE/);
  assert.throws(()=>db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,?,?)")
   .run("test-b","FIRST_PILOT","Pilot B","",now,now),/(CHECK|UNIQUE)/);
  db.prepare('DELETE FROM "user" WHERE "id"=?').run("test-a");
  assert.equal(db.prepare("SELECT count(*) n FROM member_creator_profiles").get().n,0);
 }finally{db.close();}
});

test("email methods advertise only when invite pilot is enabled and old provider routes stay blocked",async()=>{
 const active=fixture(),off=fixture(true,false);
 const activeMethods=await(await worker.fetch(get("/api/v1/member/auth-methods"),active)).json();
 assert.equal(activeMethods.registration,"invite-only");
 assert.equal(activeMethods.methods.email.available,true);
 assert.equal(activeMethods.methods.google.available,false);
 assert.equal(activeMethods.methods.github.available,false);
 const closed=await(await worker.fetch(get("/api/v1/member/auth-methods"),off)).json();
 assert.equal(closed.registration,"closed");
 assert.equal(closed.methods.email.available,false);
 dispatched=[];
 const blocked=await statuses([
  get("/api/v1/member/me"),
  get("/api/v1/member/projects"),
  get("/api/v1/member/auth/list-users"),
  post("/api/v1/member/auth/sign-up/email",{email:"test_one@fixture.invalid"}),
  post("/api/v1/member/auth/sign-in/social",{provider:"google"}),
  post("/api/v1/member/auth/link-social",{provider:"google"}),
  get("/api/v1/member/creators/showcase")
 ],active);
 assert.deepEqual(blocked,[404,404,404,404,503,404,404]);
 assert.deepEqual(dispatched,[]);
});

test("OTP requests permit only invited addresses, fixed length, no role fields and same origin",async()=>{
 const active=fixture(),send="/api/v1/member/auth/email-otp/send-verification-otp";
 const verify="/api/v1/member/auth/sign-in/email-otp";
 dispatched=[];
 assert.deepEqual(await statuses([
  post(send,{email:"unknown@fixture.invalid",type:"sign-in"}),
  post(send,{email:"owner@fixture.invalid",type:"sign-in"}),
  post(send,{email:"test_one@fixture.invalid",type:"reset-password"}),
  post(send,{email:"test_one@fixture.invalid",type:"sign-in",role:"staff"}),
  post(send,{email:"test_one@fixture.invalid",type:"sign-in"},{Origin:"https://evil.example"}),
  post(verify,{email:"test_one@fixture.invalid",otp:"1234567"}),
  post(verify,{email:"test_one@fixture.invalid",otp:"12345678",userId:"founder"})
 ],active),[200,200,400,400,403,400,400]);
 assert.equal(dispatched.length,0);
 const ok=post(send,{email:"test_one@fixture.invalid",type:"sign-in"});
 assert.equal((await worker.fetch(ok,active)).status,200);
 assert.deepEqual(JSON.parse(dispatched[0].body),{email:"test_one@fixture.invalid",type:"sign-in"});
 const verified=await worker.fetch(post(verify,{email:"test_one@fixture.invalid",otp:"01234567"}),active);
 assert.equal(verified.status,200);
 assert.deepEqual(JSON.parse(dispatched[1].body),{email:"test_one@fixture.invalid",otp:"01234567",name:"ANEVUM MEMBER"});
 assert.match(verified.headers.get("set-cookie")||"",/anevum_can_stage/);
 assert.equal(verified.headers.get("access-control-allow-origin"),null);
});

test("a verified session can see only its own canonical profile; profile writes reject cross-site and public view starts private",async()=>{
 const active=fixture(true,true,{user_id:"can-a",handle:"first_pilot",display_name:"Pilot A",
   bio:"Pilot bio",visibility:"private",revision:1,created_at:12345,updated_at:12345});
 dispatched=[];
 const privateGet=await worker.fetch(get("/api/v1/member/creator-profile",{
  cookie:"better-auth.session_token=legacy; __Secure-anevum_can_stage.session_token=stage"
 }),active);
 assert.equal(privateGet.status,200);
 const body=await privateGet.json();
 assert.equal(body.memberId,"can-a");
 assert.equal(body.profile.handle,"first_pilot");
 assert.equal(body.profile.visibility,"private");
 assert.equal(body.profile.email,undefined);
 assert.equal((await worker.fetch(get("/api/v1/members/first_pilot"),active)).status,404);
 const cross=new Request(origin+"/api/v1/member/creator-profile",{
  method:"PATCH",headers:{origin:"https://other.invalid","sec-fetch-site":"cross-site",
   "content-type":"application/json"},body:'{"revision":1}'
 });
 assert.equal((await worker.fetch(cross,active)).status,403);
 const privateProfile=await worker.fetch(get("/api/v1/members/first_pilot"),active);
 assert.equal(privateProfile.headers.get("set-cookie"),null);
 assert.equal(dispatched.length,0);
});

test("the legacy V013 candidate keeps routes disabled and no permanent database binding",()=>{
 const json=JSON.parse(readFileSync(new URL("../wrangler.canonical-stage.candidate.jsonc",import.meta.url),"utf8"));
 assert.deepEqual(json.routes,[]);
 assert.equal(json.workers_dev,false);
 assert.equal(json.preview_urls,false);
 assert.equal(json.d1_databases,undefined);
 const review=JSON.parse(readFileSync(new URL("../wrangler.canonical-stage.review.jsonc",import.meta.url),"utf8"));
 assert.deepEqual(review.routes,[]);
 assert.equal(review.d1_databases?.length,1);
 assert.equal(review.d1_databases[0]?.binding,"MEMBER_DB");
 assert.equal(review.d1_databases[0]?.database_name,"anevum-canonical-member-staging");
 assert.equal(review.d1_databases[0]?.database_id,"e1d29049-c83b-4534-8355-dc1fa36ba6d8");
 assert.equal(json.vars.ANEVUM_CANONICAL_STAGE_ENABLED,"false");
 assert.equal(json.vars.CANONICAL_EMAIL_ENABLED,"false");
});
