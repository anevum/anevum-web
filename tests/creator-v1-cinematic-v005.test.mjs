import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const shell=get("creator-v1/web/src/components/Shell.tsx");
const landing=get("creator-v1/web/src/pages/CinematicLandingPage.tsx");
const rail=get("creator-v1/web/src/components/CinematicSiteRail.tsx");
const routes=get("creator-v1/web/src/App.tsx");
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
