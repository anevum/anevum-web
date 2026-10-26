import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const shell=read("web/src/components/Shell.tsx");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const own=read("web/src/lib/useOwnPlayerCard.ts");
const search=read("web/src/components/PortalLauncher.tsx");
const project=read("web/src/components/ProjectCard.tsx");
const identity=read("web/src/components/CompactMemberIdentity.tsx");
const css=read("web/src/home-navigation-v079.css");
const bootstrap=read("web/src/main.tsx");
const app=read("web/src/App.tsx");

test("V079 has valid React source and applies its override last",()=>{
 for(const source of [shell,home,own,search,project])
  assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(bootstrap,/import "\.\/home-navigation-v079\.css";/);
 assert.ok(bootstrap.lastIndexOf("home-navigation-v079.css")>bootstrap.lastIndexOf("site-experience-v009.css"));
 assert.match(app,/path="studio" element=\{nativeCreatorEnabled\?<Suspense fallback=\{creatorFallback\}><NativeCreatorStudioPage\/><\/Suspense>:<CanonicalStudioPage\/>\}/);
 assert.match(app,/path="studio\/records" element=\{<CanonicalStudioPage\/>\}/);
 assert.match(app,/path="community\/threads\/:id" element={<CommunityThread\/>}/);
});

test("V079 replaces illustrated mega-menu with accessible destinations and actual owner identity",()=>{
 assert.doesNotMatch(shell,/CosmicArtwork|portalCategories|av9-navigation-world-art/);
 assert.match(shell,/menuDestinations/);
 assert.match(shell,/menuCategories/);
 assert.match(shell,/menuUtilities/);
 assert.match(shell,/useOwnPlayerCard\(menuOpen\)/);
 assert.match(shell,/<CompactMemberIdentity member={ownCard} href="\/member"/);
 assert.match(shell,/aria-controls="av79-navigation"/);
 assert.match(shell,/id="av79-navigation"/);
 assert.match(shell,/showModal\(\)/);
 assert.match(shell,/onCancel=\{\(\)=>setMenuOpen\(false\)\}/);
 for(const route of ["/discover?category=games","/discover","/community","/studio","/levels","/library","/join"])
  assert.ok(shell.includes(route),"Missing useful route "+route);
 const navDestinations=shell.slice(shell.indexOf("const menuDestinations"),shell.indexOf("const menuCategories"));
 assert.equal((navDestinations.match(/label:"(?:Play|Discover|Community|Create)"/g)||[]).length,4);
});

test("V079 owner identity comes solely from verified account-space records",()=>{
 for(const token of [
  "canonicalAuthClient.useSession","emailVerified===true","canonicalMe(controller.signal)",
  "canonicalSpace(controller.signal)","record.memberId!==memberId",
  "space.showStats&&space.stats","space.featuredAwards||[]",
  "space.earnedBadges","space.badgeDisplay","space.distinctions","space.aura",
  "source:\"canonical-member\""
 ])assert.ok(own.includes(token),"Missing owner boundary: "+token);
 assert.doesNotMatch(own,/Math\.random|localStorage|sessionStorage|\/admin|\/moderation|fetch\(/);
 assert.match(identity,/channel\?\[\]:selectFeaturedBadges/);
 assert.match(identity,/data-player-card="v078"/);
 assert.match(identity,/artwork="card"/);
});

test("V115 first visit keeps four actual destinations without promoting an alpha game",()=>{
 for(const token of [
  "readStatus(signal)","readProjects({limit:\"32\"}","readCreators({limit:\"8\"}",
  "projectDetailPath(project.id","useOwnPlayerCard","av79-hero",
  "av115-wayfinder","av115-gateways","av115-gateway-member",
  "av115-public-index","av115-public-item","av79-member-section",
  "av79-member-invitation","CompactMemberIdentity"
 ])assert.ok(home.includes(token),"Missing homepage contract: "+token);
 assert.doesNotMatch(home,/<WorldGatewayDeck|<LiveSignalModules|<CommunityHomeFeed|<MemberForumHighlights/);
 assert.doesNotMatch(home,/CosmicArtwork|fakeUser|fakeProject|fakeActivity|sampleProjects|sampleRatings|dangerouslySetInnerHTML/);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|const firstGame=/);
 const entries=home.slice(home.indexOf("const gateways=["),home.indexOf("] as const;",home.indexOf("const gateways=[")));
 assert.equal((entries.match(/title:"(?:Discover|Connect|Create)"/g)||[]).length,3);
 assert.match(home,/className="av79-gateway av115-gateway av115-gateway-member"/);
 assert.match(home,/source:"creator-channel",avatar:false,level:null,featuredAwards:\[\]/);
 assert.match(project,/<CompactMemberIdentity/);
 assert.match(project,/source:"creator-channel",avatar:false,level:null,featuredAwards:\[\]/);
});

test("V115 reuses IREN entry and verified member path without an extra homepage panel",()=>{
 const firstContactCSS=read("web/src/home-first-contact-v111.css");
 assert.match(home,/className="av115-iren-console"/);
 assert.match(home,/to={signedIn\?"\/member":"\/join"}/);
 assert.match(home,/new Event\("anevum:iren-intro"\)/);
 assert.doesNotMatch(home,/className="av111-onramp"/);
 assert.match(firstContactCSS,/prefers-reduced-motion:reduce/);
 assert.match(firstContactCSS,/forced-colors:active/);
 assert.match(bootstrap,/import "\.\/first-contact-wayfinder-v115\.css"/);
});

test("V079 native switcher searches real public data on every public route",()=>{
 assert.match(search,/const liveEnabled=open&&liveQuery\.length>=2/);
 assert.match(search,/readProjects\(\{q:liveQuery,limit:"5"\}/);
 assert.match(search,/readCreators\(\{q:liveQuery,limit:"4"\}/);
 assert.match(search,/controller\.abort\(\)/);
 assert.match(search,/Search published projects/);
 assert.doesNotMatch(search,/const liveEnabled=open&&routePrefix===/);
 assert.doesNotMatch(search,/dummyProjects|fakeUsers|Math\.random|sessionStorage|localStorage/);
});

test("V079 remains usable on phones, reduced motion, and without decorative artwork",()=>{
 for(const selector of [
  ".av79-navigation",".av79-navigation-primary",".av79-destination",
  ".av79-navigation-identity",".av79-hero",".av79-gateways",
  ".av79-feature",".av79-member-section",".av79-member-invitation"
 ])assert.ok(css.includes(selector),selector);
 for(const token of ["max-width:900px","max-width:650px","max-width:380px","prefers-reduced-motion:reduce","forced-colors:active"])
  assert.ok(css.includes(token),token);
 assert.doesNotMatch(css,/image-rendering:\s*pixelated|position:fixed;\s*bottom:\s*0/);
 assert.doesNotMatch(shell,/mobile-bottom-nav|const mobileNav/);
});

test("V079 preserves released unlinked-creator incident fix",()=>{
 for(const source of [home,project,search]){
  assert.match(source,/publicCreatorHandle\(project\.creatorHandle\)/);
  assert.match(source,/ANEVUM member/);
 }
 for(const source of [home,project]){
  assert.match(source,/Public creator channel not linked\./);
  assert.match(source,/Creator profile not publicly linked/);
  assert.doesNotMatch(source,/encodeURIComponent\(project\.creatorHandle\)/);
 }
 assert.doesNotMatch(home,/ANEVUM \/ PUBLISHED 001|OPEN<br\/>WORLD/);
});
