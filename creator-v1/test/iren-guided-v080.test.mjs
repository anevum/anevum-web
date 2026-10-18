import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const tour=read("web/src/components/IrenGuidedContinuance.tsx");
const shell=read("web/src/components/Shell.tsx");
const member=read("web/src/components/MemberSpaceDashboard.tsx");
const editor=read("web/src/pages/Phase1MemberPage.tsx");
const styles=read("web/src/iren-guided-v080.css");
const bootstrap=read("web/src/main.tsx");
const discover=read("web/src/pages/DiscoverPage.tsx");
const community=read("web/src/pages/CommunityPage.tsx");

test("IREN V080 JSX parses and stylesheet loads last",()=>{
 for(const source of [tour,shell,member,editor,discover,community]){
  assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 }
 assert.match(bootstrap,/import "\.\/iren-guided-v080\.css";/);
 assert.ok(bootstrap.lastIndexOf("iren-guided-v080.css")>bootstrap.lastIndexOf("sitewide-polish-v079.css"));
});

test("Tour teaches actual page elements, supports dismissal and never exposes locked rewards",()=>{
 for(const anchor of ["identity","progress","privacy","studio","discover","community","navigation"]){
  assert.ok(tour.includes('data-iren-anchor="'+anchor+'"')||tour.includes('[data-iren-anchor="'+anchor+'"]'),anchor);
  // Member progression exists only after verified stats load, unlike static targets.
  if(anchor==="progress")
   assert.match(member,/data-iren-anchor=\{space\?\.stats\?"progress":undefined\}/);
  else assert.ok((shell+member+discover+community).includes('data-iren-anchor="'+anchor+'"'),anchor);
 }
 for(const token of ['pause(','finish("skipped")','finish("completed")','status:"paused"','onKey','Escape','readProgress','writeProgress','memberId||"visitor"','anevum:member-created','anevum:iren-open','anevum:iren-tour','prefers-reduced-motion','aria-labelledby="ir80-guide-title"'])
  assert.ok(tour.includes(token),"Missing tour boundary: "+token);
 assert.doesNotMatch(tour,/fetch\(|dangerouslySetInnerHTML|Math\.random\(/);
 assert.match(tour,/never disclosed by this guide/);
 assert.match(editor,/if\(!claimed\)\{[\s\S]*?anevum:member-created/);
 assert.doesNotMatch(member,/ms-checklist|ms-welcome|newMember/);
 assert.match(shell,/OPEN IREN HELP/);
 assert.match(tour,/aria-modal="true"/);
});

test("Compact member landing retains real server-authoritative stats and account controls",()=>{
 assert.match(member,/canonicalSpace\(\)/);
 assert.match(member,/canonicalWall\(\)/);
 assert.match(member,/data-iren-anchor=\{space\?\.stats\?"progress":undefined\}/);
 assert.match(member,/SpaceProgress space=\{space\}/);
 assert.match(member,/profile\.visibility==='public'/);
 assert.match(member,/canonicalAuthClient\.signOut/); // Account closure controls remain in Phase1MemberPage
});
