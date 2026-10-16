// V009 canonical private saved-works UI and transport contracts.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 readCanonicalSavedProjects,CanonicalProjectSaveError
} from "../web/src/lib/canonical-project-saves.ts";
import {safeReturnPath} from "../web/src/lib/navigation.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const id="a".repeat(32);
const item={id,title:"Verified Sample",summary:"A published sample description.",category:"games",
 creatorHandle:"offline_maker",creatorName:"Offline Maker",
 publishedAt:"2026-10-12T00:00:00Z",savedAt:1791763200};
const token=Buffer.from(JSON.stringify([1791763200,id])).toString("base64url");
const answer=(body,status=200,type="application/json")=>
 new Response(type==="application/json"?JSON.stringify(body):"not-json",{
 status,headers:{"content-type":type}
 });
async function withFetch(stub,run){
 const original=globalThis.fetch;globalThis.fetch=stub;
 try{return await run()}finally{globalThis.fetch=original}
}

test("private saved-works client requests only same-origin, server-owned session and opaque cursor",async()=>{
 const calls=[];
 await withFetch(async(url,init)=>{
  calls.push({url,init});
  return answer({items:[item],nextCursor:calls.length===1?token:null});
 },async()=>{
  assert.deepEqual(await readCanonicalSavedProjects(),{items:[item],nextCursor:token});
  assert.deepEqual(await readCanonicalSavedProjects(token),{items:[item],nextCursor:null});
 });
 assert.equal(calls[0].url,"/api/v1/member/project-saves?limit=12");
 assert.equal(calls[1].url,"/api/v1/member/project-saves?limit=12&after="+token);
 for(const {init} of calls){
  assert.equal(init.method,"GET");
  assert.equal(init.credentials,"same-origin");
  assert.equal(init.mode,"same-origin");
  assert.equal(init.cache,"no-store");
  assert.equal(init.redirect,"error");
  assert.deepEqual(init.headers,{Accept:"application/json"});
  assert.equal(init.body,undefined);
 }
});

test("invalid cursor and malformed private collection responses fail closed",async()=>{
 await withFetch(async()=>{throw Error("network request not allowed")},async()=>{
  for(const after of ["../other","a".repeat(170),"AA%2FBB","hi","eyJtZW1iZXJJZCI6ImF0dGFja2VyIn0="])
   await assert.rejects(readCanonicalSavedProjects(after),/Invalid saved works cursor/);
 });
 for(const bad of [
  {},null,[],{items:"not-an-array",nextCursor:null},
  {items:[item],nextCursor:"bad!"},
  {items:[item,item],nextCursor:null},
  {items:[{...item,id:"invalid"}],nextCursor:null},
  {items:[{...item,category:"unsafe"}],nextCursor:null},
  {items:[{...item,savedAt:"1791763200"}],nextCursor:null},
  {items:[{...item,title:""}],nextCursor:null},
  {items:[{...item,creatorHandle:"../other"}],nextCursor:null},
  {items:Array(25).fill(item),nextCursor:null}
 ]){
  await withFetch(async()=>answer(bad),async()=>{
   await assert.rejects(readCanonicalSavedProjects(),
    error=>error instanceof CanonicalProjectSaveError&&error.status===503);
  });
 }
 await withFetch(async()=>answer({items:[],nextCursor:null},401),async()=>{
  await assert.rejects(readCanonicalSavedProjects(),
   error=>error instanceof CanonicalProjectSaveError&&error.status===401);
 });
 await withFetch(async()=>answer(null,200,"text/html"),async()=>{
  await assert.rejects(readCanonicalSavedProjects(),
   error=>error instanceof CanonicalProjectSaveError&&error.status===503);
 });
});

test("canonical collection is a separate public route with an authenticated, capability-gated view",()=>{
 const app=read("web/src/App.tsx");
 const view=read("web/src/pages/CanonicalSavedWorksPage.tsx");
 const shell=read("web/src/components/Shell.tsx");
 const panel=read("web/src/components/CanonicalProjectSavePanel.tsx");
 assert.match(app,/path="saved" element=\{<CanonicalSavedWorksPage\/>\}/);
 assert.match(app,/path="library" element=\{<MemberLibraryPage\/>\}/);
 assert.match(view,/canonicalAuthClient\.useSession\(\)/);
 assert.match(view,/capability\.data\.kind==="canonical-saves"/);
 assert.match(view,/!verified/);
 assert.match(view,/<SavedWorksCollection key=\{member!\.id\}/);
 assert.match(view,/readCanonicalSavedProjects\(undefined,signal\)/);
 assert.match(view,/readCanonicalSavedProjects\(cursor\)/);
 assert.match(view,/setCanonicalProjectSaved\(id,false\)/);
 assert.match(view,/THIS SPACE BELONGS TO YOU/);
 assert.match(view,/SAVED WORKS ARE NOT YET ACTIVE/);
 assert.match(view,/Only projects that remain published and approved appear here/);
 assert.doesNotMatch(view,/memberLibrary|memberMe|memberSetSaved|memberVote|localStorage|awardXp|grantXp/);
 assert.match(shell,/item\.to==="\/library"&&canonicalMember\?"\/saved":item\.to/);
 assert.match(panel,/to="\/saved">MY SAVED WORKS/);
 assert.match(read("web/src/pages/ProjectPage.tsx"),/from==="\/saved"\?"BACK TO SAVED WORKS"/);
 assert.equal(safeReturnPath("/saved"),"/saved");
 assert.equal(safeReturnPath("//evil.example"),"/discover");
 assert.equal(safeReturnPath("/account"),"/discover");
});

test("saved works presentation honors phone width, touch controls and no nested main landmark",()=>{
 const source=read("web/src/pages/CanonicalSavedWorksPage.tsx");
 const style=read("web/src/pages/canonical-saved-works.css");
 assert.match(source,/className="avsaved-grid"/);
 assert.match(source,/className="avsaved-card"/);
 assert.match(source,/CosmicArtwork scene=\{item\.category as Category\}/);
 assert.match(source,/aria-label="Your private saved projects"/);
 assert.match(source,/role="alert"/);
 assert.doesNotMatch(source,/<main/);
 assert.match(style,/@media\(max-width:660px\)/);
 assert.match(style,/\.avsaved-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(style,/min-height:48px/);
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(style,/@media\(forced-colors:active\)/);
});

test("saved works remains off in deployment inventory with no unreviewed data path",()=>{
 const config=JSON.parse(read("wrangler.a-progression-v031.jsonc"));
 assert.equal(config.vars?.CANONICAL_PROJECT_SAVES_ENABLED,undefined);
 assert.deepEqual(config.routes,[]);
 const worker=read("canonical-auth/worker.mjs");
 assert.match(worker,/path===CANONICAL_PREFIX\+"\/project-saves"/);
 assert.match(worker,/CANONICAL_PROJECT_SAVES_ENABLED/);
 assert.match(worker,/withoutForeignCookies/);
 assert.match(read("canonical-auth/project-saves.mjs"),/SAFE_PUBLIC_PROJECTS/);
 assert.match(read("canonical-auth/project-saves.mjs"),/p.status='published'/);
 assert.match(read("canonical-auth/project-saves.mjs"),/c.status='active'/);
});
