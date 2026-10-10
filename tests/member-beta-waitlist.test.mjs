import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { memberBetaEndpoint, memberBetaSchemaReady } from "../src/server/member-beta.mjs";

function fakeDb() {
  const members=new Map();
  const queries=[];
  return {
    members,queries,
    prepare(sql) {
      const stmt={
        sql,args:[],
        bind(...args){this.args=args;return this;},
        async first() {
          if(sql.includes("sqlite_master"))return {name:"member_rhen_beta_waitlist"};
          if(sql.includes("SELECT joined_at"))return members.has(this.args[0])?{joined_at:members.get(this.args[0])}:null;
          throw Error("Unexpected SELECT: "+sql);
        },
        async run() {
          queries.push({sql,args:[...this.args]});
          if(sql.includes("INSERT OR IGNORE")) {
            if(!members.has(this.args[0]))members.set(this.args[0],"2026-10-09 12:00:00");
          } else if(sql.includes("DELETE FROM member_rhen_beta_waitlist")) {
            members.delete(this.args[0]);
          } else throw Error("Unexpected mutation: "+sql);
          return {success:true};
        }
      };
      return stmt;
    }
  };
}
const prodOrigin="https://anevum.com";
const makeRequest=(method,body="{}")=>new Request(prodOrigin+"/api/member/rhen/beta",{
  method,
  ...(method==="GET"?{}:{headers:{"Content-Type":"application/json"},body:method==="POST"?body:undefined})
});
const enabled=(db)=>({MEMBER_DB:db,ANEVUM_RHEN_BETA_WAITLIST_ENABLED:"true"});
const account=(id)=>({id,email:id+"@example.test",emailVerified:true});

test("free beta signup always requires separate release approval and schema",async()=>{
  assert.equal(await memberBetaSchemaReady({}),false);
  const db=fakeDb();
  const blocked=await memberBetaEndpoint(makeRequest("GET"),{
    MEMBER_DB:db,ANEVUM_RHEN_BETA_WAITLIST_ENABLED:"false"
  },account("one"));
  assert.equal(blocked.status,503);
  assert.equal((await blocked.json()).available,false);
  const missing=await memberBetaEndpoint(makeRequest("GET"),enabled({
    prepare(){return {async first(){return null;}};}
  }),account("one"));
  assert.equal(missing.status,503);
  assert.equal(await memberBetaSchemaReady(db),true);
});

test("join, duplicate join, withdrawal and account isolation never grant trading",async()=>{
  const db=fakeDb(),env=enabled(db);
  assert.equal((await (await memberBetaEndpoint(makeRequest("GET"),env,account("one"))).json()).joined,false);
  let result=await memberBetaEndpoint(makeRequest("POST"),env,account("one"));
  assert.equal(result.status,200);
  let body=await result.json();
  assert.equal(body.joined,true);
  assert.equal(body.priceCents,0);
  assert.equal(body.charged,false);
  assert.equal(body.executionEnabled,false);
  assert.equal(body.brokerageConnected,false);
  assert.equal(db.members.size,1);
  await memberBetaEndpoint(makeRequest("POST"),env,account("one"));
  assert.equal(db.members.size,1);
  result=await memberBetaEndpoint(makeRequest("GET"),env,account("two"));
  assert.equal((await result.json()).joined,false);
  result=await memberBetaEndpoint(makeRequest("POST"),env,account("two"));
  assert.equal((await result.json()).joined,true);
  assert.equal(db.members.size,2);
  await memberBetaEndpoint(makeRequest("DELETE"),env,account("one"));
  assert.equal(db.members.has("one"),false);
  assert.equal(db.members.has("two"),true);
  assert.equal(db.queries.every(x=>x.args.length===1 && ["one","two"].includes(x.args[0])),true);
});

test("unverified user, spoofed identity or unsafe JSON cannot register",async()=>{
  const db=fakeDb(),env=enabled(db);
  const other={...account("one"),emailVerified:false};
  assert.equal((await memberBetaEndpoint(makeRequest("POST"),env,other)).status,403);
  for(const body of ['{"user_id":"two"}','{"plan":"paid"}','[]','null','not-json','{"x":1,"y":2}']) {
    const result=await memberBetaEndpoint(makeRequest("POST",body),env,account("one"));
    assert.equal(result.status,400,body);
  }
  assert.equal(db.members.size,0);
  const missingType=new Request(prodOrigin+"/api/member/rhen/beta",{method:"POST",body:"{}"});
  assert.equal((await memberBetaEndpoint(missingType,env,account("one"))).status,400);
});

test("beta remains separate from payments, owner RHEN API, and staging gate",()=>{
  const production=JSON.parse(readFileSync(new URL("../wrangler.jsonc",import.meta.url),"utf8"));
  const staging=JSON.parse(readFileSync(new URL("../wrangler.member-staging.jsonc",import.meta.url),"utf8"));
  assert.equal(production.vars.ANEVUM_RHEN_BETA_WAITLIST_ENABLED,"false");
  assert.equal(staging.vars.ANEVUM_RHEN_BETA_WAITLIST_ENABLED,"false");
  const worker=readFileSync(new URL("../worker.mjs",import.meta.url),"utf8");
  const member=readFileSync(new URL("../src/server/member.mjs",import.meta.url),"utf8");
  const schema=readFileSync(new URL("../migrations/0003_member_billing.sql",import.meta.url),"utf8");
  const beta=readFileSync(new URL("../src/server/member-beta.mjs",import.meta.url),"utf8");
  assert.match(member,/pathname === "\/api\/member\/rhen\/beta"/);
  assert.match(member,/safeMutation\(request, verifiedOrigin\)/);
  assert.match(member,/rhenBetaWaitlist/);
  assert.match(worker,/commandCredential\(request, env\)/);
  assert.match(schema,/REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.doesNotMatch(beta,/STRIPE_SECRET_KEY|alpaca|broker[_-]?key|executionEnabled:\s*true|order_write/i);
});
