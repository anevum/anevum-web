import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {
 studioRole,studioEndpoint,studioPublicEndpoint,studioSchemaReady,validateEditorialEntry
} from "../src/server/studio-content.mjs";
import {moderatorAllowed} from "../src/server/commons-moderation.mjs";

const origin="https://anevum.com";
const owner={id:"owner-member-000001",email:"anevum.studio@gmail.com",emailVerified:true};
const administrator={id:"admin-member-000002",email:"devon@anevum.com",emailVerified:true};
const ordinary={id:"ordinary-member-03",email:"tester@example.net",emailVerified:true};
const envBase={
 ANEVUM_STUDIO_ENABLED:"true",ANEVUM_STUDIO_PUBLISH_ENABLED:"true",
 ANEVUM_STUDIO_OWNER_MEMBER_ID:owner.id,ANEVUM_STUDIO_ADMIN_MEMBER_ID:administrator.id,
 COMMAND_ACCESS_EMAILS:"anevum.studio@gmail.com,devon@anevum.com"
};
const payload={kind:"AHA",title:"An observable discovery",summary:"A first-party record about a reproducible result.",
 body:"This is a longer first-party write-up with meaningful content and documented limitations."};
function request(route,method="GET",data,extraHeaders={}){
 const headers={...(data===undefined?{}:{"Content-Type":"application/json"}),...extraHeaders};
 return new Request(origin+route,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
}
async function response(db,{route="/api/member/studio/status",method="GET",data,user=owner,
 accessEmail=owner.email,env={},headers={}}={}){
 const res=await studioEndpoint(request(route,method,data,headers),{...envBase,MEMBER_DB:db,...env},
 user,origin,route,accessEmail);
 return {status:res.status,data:await res.json()};
}
async function publicResponse(db,route="/api/public/studio/entries",env={}){
 const path=new URL(origin+route).pathname;
 const res=await studioPublicEndpoint(request(route),{...envBase,MEMBER_DB:db,...env},path);
 return {status:res.status,data:await res.json()};
}
function fakeDB(){
 const entries=new Map(),events=new Map();
 function prepared(sql,args=[]){
  return {
   sql,args,
   bind(...values){return prepared(sql,values);},
   async all(){
    if(sql.includes("sqlite_master"))return {results:[
     {name:"studio_entries"},{name:"studio_entry_events"}]};
    if(sql.startsWith("SELECT * FROM studio_entries ORDER BY updated_at"))
     return {results:[...entries.values()].sort((a,b)=>b.updated_at-a.updated_at)};
    if(sql.startsWith("SELECT action,revision,actor_member_id,created_at FROM studio_entry_events")) {
      return {results:[...events.values()].filter(x=>x.entry_id===args[0])
        .sort((a,b)=>b.revision-a.revision).slice(0,101)};
    }
    if(sql.startsWith("SELECT slug,kind,title,summary,published_at FROM studio_entries")){
     return {results:[...entries.values()].filter(x=>x.status==="PUBLISHED"&&
       (args[0]===null||x.kind===args[0]))
       .sort((a,b)=>(b.published_at-a.published_at)||b.id.localeCompare(a.id))};
    }
    throw Error("Unknown all() query: "+sql);
   },
   async first(){
    if(sql.startsWith("SELECT id,revision FROM studio_entries WHERE id=?"))
     return entries.get(args[0])||null;
    if(sql.startsWith("SELECT * FROM studio_entries WHERE id=?"))
     return entries.get(args[0])||null;
    if(sql.startsWith("SELECT slug,kind,title,summary,body,published_at FROM studio_entries"))
     return [...entries.values()].find(x=>x.slug===args[0]&&x.status==="PUBLISHED")||null;
    throw Error("Unknown first() query: "+sql);
   }
  };
 }
 const db={prepare:sql=>prepared(sql),
  async batch(statements){
   const changes=[];
   for(const op of statements){
    const {sql,args}=op;
    let changed=0;
    if(sql.startsWith("INSERT INTO studio_entries(")){
     const [id,slug,kind,title,summary,body,created_by_member_id,
      updated_by_member_id,created_at,updated_at]=args;
     if(!entries.has(id)){
      entries.set(id,{id,slug,kind,title,summary,body,status:"DRAFT",revision:1,
       created_by_member_id,updated_by_member_id,created_at,updated_at,published_at:null});
      changed=1;
     }
    }else if(sql.startsWith("INSERT INTO studio_entry_events(")&&sql.includes("VALUES")){
     const [id,entry_id,actor_member_id,created_at]=args;
     if(entries.has(entry_id)){
      events.set(id,{id,entry_id,actor_member_id,action:"CREATE",revision:1,created_at});
      changed=1;
     }
    }else if(sql.startsWith("UPDATE studio_entries SET kind")){
     const [kind,title,summary,body,updated_by_member_id,updated_at,id,revision]=args;
     const row=entries.get(id);
     if(row&&row.status==="DRAFT"&&row.revision===revision){
      Object.assign(row,{kind,title,summary,body,updated_by_member_id,updated_at,
       revision:row.revision+1});changed=1;
     }
    }else if(sql.startsWith("UPDATE studio_entries SET status")){
     const [status,published_at,updated_by_member_id,updated_at,id,revision,previous]=args;
     const row=entries.get(id);
     if(row&&row.status===previous&&row.revision===revision){
      Object.assign(row,{status,published_at,updated_by_member_id,updated_at,
       revision:row.revision+1});changed=1;
     }
    }else if(sql.startsWith("INSERT INTO studio_entry_events(")&&sql.includes("SELECT")){
     const [id,actor_member_id,action,created_at,entry_id,revision,status]=args;
     const row=entries.get(entry_id);
     if(row&&row.revision===revision&&row.status===status&&
       ![...events.values()].some(x=>x.entry_id===entry_id&&x.revision===revision)){
      events.set(id,{id,entry_id,actor_member_id,action,revision,created_at});
      changed=1;
     }
    }else throw Error("Unknown batch query: "+sql);
    changes.push({meta:{changes:changed}});
   }
   return changes;
  }};
 return {db,entries,events};
}
test("primary owner and secondary admin require exact Google ID, Access assertion and allowlist",()=>{
 assert.equal(studioRole(envBase,owner,owner.email),"owner");
 assert.equal(studioRole(envBase,administrator,administrator.email),"admin");
 assert.equal(studioRole(envBase,ordinary,ordinary.email),null);
 assert.equal(studioRole(envBase,owner,administrator.email),null);
 assert.equal(studioRole(envBase,{...owner,id:"fabricated-id"},owner.email),null);
 assert.equal(studioRole(envBase,{...owner,emailVerified:false},owner.email),null);
 assert.equal(studioRole({...envBase,ANEVUM_STUDIO_ENABLED:"false"},owner,owner.email),null);
 assert.equal(studioRole({...envBase,COMMAND_ACCESS_EMAILS:""},owner,owner.email),null);
 assert.equal(studioRole({...envBase,ANEVUM_STUDIO_ADMIN_MEMBER_ID:"other-id"},administrator,administrator.email),null);
});
test("validation excludes client role overrides, malformed documents and empty drafts",()=>{
 assert.deepEqual(validateEditorialEntry(payload),payload);
 for(const attempt of [
  {...payload,memberId:"owner-member-000001"},
  {...payload,status:"PUBLISHED"}, {...payload,kind:"PROMOTION"},
  {...payload,title:"abc"}, {...payload,body:"short"},
  {...payload,title:"bad\u0000name"}, {...payload,summary:""},
 ])assert.equal(validateEditorialEntry(attempt),null);
 assert.deepEqual(validateEditorialEntry({...payload,expectedRevision:1},true),
  {...payload,expectedRevision:1});
 assert.equal(validateEditorialEntry({...payload,expectedRevision:0},true),null);
});
test("missing or disabled schema fails closed rather than advertising publishing",async()=>{
 const store=fakeDB();
 assert.equal(await studioSchemaReady(store.db),true);
 assert.equal((await response(store.db,{user:ordinary,accessEmail:ordinary.email})).status,403);
 assert.equal((await response(store.db,{env:{ANEVUM_STUDIO_ENABLED:"false"}})).status,403);
 assert.equal((await publicResponse(store.db,"/api/public/studio/entries",{ANEVUM_STUDIO_ENABLED:"false"})).status,503);
 const unavailable={prepare:()=>({all:async()=>({results:[]})})};
 assert.equal((await response(unavailable)).data.contentReady,false);
});
test("create/edit/publish/unpublish/archive preserve private drafts and audited revisions",async()=>{
 const {db,entries,events}=fakeDB();
 const base="/api/member/studio/entries";
 let created=await response(db,{route:base,method:"POST",data:payload});
 assert.equal(created.status,201);
 assert.equal(created.data.entry.status,"DRAFT");
 assert.equal(created.data.action,"CREATE");assert.equal(created.data.auditRecorded,true);
 assert.equal(entries.size,1);assert.equal(events.size,1);
 const id=created.data.entry.id,slug=created.data.entry.slug;
 assert.equal((await publicResponse(db)).data.entries.length,0);
 assert.equal((await publicResponse(db,"/api/public/studio/entries/"+slug)).status,404);
 const edit={...payload,title:"A verified experimental result",expectedRevision:1};
 let edited=await response(db,{route:base+"/"+id,method:"PATCH",data:edit});
 assert.equal(edited.status,200);assert.equal(edited.data.entry.revision,2);
 assert.equal((await response(db,{route:base+"/"+id,method:"PATCH",data:edit})).status,409);
 let published=await response(db,{route:base+"/"+id+"/publish",method:"POST",
  data:{confirm:"PUBLISH",expectedRevision:2}});
 assert.equal(published.status,200);assert.equal(published.data.entry.status,"PUBLISHED");
 const list=await publicResponse(db);
 assert.equal(list.data.entries.length,1);assert.equal(list.data.entries[0].slug,slug);
 assert.ok(!JSON.stringify(list.data).includes(payload.body));
 const detail=await publicResponse(db,"/api/public/studio/entries/"+slug);
 assert.equal(detail.data.entry.body,payload.body);
 assert.equal(detail.data.entry.title,edit.title);
 let unpublished=await response(db,{route:base+"/"+id+"/unpublish",method:"POST",
  data:{confirm:"UNPUBLISH",expectedRevision:3}});
 assert.equal(unpublished.status,200);assert.equal(unpublished.data.entry.status,"DRAFT");
 assert.equal((await publicResponse(db,"/api/public/studio/entries/"+slug)).status,404);
 let archived=await response(db,{route:base+"/"+id+"/archive",method:"POST",
  data:{confirm:"ARCHIVE",expectedRevision:4}});
 assert.equal(archived.status,200);assert.equal(archived.data.entry.status,"ARCHIVED");
 assert.equal((await response(db,{route:base+"/"+id,method:"PATCH",
  data:{...payload,expectedRevision:5}})).status,409);
 assert.deepEqual([...events.values()].map(x=>x.action),
  ["CREATE","EDIT","PUBLISH","UNPUBLISH","ARCHIVE"]);
});
test("publishing requires an independent explicit feature flag and action consent",async()=>{
 const {db}=fakeDB(),base="/api/member/studio/entries";
 const created=await response(db,{route:base,method:"POST",data:payload});
 const id=created.data.entry.id;
 assert.equal((await response(db,{route:base+"/"+id+"/publish",method:"POST",
  data:{confirm:"PUBLISH",expectedRevision:1},
  env:{ANEVUM_STUDIO_PUBLISH_ENABLED:"false"}})).status,403);
 assert.equal((await response(db,{route:base+"/"+id+"/publish",method:"POST",
  data:{confirm:"YES",expectedRevision:1}})).status,400);
 assert.equal((await response(db,{route:base+"/"+id+"/publish",method:"POST",
  data:{confirm:"PUBLISH",expectedRevision:1,memberId:owner.id}})).status,400);
 assert.equal((await publicResponse(db)).data.entries.length,0);
});
test("wrong account, spoofed Access identity, stale session and unsupported mutation deny",async()=>{
 const {db}=fakeDB(),base="/api/member/studio/entries";
 assert.equal((await response(db,{route:base,method:"POST",data:payload,
  user:ordinary,accessEmail:ordinary.email})).status,403);
 assert.equal((await response(db,{route:base,method:"POST",data:payload,
  user:administrator,accessEmail:owner.email})).status,403);
 assert.equal((await response(db,{route:base,method:"POST",data:payload,
  headers:{"X-ANEVUM-EXPECTED-MEMBER-ID":administrator.id}})).status,409);
 assert.equal((await response(db,{route:base,method:"DELETE"})).status,405);
 const creation=await response(db,{route:base,method:"POST",data:payload,user:administrator,
  accessEmail:administrator.email});
 assert.equal(creation.status,201);
 assert.equal(creation.data.viewerMemberId,administrator.id);
});
test("public filter allows only known types; admin list never returned anonymously",async()=>{
 const {db}=fakeDB();
 assert.equal((await publicResponse(db,"/api/public/studio/entries?kind=AHA")).status,200);
 assert.equal((await publicResponse(db,"/api/public/studio/entries?kind=BROKER")).status,400);
 assert.equal((await publicResponse(db,"/api/public/studio/entries?anything=1")).status,400);
 assert.equal((await response(db,{route:"/api/member/studio/entries",
  user:ordinary,accessEmail:ordinary.email})).status,403);
});
test("Studio-enabled moderation requires pinned staff, not RHEN owner privileges",()=>{
 const origin="https://anevum-member-staging.devonakins.workers.dev";
 const cfg={...envBase,ANEVUM_MEMBER_PREVIEW_ENABLED:"true",MEMBER_PREVIEW_ORIGIN:origin,
  ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"true"};
 assert.equal(moderatorAllowed(cfg,owner,origin,owner.email),true);
 assert.equal(moderatorAllowed(cfg,administrator,origin,administrator.email),true);
 assert.equal(moderatorAllowed(cfg,ordinary,origin,ordinary.email),false);
 assert.equal(moderatorAllowed({...cfg,ANEVUM_STUDIO_ADMIN_MEMBER_ID:"wrong-id"},
  administrator,origin,administrator.email),false);
 assert.equal(moderatorAllowed({...cfg,ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false"},
  owner,origin,owner.email),false);
});
test("migration creates private audit-backed editorial schema in real SQLite",()=>{
 const code=[
 "import sqlite3,sys",
 "db=sqlite3.connect(':memory:')",
 "db.executescript(open(sys.argv[1],encoding='utf-8').read())",
 "tables={r[0] for r in db.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")}",
 "assert 'studio_entries' in tables and 'studio_entry_events' in tables",
 "assert {r[1] for r in db.execute('PRAGMA table_info(studio_entries)')} >= {'id','slug','status','revision','body','published_at'}",
 "assert {r[1] for r in db.execute('PRAGMA table_info(studio_entry_events)')} >= {'actor_member_id','action','revision'}",
 "print('Studio D1 SQLite schema verified')"
 ].join("\n");
 const path=new URL("../migrations-studio/0008_studio_editorial.sql",import.meta.url).pathname;
 assert.match(execFileSync("python3",["-c",code,path],{encoding:"utf8"}),/verified/);
});
test("Worker requires Access before Studio API and exposes no public draft routes",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const worker=read("worker.mjs"), member=read("src/server/member.mjs");
 const app=read("src/App.tsx"),ui=read("src/pages/StudioDashboard.tsx");
 const publicUI=read("src/commons/StudioPublications.tsx");
 assert.match(worker,/pathname\.startsWith\("\/api\/member\/studio\/"\)/);
 assert.match(worker,/verifyAccessAssertion\(token,env\)/);
 assert.match(worker,/pathname\.startsWith\("\/api\/public\/studio\/"\)/);
 assert.match(member,/studioEndpoint\(request,env,user,verifiedOrigin/);
 assert.match(member,/safeMutation\(request, verifiedOrigin\)/);
 assert.match(app,/<Route path="\/studio"/);
 assert.match(app,/<Route path="\/updates"/);
 assert.match(app,/<Route path="\/updates\/:slug"/);
 assert.match(worker,/pathname\.startsWith\("\/studio"\)/);
 assert.match(ui,/viewerMemberId!==id/);
 assert.match(ui,/receipt\.auditRecorded!==true/);
 assert.match(publicUI,/credentials:"omit"/);
 assert.doesNotMatch(publicUI,/dangerouslySetInnerHTML/);
 assert.doesNotMatch(ui,/order_submit|trade_execute|\/v2\/orders|brokerToken/);
});

