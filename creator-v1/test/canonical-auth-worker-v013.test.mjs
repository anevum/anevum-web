import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  CANONICAL_ORIGIN,CANONICAL_AUTH_PATH,CANONICAL_COOKIE_PREFIX,
  canonicalConfigState,canonicalSchemaReady,permitCanonicalUserCreation,
  withoutForeignCookies,isCanonicalOrigin
} from "../canonical-auth/policy.mjs";
import {canonicalAuthOptions,createCanonicalAuth} from "../canonical-auth/auth.mjs";
import {createCanonicalStageWorker} from "../canonical-auth/worker.mjs";
import {assessIdentityStageInventory} from "../ops/identity-release-gate.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const candidate=JSON.parse(read("wrangler.canonical-stage.candidate.jsonc"));
const inventory=JSON.parse(read("test/fixtures/identity-stage-inventory-2026-10-14.json"));
const tables=["user","session","account","verification","rateLimit"];
const db=names=>({
 prepare(sql){
  return {async all(){
   if(!/sqlite_master/.test(sql))throw Error("No executable fixture query");
   return {success:true,results:names.map(name=>({name}))};
  }};
 },
 async batch(){return [];}
});
const env=(invited=false)=>({
  ANEVUM_CANONICAL_STAGE_ENABLED:"true",
  CANONICAL_SCHEMA_APPROVED:"true",
  CANONICAL_GOOGLE_ENABLED:"true",
  CANONICAL_INVITED_SIGNUP_ENABLED:invited?"true":"false",
  CANONICAL_BETTER_AUTH_SECRET:"s".repeat(48),
  CANONICAL_GOOGLE_CLIENT_ID:"fixture-google-client-id",
  CANONICAL_GOOGLE_CLIENT_SECRET:"fixture-google-client-secret",
  CANONICAL_INVITE_EMAILS:"pilot_one@fixture.invalid,pilot_two@fixture.invalid",
  CANONICAL_PROTECTED_EMAILS:"protected_owner@fixture.invalid",
  MEMBER_DB:db(tables)
});
const req=(path,opts={},host=CANONICAL_ORIGIN)=>
  new Request(host+path,{method:opts.method||"GET",headers:opts.headers,body:opts.body});
const post=(path,body,headers={})=>req(path,{
  method:"POST",
  headers:{
    origin:CANONICAL_ORIGIN,"sec-fetch-site":"same-origin",
    "content-type":"application/json",...headers
  },
  body:typeof body==="string"?body:JSON.stringify(body)
});
const calls=[];
const fakeAuth=()=>({async handler(request){
 calls.push({
   path:new URL(request.url).pathname,
   method:request.method,
   cookie:request.headers.get("cookie"),
   authorization:request.headers.get("authorization"),
   origin:request.headers.get("origin"),
   body:request.method==="POST"?await request.text():null
 });
 return new Response('{"ok":true}',{
   status:200,headers:{
     "content-type":"application/json",
     "set-cookie":"__Secure-anevum_can_stage.session_token=stage-only; Path=/; Secure; HttpOnly; SameSite=Lax",
     "access-control-allow-origin":"*",
     "access-control-allow-credentials":"true"
   }
 });
}});
const stage=createCanonicalStageWorker({authFactory:fakeAuth});
const parse=async res=>res.json();

test("V013 candidate is explicitly unbound and disabled in source control",()=>{
 assert.equal(candidate.name,"anevum-canonical-member-staging");
 assert.equal(candidate.main,"./canonical-auth/worker.mjs");
 assert.equal(candidate.workers_dev,false);
 assert.equal(candidate.preview_urls,false);
 assert.deepEqual(candidate.routes,[]);
 assert.equal(candidate.vars.ANEVUM_CANONICAL_STAGE_ENABLED,"false");
 assert.equal(candidate.vars.CANONICAL_SCHEMA_APPROVED,"false");
 assert.equal(candidate.vars.CANONICAL_GOOGLE_ENABLED,"false");
 assert.equal(candidate.vars.CANONICAL_INVITED_SIGNUP_ENABLED,"false");
 assert.equal(candidate.d1_databases,undefined);
 const serialized=JSON.stringify(candidate);
 assert.doesNotMatch(serialized,/anevum\.com\/\*|RHEN|Alpaca|BETTER_AUTH_SECRET|GOOGLE_CLIENT_SECRET|fa96e36d|b2f9b4ad|6c7b5f0c/i);
 assert.equal(assessIdentityStageInventory(inventory).status,"blocked");
});

