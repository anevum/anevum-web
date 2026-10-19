// Synthetic regression tests for schema and engine efficiency.
// Never reuses sessions or test identities across database bindings.
import test from "node:test";
import assert from "node:assert/strict";
import {createCanonicalAuthResolver,createCanonicalStageWorker} from "../canonical-auth/worker.mjs";
import {canonicalSchemaReady} from "../canonical-auth/policy.mjs";
import {canonicalCreatorSchemaReady} from "../canonical-auth/profile.mjs";

const canonicalTables=["user","session","account","verification","rateLimit","canonical_identity_manifest"];
const creatorTables=["user","member_creator_profiles","member_creator_edit_limits"];
function syntheticDb(){
 const queried=[];
 let issuer='anevum-better-auth-staging-v1';
 const db={
  prepare(sql){queried.push(sql);
   return {async all(){
    if(sql==="SELECT name FROM sqlite_master WHERE type = 'table'")
     return {success:true,results:[...canonicalTables,...creatorTables].map(name=>({name}))};
    if(sql.includes("SELECT issuer,migration FROM canonical_identity_manifest"))
     return {success:true,results:[{issuer,migration:"0001_canonical_better_auth_core"}]};
    if(sql.includes("member_creator_profiles','member_creator_edit_limits"))
     return {success:true,results:creatorTables.map(name=>({name}))};
    if(sql==="PRAGMA table_info(member_creator_profiles)")
     return {success:true,results:["user_id","handle","display_name","bio","visibility","revision","headline","world_theme","focus_json"].map(name=>({name}))};
    throw Error("Unexpected query "+sql);
   }};
  },
  async batch(){return []}
 };
 return {db,queried,setIssuer:value=>issuer=value};
}
const config=db=>({
 ANEVUM_CANONICAL_STAGE_ENABLED:"true",
 CANONICAL_SCHEMA_APPROVED:"true",
 CANONICAL_BETTER_AUTH_SECRET:"s".repeat(48),
 CANONICAL_EMAIL_ENABLED:"true",CANONICAL_RESEND_API_KEY:"t".repeat(48),
 CANONICAL_PROTECTED_EMAILS:"owner@fixture.invalid",
 CANONICAL_INVITED_SIGNUP_ENABLED:"true",
 CANONICAL_INVITE_EMAILS:"alpha@fixture.invalid,beta@fixture.invalid",
 MEMBER_DB:db
});

test("positive readiness checks run once per binding within 30 seconds",async()=>{
 const {db,queried}=syntheticDb(),env=config(db);
 assert.equal(await canonicalSchemaReady(env),true);
 assert.equal(await canonicalCreatorSchemaReady(db),true);
 const first=queried.length;
 assert.equal(first,4);
 assert.equal(await canonicalSchemaReady(env),true);
 assert.equal(await canonicalCreatorSchemaReady(db),true);
 // Database-wide table scans are cached. The trusted issuer is not.
 assert.equal(queried.length,first+1);
 assert.ok(queried.at(-1).includes("SELECT issuer,migration"));
});

test("issuer marker changes immediately invalidate schema readiness",async()=>{
 const setup=syntheticDb(),env=config(setup.db);
 assert.equal(await canonicalSchemaReady(env),true);
 setup.setIssuer("untrusted-issuer");
 assert.equal(await canonicalSchemaReady(env),false);
 assert.equal(setup.queried.length,3,"metadata cached, issuer verified a second time");
});

test("independent databases do not reuse a previous schema certification",async()=>{
 const a=syntheticDb(),b=syntheticDb();
 assert.equal(await canonicalSchemaReady(config(a.db)),true);
 assert.equal(await canonicalSchemaReady(config(b.db)),true);
 assert.equal(a.queried.length,2);
 assert.equal(b.queried.length,2);
});

test("engine resolution is confined to a binding and exact auth settings",()=>{
 let created=0;
 const authFor=createCanonicalAuthResolver(()=>({created:++created}));
 const db1=syntheticDb().db,db2=syntheticDb().db,env=config(db1);
 const original=authFor(env);
 assert.equal(authFor({...env}),original);
 assert.equal(created,1);
 const rotated=authFor({...env,CANONICAL_BETTER_AUTH_SECRET:"z".repeat(48)});
 assert.notEqual(rotated,original);
 assert.equal(created,2);
 assert.notEqual(authFor(config(db2)),rotated);
 assert.equal(created,3);
 const originalConfigAgain=authFor(config(db1));
 assert.notEqual(originalConfigAgain,original);
 assert.equal(created,4);
});

test("reused auth engine resolves fresh cookies on every request",async()=>{
 const {db}=syntheticDb(),env=config(db);let factories=0,handlers=0;
 const worker=createCanonicalStageWorker({authFactory:()=>{
  factories++;
  return {async handler(req){
   handlers++;
   return Response.json({cookie:req.headers.get("cookie")});
  }};
 }});
 const make=token=>new Request("https://a.anevum.com/api/v1/member/auth/get-session",
  {headers:{cookie:"__Secure-anevum_can_stage.session_token="+token}});
 const a=await worker.fetch(make("first"),env);
 const b=await worker.fetch(make("second"),env);
 assert.equal(a.status,200);
 assert.equal(b.status,200);
 assert.match((await a.json()).cookie,/first/);
 assert.match((await b.json()).cookie,/second/);
 assert.equal(factories,1);
 assert.equal(handlers,2);
});
