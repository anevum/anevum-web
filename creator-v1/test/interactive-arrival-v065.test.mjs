import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const arrival=read("web/src/components/ArrivalExperience.tsx");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const css=read("web/src/interactive-arrival-v065.css");
const entry=read("web/src/main.tsx");
const browser=read("test/capture-sitewide-v012.mjs");
const capture=read("test/capture-community-hub-v007.mjs");

test("V065 is a valid React first-contact experience with four real direct destinations",()=>{
  assert.doesNotThrow(()=>parse(arrival,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.doesNotThrow(()=>parse(home,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(arrival,/export const ENTRY_PORTALS/);
  for(const item of ["play","discover","connect","create"])
    assert.match(arrival,new RegExp('id:"'+item+'"'));
  for(const destination of ["/discover?category=games","/discover","/community","/studio"])
    assert.ok(arrival.includes('destination:"'+destination+'"'),destination);
  assert.match(arrival,/aria-label="Choose how to enter ANEVUM"/);
  assert.match(arrival,/aria-labelledby="av65-title"/);
  assert.match(arrival,/aria-label=\{"Enter "\+portal.label.toLowerCase\(\)\}/);
  assert.match(arrival,/onPointerEnter/);
  assert.match(arrival,/onFocus/);
  assert.match(arrival,/onTouchStart/);
  assert.match(arrival,/onTouchEnd/);
  assert.match(arrival,/type="button" onClick=\{\(\)=>step\(-1\)\}/);
  assert.match(arrival,/type="button" onClick=\{\(\)=>step\(1\)\}/);
  assert.match(arrival,/projectDetailPath\(activeProject.id/);
});

test("V065 preserves imagery fallback and never fabricates community activity",()=>{
  assert.match(arrival,/assets\/community-portals\//);
  assert.match(arrival,/1536\.webp/);
  assert.match(arrival,/768\.webp/);
  assert.match(arrival,/srcSet=/);
  assert.match(arrival,/CosmicIllustration/);
  assert.match(arrival,/onError=\{\(\)=>setFailed\(true\)\}/);
  assert.match(arrival,/find\(project=>project.category===portal.category\)/);
  assert.doesNotMatch(arrival,/Math\.random|fetch\(|localStorage|sessionStorage|dangerouslySetInnerHTML|fakeCount|fakeProject|fakePeople|AWAITING FIRST APPROVED RELEASE|INDEX \/ AUTOMATIC|LIVE SIGNAL/);
  assert.match(home,/readProjects/);
  assert.match(home,/readCreators/);
  assert.match(home,/readStatus/);
  assert.match(home,/MemberForumHighlights/);
  assert.match(home,/projects.length>0\|\|creators.length>0/);
  assert.doesNotMatch(home,/<LiveSignalHero|<LiveSignalModules|<WorldGatewayDeck/);
});

test("V065 loads last, keeps mobile first-viewport action doors accessible, and has static fallbacks",()=>{
  assert.ok(entry.lastIndexOf("interactive-arrival-v065.css")>entry.lastIndexOf("continuance-worldstage-v064.css"));
  assert.match(css,/\.av65-stage/);
  assert.match(css,/\.av65-doors/);
  assert.match(css,/\.av65-door-image/);
  assert.match(css,/max-width:700px/);
  assert.match(css,/max-width:359px/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/prefers-reduced-transparency:reduce/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/image-rendering:auto/);
  assert.doesNotMatch(css,/@import|https?:\/\/|url\(|scrollbar-width:none|position:fixed;\s*bottom:0/);
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
  assert.match(browser,/SITEWIDE_V065_ENTRANCE/);
  assert.match(browser,/visibleDoors/);
  assert.match(capture,/V065_HOMEPAGE_ENTRANCE/);
  assert.match(capture,/v065-interactive-preview/);
});
