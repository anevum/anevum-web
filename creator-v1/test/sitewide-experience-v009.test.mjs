import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("V009 unifies site navigation and retains native route boundaries",()=>{
 const shell=read("web/src/components/Shell.tsx");
 const app=read("web/src/App.tsx");
 assert.doesNotThrow(()=>parse(shell,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(shell,/aria-haspopup="dialog"/);
 assert.match(shell,/dialog ref=\{menuDialog\}/);
 assert.match(shell,/showModal\(\)/);
 assert.match(shell,/aria-label="Primary navigation"/);
 assert.match(shell,/PortalLauncher/);
 assert.match(shell,/isEditableTarget/);
 assert.match(shell,/site-shell--cinematic/);
 assert.doesNotMatch(shell,/<CinematicSiteRail\/>/);
 assert.doesNotMatch(shell,/portfolio|RHEN TERMINAL|mobile-bottom-nav/i);
 for(const path of ["/severance","/discover","/community","/creators","/studio","/library","/member","/join","/status"]){
   assert.ok(shell.includes(path),"Missing public or account destination "+path);
 }
 // Evolution is intentionally demoted from visible navigation at the current
 // game-development stage, but the protected route is still registered.
 assert.match(app,/path="levels"/);
 assert.doesNotMatch(shell,/to:"\/create",label:"Create"/);
 assert.match(app,/path="create" element={<Navigate to="\/studio" replace\/>}/);
 assert.match(app,/<MemberGate\/>/);
 assert.match(app,/path="account" element={<Navigate to="\/member" replace\/>}/);
 assert.match(app,/path="community\/write"/);
});
test("V115 homepage preserves real public work, identity and unduplicated navigation",()=>{
 const home=read("web/src/pages/CinematicLandingPage.tsx");
 const signal=read("web/src/components/LiveSignalHero.tsx");
 const portals=read("web/src/components/WorldGatewayDeck.tsx");
 const feed=read("web/src/components/CommunityHomeFeed.tsx");
 for(const source of [home,signal,portals])assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 for(const contract of [/readStatus/,/readProjects/,/readCreators/,/projectDetailPath/,/useOwnPlayerCard/,/CompactMemberIdentity/,/av115-public-index/,/av115-gateways/])
  assert.match(home,contract);
 assert.doesNotMatch(home,/<WorldGatewayDeck|<LiveSignalModules|<CommunityHomeFeed|<CinematicSiteRail/);
 assert.match(home,/projects\.filter\(project=>project\.category!=="games"\)/);
 assert.match(home,/showcase\.map\(project=>/);
 assert.doesNotMatch(home,/featured=games\[0\]|Play a game|FEATURED RELEASE/);
 assert.match(portals,/discover\?category=games/);
 assert.match(signal,/readCommunityPosts/);
 assert.match(feed,/readPublicShowcases/);
 assert.doesNotMatch(home,/fakeUser|fakeProject|fakeActivity|fakeXp|dangerouslySetInnerHTML/);
});
test("V009 design finishes public pages without unlocking member writes",()=>{
 const main=read("web/src/main.tsx");
 const css=read("web/src/site-experience-v009.css");
 assert.match(main,/site-experience-v009\.css/);
 for(const selector of [".av9-navigation",".av9-world-deck",".av9-world-gateway",".av6-feed-item-body",
   ".portal-project-header",".portal-channel-banner",".ch7-entry",".levels-masthead"]){
   assert.ok(css.includes(selector),selector);
 }
 for(const query of ["max-width:1440px","max-width:1180px","max-width:900px","max-width:700px",
   "max-width:359px","prefers-reduced-motion:reduce","forced-colors:active"]){
   assert.ok(css.includes(query),query);
 }
 assert.doesNotMatch(css,/position:fixed;\s*bottom:0|scrollbar-width:\s*none/);
 assert.match(css,/image-rendering:auto/);
 assert.match(css,/\.av9-shell \.av9-hero-actions>a/);
 assert.match(css,/min-height:50px/);
 assert.match(main,/creator-showcase-v007\.css/);
 assert.match(css,/\.av9-shell \.av7-author/);
 assert.match(read("web/src/components/PublicAuthorShowcase.tsx"),/CHOSEN AWARDS/);
 assert.match(read("web/src/lib/api.ts"),/verified-creator-ledger/);
});
