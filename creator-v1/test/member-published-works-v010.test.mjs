import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parsePackageWorks,requestPackageWorks,validCreatorHandle} from "../web/src/lib/package-gallery.ts";

const ID="5764a892-0526-47b6-953b-4cf6a9053c0f",HANDLE="cosmiccreator";
const cover="/upload/v3/api/v1/packages/covers/"+ID;
const play="/upload/v3/play/"+ID;
const published={id:ID,title:"Signal Drift",summary:"A playable build from a real creator.",category:"game",
  version:2,cover_url:cover,play_url:play,published_at:1760000000};
const privateDraft={...published,cover_url:null,play_url:null,
  draft_status:"ready",status:"draft",published_at:undefined};

test("V010 public creator cards accept only verified route-safe server release contracts",()=>{
  assert.equal(validCreatorHandle(HANDLE),true);
  assert.equal(validCreatorHandle("../staff"),false);
  const approved=parsePackageWorks({handle:HANDLE,projects:[published]},HANDLE,false);
  assert.deepEqual(approved,{handle:HANDLE,projects:[{
    id:ID,title:"Signal Drift",summary:published.summary,category:"game",
    version:2,coverUrl:cover,playUrl:play,status:null,pending:false
  }]});
  assert.equal(parsePackageWorks({handle:"othermember",projects:[published]},HANDLE,false),null);
  assert.equal(parsePackageWorks({handle:HANDLE,projects:[privateDraft]},HANDLE,false),null);
  assert.equal(parsePackageWorks({handle:HANDLE,projects:[published,published]},HANDLE,false),null);
  assert.equal(parsePackageWorks({handle:HANDLE,projects:[{...published,play_url:"https://evil.invalid/game"}]},HANDLE,false),null);
  assert.equal(parsePackageWorks({handle:HANDLE,projects:[{...published,play_url:"/upload/v3/play/"+ID+"?preview=1"}]},HANDLE,false),null);
  assert.equal(parsePackageWorks({handle:HANDLE,projects:[{...published,cover_url:"//evil.invalid/cover.png"}]},HANDLE,false),null);
  assert.equal(parsePackageWorks({handle:HANDLE,projects:[{...published,id:"../staff"}]},HANDLE,false),null);
});
test("V010 owner member space may show true private draft state but never invents public playback",()=>{
 const d=parsePackageWorks({projects:[privateDraft]},HANDLE,true);
 assert.equal(d?.projects.length,1);
 assert.equal(d?.projects[0].playUrl,null);
 assert.equal(d?.projects[0].status,"draft");
 assert.equal(d?.projects[0].pending,true);
 assert.equal(d?.handle,null);
 assert.equal(parsePackageWorks({projects:[{...privateDraft,cover_url:"https://other.invalid/cover"}]},HANDLE,true),null);
});
test("V010 public reads are cookieless, owner reads use only same-origin credentials",async()=>{
 const original=globalThis.fetch,calls=[];
 try{
   globalThis.fetch=async(input,init)=>{
     calls.push({input,init});
     return Response.json(init.credentials==="omit"?{handle:HANDLE,projects:[published]}:
       {projects:[privateDraft]});
   };
   const publicWorks=await requestPackageWorks(HANDLE,false);
   assert.equal(publicWorks?.projects[0].playUrl,play);
   const mine=await requestPackageWorks(HANDLE,true);
   assert.equal(mine?.projects[0].status,"draft");
   assert.equal(calls.length,2);
   assert.equal(calls[0].input,"/upload/v3/api/v1/packages/creators/"+HANDLE+"/projects");
   assert.equal(calls[0].init.credentials,"omit");
   assert.equal(calls[1].input,"/upload/v3/api/v1/packages/mine");
   assert.equal(calls[1].init.credentials,"same-origin");
   for(const call of calls){
     assert.equal(call.init.mode,"same-origin");
     assert.equal(call.init.redirect,"error");
     assert.equal(call.init.cache,"no-store");
     assert.equal(call.init.method,"GET");
   }
 }finally{globalThis.fetch=original;}
});
test("V010 disabled, forbidden or malformed package service hides gallery without replacing a public wall",async()=>{
 const original=globalThis.fetch;
 try{
   for(const result of [new Response("Not found",{status:404}),
     Response.json({projects:[published]},{status:503}),
     Response.json({profile:{handle:HANDLE},projects:[{...published,id:"../../unsafe"}]})]){
     globalThis.fetch=async()=>result.clone();
     assert.equal(await requestPackageWorks(HANDLE,false),null);
   }
   globalThis.fetch=async()=>{throw Error("Worker disconnected");};
   assert.equal(await requestPackageWorks(HANDLE,false),null);
 }finally{globalThis.fetch=original;}
});
test("V010 is mounted only in verified canonical owner and public member worlds",()=>{
 const load=path=>readFileSync(new URL(path,import.meta.url),"utf8");
 const publicWorld=load("../web/src/pages/Phase1PublicMemberPage.tsx");
 const ownWorld=load("../web/src/components/MemberSpaceDashboard.tsx");
 const component=load("../web/src/components/MemberPublishedWorks.tsx");
 assert.match(publicWorld,/if\(!data\)return /);
 assert.match(publicWorld,/<MemberPublishedWorks handle=\{profile\.handle\}\/>/);
 assert.match(ownWorld,/tab==='overview'\|\|tab==='wall'/);
 assert.match(ownWorld,/<MemberPublishedWorks handle=\{profile\.handle\} owner\/>/);
 assert.match(component,/if\(!data\)return null/);
 assert.match(component,/requestPackageWorks\(handle,owner,controller\.signal\)/);
 assert.match(component,/loading="lazy"/);
 assert.doesNotMatch(component,/https?:\/\/(?!anevum)/);
});
