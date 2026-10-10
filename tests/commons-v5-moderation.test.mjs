import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {moderatorAllowed,moderationEndpoint} from "../src/server/commons-moderation.mjs";
const origin="https://anevum-member-staging.devonakins.workers.dev";
const moderator={id:"mod-1",email:"approved@example.test",emailVerified:true};
const another={id:"ordinary-1",email:"ordinary@example.test",emailVerified:true};
const unverified={...moderator,emailVerified:false};
const flags={
  MEMBER_PREVIEW_ORIGIN:origin,ANEVUM_MEMBER_PREVIEW_ENABLED:"true",
  ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"true",
  COMMAND_ACCESS_EMAILS:"approved@example.test"
};
const postId="223e4567-e89b-12d3-a456-426614174000";
const reportId="223e4567-e89b-12d3-a456-426614174001";
const base="/api/member/commons/moderation/reports";
const req=(route,method="GET",data)=>new Request(origin+route,{
  method,headers:method==="POST"?{"Content-Type":"application/json",Origin:origin}:{},
  body:data===undefined?undefined:JSON.stringify(data)
});
async function invoke(db,user=moderator,accessEmail=moderator.email,route=base,
  method="GET",body,override={}){
  const response=await moderationEndpoint(req(route,method,body),{
    ...flags,MEMBER_DB:db,...override
  },user,origin,route.split("?")[0],accessEmail);
  return {status:response.status,payload:await response.json()};
}

function fakeDb(){
  const store={
    reports:new Map([[reportId,{id:reportId,post_id:postId,reason:"privacy",
      reporter_user_id:"ordinary-1",status:"PENDING",created_at:77}]]),
    posts:new Map([[postId,{id:postId,title:"Evidence provenance",
      body:"Research question with detailed methodological evidence.",
      status:"PUBLISHED",updated_at:77}]]),
    events:new Map()
  };
  const tables=[
    "commons_v5_posts","commons_v5_replies","commons_v5_reports",
    "commons_v5_moderation_events"
  ];
  const db={
    prepare(sql){
      return {
        all:async()=>{
          if(sql.includes("sqlite_master"))return {results:tables.map(name=>({name}))};
          if(sql.startsWith("SELECT r.id AS report_id")){
            return {results:[...store.reports.values()]
              .filter(r=>r.status==="PENDING")
              .map(r=>({report_id:r.id,reason:r.reason,created_at:r.created_at,
                post_id:r.post_id,...store.posts.get(r.post_id)}))};
          }
          throw Error("Unexpected queue query");
        },
        bind(...args){return {sql,args};}
      };
    },
    async batch(prepared){
      assert.equal(prepared.length,3);
      const [up,hide,audit]=prepared;
      assert.match(up.sql,/UPDATE commons_v5_reports SET status/);
      assert.match(hide.sql,/UPDATE commons_v5_posts SET status/);
      assert.match(audit.sql,/INSERT INTO commons_v5_moderation_events/);
      const r=store.reports.get(up.args[1]);
      if(!r||r.status!=="PENDING")return [{meta:{changes:0}},{meta:{changes:0}},{meta:{changes:0}}];
      r.status=up.args[0];
      let changes=0;
      const p=store.posts.get(r.post_id);
      if(p?.status==="PUBLISHED"&&hide.args[2]==="HIDE"){
        p.status="HIDDEN";p.updated_at=hide.args[0];changes=1;
      }
      const [id,actor_user_id,action,reason,occurred_at,report_id,target_status]=audit.args;
      assert.equal(report_id,r.id);
      assert.equal(target_status,r.status);
      assert.equal(store.events.size,0);
      store.events.set(id,{id,actor_user_id,action,reason,occurred_at,
        report_id,target_post_id:postId});
      return [{meta:{changes:1}},{meta:{changes}},{meta:{changes:1}}];
    }
  };
  return {db,store};
}

