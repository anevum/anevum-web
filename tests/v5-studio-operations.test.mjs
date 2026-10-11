import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {studioEndpoint} from "../src/server/studio-content.mjs";
const owner={id:"owner-member-000001",email:"anevum.studio@gmail.com",emailVerified:true};
const ordinary={id:"member-ordinary-003",email:"member@example.test",emailVerified:true};
const production="https://anevum.com";
const pilot="https://anevum-member-staging.devonakins.workers.dev";
const flags={ANEVUM_STUDIO_ENABLED:"true",ANEVUM_STUDIO_OWNER_MEMBER_ID:owner.id,
 ANEVUM_STUDIO_ACCESS_EMAILS:owner.email,ANEVUM_STUDIO_PUBLISH_ENABLED:"false"};
function database({accounts=5,rows=[{status:"DRAFT",total:3},{status:"PUBLISHED",total:2}],
 auditEvents=7,pendingReports=4,broken=false,invalidCounts=false,invalidStatus=false}={}){
 const tables=["studio_entries","studio_entry_events","commons_v5_posts",
  "commons_v5_replies","commons_v5_reports","commons_v5_moderation_events"];
 return {
  prepare(sql){
   return {sql,
    async all(){
     if(sql.includes("sqlite_master"))return {results:tables.map(name=>({name}))};
     throw Error("Unexpected non-aggregate query");
    },
    async first(){
     if(sql.includes("commons_v5_reports"))return {total:pendingReports};
     throw Error("Unexpected single-value query");
    }
   };
  },
  async batch(queries){
   assert.equal(queries.length,3);
   assert.match(queries[0].sql,/COUNT\(\*\) AS total FROM "user"/);
   assert.match(queries[1].sql,/FROM studio_entries GROUP BY status/);
   assert.match(queries[2].sql,/FROM studio_entry_events/);
   if(broken)throw Error("D1 unavailable");
   return [
    {results:[{total:invalidCounts?-1:accounts}]},
    {results:invalidStatus?[{status:"UNEXPECTED",total:3}]:rows},
    {results:[{total:auditEvents}]}
   ];
  }
 };
}
async function invoke({db=database(),user=owner,email=user.email,origin=production,env={},
 method="GET",route="/api/member/studio/overview"}={}){
 const req=new Request(origin+route,{method,headers:{"Accept":"application/json"}});
 const response=await studioEndpoint(req,{...flags,MEMBER_DB:db,...env},user,origin,route,email);
 return {status:response.status,body:await response.json(),headers:response.headers};
}
test("staff aggregates reflect real storage counts without releasing user or brokerage data",async()=>{
 const result=await invoke();
 assert.equal(result.status,200);
 assert.equal(result.body.schemaVersion,"anevum.studio.overview.v1");
 assert.equal(result.body.viewerMemberId,owner.id);
 assert.deepEqual(result.body.members,{registered:5});
 assert.deepEqual(result.body.publications,{drafts:3,published:2,archived:0});
 assert.deepEqual(result.body.audit,{events:7});
 assert.deepEqual(result.body.moderation,{state:"PILOT_DISABLED",pendingReports:null});
 assert.match(result.headers.get("cache-control"),/no-store/);
 const output=JSON.stringify(result.body);
 for(const secret of ["member@example.test","apiKey","broker","token","clientSecret"])
   assert.ok(!output.includes(secret),"Sensitive content present: "+secret);
});
test("no studio access is granted by ordinary authentication, email spoofing or body",async()=>{
 assert.equal((await invoke({user:ordinary})).status,403);
 assert.equal((await invoke({email:"devon@anevum.com"})).status,403);
 assert.equal((await invoke({env:{ANEVUM_STUDIO_ENABLED:"false"}})).status,403);
 assert.equal((await invoke({env:{ANEVUM_STUDIO_OWNER_MEMBER_ID:"incorrect"}})).status,403);
 assert.equal((await invoke({method:"POST"})).status,405);
});
test("operational read refuses corrupted, duplicate and missing D1 totals",async()=>{
 assert.equal((await invoke({db:database({broken:true})})).status,503);
 assert.equal((await invoke({db:database({invalidCounts:true})})).status,503);
 assert.equal((await invoke({db:database({invalidStatus:true})})).status,503);
 assert.equal((await invoke({db:database({rows:[{status:"DRAFT",total:1},{status:"DRAFT",total:2}]})})).status,503);
 assert.equal((await invoke({db:database({rows:[],accounts:0,auditEvents:0})})).status,200);
});
test("moderation count is only visible when isolated pilot is genuinely configured",async()=>{
 const env={ANEVUM_MEMBER_PREVIEW_ENABLED:"true",MEMBER_PREVIEW_ORIGIN:pilot,
  ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"true"};
 const result=await invoke({origin:pilot,env});
 assert.equal(result.status,200);
 assert.deepEqual(result.body.moderation,{state:"PILOT_READY",pendingReports:4});
 const disabled=await invoke({origin:pilot,env:{...env,ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false"}});
 assert.deepEqual(disabled.body.moderation,{state:"PILOT_DISABLED",pendingReports:null});
 const unavailable=await invoke({origin:pilot,env,db:{
  ...database(),prepare(sql){
    if(sql.includes("sqlite_master")&&sql.includes("commons_v5_"))
      return {all:async()=>({results:[]})};
    return database().prepare(sql);
  }
 }});
 assert.equal(unavailable.body.moderation.state,"STORAGE_UNAVAILABLE");
 assert.equal(unavailable.body.moderation.pendingReports,null);
});
test("private UI validates exact session and hides metrics on errors",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const page=read("src/pages/StudioDashboard.tsx");
 const component=read("src/pages/StudioOperations.tsx");
 const server=read("src/server/studio-content.mjs");
 const operation=read("src/server/studio-operations.mjs");
 const css=read("src/styles/commons-v5-studio.css");
 assert.match(server,/pathname === "\/api\/member\/studio\/overview"/);
 assert.match(server,/studioOperationsOverview\(request,env,user,origin\)/);
 assert.match(page,/<StudioOperations memberId=\{id\}\/>/);
 assert.match(component,/v.viewerMemberId!==id/);
 assert.match(component,/controller.abort\(\)/);
 assert.match(component,/state==="unavailable"/);
 assert.match(component,/moderation.pendingReports===null/); // API semantics not inferred on client
 assert.match(operation,/COUNT\(\*\) AS total FROM "user"/);
 assert.match(operation,/No counts were inferred|Counts not verified|Counts not verified|Counts not verified|not verified/i);
 assert.match(css,/studio-ops-metrics/);
 assert.doesNotMatch(component,/dangerouslySetInnerHTML|localStorage|order_submit|brokerToken/);
});