test("Commons homepage uses only genuine public Studio publications and a supported navigation icon",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const home=read("src/commons/CommonsV5.tsx");
 const block=read("src/commons/StudioRecentPosts.tsx");
 const icons=read("public/commons-v5-icons.svg");
 const nav=read("src/commons/site-navigation.ts");
 assert.match(home,/StudioRecentPosts/);
 assert.match(block,/fetch\("\/api\/public\/studio\/entries"/);
 assert.match(block,/value\.entries\.every\(valid\)/);
 assert.match(block,/if\(!items\.length\)return null/);
 assert.match(nav,/path:"\/updates",label:"Updates",icon:"file"/);
 assert.match(icons,/id="i-file"/);
 assert.doesNotMatch(block,/dangerouslySetInnerHTML|\.order_submit|brokerToken/);
});


test("Studio history is staff-only, audit-backed and revision-bound",async()=>{
 const {db}=fakeDB();
 const base="/api/member/studio/entries";
 const created=await response(db,{route:base,method:"POST",data:payload});
 assert.equal(created.status,201);
 const id=created.data.entry.id;
 const change=await response(db,{route:base+"/"+id,method:"PATCH",
  data:{...payload,expectedRevision:1,title:"Verified research progress"}});
 assert.equal(change.status,200);
 const history=await response(db,{route:base+"/"+id+"/history"});
 assert.equal(history.status,200);
 assert.equal(history.data.viewerMemberId,owner.id);
 assert.equal(history.data.entryId,id);
 assert.equal(history.data.entryRevision,2);
 assert.equal(history.data.olderEventsMayExist,false);
 assert.deepEqual(history.data.events.map(x=>[x.action,x.revision]),
  [["EDIT",2],["CREATE",1]]);
 assert.ok(history.data.events.every(x=>x.actorMemberId===owner.id));
 const denied=await response(db,{route:base+"/"+id+"/history",user:ordinary,
  accessEmail:ordinary.email});
 assert.equal(denied.status,403);
 assert.equal((await response(db,{route:base+"/"+id+"/history",method:"DELETE"})).status,405);
 assert.equal((await response(db,{route:base+"/00000000-0000-4000-8000-000000000000/history"})).status,404);
});
