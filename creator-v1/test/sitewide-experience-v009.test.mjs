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
 for(const path of ["/discover","/community","/creators","/levels","/create","/library","/member","/join","/status"]){
   assert.ok(shell.includes(path),"missing genuine destination "+path);
 }
 assert.match(app,/<MemberGate\/>/);
 assert.match(app,/path="account" element={<Navigate to="\/member" replace\/>}/);
 assert.match(app,/path="community\/write"/);
});
test("V009 homepage is assembled from verified public data and real world links",()=>{
 const home=read("web/src/pages/CinematicLandingPage.tsx");
 const signal=read("web/src/components/LiveSignalHero.tsx");
 const portals=read("web/src/components/WorldGatewayDeck.tsx");
 const feed=read("web/src/components/CommunityHomeFeed.tsx");
 for(const source of [home,signal,portals])assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(home,/readStatus/);
 assert.match(home,/readProjects/);
 assert.match(home,/readCreators/);
 assert.match(home,/WorldGatewayDeck/);
 assert.match(home,/CommunityHomeFeed/);
 assert.doesNotMatch(home,/<CinematicSiteRail\/>/);
 assert.match(portals,/discover\?category=games/);
 assert.match(portals,/discover\?category=tools/);
 assert.match(portals,/discover\?category=creative/);
 assert.match(portals,/discover\?category=libraries/);
 assert.match(signal,/A world made/);
 assert.match(signal,/readCommunityPosts/);
 assert.match(feed,/readCommunityPosts/);
 assert.match(feed,/readPublicShowcases/);
 assert.match(feed,/PublicAuthorShowcase/);
 assert.match(feed,/showcaseItems/);
 assert.match(feed,/communityEnabled/);
 assert.match(feed,/state==="ready"/);
 assert.doesNotMatch(portals+signal+feed,/Math\.random|fakeUser|fakeActivity|fakeXp|dangerouslySetInnerHTML/);
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
