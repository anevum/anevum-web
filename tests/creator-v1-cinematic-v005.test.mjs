import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const shell=get("creator-v1/web/src/components/Shell.tsx");
const landing=get("creator-v1/web/src/pages/CinematicLandingPage.tsx");
const rail=get("creator-v1/web/src/components/CinematicSiteRail.tsx");
const routes=get("creator-v1/web/src/App.tsx");
const feed=get("creator-v1/web/src/components/CommunityHomeFeed.tsx");
const tactile=get("creator-v1/web/src/tactile-editorial-v006.css");
const stylesheet=get("creator-v1/web/src/cinematic-world-v005.css");
test("V005 source TSX parses and shares actual navigation",()=>{
  for(const src of [shell,landing,rail])assert.doesNotThrow(()=>parse(src,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(landing,/<CinematicSiteRail\s*\/>/);
  assert.match(shell,/<CinematicSiteRail\s*\/>/);
  assert.match(shell,/cinematicPublic\s*\?/);
  assert.match(rail,/aria-current/);
});
test("V005 maintains live API data and accurate public featured project",()=>{
  assert.match(landing,/readProjects/);
  assert.match(landing,/readStatus/);
  assert.match(landing,/projectDetailPath/);
  assert.match(landing,/project\?project\.title/);
  assert.match(landing,/No fictional projects are listed as live/);
  assert.doesNotMatch(landing,/Level 32|12\.4K XP|fakeProject/);
});
test("V005 does not change separate authenticated and Atlas route boundaries",()=>{
  assert.match(routes,/<MemberGate\s*\/>/);
  assert.match(routes,/path="atlas"/);
  assert.match(routes,/path="community\/write"/);
  assert.match(routes,/PublicBoardsPage/);
  assert.match(shell,/location\.pathname\.startsWith\("\/community\/posts\/"\)/);
  assert.doesNotMatch(shell,/location\.pathname\.startsWith\("\/account"/);
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
  assert.match(landing,/<CommunityHomeFeed /);
  assert.match(feed,/readCommunityPosts/);
  assert.match(feed,/communityEnabled/);
  assert.match(feed,/readCommunityPosts\(\{sort:"new",limit:"8"\}/);
  assert.match(feed,/projectDetailPath/);
  assert.match(feed,/encodeURIComponent\(handle\)/);
  assert.match(feed,/approved public records only/i);
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
