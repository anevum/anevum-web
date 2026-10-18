import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const doors=read("web/src/components/WorldGatewayDeck.tsx");
const activity=read("web/src/components/LiveSignalHero.tsx");
const css=read("web/src/module-experience-v073.css");
const main=read("web/src/main.tsx");
const browser=read("test/capture-sitewide-v012.mjs");

test("V079 replaces V073's stacked public modules with a short real-content homepage",()=>{
 for(const source of [home,doors,activity])
  assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(main,/home-navigation-v079\.css/);
 assert.match(home,/<nav className="av79-gateways"/);
 assert.match(home,/readProjects/);
 assert.match(home,/readCreators/);
 assert.match(home,/readStatus/);
 assert.match(home,/const featured=games\[0\]\|\|projects\[0\]\|\|null/);
 assert.match(home,/useOwnPlayerCard/);
 assert.match(home,/CompactMemberIdentity/);
 assert.doesNotMatch(home,/<WorldGatewayDeck|<LiveSignalModules|<CommunityHomeFeed|<LiveSignalHero/);
});
test("V073 four doors use authentic routes and useful previews, never generated illustrations",()=>{
  for(const key of ['id:"play"','id:"discover"','id:"connect"','id:"create"'])
    assert.ok(doors.includes(key),"Missing door "+key);
  for(const destination of [
    "/discover?category=games","/discover","/community","/studio",
    "/join","/guide","/boards","/creators"
  ])assert.ok(doors.includes(destination),"Missing useful route "+destination);
  assert.match(doors,/projectDetailPath\(games\[0\]\.id/);
  assert.match(doors,/projectDetailPath\(latest\.id/);
  assert.match(doors,/features\?\.communityPosts===true/);
  assert.match(doors,/No approved games published yet/);
  assert.match(doors,/No approved releases published yet/);
  assert.match(doors,/Cannot verify releases at present/);
  assert.match(doors,/Private authoring and publication are separate|Draft privately/);
  assert.doesNotMatch(doors,/CosmicArtwork|<img|<canvas|dangerouslySetInnerHTML|Math\.random|fake(Project|User|Count)|fetch\(/);
});

test("V073 both module selectors support accessible keyboard tabs and reduced-motion styling",()=>{
  for(const source of [doors,activity]){
    assert.match(source,/role="tablist"/);
    assert.match(source,/role="tab"/);
    assert.match(source,/role="tabpanel"/);
    assert.match(source,/aria-selected=/);
    assert.match(source,/aria-controls=/);
    assert.match(source,/ArrowRight/);
    assert.match(source,/ArrowLeft/);
    assert.match(source,/Home/);
    assert.match(source,/End/);
    assert.match(source,/tabIndex=/);
  }
  for(const selector of [
    ".av73-world-workspace",".av73-world-tabs",".av73-world-tab",
    ".av73-world-stage",".av73-stage-record",".av73-action-main",
    ".av11-module-workbench",".av11-module-tabs",".av11-module-stage"
  ])assert.ok(css.includes(selector),"Missing module style "+selector);
  for(const media of [
    "max-width:820px","max-width:540px","max-width:345px",
    "max-width:800px","max-width:430px",
    "prefers-reduced-motion:reduce","forced-colors:active"
  ])assert.ok(css.includes(media),"Missing accessible viewport "+media);
  assert.doesNotMatch(css,/animation:\s*[^;]*infinite|image-rendering:\s*pixelated/);
});

test("V079 browser checks four direct journeys, compact wayfinder and no decorative category gallery",()=>{
 for(const check of [
  "V079_HOME_ENTRY","V079_MENU_ACCESS","av79-gateway",
  "av79-feature","av79-navigation","av79-destination"
 ])assert.ok(browser.includes(check),check);
 assert.ok(browser.includes('".av79-home"'));
 assert.doesNotMatch(browser,/COMMUNITY_PORTAL_ART_OR_LAYOUT/);
});

test("V073 Discover is search-led with verified counts and real metadata cards",()=>{
  const discover=read("web/src/pages/DiscoverPage.tsx");
  const project=read("web/src/components/ProjectCard.tsx");
  const browseCss=read("web/src/discover-experience-v073.css");
  for(const text of [discover,project])
    assert.doesNotThrow(()=>parse(text,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(main,/discover-experience-v073\.css/);
  assert.match(discover,/av73-discover-intro/);
  assert.match(discover,/immersive\?<PortalHeading/);
  assert.match(discover,/readProjects/);
  assert.match(discover,/readCategories/);
  assert.match(discover,/presentation="editorial"/);
  assert.match(discover,/av73-filter-count/);
  assert.match(discover,/category:category\|\|undefined/);
  assert.match(discover,/free:freeOnly\?"1":undefined/);
  assert.match(discover,/next\.delete\("cursor"\)/);
  assert.doesNotMatch(discover,/portal-discover-side|portal-directory|THE FIRST RELEASES ARE ON THEIR WAY/);
  assert.match(project,/presentation\?: "visual" \| "editorial"/);
  assert.match(project,/projectDetailPath/);
  assert.match(project,/av73-project-card-author/);
  assert.match(project,/av73-project-card-action/);
  const editorial=project.slice(project.indexOf('if(presentation==="editorial")'),project.indexOf('  return ('));
  assert.doesNotMatch(editorial,/CosmicArtwork|project-art|<img|<canvas|Math\.random/);
  for(const token of [".av73-discover-intro",".av73-discover .portal-wide-search",".av73-discover .portal-channel-filters",
    ".av73-project-card",".av73-discover .portal-true-empty","max-width:365px",
    "max-width:700px","prefers-reduced-motion:reduce","forced-colors:active"])
    assert.ok(browseCss.includes(token),"Missing Discover surface "+token);
  for(const check of ["V073_DISCOVER_FIRST_FOLD","V073_DISCOVER_FILTER","V073_DISCOVER_SEARCH"])
    assert.ok(browser.includes(check),"Missing visual QA "+check);
  assert.doesNotMatch(discover+project+browseCss,/fakeProject|fakeCreator|fakeUser|dangerouslySetInnerHTML/);
});
