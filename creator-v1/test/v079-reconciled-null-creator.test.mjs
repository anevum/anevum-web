import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publicCreatorHandle} from "../web/src/lib/public-creator-handle.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("production-reconciled V079 never fabricates a public creator channel",()=>{
 for(const invalid of [null,undefined,false,0,"null","undefined","@devon","private name","/creators/null"])
  assert.equal(publicCreatorHandle(invalid),null,String(invalid));
 assert.equal(publicCreatorHandle("devon"),"devon");
 for(const path of [
   "web/src/pages/CinematicLandingPage.tsx",
   "web/src/components/ProjectCard.tsx",
   "web/src/components/PortalLauncher.tsx"
 ]){
  const source=read(path);
  assert.match(source,/publicCreatorHandle\(project\.creatorHandle\)/,path);
  assert.doesNotMatch(source,/encodeURIComponent\(project\.creatorHandle\)/,path);
 }
 const home=read("web/src/pages/CinematicLandingPage.tsx");
 assert.match(home,/Public creator channel not linked\./);
 assert.match(home,/const featured=projects\[0\]\|\|null/);
 assert.match(home,/sort\(byPublication\)/);
 assert.doesNotMatch(home,/const featured=games\[0\]/);
 assert.match(home,/featured\.title/);
 assert.doesNotMatch(home,/ANEVUM \/ PUBLISHED 001/);
 const cards=read("web/src/components/ProjectCard.tsx");
 assert.match(cards,/Public creator channel not linked\./);
 assert.match(cards,/source:"creator-channel",avatar:false,level:null,featuredAwards:\[\]/);
 assert.match(read("web/src/components/CommunityHomeFeed.tsx"),/publicCreatorHandle\(project\.creatorHandle\)/);
});