test("moderation requires matching independently verified Access identity and explicit allowlist",()=>{
  assert.equal(moderatorAllowed(flags,moderator,origin,moderator.email),true);
  assert.equal(moderatorAllowed(flags,unverified,origin,moderator.email),false);
  assert.equal(moderatorAllowed(flags,moderator,origin,undefined),false);
  assert.equal(moderatorAllowed(flags,moderator,origin,another.email),false);
  assert.equal(moderatorAllowed(flags,another,origin,another.email),false);
  assert.equal(moderatorAllowed({...flags,COMMAND_ACCESS_EMAILS:""},moderator,origin,moderator.email),false);
  assert.equal(moderatorAllowed({...flags,ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false"},moderator,origin,moderator.email),false);
  assert.equal(moderatorAllowed(flags,moderator,"https://anevum.com",moderator.email),false);
});

test("staff queue requires dual authorization and excludes account and brokerage information",async()=>{
  const {db}=fakeDb();
  assert.equal((await invoke(db,moderator,null)).status,403);
  assert.equal((await invoke(db,another,another.email)).status,403);
  const {status,payload}=await invoke(db);
  assert.equal(status,200);
  assert.equal(payload.pending.length,1);
  assert.equal(payload.pending[0].id,reportId);
  assert.equal(payload.pending[0].post.id,postId);
  assert.ok(!JSON.stringify(payload).includes("reporter_user_id"));
  assert.ok(!JSON.stringify(payload).includes("broker"));
});

test("moderator hiding a reported post leaves one durable scoped audit entry",async()=>{
  const {db,store}=fakeDb();
  const route=base+"/"+reportId+"/resolve";
  const first=await invoke(db,moderator,moderator.email,route,"POST",{
    decision:"HIDE",reason:"Verified disclosure of private member information"
  });
  assert.equal(first.status,200);
  assert.equal(first.payload.moderationAuditRecorded,true);
  assert.equal(first.payload.executionEnabled,false);
  assert.equal(store.posts.get(postId).status,"HIDDEN");
  assert.equal(store.reports.get(reportId).status,"REVIEWED");
  assert.equal(store.events.size,1);
  assert.equal([...store.events.values()][0].actor_user_id,moderator.id);
  assert.equal([...store.events.values()][0].report_id,reportId);
  const repeated=await invoke(db,moderator,moderator.email,route,"POST",{
    decision:"HIDE",reason:"Duplicate attempt must not change state"
  });
  assert.equal(repeated.status,409);
  assert.equal(store.events.size,1);
  assert.equal((await invoke(db)).payload.pending.length,0);
});

test("dismissed report retains published post and records dismissal audit",async()=>{
  const {db,store}=fakeDb();
  const route=base+"/"+reportId+"/resolve";
  const result=await invoke(db,moderator,moderator.email,route,"POST",{
    decision:"DISMISS",reason:"No violation supported by evidence"
  });
  assert.equal(result.status,200);
  assert.equal(store.reports.get(reportId).status,"DISMISSED");
  assert.equal(store.posts.get(postId).status,"PUBLISHED");
  assert.equal([...store.events.values()][0].action,"dismiss_report");
});

test("unexpected decisions, client-selected identities and malformed IDs do not write",async()=>{
  const {db,store}=fakeDb();
  const route=base+"/"+reportId+"/resolve";
  for(const data of [
    {decision:"BAN",reason:"Eight-char reason"},
    {decision:"HIDE",reason:"short"},
    {decision:"HIDE",reason:"acceptable reason",memberId:"someone"},
    {decision:"HIDE",reason:"acceptable reason",moderator:"admin"},
    {decision:"HIDE",reason:"valid reason\nwith unsafe newline"}
  ]){
    assert.equal((await invoke(db,moderator,moderator.email,route,"POST",data)).status,400);
  }
  assert.equal((await invoke(db,moderator,moderator.email,base+"/not-an-id/resolve",
    "POST",{decision:"HIDE",reason:"Valid longer reason"})).status,404);
  assert.equal(store.events.size,0);
  assert.equal(store.posts.get(postId).status,"PUBLISHED");
});

test("moderator routing is pre-authenticated by Access and also subject to Better Auth",()=>{
  const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const worker=read("worker.mjs");
  const member=read("src/server/member.mjs");
  const social=read("src/server/commons-moderation.mjs");
  const schema=read("migrations-social/0006_commons_v5_discussions.sql");
  assert.match(worker,/pathname\.startsWith\("\/api\/member\/commons\/moderation\/"\)/);
  assert.match(worker,/const credential = await commandCredential\(request, env\)/);
  assert.match(worker,/moderatorAccessEmail: credential\.identity\.email/);
  assert.match(member,/const user = session\?\.user/);
  assert.match(member,/!safeMutation\(request, verifiedOrigin\)/);
  assert.match(member,/moderationEndpoint\(request, env, user, verifiedOrigin/);
  assert.match(social,/list\.length>0 && list\.includes\(memberEmail\)/);
  assert.match(schema,/report_id TEXT UNIQUE REFERENCES commons_v5_reports/);
  assert.match(schema,/actor_user_id TEXT REFERENCES "user"\("id"\) ON DELETE SET NULL/);
  const ui=read("src/commons/CommonsModeration.tsx");
  const pages=read("src/commons/CommonsPages.tsx");
  const app=read("src/App.tsx");
  assert.match(pages,/pathname === "\/communities\/moderation"/);
  assert.match(app,/<Route path="\/communities\/moderation"/);
  assert.match(ui,/fetch\("\/api\/member\/commons\/moderation\/reports"/);
  assert.match(ui,/moderationAuditRecorded/);
  assert.doesNotMatch(ui,/dangerouslySetInnerHTML|localStorage\.getItem\("moderator"/);

  assert.doesNotMatch(social,/order_submit|trade_execute|brokerToken|\/v2\/orders/);
});
