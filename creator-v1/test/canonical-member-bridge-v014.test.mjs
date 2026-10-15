import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {
  CREATOR_LINK_ROUTE,REQUIRED_BRIDGE_MIGRATIONS,bridgeConfigured,
  bridgeSchemaReady,verifiedCanonicalSubject,findVerifiedCreator,
  canonicalCreatorBridgeStatus
} from "../canonical-auth/member-bridge.mjs";
import {createCanonicalStageWorker} from "../canonical-auth/worker.mjs";
import {IDENTITY_STAGE} from "../ops/identity-release-gate.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const NOW=1760481000000;
const time=Math.floor(NOW/1000);
const ALPHA="canonical_alpha_verified";
const BETA="canonical_beta_verified";
const C="canonical_staff_verified";

function creatorD1({links=true}={}){
  const sqlite=new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys=ON");
  sqlite.exec(read("community-preview/migrations/0001_initial_creator_platform.sql"));
  sqlite.exec(read("auth/migrations/0003_member_identity_staging.sql"));
  sqlite.exec(read("auth/migrations/0006_account_privacy.sql"));
  if(links)sqlite.exec(read("auth/migrations/0015_creator_canonical_identity_links.sql"));
  for(const [id,email,handle,staff] of [
    ["legacy_alpha","shared@fixture.invalid","alpha_maker",0],
    ["legacy_beta","second@fixture.invalid","beta_maker",0],
    ["legacy_staff","staff@fixture.invalid","staff_creator",1]
  ]){
    sqlite.prepare("INSERT INTO member_accounts(id,email,verified_at,status,created_at) VALUES(?,?,?,'active',?)")
      .run(id,email,time,time);
    sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,is_staff,status) VALUES(?,?,?,?,?,'active')")
      .run(id,handle,"Fixture "+handle,"Public synthetic bio",staff);
  }
  const db={
    prepare(sql){
      return {
        bind(...params){
          return {async all(){return {success:true,results:sqlite.prepare(sql).all(...params)}}};
        },
        async all(){return {success:true,results:sqlite.prepare(sql).all()}}
      };
    }
  };
  const link=(legacy,subject,digest)=>
    sqlite.prepare("INSERT INTO creator_canonical_identity_links(legacy_member_id,canonical_subject,canonical_issuer,proof_digest,status,verified_at,reviewed_at) VALUES(?,?,'anevum-better-auth-staging-v1',?,'verified',?,?)")
      .run(legacy,subject,digest,time,time+1);
  if(links){
    link("legacy_alpha",ALPHA,"a".repeat(64));
    link("legacy_beta",BETA,"b".repeat(64));
    link("legacy_staff",C,"c".repeat(64));
  }
  return {sqlite,db,link};
}

function env(legacy,more={}){
 return {
   ANEVUM_CANONICAL_STAGE_ENABLED:"true",
   CANONICAL_SCHEMA_APPROVED:"true",
   CANONICAL_GOOGLE_ENABLED:"true",
   CANONICAL_INVITED_SIGNUP_ENABLED:"false",
   CANONICAL_BETTER_AUTH_SECRET:"s".repeat(48),
   CANONICAL_GOOGLE_CLIENT_ID:"fixture-client-id-for-google",
   CANONICAL_GOOGLE_CLIENT_SECRET:"fixture-client-secret-for-google",
   CANONICAL_PROTECTED_EMAILS:"founder@fixture.invalid",
   MEMBER_DB:{
     prepare(sql){
       return {async all(){
         if(/sqlite_master/.test(sql))
           return {success:true,results:["user","session","account","verification","rateLimit","canonical_identity_manifest"].map(name=>({name}))};
         if(/canonical_identity_manifest/.test(sql))
           return {success:true,results:[{issuer:"anevum-better-auth-staging-v1",migration:"0001_canonical_better_auth_core"}]};
         throw Error("Unknown canonical schema probe");
       }};
     },async batch(){return[];}
   },
   ANEVUM_CANONICAL_CREATOR_BRIDGE_READ_ENABLED:"true",
   CREATOR_BRIDGE_SCHEMA_APPROVED:"true",
   CREATOR_BRIDGE_D1_ID:IDENTITY_STAGE.creatorStageDb,
   CREATOR_BRIDGE_DB:legacy.db,
   ...more
 };
}
const request=(path=CREATOR_LINK_ROUTE,options={})=>
  new Request("https://a.anevum.com"+path,{
    method:options.method||"GET",headers:options.headers
  });
