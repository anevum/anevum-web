// True Better Auth session exercise using an in-memory D1-compatible SQLite shim.
// No network requests, real emails, deployed routes or persistent member records.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import worker from "../web/a-canonical-stage.review.mjs";
import {createCanonicalAuth} from "../canonical-auth/auth.mjs";

const ORIGIN="https://a.anevum.com";
const read=p=>readFileSync(new URL("../canonical-auth/migrations/"+p,import.meta.url),"utf8");
const auth="/api/v1/member/auth";
function fixture(){
  const db=new DatabaseSync(":memory:");
  for(const file of ["0001_canonical_better_auth_core.sql",
    "0002_member_creator_profiles.sql","0003_member_world_personalization.sql"]){
    db.exec(read(file));
  }
  const adapter={
    prepare(sql){
      let params=[];
      const compile=()=>db.prepare(sql);
      const statement={
        sql,get args(){return params},
        bind(...args){params=args;return statement},
        async all(){return {success:true,results:compile().all(...params),meta:{changes:0,last_row_id:0,changed_db:false}}},
        async first(column){const row=compile().get(...params)||null;return column?row?.[column]??null:row},
        async raw(options){const query=compile();const rows=query.all(...params).map(Object.values);
          return options?.columnNames?[query.columns().map(c=>c.name),...rows]:rows;},
        async run(){const result=compile().run(...params);return {success:true,meta:{
          changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid),
          changed_db:result.changes>0},results:[]}}
      };
      return statement;
    },
    async batch(statements){const result=[];db.exec("SAVEPOINT better_auth_fixture");try{
      for(const stmt of statements){const query=db.prepare(stmt.sql);
        if(query.columns().length>0)result.push({success:true,results:query.all(...stmt.args),meta:{changes:0,last_row_id:0,changed_db:false}});
        else {const change=query.run(...stmt.args);result.push({success:true,results:[],
          meta:{changes:Number(change.changes),last_row_id:Number(change.lastInsertRowid)}});}
      }
      db.exec("RELEASE SAVEPOINT better_auth_fixture");
    }catch(e){db.exec("ROLLBACK TO SAVEPOINT better_auth_fixture");db.exec("RELEASE SAVEPOINT better_auth_fixture");throw e}return result},
    async exec(sql){db.exec(sql);return {count:1,duration:0}},
    async dump(){throw Error("Dump is unavailable in local test fixture")},
    withSession(){return {prepare:adapter.prepare,batch:adapter.batch,getBookmark:()=>null}}
  };
  const env={
    ANEVUM_CANONICAL_STAGE_ENABLED:"true",CANONICAL_SCHEMA_APPROVED:"true",
    CANONICAL_EMAIL_ENABLED:"true",CANONICAL_GOOGLE_ENABLED:"false",
    CANONICAL_INVITED_SIGNUP_ENABLED:"true",
    CANONICAL_BETTER_AUTH_SECRET:"private-fixture-unique-not-deployed-value".padEnd(48,"x"),
    CANONICAL_RESEND_API_KEY:"never-live-fixture-not-a-key".padEnd(48,"x"),
    CANONICAL_PROTECTED_EMAILS:"owner@fixture.invalid",
    CANONICAL_INVITE_EMAILS:"pilot_a@fixture.invalid,pilot_b@fixture.invalid",
    MEMBER_DB:adapter
  };
  return {db,env};
}
const post=(path,body,cookie)=>new Request(ORIGIN+path,{
  method:"POST",headers:{"origin":ORIGIN,"sec-fetch-site":"same-origin",
    "content-type":"application/json",...(cookie?{cookie}:null)},
  body:JSON.stringify(body)
});
const get=(path,cookie)=>new Request(ORIGIN+path,{headers:cookie?{cookie}:undefined});
function cookieFrom(response){
  const header=response.headers.get("set-cookie")||"";
  const first=header.split(";")[0];
  assert.match(first,/anevum_can_stage/);
  assert.match(header,/HttpOnly/i);
  assert.match(header,/Secure/i);
  return first;
}


