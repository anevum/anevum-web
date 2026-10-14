import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {ATLAS_WORLDS,ATLAS_WORLD_BY_ID,ATLAS_LINKS,ATLAS_MOBILE_LAYOUT} from "../web/src/lib/atlas-worlds.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Atlas is lazy-loaded as a full-viewport route, preserving the live homepage and existing Shell",()=>{
 const app=read("web/src/App.tsx"),page=read("web/src/pages/AtlasPage.tsx"),home=read("web/src/pages/HomePage.tsx");
 assert.match(app,/lazy\(\(\) => import\("\.\/pages\/AtlasPage"\)/);
 assert.match(app,/path="atlas"/);
 assert.match(app,/<Route element={<Shell\/>}>/);
 assert.match(home,/to="\/atlas"/);
 assert.match(page,/className="atlas-universe-viewport"/);
 assert.doesNotMatch(page,/dangerouslySetInnerHTML|<iframe|Math\.random/);
});
test("all worlds are first-party authentic destinations, with no invented live collaboration",()=>{
 assert.equal(ATLAS_WORLDS.length,10);
 assert.equal(new Set(ATLAS_WORLDS.map(x=>x.id)).size,10);
 assert.equal(ATLAS_WORLD_BY_ID.size,10);
 for(const world of ATLAS_WORLDS){
   assert.match(world.route,/^\/[a-z]+(?:\?category=[a-z]+)?$/);
   assert.ok(["public","invited","planned"].includes(world.status));
   assert.equal(world.coordinates.length,3);
   assert.ok(world.coordinates.every(Number.isFinite));
   assert.ok(world.title&&world.action&&world.description);
   if(world.status==="planned")assert.equal(world.type,"roadmap");
 }
 for(const [start,end] of ATLAS_LINKS){assert.ok(ATLAS_WORLD_BY_ID.has(start));assert.ok(ATLAS_WORLD_BY_ID.has(end));}
});
test("real public catalogue and server verified XP power the UX, not fake counters",()=>{
 const page=read("web/src/pages/AtlasPage.tsx");
 for(const phrase of ["readProjects(","readStatus(","No approved public projects","No real inbox, unread count, messages or delivery is live","No actual live presence or shared editor exists","memberProgress(","previous?.id===member.id","progression.level>previous.level"]){
  assert.ok(page.includes(phrase),phrase);
 }
 assert.doesNotMatch(page,/fakeUsers|fakeMessages|grantXp\(|localStorage/);
});
test("dragging, keyboard input, dialogs, mobile and reduced motion are implemented",()=>{
 const page=read("web/src/pages/AtlasPage.tsx"),css=read("web/src/pages/atlas.css");
 for(const signal of ["setPointerCapture","onPointerMove","onWheel","onMapKey","ArrowLeft","ArrowRight","Home","aria-haspopup=\"dialog\"","showModal()","onCancel={onDismiss}"]){
   assert.ok(page.includes(signal),signal);
 }
 for(const rule of ["perspective:1150px","transform-style:preserve-3d","touch-action:none","@media(max-width:640px)","@media(prefers-reduced-motion:reduce)","overflow:hidden"]){
   assert.ok(css.includes(rule),rule);
 }
 assert.ok(existsSync(new URL("../web/src/pages/atlas.css",import.meta.url)));
});
test("phone layout preserves ten unique tappable positions within bounded horizontal reach",()=>{
 const positions=Object.values(ATLAS_MOBILE_LAYOUT);
 assert.equal(positions.length,10);
 assert.equal(new Set(positions.map(p=>p.join(","))).size,10);
 assert.ok(positions.every(([x,y])=>Math.abs(x)<=2.7&&Math.abs(y)<=4.8));
 const css=read("web/src/pages/atlas.css"),page=read("web/src/pages/AtlasPage.tsx");
 assert.match(css,/--atlas-mobile-x/);
 assert.match(css,/atlas-lattice--mobile/);
 assert.match(page,/ATLAS_MOBILE_LAYOUT\[world\.id\]/);
});
test("Atlas is accessible from the existing portal and mobile menu",()=>{
 const shell=read("web/src/components/Shell.tsx"),nav=read("web/src/lib/portal-destinations.ts");
 assert.match(shell,/\["\/atlas","Atlas \/ Spatial Navigation"\]/);
 assert.match(nav,/id:"atlas".*path:"\/atlas"/);
});

test("Deck search stays in the same full-screen experience and queries the approved catalogue",()=>{
 const page=read("web/src/pages/AtlasPage.tsx");
 const css=read("web/src/pages/atlas.css");
 assert.match(page,/setSubmittedQuery\(query\.trim\(\)\.slice\(0,100\)\)/);
 assert.match(page,/q:submittedQuery\|\|undefined/);
 assert.match(page,/SEARCH RESULTS/);
 assert.doesNotMatch(page,/navigate\(nextPath\)|window\.location\.assign/);
 assert.match(css,/\.atlas-deck-search button/);
});