const identity=(subject=ALPHA,extra={})=>({
  user:{id:subject,email:"shared@fixture.invalid",emailVerified:true,
    ...extra.user},
  session:{id:"auth_session_verified",
    userId:subject,expiresAt:new Date(NOW+300000),...extra.session}
});
function mockedAuth(response){
  const recorded=[];
  const auth=()=>({api:{async getSession({headers}){
    recorded.push({
      cookie:headers.get("cookie"),authorization:headers.get("authorization"),
      origin:headers.get("origin")
    });
    return typeof response==="function"?response():response;
  }}});
  return {auth,recorded};
}

test("V014 read-only bridge is disabled and unbound in the checked-in Worker configuration",()=>{
 const config=JSON.parse(read("wrangler.canonical-stage.candidate.jsonc"));
 assert.equal(config.vars.ANEVUM_CANONICAL_CREATOR_BRIDGE_READ_ENABLED,undefined);
 assert.equal(config.vars.CREATOR_BRIDGE_SCHEMA_APPROVED,undefined);
 assert.equal(config.vars.CREATOR_BRIDGE_D1_ID,undefined);
 assert.deepEqual(config.routes,[]);
 assert.equal(config.d1_databases,undefined);
 assert.equal(config.vars.ANEVUM_CANONICAL_STAGE_ENABLED,"false");
 assert.equal(CREATOR_LINK_ROUTE,"/api/v1/member/creator-link");
 const source=read("canonical-auth/member-bridge.mjs");
 assert.doesNotMatch(source,/^\s*(INSERT INTO|UPDATE |DELETE FROM|CREATE TABLE|ALTER TABLE)\b/gm);
 assert.doesNotMatch(source,/get\(["']email|sessionStorage|localStorage|grantXp|assignRole|setStaff/i);
});

test("the legacy D1 link is never enabled by a flag alone",async()=>{
 const legacy=creatorD1();
 try{
  const valid=env(legacy);
  assert.equal(bridgeConfigured(valid),true);
  assert.equal(await bridgeSchemaReady(valid),true);
  for(const change of [
    {ANEVUM_CANONICAL_CREATOR_BRIDGE_READ_ENABLED:"false"},
    {CREATOR_BRIDGE_SCHEMA_APPROVED:"false"},
    {CREATOR_BRIDGE_D1_ID:IDENTITY_STAGE.productionDb},
    {CREATOR_BRIDGE_D1_ID:IDENTITY_STAGE.olderV5PreviewDb},
    {CREATOR_BRIDGE_DB:null},
    {CREATOR_BRIDGE_DB:valid.MEMBER_DB}
  ]){
    const bad={...valid,...change};
    assert.equal(bridgeConfigured(bad),false,JSON.stringify(Object.keys(change)));
    assert.equal(await bridgeSchemaReady(bad),false);
  }
  assert.deepEqual(REQUIRED_BRIDGE_MIGRATIONS,[
    "0003_member_identity_staging",
    "0006_account_privacy",
    "0015_creator_canonical_identity_links"
  ]);
 }finally{legacy.sqlite.close()}
});

test("missing 0015 migration, unreadable D1 and wrong issuer are unavailable, never auto-linked",async()=>{
 const legacy=creatorD1({links:false});
 try{
  const e=env(legacy);
  assert.equal(await bridgeSchemaReady(e),false);
  const verified=mockedAuth(identity());
  const result=await canonicalCreatorBridgeStatus(request(),e,verified.auth(e),NOW);
  assert.equal(result.status,503);
  assert.equal(result.body.state,"unavailable");
 }finally{legacy.sqlite.close()}
 const legacy2=creatorD1();
 try{
  const e=env(legacy2,{CREATOR_BRIDGE_DB:{prepare(){throw Error("offline")}}});
  assert.equal(await bridgeSchemaReady(e),false);
  assert.deepEqual(await findVerifiedCreator(e,ALPHA),{state:"unavailable",creator:null});
  const wrongIssuer=env(legacy2);
  legacy2.sqlite.prepare("UPDATE creator_canonical_identity_links SET status='revoked',revoked_at=? WHERE canonical_subject=?")
    .run(time+2,ALPHA);
  assert.deepEqual(await findVerifiedCreator(wrongIssuer,ALPHA),{state:"unlinked",creator:null});
 }finally{legacy2.sqlite.close()}
});

test("canonical session must be verified, bound to itself, unexpired, and have an opaque subject",async()=>{
 const req=request(undefined,{headers:{
  Cookie:"__Host-anevum_stage_sid=legacy; better-auth.session_token=v5; __Secure-anevum_can_stage.session_token=trusted",
  Authorization:"Bearer legacy-token"
 }});
 const cases=[
  [null,null],
  [identity(),ALPHA],
  [identity(ALPHA,{user:{emailVerified:false}}),null],
  [identity(ALPHA,{session:{userId:BETA}}),null],
  [identity(ALPHA,{session:{expiresAt:new Date(NOW-10)}}),null],
  [identity(ALPHA,{session:{expiresAt:null}}),null],
  [identity("someone@example.invalid"),null],
  [identity("x"),null],
  [{user:{id:ALPHA,emailVerified:true},session:null},null]
 ];
 for(const [session,expected] of cases){
  const fake=mockedAuth(session);
  const actual=await verifiedCanonicalSubject(fake.auth(),req,NOW);
  assert.equal(actual,expected);
  assert.equal(fake.recorded.length,1);
  assert.equal(fake.recorded[0].cookie,
    "__Secure-anevum_can_stage.session_token=trusted");
  assert.equal(fake.recorded[0].authorization,null);
 }
 const failed=mockedAuth(()=>{throw Error("DB down")});
 assert.equal(await verifiedCanonicalSubject(failed.auth(),req,NOW),null);
});

test("two canonical sessions resolve only their explicit separate creator mapping",async()=>{
 const legacy=creatorD1();
 try{
  const e=env(legacy);
  const a=await canonicalCreatorBridgeStatus(request(),e,mockedAuth(identity(ALPHA)).auth(),NOW);
  const b=await canonicalCreatorBridgeStatus(request(),e,mockedAuth(identity(BETA)).auth(),NOW);
  assert.equal(a.status,200);
  assert.equal(b.status,200);
  assert.deepEqual(a.body.creator,{
    handle:"alpha_maker",displayName:"Fixture alpha_maker",bio:"Public synthetic bio"
  });
  assert.deepEqual(b.body.creator,{
    handle:"beta_maker",displayName:"Fixture beta_maker",bio:"Public synthetic bio"
  });
  assert.deepEqual(a.body.capabilities,{
    creatorReadOnly:true,privateMemberWrites:false,linkChanges:false
  });
  assert.equal(JSON.stringify(a).includes("legacy_alpha"),false);
  assert.equal(JSON.stringify(a).includes("shared@fixture.invalid"),false);
  assert.equal(JSON.stringify(a).includes(ALPHA),false);
  assert.equal(JSON.stringify(b).includes("legacy_alpha"),false);
  assert.equal(JSON.stringify(b).includes("alpha_maker"),false);
 }finally{legacy.sqlite.close()}
});

test("equal email, forged member ID, different account or missing verified link never claims another creator",async()=>{
 const legacy=creatorD1();
 try{
  const e=env(legacy);
  const foreignSubject="canonical_unlinked_test";
  const verified=mockedAuth(identity(foreignSubject,{user:{
    email:"shared@fixture.invalid",memberId:"legacy_alpha",
    handle:"alpha_maker",role:"owner"
  }}));
  const output=await canonicalCreatorBridgeStatus(request(
    CREATOR_LINK_ROUTE+"?memberId=legacy_alpha&handle=alpha_maker"
  ),e,verified.auth(),NOW);
  // The read-only resolver itself uses only the verified session subject.
  assert.equal(output.status,409);
  assert.equal(output.body.state,"unlinked");
  assert.equal(output.body.creator,null);
  assert.deepEqual(await findVerifiedCreator(e,foreignSubject),{
    state:"unlinked",creator:null
  });
  assert.equal((await canonicalCreatorBridgeStatus(request(),e,mockedAuth(identity()).auth(),NOW)).body.creator.handle,"alpha_maker");
 }finally{legacy.sqlite.close()}
});

test("revocation, suspension, deletion and staff role all fail closed without privilege crossover",async()=>{
 const legacy=creatorD1();
 try{
  const e=env(legacy);
  const staff=await canonicalCreatorBridgeStatus(request(),e,mockedAuth(identity(C)).auth(),NOW);
  assert.equal(staff.status,409);
  assert.equal(staff.body.creator,null);
  legacy.sqlite.prepare("UPDATE creator_canonical_identity_links SET status='revoked',revoked_at=? WHERE canonical_subject=?")
    .run(time+10,ALPHA);
  assert.equal((await findVerifiedCreator(e,ALPHA)).state,"unlinked");
  legacy.sqlite.prepare("UPDATE member_accounts SET status='suspended' WHERE id='legacy_beta'").run();
  assert.equal((await findVerifiedCreator(e,BETA)).state,"unlinked");
  legacy.sqlite.prepare("UPDATE member_accounts SET status='active' WHERE id='legacy_beta'").run();
  legacy.sqlite.prepare("UPDATE creator_profiles SET status='deleted' WHERE member_id='legacy_beta'").run();
  assert.equal((await findVerifiedCreator(e,BETA)).state,"unlinked");
  legacy.sqlite.prepare("DELETE FROM member_accounts WHERE id='legacy_alpha'").run();
  assert.equal(legacy.sqlite.prepare("SELECT count(*) n FROM creator_canonical_identity_links WHERE canonical_subject=?").get(ALPHA).n,0);
  assert.equal((await findVerifiedCreator(e,ALPHA)).state,"unlinked");
 }finally{legacy.sqlite.close()}
});

test("link endpoint is read-only and cannot be used with guest, wrong-host, body, query or write",async()=>{
 const legacy=creatorD1();
 try{
  const e=env(legacy);
  const saved=mockedAuth(identity(ALPHA));
  const stage=createCanonicalStageWorker({authFactory:saved.auth});
  const get=await stage.fetch(request(),e);
  // The V013 canonical Worker tests use Date.now(); do not time-travel in this
  // HTTP test: inject a genuinely future expiration.
  assert.equal(get.status,401);
  const future=mockedAuth(identity(ALPHA,{session:{expiresAt:new Date(Date.now()+300000)}}));
  const worker=createCanonicalStageWorker({authFactory:future.auth});
  const result=await worker.fetch(request(undefined,{headers:{
   Cookie:"__Host-anevum_stage_sid=forged; __Secure-anevum_can_stage.session_token=valid",
   Authorization:"Bearer old-token"
  }}),e);
  assert.equal(result.status,200);
  assert.equal((await result.json()).creator.handle,"alpha_maker");
  assert.equal(result.headers.get("cache-control"),"private, no-store");
  assert.equal(result.headers.get("access-control-allow-origin"),null);
  assert.equal(result.headers.get("x-frame-options"),"DENY");
  assert.equal(future.recorded[0].authorization,null);
  assert.equal(future.recorded[0].cookie,"__Secure-anevum_can_stage.session_token=valid");
  assert.equal((await worker.fetch(request(CREATOR_LINK_ROUTE+"?handle=alpha_maker"),e)).status,400);
  for(const method of ["POST","PATCH","DELETE"]){
   const req=new Request("https://a.anevum.com"+CREATOR_LINK_ROUTE,{method});
   assert.equal((await worker.fetch(req,e)).status,405);
  }
  assert.equal((await worker.fetch(new Request("https://next.anevum.com"+CREATOR_LINK_ROUTE),e)).status,404);
  assert.equal((await worker.fetch(new Request("https://anevum.com"+CREATOR_LINK_ROUTE),e)).status,404);
  assert.equal((await worker.fetch(request("/api/v1/member/me"),e)).status,404);
  assert.equal((await worker.fetch(request("/api/v1/member/projects"),e)).status,404);
  assert.equal((await worker.fetch(request("/api/v1/member/creator-link/change"),e)).status,404);
  const disabled={...e,ANEVUM_CANONICAL_CREATOR_BRIDGE_READ_ENABLED:"false"};
  assert.equal((await worker.fetch(request(),disabled)).status,503);
 }finally{legacy.sqlite.close()}
});

test("zero authenticated sessions, disabled features, and absent links disclose no identity",async()=>{
 const legacy=creatorD1();
 try{
  const e=env(legacy);
  const fake=mockedAuth(null);
  const worker=createCanonicalStageWorker({authFactory:fake.auth});
  const noSession=await worker.fetch(request(),e);
  assert.equal(noSession.status,401);
  assert.deepEqual(await noSession.json(),{state:"signed-out",creator:null});
  const broken={...e,CREATOR_BRIDGE_D1_ID:IDENTITY_STAGE.olderV5PreviewDb};
  const output=await worker.fetch(request(),broken);
  assert.equal(output.status,503);
  assert.deepEqual(await output.json(),{state:"unavailable",creator:null});
 }finally{legacy.sqlite.close()}
});
