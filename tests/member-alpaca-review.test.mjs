import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import {
  reviewerConnectConfigured, reviewerSchemaReady, buildReviewerAuthorizeUrl,
  reviewerEndpoint, exportReviewerConnection
} from "../src/server/member-alpaca-review.mjs";

const origin="https://anevum-member-staging.devonakins.workers.dev";
const path="/api/member/alpaca/review/callback";
const userA={id:"member-a",emailVerified:true};
const userB={id:"member-b",emailVerified:true};
const token="fake-paper-authorization-token-for-test-only";
const key=btoa(String.fromCharCode(...new Uint8Array(32).fill(13)));
const envConfig={
  ANEVUM_MEMBER_PREVIEW_ENABLED:"true", MEMBER_PREVIEW_ORIGIN:origin,
  ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED:"true",
  ALPACA_CONNECT_CLIENT_ID:"test-paper-review-client-id",
  ALPACA_CONNECT_CLIENT_SECRET:"test-paper-review-client-secret",
  ALPACA_CONNECT_TOKEN_KEY_BASE64:key
};
const req=(route,method="GET",body)=>new Request(origin+route,{
  method,headers:method==="POST"?{Origin:origin,"Content-Type":"application/json"}:{},
  body:body===undefined?undefined:JSON.stringify(body)
});

function fakeDatabase() {
  const states=new Map(),consents=new Map(),connections=new Map(),calls=[];
  const names=["member_alpaca_review_states","member_alpaca_review_consent","member_alpaca_review_connections"];
  const db={prepare(sql) {
    return {
      all:async()=>({results:names.map(name=>({name}))}),
      bind(...args){
        calls.push({sql,args});
        return {
          first:async()=>{
            if(sql.includes("FROM member_alpaca_review_connections"))return connections.get(args[0])||null;
            throw Error("Unexpected first: "+sql);
          },
          run:async()=>{
            if(sql.includes("INSERT INTO member_alpaca_review_consent")){
              consents.set(args[0],{version:args[1],at:args[2]});return {meta:{changes:1}};
            }
            if(sql.includes("INSERT INTO member_alpaca_review_states")){
              const [hash,user,expiry,created,limitUser,since]=args;
              assert.equal(user,limitUser);
              if([...states.values()].filter(s=>s.user===user&&s.created>=since).length>=5)
                return {meta:{changes:0}};
              states.set(hash,{user,expiry,created,consumed:false});return {meta:{changes:1}};
            }
            if(sql.includes("UPDATE member_alpaca_review_states")){
              const [now,hash,user,at]=args;const state=states.get(hash);
              if(!state||state.consumed||state.user!==user||state.expiry<at)return {meta:{changes:0}};
              state.consumed=true;return {meta:{changes:1}};
            }
            if(sql.includes("INSERT INTO member_alpaca_review_connections")){
              const [user,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes,connected_at]=args;
              if(connections.has(user)||[...connections.values()].some(x=>x.broker_account_id===broker_account_id))
                throw Error("Duplicate broker account");
              connections.set(user,{connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes,connected_at});
              return {meta:{changes:1}};
            }
            if(sql.includes("DELETE FROM member_alpaca_review_connections")){
              return {meta:{changes:connections.delete(args[0])?1:0}};
            }
            throw Error("Unexpected run: "+sql);
          }
        };
      }
    };
  }};
  return {db,states,consents,connections,calls};
}
const configured=db=>({...envConfig,MEMBER_DB:db});
function providerFetch(brokerId="paper-member-a-1234",grantScope="",other={}) {
  const calls=[];
  const fetcher=async(url,init)=>{
    calls.push({url,method:init.method||"GET",redirect:init.redirect});
    if(url==="https://api.alpaca.markets/oauth/token")return Response.json({
      access_token:token,token_type:"bearer",scope:grantScope
    });
    if(url==="https://paper-api.alpaca.markets/v2/account")return Response.json({
      id:brokerId,status:"ACTIVE",account_blocked:false,...other
    });
    throw Error("Unexpected provider endpoint");
  };
  return {fetcher,calls};
}
async function start(db,user=userA,body={acknowledged:true,disclosureVersion:"alpaca-review-paper-v1"}) {
  const env=configured(db);
  const r=await reviewerEndpoint(req("/api/member/alpaca/review/start","POST",body),env,user,origin,
    "/api/member/alpaca/review/start");
  const data=await r.json();
  return {r,data,env,state:data.authorizeUrl?new URL(data.authorizeUrl).searchParams.get("state"):null};
}
async function callback(state,db,user=userA,fetcher=providerFetch().fetcher) {
  return reviewerEndpoint(req(path+"?state="+encodeURIComponent(state)+"&code=TEST-CODE"),configured(db),
    user,origin,path,fetcher);
}