test("canonical configuration cannot activate without exact explicit flags, database and secrets",()=>{
 const empty=canonicalConfigState({});
 assert.equal(empty.operational,false);
 assert.equal(empty.invited,false);
 assert.equal(canonicalConfigState(env()).operational,true);
 assert.equal(canonicalConfigState(env()).invited,false);
 assert.equal(canonicalConfigState(env(true)).invited,true);
 const base=env(true);
 for(const [key,value] of [
   ["ANEVUM_CANONICAL_STAGE_ENABLED","TRUE"],
   ["CANONICAL_SCHEMA_APPROVED","false"],
   ["CANONICAL_GOOGLE_ENABLED","false"],
   ["CANONICAL_BETTER_AUTH_SECRET","short"],
   ["CANONICAL_GOOGLE_CLIENT_ID","bad"],
   ["CANONICAL_GOOGLE_CLIENT_SECRET",null],
   ["CANONICAL_PROTECTED_EMAILS",""],
   ["MEMBER_DB",null]
 ]){
  const actual=canonicalConfigState({...base,[key]:value});
  assert.equal(actual.operational,false,key);
  assert.equal(actual.invited,false,key);
 }
 const oneInvite=canonicalConfigState({...base,CANONICAL_INVITE_EMAILS:"pilot_one@fixture.invalid"});
 assert.equal(oneInvite.operational,true);
 assert.equal(oneInvite.invited,false);
});

test("user creation is explicitly denied without pilot authorization and never grants owner",()=>{
 assert.equal(permitCanonicalUserCreation(env(),"pilot_one@fixture.invalid"),false);
 assert.equal(permitCanonicalUserCreation(env(true),"pilot_one@fixture.invalid"),true);
 assert.equal(permitCanonicalUserCreation(env(true),"PILOT_TWO@FIXTURE.INVALID"),true);
 assert.equal(permitCanonicalUserCreation(env(true),"unknown@fixture.invalid"),false);
 assert.equal(permitCanonicalUserCreation(env(true),"protected_owner@fixture.invalid"),false);
 assert.equal(permitCanonicalUserCreation(env(true),"pilot_one@other.invalid"),false);
 assert.equal(permitCanonicalUserCreation(env(true),null),false);
 assert.equal(permitCanonicalUserCreation(env(true),{}),false);
 assert.equal(permitCanonicalUserCreation(env(true),"pilot_one@fixture.invalid\n"),true);
});

