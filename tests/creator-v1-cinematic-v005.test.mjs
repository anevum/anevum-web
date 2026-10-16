import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const shell=get("creator-v1/web/src/components/Shell.tsx");
const landing=get("creator-v1/web/src/pages/CinematicLandingPage.tsx");
const hero=get("creator-v1/web/src/components/LiveSignalHero.tsx");
const signalCss=get("creator-v1/web/src/live-signal-v008.css");
const main=get("creator-v1/web/src/main.tsx");
const rail=get("creator-v1/web/src/components/CinematicSiteRail.tsx");
const routes=get("creator-v1/web/src/App.tsx");
const feed=get("creator-v1/web/src/components/CommunityHomeFeed.tsx");
const tactile=get("creator-v1/web/src/tactile-editorial-v006.css");
const stylesheet=get("creator-v1/web/src/cinematic-world-v005.css");
test("V005 source TSX parses and shares actual navigation",()=>{
  for(const src of [shell,landing,rail,hero])assert.doesNotThrow(()=>parse(src,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(landing,/<WorldGatewayDeck\s*\/>/);
  assert.match(shell,/className="site-main av9-main"/);
  assert.match(shell,/<dialog ref=\{menuDialog\}/);
  assert.match(shell,/aria-haspopup="dialog"/);
  assert.match(shell,/showModal\(\)/);
  assert.match(rail,/aria-current/); // Legacy rail remains available for source comparison, not mounted.
  assert.doesNotMatch(landing+shell,/<CinematicSiteRail\s*\/>/);
});
test("V008 homepage preserves the source-backed public release and creator index",()=>{
  assert.match(landing,/readProjects/);
  assert.match(landing,/readStatus/);
  assert.match(landing,/readCreators/);
  assert.match(landing,/<LiveSignalHero/);
  assert.match(landing,/lastVerified/);
  assert.match(hero,/projectDetailPath/);
  assert.match(hero,/sortByPublication/);
  assert.match(hero,/status\.counts\.publishedProjects/);
  assert.doesNotMatch(hero,/12\.4K|3\.1K|8,921|fakeProject/);
});
test("V012 preserves member boundaries while retiring duplicate Atlas navigation",()=>{
  assert.match(routes,/<MemberGate\s*\/>/);
  assert.match(routes,/path="atlas\/\*" element={<LegacyAtlasRedirect\/>}/);
  assert.doesNotMatch(routes,/<AtlasMorphLayout\/>|<AtlasPage\/>/);
  assert.match(routes,/path="community\/write"/);
  assert.match(routes,/PublicBoardsPage/);
  assert.match(shell,/site-shell--cinematic/);
  assert.match(shell,/canonicalMember\?"\/member":"\/join"/);
  assert.match(routes,/path="account" element={<MemberAccountPage\/>}/);
  assert.match(shell,/PortalLauncher/);
  assert.doesNotMatch(shell,/memberHealth|memberSignIn|staffApprove|RHEN TERMINAL|portfolio/);
});
test("V005 supplies mobile, reduced motion and forced-colors behavior",()=>{
  assert.match(stylesheet,/@media\(max-width:900px\)/);
  assert.match(stylesheet,/@media\(max-width:640px\)/);
  assert.match(stylesheet, /prefers-reduced-motion:reduce/);
  assert.match(stylesheet, /forced-colors:active/);
  assert.match(stylesheet, /:focus-visible/);
});

test("V006 builds a source-backed homepage feed and links real creator identities",()=>{
  assert.doesNotThrow(()=>parse(feed,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(landing,/<CommunityHomeFeed\b/);
  assert.match(feed,/readCommunityPosts/);
  assert.match(feed,/communityEnabled/);
  assert.match(feed,/readCommunityPosts\(\{sort:"new",limit:"8"\}/);
  assert.match(feed,/projectDetailPath/);
  assert.match(get("creator-v1/web/src/components/PublicAuthorShowcase.tsx"),/encodeURIComponent\(handle\)/);
  assert.match(feed,/A bounded excerpt of public records only/i);
  assert.doesNotMatch(feed,/fake creator|syntheticProject|inventedPost/);
});
test("V006 visual controls are rounded, tactile, and editorial without changing member gates",()=>{
  assert.match(tactile,/--av6-editorial/);
  assert.match(tactile,/--av6-index/);
  assert.match(tactile,/border-radius:999px/);
  assert.match(tactile,/--av6-control-shadow/);
  assert.match(tactile,/prefers-reduced-motion:reduce/);
  assert.match(tactile,/forced-colors:active/);
  assert.match(routes,/<MemberGate\s*\/>/);
});

test("V006 second pass keeps bounded field selection and mobile-first content",()=>{
  assert.match(feed,/id="community-index"/);
  assert.match(feed,/id="av6-field-filter"/);
  assert.match(feed,/field==="all"/);
  assert.match(feed,/Latest approved|LATEST APPROVED FIRST/);
  // V011 puts illustrated discovery before the public telemetry grid on all screens.
  assert.match(hero,/href="#world-gateways"/);
  assert.match(landing,/<WorldGatewayDeck\/>/);
  assert.match(landing,/<LiveSignalModules/);
  assert.ok(landing.indexOf("<WorldGatewayDeck/>")<landing.indexOf("<LiveSignalModules"));
  assert.match(feed,/id="community-index"/);
  assert.match(tactile,/\.cinema-feature\{display:none\}/);
  assert.match(tactile,/\.av6-feed-fields select:focus-visible/);
});

test("V008 Live Signal transmits verified public content, not fictional dashboard data",()=>{
  assert.match(hero,/readCommunityPosts\(\{sort:"new",limit:"3"\}/);
  assert.match(hero,/communityPosts===true/);
  assert.match(hero,/status\.counts\.publishedCreators/);
  assert.match(hero,/utcClock/);
  assert.match(hero,/INDEXED \/ /);
  assert.match(hero,/No synthetic presence or activity/);
  assert.match(hero,/state!=="ready"/);
  assert.match(landing,/document\.visibilityState==="visible"/);
  assert.match(landing,/180000/);
  assert.match(landing,/portal\.state==="error"&&hasVerifiedData/);
});
test("V008 typography, controls and mobile motion respect public UX boundaries",()=>{
  assert.match(main,/live-signal-v008\.css/);
  assert.match(signalCss,/--av8-serif/);
  assert.match(signalCss,/border-radius:28px/);
  assert.match(signalCss,/@media\(max-width:600px\)/);
  assert.match(signalCss,/@media\(max-width:370px\)/);
  assert.match(signalCss,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(signalCss,/@media\(forced-colors:active\)/);
  assert.match(signalCss,/focus-visible/);
  assert.doesNotMatch(landing,/CinematicCatalogueSections|CinematicDiscoverySections|HotCommunityPosts|RHEN TERMINAL/);
  assert.match(hero,/window\.matchMedia/);
  assert.match(hero,/av8-clock-label/);
  assert.match(signalCss,/\.site-shell--home \.header-create/);
  assert.match(signalCss,/av8-release-title strong\{/);
  assert.doesNotMatch(signalCss,/clip-path:inset\(0 100%/);
  assert.match(routes,/<MemberGate\s*\/>/);
});
