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
const parityHeader=read("web/src/parity/ParityHeaderV136.tsx");

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
 assert.match(member,/readWithDeadline\(signal=>canonicalSpace\(signal\)\)/);
 assert.match(member,/readWithDeadline\(signal=>canonicalWall\(signal\)\)/);
 assert.match(member,/data-iren-anchor=\{space\?\.stats\?"progress":undefined\}/);
 assert.match(member,/SpaceProgress space=\{space\}/);
 assert.match(member,/profile\.visibility==='public'/);
 assert.match(member,/canonicalAuthClient\.signOut/); // Account closure controls remain in Phase1MemberPage
});

test("IREN Wayfinder utility spans both columns and keeps its action on phones",()=>{
 assert.match(shell,/className="ir80-wayfinder-entry"/);
 assert.match(styles,/\.av79-navigation \.ir80-wayfinder-entry\s*\{[^}]*grid-column:1\s*\/\s*-1;/);
 assert.match(styles,/\.av79-navigation \.ir80-wayfinder-entry\s*\{[^}]*grid-template-columns:36px minmax\(0,1fr\) auto;/);
 assert.match(styles,/@media\(max-width:650px\)\s*\{[\s\S]*?\.ir80-wayfinder-action\s*\{[^}]*grid-column:2;/);
 assert.doesNotMatch(styles,/\.ir80-wayfinder-action\s*\{display:none/);
});

test("IREN uses visible responsive controls for Creator Studio and Wayfinder (external tester regression)",()=>{
  // The redesigned member toolbar places Studio inside a closed details panel;
  // the desktop header hides the mobile Menu trigger. Neither is highlightable.
  assert.match(tour,/id:"studio",route:"\/member",anchor:'\[data-iren-anchor="studio"\]',fallback:'\[data-iren-anchor="studio-tools"\]'/);
  assert.match(member,/<summary data-iren-anchor="studio-tools">Profile &amp; tools<\/summary>/);
  assert.match(tour,/id:"wayfinder",route:"\/community",anchor:'\[data-iren-anchor="navigation"\]',fallback:'\[data-iren-anchor="navigation-desktop"\]'/);
  assert.match(shell,/<nav data-iren-anchor="navigation-desktop" className="desktop-nav av9-primary"/);
  assert.match(shell,/<button data-iren-anchor="navigation"/);
  // V136 replaces the legacy Shell header; the actual rendered header needs
  // the same semantic targets, not merely selectors in dead fallback source.
  assert.match(parityHeader,/<nav data-iren-anchor="navigation-desktop"/);
  assert.match(parityHeader,/<button data-iren-anchor="navigation" ref=\{menuButton\}/);
  assert.doesNotThrow(()=>parse(parityHeader,{sourceType:"module",plugins:["typescript","jsx"]}));
  // Hidden responsive branches and collapsed details must never be spotlighted.
  assert.match(tour,/getClientRects\(\)\.length/);
  assert.match(tour,/getComputedStyle\(target\)/);
  assert.match(tour,/ancestor\.matches\('details:not\(\[open\]\)'\)/);
  assert.match(tour,/querySelector\(':scope > summary'\)/);
  assert.match(tour,/rect=target\.getBoundingClientRect\(\);[\s\S]*?scrollIntoView\([\s\S]*?rect=target\.getBoundingClientRect\(\)/);
  assert.match(tour,/isVisible\(primary\)/);
  assert.match(tour,/isVisible\(fallback\)/);
  assert.match(tour,/rect\.left<8\|\|rect\.right>window\.innerWidth-8/);
});
