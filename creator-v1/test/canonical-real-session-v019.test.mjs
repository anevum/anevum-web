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

for(const mode of ["invite-only","open"])test(`two independent users complete composed ${mode} OTP sessions without sharing profiles`, {timeout:30000}, async()=>{
  const {db,env}=fixture();
  env.CANONICAL_PUBLIC_SIGNUP_ENABLED=mode==="open"?"true":"false";
  if(mode==="open")env.CANONICAL_INVITE_EMAILS="";
  const priorFetch=globalThis.fetch;
  const sent=new Map();
  globalThis.fetch=async (input,options)=>{
    assert.equal(String(input),"https://api.resend.com/emails");
    const mail=JSON.parse(options.body);
    const code=/verification code is (\d{8})/.exec(mail.text)?.[1];
    assert.match(code||"",/^\d{8}$/);
    sent.set(mail.to[0],code);
    return Response.json({id:"offline-only"},{status:200});
  };
  try{
    const methods=await worker.fetch(get("/api/v1/member/auth-methods"),env);
    assert.equal(methods.status,200);
    assert.equal((await methods.json()).registration,mode);
    const open=await worker.fetch(post(auth+"/email-otp/send-verification-otp",{
      email:"pilot_a@fixture.invalid",type:"sign-in"}),env);
    if(open.status!==200){
      // Debug only, with local invalid test identifiers, never deployed secrets.
      const direct=await createCanonicalAuth(env).handler(
        post(auth+"/email-otp/send-verification-otp",{
          email:"pilot_a@fixture.invalid",type:"sign-in"}));
      assert.equal(open.status,200,"Worker rejected real Better Auth OTP; direct status "+direct.status);
    }
    assert.ok(sent.has("pilot_a@fixture.invalid"));
    const invalid=await worker.fetch(post(auth+"/sign-in/email-otp",{
      email:"pilot_a@fixture.invalid",otp:"00000000"}),env);
    assert.notEqual(invalid.status,200);
    const a=await worker.fetch(post(auth+"/sign-in/email-otp",{
      email:"pilot_a@fixture.invalid",otp:sent.get("pilot_a@fixture.invalid")}),env);
    assert.equal(a.status,200,"Real OTP sign-in A must succeed");
    const cookieA=cookieFrom(a);
    const asession=await worker.fetch(get(auth+"/get-session",cookieA),env);
    assert.equal(asession.status,200);
    assert.equal((await asession.json())?.user?.email,"pilot_a@fixture.invalid");

    assert.equal((await worker.fetch(post(auth+"/email-otp/send-verification-otp",{
      email:"pilot_b@fixture.invalid",type:"sign-in"}),env)).status,200);
    const b=await worker.fetch(post(auth+"/sign-in/email-otp",{
      email:"pilot_b@fixture.invalid",otp:sent.get("pilot_b@fixture.invalid")}),env);
    assert.equal(b.status,200,"Real OTP sign-in B must succeed");
    const cookieB=cookieFrom(b);
    assert.notEqual(cookieA,cookieB);
    const me="/api/v1/member/creator-profile";
    // Some WebKit and in-app contexts do not attach Sec-Fetch-Site to a
   // legitimate same-origin POST. Origin remains mandatory and exact.
   const safariLikeClaim=new Request(ORIGIN+me,{
     method:"POST",headers:{"origin":ORIGIN,"sec-fetch-site":"same-site",
       "x-anevum-profile-intent":"anevum-profile-write-v1",
       "content-type":"application/json","cookie":cookieA},
     body:JSON.stringify({handle:"pilot_alpha",displayName:"Pilot Alpha",bio:"First private world"})
   });
   const claimedA=await worker.fetch(safariLikeClaim,env);
   assert.equal(claimedA.status,201,"Exact-Origin member claim succeeds without optional Fetch Metadata");
    const claimedB=await worker.fetch(post(me,{
      handle:"pilot_beta",displayName:"Pilot Beta",bio:"Second private world"},cookieB),env);
    assert.equal(claimedB.status,201);
    assert.equal((await worker.fetch(get("/api/v1/members/pilot_alpha"),env)).status,404);
    const privateA=await (await worker.fetch(get(me,cookieA),env)).json();
    const privateB=await (await worker.fetch(get(me,cookieB),env)).json();
    assert.equal(privateA.profile.handle,"pilot_alpha");
    assert.equal(privateB.profile.handle,"pilot_beta");
    assert.notEqual(privateA.memberId,privateB.memberId);

    // Self-service export includes only the verified canonical owner and
    // private profile; never sessions, OTPs, other members or legacy data.
    const exportPath="/api/v1/member/account-export";
    assert.equal((await worker.fetch(get(exportPath),env)).status,401);
    const exportedResponse=await worker.fetch(get(exportPath,cookieA),env);
    assert.equal(exportedResponse.status,200);
    assert.match(exportedResponse.headers.get("content-disposition")||"",/attachment/);
    assert.match(exportedResponse.headers.get("cache-control")||"",/no-store/);
    assert.equal(exportedResponse.headers.get("access-control-allow-origin"),null);
    const exported=await exportedResponse.json();
    assert.equal(exported.format,"ANEVUM_CANONICAL_MEMBER_EXPORT_V1");
    assert.equal(exported.member.email,"pilot_a@fixture.invalid");
    assert.equal(exported.member.id,privateA.memberId);
    assert.equal(exported.profile.handle,"pilot_alpha");
    const exportedText=JSON.stringify(exported);
    assert.ok(!exportedText.includes("pilot_b@fixture.invalid"));
    assert.ok(!exportedText.includes("pilot_beta"));
    assert.ok(!exportedText.includes(cookieA));
    assert.ok(!exportedText.includes(sent.get("pilot_a@fixture.invalid")));
    assert.equal(exported.session,undefined);
    assert.equal(exported.role,undefined);
    assert.equal(exported.account,undefined);
    assert.equal((await worker.fetch(post(exportPath,{},cookieA),env)).status,404);
    const exportB=await (await worker.fetch(get(exportPath,cookieB),env)).json();
    assert.equal(exportB.member.email,"pilot_b@fixture.invalid");
    assert.equal(exportB.profile.handle,"pilot_beta");

    const cross=await worker.fetch(post(me,{
      handle:"pilot_alpha",displayName:"Stolen",bio:""},cookieB),env);
    assert.equal(cross.status,409);
    const signedOut=await worker.fetch(post(auth+"/sign-out",{},cookieA),env);
    assert.equal(signedOut.status,200);
    const after=await worker.fetch(get(auth+"/get-session",cookieA),env);
    assert.equal((await after.json())?.user??null,null);
    assert.equal((await worker.fetch(get("/api/v1/member/account-export",cookieA),env)).status,401);
  }finally{
    globalThis.fetch=priorFetch;
    db.close();
  }
});