test("Better Auth remains separate, with no implicit linking, passwords, owner roles or subdomain cookies",async()=>{
 assert.throws(()=>canonicalAuthOptions({}),/disabled/);
 const off=canonicalAuthOptions(env());
 assert.equal(off.baseURL,CANONICAL_ORIGIN);
 assert.equal(off.basePath,CANONICAL_AUTH_PATH);
 assert.equal(off.advanced.cookiePrefix,CANONICAL_COOKIE_PREFIX);
 assert.equal(off.advanced.crossSubDomainCookies,undefined);
 assert.deepEqual(off.trustedOrigins,[CANONICAL_ORIGIN]);
 assert.equal(off.emailAndPassword.enabled,false);
 assert.equal(off.socialProviders.google.requireEmailVerification,true);
 assert.equal(off.socialProviders.google.disableSignUp,true);
 assert.equal(off.socialProviders.google.disableImplicitSignUp,true);
 assert.equal(off.account.accountLinking.disableImplicitLinking,true);
 assert.equal(off.account.encryptOAuthTokens,true);
 assert.equal(off.account.storeStateStrategy,"database");
 assert.equal(off.rateLimit.storage,"database");
 assert.equal(off.rateLimit.customRules["/sign-in/social"].max,5);
 assert.equal(await off.databaseHooks.user.create.before({email:"pilot_one@fixture.invalid"}),false);
 const on=canonicalAuthOptions(env(true));
 assert.equal(on.socialProviders.google.disableSignUp,false);
 assert.equal(on.socialProviders.google.disableImplicitSignUp,false);
 assert.deepEqual(await on.databaseHooks.user.create.before({email:"pilot_one@fixture.invalid"}),
   {data:{email:"pilot_one@fixture.invalid"}});
 assert.equal(await on.databaseHooks.user.create.before({email:"unauthorized@fixture.invalid"}),false);
 let captured;
 createCanonicalAuth(env(true),options=>(captured=options,{handler:()=>{}}));
 assert.equal(captured.database,env(true).MEMBER_DB===captured.database?captured.database:captured.database);
 assert.equal(captured.socialProviders.google.scope.includes("email"),true);
 const source=read("canonical-auth/auth.mjs");
 assert.doesNotMatch(source,/from "\.\.\/\.\.\/src\/server\/member|RHEN|alpaca|memberEntitlement|grantXp|privilegedRole/);
});

test("schema readiness is verified from actual D1 metadata, not a source flag",async()=>{
 assert.equal(await canonicalSchemaReady(env()),true);
 assert.equal(await canonicalSchemaReady({...env(),MEMBER_DB:db(tables.slice(0,4))}),false);
 assert.equal(await canonicalSchemaReady({...env(),MEMBER_DB:db([])}),false);
 assert.equal(await canonicalSchemaReady({...env(),MEMBER_DB:{prepare(){throw Error("D1 offline")},batch(){}}}),false);
 assert.equal(await canonicalSchemaReady({...env(),MEMBER_DB:null}),false);
});

test("origin is exactly a.anevum.com, not apex, sibling, insecure HTTP or attacker suffix",()=>{
 assert.equal(isCanonicalOrigin(req("/api/v1/member/health")),true);
 for(const url of [
  "https://anevum.com/api/v1/member/health",
  "https://next.anevum.com/api/v1/member/health",
  "https://a.anevum.com.evil.example/api/v1/member/health",
  "http://a.anevum.com/api/v1/member/health"
 ])assert.equal(isCanonicalOrigin(new Request(url)),false,url);
});

test("disabled service returns only inert health/method discovery",async()=>{
 calls.length=0;
 const disabled={...env(),ANEVUM_CANONICAL_STAGE_ENABLED:"false"};
 const health=await parse(await stage.fetch(req("/api/v1/member/health"),disabled));
 assert.deepEqual(health,{
  service:"anevum-canonical-auth-staging",status:"closed",
  registration:"closed",linkedCreatorAccounts:false
 });
 const methods=await parse(await stage.fetch(req("/api/v1/member/auth-methods"),disabled));
 assert.equal(methods.registration,"closed");
 assert.equal(methods.methods.google.available,false);
 assert.equal(methods.methods.email.available,false);
 assert.equal(methods.linking,"disabled");
 assert.equal((await stage.fetch(req("/api/v1/member/auth/get-session"),disabled)).status,503);
 assert.equal((await stage.fetch(req("/api/v1/member/me"),disabled)).status,404);
 assert.equal((await stage.fetch(req("/api/v1/member/projects"),disabled)).status,404);
 assert.equal((await stage.fetch(req("/api/v1/member/health",{method:"POST"}),disabled)).status,405);
 assert.deepEqual(calls,[]);
});

test("only allowlisted Better Auth endpoints function once config and schema pass",async()=>{
 calls.length=0;
 const active=env();
 const methods=await parse(await stage.fetch(req("/api/v1/member/auth-methods"),active));
 assert.equal(methods.registration,"closed");
 assert.equal(methods.methods.google.available,true);
 assert.equal(methods.methods.github.available,false);
 const all=[
  ["/api/v1/member/me","GET"],["/api/v1/member/creators/showcase","GET"],
  ["/api/v1/member/auth/list-users","GET"],["/api/v1/member/auth/link-social","POST"],
  ["/api/v1/member/auth/sign-up/email","POST"],["/api/v1/member/auth/sign-in/email","POST"],
  ["/api/v1/member/auth/sign-up/social","POST"],["/api/v1/member/auth/sign-in/github","POST"],
  ["/api/v1/member/auth/delete-user","POST"],["/api/v1/member/auth/update-user","POST"],
  ["/api/v1/member/auth/admin/create-user","POST"],["/api/v1/member/auth/get-session","HEAD"],
  ["/api/v1/member/auth/callback/github","GET"],["/api/v1/member/auth/callback/google","POST"]
 ];
 for(const [path,method] of all){
  const response=await stage.fetch(req(path,{method}),active);
  assert.equal(response.status,404,method+" "+path);
 }
 assert.deepEqual(calls,[]);
});

test("unknown or legacy cookies and Bearer tokens cannot enter Better Auth handler",async()=>{
 calls.length=0;
 const cookie="__Host-anevum_stage_sid=legacy-secret; better-auth.session_token=v5-secret; " +
  "__Secure-anevum_can_stage.session_token=stage-secret; tracking=personal";
 const response=await stage.fetch(req("/api/v1/member/auth/get-session",{
   headers:{cookie,authorization:"Bearer legacy-token"}
 }),env());
 assert.equal(response.status,200);
 assert.equal(calls.length,1);
 assert.equal(calls[0].cookie,"__Secure-anevum_can_stage.session_token=stage-secret");
 assert.equal(calls[0].authorization,null);
 assert.equal(response.headers.get("access-control-allow-origin"),null);
 assert.equal(response.headers.get("access-control-allow-credentials"),null);
 assert.match(response.headers.get("set-cookie")||"",/anevum_can_stage/);
 assert.equal(response.headers.get("cache-control"),"private, no-store");
 assert.equal(response.headers.get("x-frame-options"),"DENY");
 assert.equal(withoutForeignCookies(req("/api/v1/member/auth/get-session")).headers.get("cookie"),null);
});

test("OAuth login accepts only bounded Google provider and fixed on-site callback",async()=>{
 calls.length=0;
 let response=await stage.fetch(post("/api/v1/member/auth/sign-in/social",{provider:"google"}),env(true));
 assert.equal(response.status,200);
 assert.deepEqual(JSON.parse(calls.at(-1).body),{provider:"google",callbackURL:"/join"});
 assert.equal(calls.at(-1).authorization,null);
 assert.equal(calls.at(-1).cookie,null);
 response=await stage.fetch(post("/api/v1/member/auth/sign-in/social",{provider:"google",callbackURL:"/join"}),env(true));
 assert.equal(response.status,200);
 for(const payload of [
  {provider:"github"},
  {provider:"google",callbackURL:"https://other.example"},
  {provider:"google",callbackURL:"//evil.example"},
  {provider:"google",callbackURL:"/account"},
  {provider:"google",callbackURL:"/join",role:"founder"},
  {provider:"google",callbackURL:"/join",userId:"legacy-user"},
  {provider:"google",callbackURL:"/join",disableRedirect:true},
  [],
  "not-json"
 ]){
  const before=calls.length;
  const res=await stage.fetch(post("/api/v1/member/auth/sign-in/social",payload),env(true));
  assert.equal(res.status,400,JSON.stringify(payload));
  assert.equal(calls.length,before);
 }
 const tooLarge="x".repeat(700);
 assert.equal((await stage.fetch(post("/api/v1/member/auth/sign-in/social",tooLarge),env(true))).status,400);
});

test("cross-site POST, missing origin, unsupported media and auth path queries fail closed",async()=>{
 calls.length=0;
 const active=env(true),sign="/api/v1/member/auth/sign-in/social";
 const blocked=[
  post(sign,{provider:"google"},{origin:"https://evil.example"}),
  post(sign,{provider:"google"},{"sec-fetch-site":"cross-site"}),
  post(sign,{provider:"google"},{origin:"null"}),
  req(sign,{method:"POST",body:JSON.stringify({provider:"google"}),headers:{"content-type":"application/json"}}),
  post(sign+"?as=founder",{provider:"google"}),
  post(sign,{provider:"google"},{"content-type":"text/plain"})
 ];
 for(const request of blocked){
  const result=await stage.fetch(request,active);
  assert.ok([400,403].includes(result.status),result.status);
 }
 assert.equal(calls.length,0);
 assert.equal((await stage.fetch(req("/api/v1/member/auth/sign-out",{method:"POST"}),active)).status,403);
});

test("Google callback permits provider navigation but never forwards foreign cookies",async()=>{
 calls.length=0;
 const response=await stage.fetch(req("/api/v1/member/auth/callback/google?code=fixture&state=fixture",{
   headers:{
     "sec-fetch-site":"cross-site",
     "cookie":"__Host-anevum_stage_sid=old; __Secure-anevum_can_stage.oauth_state=pilot-state"
   }
 }),env());
 assert.equal(response.status,200);
 assert.equal(calls.length,1);
 assert.equal(calls[0].cookie,"__Secure-anevum_can_stage.oauth_state=pilot-state");
 assert.equal(calls[0].path,"/api/v1/member/auth/callback/google");
 assert.equal((await stage.fetch(req("/api/v1/member/auth/callback/google?"+ "a".repeat(4100)),env())).status,400);
});

test("missing canonical database or schema blocks auth handler even with rollout switches",async()=>{
 calls.length=0;
 const missingTables={...env(true),MEMBER_DB:db(["user","session"])};
 assert.equal((await stage.fetch(req("/api/v1/member/auth/get-session"),missingTables)).status,503);
 const missingBinding={...env(true),MEMBER_DB:null};
 assert.equal((await stage.fetch(req("/api/v1/member/auth/get-session"),missingBinding)).status,503);
 const badHost=await stage.fetch(req("/api/v1/member/health",{},"https://anevum.com"),env(true));
 assert.equal(badHost.status,404);
 assert.deepEqual(calls,[]);
});