test("production and unapproved configurations always block reviewer OAuth",async()=>{
  const {db}=fakeDatabase();
  for(const key of ["ANEVUM_MEMBER_PREVIEW_ENABLED","ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED",
    "ALPACA_CONNECT_CLIENT_ID","ALPACA_CONNECT_CLIENT_SECRET","ALPACA_CONNECT_TOKEN_KEY_BASE64"]){
    assert.equal(reviewerConnectConfigured({...configured(db),[key]:"false"},origin),false,key);
  }
  assert.equal(reviewerConnectConfigured(configured(db),"https://anevum.com"),false);
  assert.equal(reviewerConnectConfigured(configured(db),origin),true);
  assert.equal(await reviewerSchemaReady({}),false);
  const prod=JSON.parse(readFileSync(new URL("../wrangler.jsonc",import.meta.url),"utf8"));
  const stage=JSON.parse(readFileSync(new URL("../wrangler.member-staging.jsonc",import.meta.url),"utf8"));
  assert.equal(prod.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
  assert.equal(stage.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
  assert.notEqual(stage.d1_databases[0].database_id,prod.d1_databases[0].database_id);
});

test("authorization URL fixes paper environment, HTTPS callback and read-only default",()=>{
  const callbackUrl=origin+path;
  const state="x".repeat(44);
  const url=new URL(buildReviewerAuthorizeUrl("test-client-id",callbackUrl,state));
  assert.equal(url.origin,"https://app.alpaca.markets");
  assert.equal(url.pathname,"/oauth/authorize");
  assert.equal(url.searchParams.get("env"),"paper");
  assert.equal(url.searchParams.get("redirect_uri"),callbackUrl);
  assert.equal(url.searchParams.get("response_type"),"code");
  assert.equal(url.searchParams.get("state"),state);
  assert.equal(url.searchParams.has("scope"),false);
  assert.throws(()=>buildReviewerAuthorizeUrl("test","http://other.invalid"+path,state));
  assert.throws(()=>buildReviewerAuthorizeUrl("test",callbackUrl+"?x=1",state));
  assert.throws(()=>buildReviewerAuthorizeUrl("test",callbackUrl,"short"));
});

test("disclosure requires exact explicit acknowledgement and verified member first",async()=>{
  const {db,states,consents}=fakeDatabase();
  for(const body of [{},{acknowledged:false,disclosureVersion:"alpaca-review-paper-v1"},
    {acknowledged:true,disclosureVersion:"wrong"},
    {acknowledged:true,disclosureVersion:"alpaca-review-paper-v1",member_id:"other"}]){
    const r=await start(db,userA,body);
    assert.equal(r.r.status,400);
  }
  const unverified=await start(db,{id:"unverified",emailVerified:false});
  assert.equal(unverified.r.status,403);
  assert.equal(states.size,0);
  assert.equal(consents.size,0);
  const good=await start(db);
  assert.equal(good.r.status,200);
  assert.ok(good.state.length>=40);
  assert.equal(consents.get(userA.id).version,"alpaca-review-paper-v1");
  assert.ok(![...states.keys()][0].includes(good.state));
  assert.equal(good.data.executionEnabled,false);
});

test("one-time member-bound state connects a real paper account only with encrypted token",async()=>{
  const {db,connections}=fakeDatabase();
  const {state}=await start(db);
  const provider=providerFetch();
  const wrong=await callback(state,db,userB,provider.fetcher);
  assert.equal(wrong.status,403);
  assert.equal(provider.calls.length,0);
  const accepted=await callback(state,db,userA,provider.fetcher);
  assert.equal(accepted.status,303);
  assert.equal(accepted.headers.get("Location"),origin+"/apps/rhen/account?connection=linked");
  assert.equal(provider.calls.length,2);
  assert.deepEqual(provider.calls.map(x=>x.url),[
    "https://api.alpaca.markets/oauth/token","https://paper-api.alpaca.markets/v2/account"
  ]);
  const saved=connections.get(userA.id);
  assert.equal(saved.broker_account_id,"paper-member-a-1234");
  assert.equal(saved.granted_scopes,"");
  assert.ok(saved.encrypted_token && saved.token_iv);
  assert.ok(!JSON.stringify(saved).includes(token));
  assert.equal((await callback(state,db,userA,provider.fetcher)).status,403);
  assert.equal(provider.calls.length,2);
  const status=await reviewerEndpoint(req("/api/member/brokerage"),configured(db),userA,origin,"/api/member/brokerage");
  const payload=await status.json();
  assert.equal(payload.accountConnected,true);
  assert.equal(payload.connectionAvailable,true);
  assert.equal(payload.paperTradingEnabled,false);
  assert.equal(payload.liveTradingEnabled,false);
  assert.equal(payload.brokerWriteEnabled,false);
  assert.equal(payload.account.ending,"1234");
  assert.ok(!JSON.stringify(payload).includes("paper-member-a-1234"));
  assert.ok(!JSON.stringify(payload).includes(token));
  assert.deepEqual(await exportReviewerConnection(db,userA.id),
    {provider:"alpaca",environment:"paper",ending:"1234",connectedAt:saved.connected_at,executionPermission:"NONE"});
  const other=await reviewerEndpoint(req("/api/member/brokerage"),configured(db),userB,origin,"/api/member/brokerage");
  assert.equal((await other.json()).accountConnected,false);
});

test("provider escalation, denied account and duplicate broker identity always fail closed",async()=>{
  for(const [scope,account] of [["trading","paper-member-a-1234"],
    ["account:write","paper-member-a-1234"],["portfolio:write","paper-member-a-1234"],["","short"]]){
    const {db}=fakeDatabase();
    const {state}=await start(db);
    const r=await callback(state,db,userA,providerFetch(account,scope).fetcher);
    assert.equal(r.status,409);
    assert.equal((await r.json()).message.includes(token),false);
  }
  const {db,connections}=fakeDatabase();
  const a=await start(db);
  assert.equal((await callback(a.state,db)).status,303);
  const b=await start(db,userB);
  assert.equal((await callback(b.state,db,userB,providerFetch().fetcher)).status,409);
  assert.equal(connections.size,1);
});

test("known read-only provider scopes remain non-executing",async()=>{
  const {db}=fakeDatabase();
  const {state}=await start(db);
  const r=await callback(state,db,userA,providerFetch("paper-member-a-1234","account:read").fetcher);
  assert.equal(r.status,303);
  const view=await reviewerEndpoint(req("/api/member/brokerage"),configured(db),userA,origin,"/api/member/brokerage");
  const status=await view.json();
  assert.equal(status.accountConnected,true);
  assert.equal(status.liveTradingEnabled,false);
  assert.equal(status.paperTradingEnabled,false);
});

test("disabled onboarding still permits per-member disconnect without order access",async()=>{
  const {db,connections}=fakeDatabase();
  const {state}=await start(db);
  assert.equal((await callback(state,db)).status,303);
  const disabled={...configured(db),ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED:"false"};
  const status=await reviewerEndpoint(req("/api/member/brokerage"),disabled,userA,origin,"/api/member/brokerage");
  assert.equal((await status.json()).connectionAvailable,false);
  const out=await reviewerEndpoint(req("/api/member/alpaca/review/disconnect","POST"),disabled,userB,origin,
    "/api/member/alpaca/review/disconnect");
  assert.equal(out.status,200);
  assert.equal(connections.size,1);
  const gone=await reviewerEndpoint(req("/api/member/alpaca/review/disconnect","POST"),disabled,userA,origin,
    "/api/member/alpaca/review/disconnect");
  assert.equal(gone.status,200);
  assert.equal(connections.size,0);
  const body=await gone.json();
  assert.equal(body.executionEnabled,false);
});

test("API routes preserve Better Auth, privacy and migration lineage",()=>{
  const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const member=read("src/server/member.mjs");
  const worker=read("worker.mjs");
  const sql=read("migrations-review/0005_member_alpaca_review.sql");
  const ui=read("src/pages/RhenReviewConnect.tsx");
  assert.match(member,/if \(!user\?\.id\)/);
  assert.match(member,/safeMutation\(request, verifiedOrigin\)/);
  assert.match(member,/reviewerEndpoint\(request, env, user, verifiedOrigin, pathname\)/);
  assert.match(member,/brokerReview: reviewerConnection/);
  assert.match(worker,/pathname\.startsWith\("\/api\/member\/"/);
  assert.match(sql,/ON DELETE CASCADE/);
  assert.match(sql,/UNIQUE/);
  assert.match(sql,/CHECK\(environment='paper'\)/);
  assert.match(ui,/checked=\{acknowledged\}/);
  assert.match(ui,/canAuthorize \|\| !acknowledged/);
  assert.doesNotMatch(ui,/brokerToken|client_secret|<input type="password"/);
  assert.doesNotMatch(read("src/server/member-alpaca-review.mjs"),/\/v2\/orders|\/v2\/positions|placeOrder|submitOrder/);
});


test("review OAuth migration cannot ride along with member 0004 or a production deployment",()=>{
  const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const mainMigrations=readdirSync(new URL("../migrations/",import.meta.url))
    .filter(path=>path.endsWith(".sql")).sort();
  assert.deepEqual(mainMigrations,[
    "0001_member_platform.sql","0002_member_rhen_drafts.sql",
    "0003_member_billing.sql","0004_member_rhen_workspaces.sql"
  ]);
  assert.equal(existsSync(new URL("../migrations/0005_member_alpaca_review.sql",import.meta.url)),false);
  const reviewer=JSON.parse(source("wrangler.alpaca-review-migrations.jsonc"));
  const prod=JSON.parse(source("wrangler.jsonc"));
  const target=prod.previews.d1_databases.find(item=>item.binding==="MEMBER_DB");
  assert.equal(reviewer.d1_databases.length,1);
  assert.equal(reviewer.d1_databases[0].database_id,target.database_id);
  assert.notEqual(reviewer.d1_databases[0].database_id,prod.d1_databases[0].database_id);
  assert.equal(reviewer.d1_databases[0].migrations_dir,"migrations-review");
  const migration=source("migrations-review/0005_member_alpaca_review.sql");
  assert.match(migration,/ON DELETE CASCADE/);
  assert.match(migration,/CHECK\(environment='paper'\)/);
  const workflow=source(".github/workflows/member-alpaca-review-d1-migrate.yml");
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/MIGRATE_ALPACA_REVIEW_PREVIEW_ONLY/);
  assert.match(workflow,/PREVIEW_BACKUP_VERIFIED/);
  assert.match(workflow,/reviewed_schema_blob_sha/);
  assert.match(workflow,/inputs\.reviewed_head_sha == github\.sha/);
  assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow,/0004_member_rhen_workspaces\.sql/);
  assert.match(workflow,/npx wrangler d1 migrations apply MEMBER_DB --remote --config wrangler\.alpaca-review-migrations\.jsonc/);
  assert.doesNotMatch(workflow,/--config wrangler\.jsonc/);
  assert.doesNotMatch(workflow,/--config wrangler\.preview-migrations\.jsonc/);
  assert.doesNotMatch(workflow,/\n  push:/);
  const oldWorkflow=source(".github/workflows/member-preview-d1-migrate.yml");
  assert.match(oldWorkflow,/--config wrangler\.preview-migrations\.jsonc/);
  assert.doesNotMatch(oldWorkflow,/alpaca-review-migrations|migrations-review/);
});