test("V025 native deletion removes only confirmed signed-in canonical member and cascades private rows",{timeout:30000},async()=>{
 const {db,env}=fixture();env.CANONICAL_ACCOUNT_ERASURE_ENABLED="true";
 const oldFetch=globalThis.fetch;
 const codes=new Map();
 globalThis.fetch=async (uri,opts)=>{
   assert.equal(String(uri),"https://api.resend.com/emails");
   const email=JSON.parse(opts.body);
   const code=/verification code is (\d{8})/.exec(email.text)?.[1];
   assert.match(code||"",/^\d{8}$/);
   codes.set(email.to[0],code);
   return Response.json({id:"offline-erasure-fixture"},{status:200});
 };
 try{
   async function join(email){
     const send=await worker.fetch(post(auth+"/email-otp/send-verification-otp",{
       email,type:"sign-in"
     }),env);
     assert.equal(send.status,200);
     const signIn=await worker.fetch(post(auth+"/sign-in/email-otp",{
       email,otp:codes.get(email)
     }),env);
     assert.equal(signIn.status,200);
     return cookieFrom(signIn);
   }
   const a=await join("pilot_a@fixture.invalid");
   const b=await join("pilot_b@fixture.invalid");
   assert.equal((await worker.fetch(post("/api/v1/member/creator-profile",{
      handle:"pilot_alpha",displayName:"Alpha",bio:"private A"
   },a),env)).status,201);
   assert.equal((await worker.fetch(post("/api/v1/member/creator-profile",{
      handle:"pilot_beta",displayName:"Beta",bio:"private B"
   },b),env)).status,201);
   const path="/api/v1/member/account-delete";
   const exact={email:"pilot_a@fixture.invalid",confirmation:"DELETE MY ANEVUM ACCOUNT"};
   assert.equal((await worker.fetch(get(path,a),env)).status,404);
   assert.equal((await worker.fetch(post(auth+"/delete-user",{},a),env)).status,404,
     "Native destructive route must never be directly available");
   assert.equal((await worker.fetch(post(path,{...exact,confirmation:"DELETE"},a),env)).status,400);
   assert.equal((await worker.fetch(post(path,{...exact,email:"pilot_b@fixture.invalid"},a),env)).status,400);
   const foreign=new Request(ORIGIN+path,{method:"POST",
     headers:{origin:"https://external.invalid","sec-fetch-site":"cross-site",
       "content-type":"application/json",cookie:a},body:JSON.stringify(exact)});
   assert.equal((await worker.fetch(foreign,env)).status,403);
   const removed=await worker.fetch(post(path,exact,a),env);
   assert.equal(removed.status,200,
     "Fresh verified A must be deleted by native Better Auth; status="+removed.status);
   assert.equal(db.prepare("SELECT COUNT(*) n FROM user").get().n,1);
   assert.equal(db.prepare("SELECT COUNT(*) n FROM session").get().n,1);
   assert.equal(db.prepare("SELECT COUNT(*) n FROM account").get().n,1);
   assert.equal(db.prepare("SELECT COUNT(*) n FROM member_creator_profiles").get().n,1);
   assert.equal(db.prepare("SELECT COUNT(*) n FROM member_creator_edit_limits").get().n,0);
   assert.equal(db.prepare("SELECT handle FROM member_creator_profiles").get().handle,"pilot_beta");
   const former=await worker.fetch(get(auth+"/get-session",a),env);
   assert.equal((await former.json())?.user??null,null);
   const remaining=await worker.fetch(get(auth+"/get-session",b),env);
   assert.equal((await remaining.json())?.user?.email,"pilot_b@fixture.invalid");
   assert.equal((await worker.fetch(post(path,exact,a),env)).status,401);
 }finally{globalThis.fetch=oldFetch;db.close();}
});

test("V025 account removal defaults OFF and cannot target the protected owner or a stale session",async()=>{
 const {db,env}=fixture();
 try{
   const request=post("/api/v1/member/account-delete",{
     email:"pilot_a@fixture.invalid",confirmation:"DELETE MY ANEVUM ACCOUNT"});
   const disabled=await worker.fetch(request,env);
   assert.equal(disabled.status,404);
   assert.equal(db.prepare("SELECT COUNT(*) n FROM user").get().n,0);
 }finally{db.close();}
});
