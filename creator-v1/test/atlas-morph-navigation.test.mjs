import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ATLAS_WORLDS} from "../web/src/lib/atlas-worlds.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("one Morph top navigation renders the entire live page below it, not a floating imitation window",()=>{
 const shell=read("web/src/pages/AtlasMorphPage.tsx");
 const css=read("web/src/pages/atlas-morph.css");
 assert.match(shell,/<header className="atm-header">/);
 assert.match(shell,/<nav className="atm-primary-nav"/);
 assert.match(shell,/<main id="atm-content" ref={main}/);
 assert.match(shell,/className="atm-embedded"><Outlet\/>/);
 assert.match(shell,/<Overview onEnter={enter}/);
 for(const forbidden of ["atm-node","atm-constellation","atm-mobile-dock","atm-workspace","atm-footer","atm-floating-jump"])
   assert.ok(!shell.includes(forbidden),"Obsolete secondary UI must not render: "+forbidden);
 assert.match(css,/\.atm-content\{[^}]*position:absolute;inset:var\(--atm-nav-height\) 0 0/);
 assert.match(css,/\.atm-content--page\{padding:clamp\(/);
 assert.match(css,/\.atm-embedded\{width:100%/);
 assert.doesNotMatch(css,/\.atm-workspace\{/);
 assert.doesNotMatch(css,/\.atm-mobile-dock\{/);
 assert.doesNotMatch(css,/\.atm-footer\{/);
});

test("all ten real worlds live in one header/menu and a deliberate visual home grid",()=>{
 const shell=read("web/src/pages/AtlasMorphPage.tsx");
 assert.equal(ATLAS_WORLDS.length,10);
 for(const id of ATLAS_WORLDS.map(w=>w.id))assert.match(shell,new RegExp('  '+id+':"\\/atlas\\/'));
 assert.match(shell,/className="atm-world-grid"/);
 assert.match(shell,/atm-world-tile--/);
 assert.match(shell,/<nav className="atm-worlds-menu-grid"/);
 assert.match(shell,/aria-controls="atm-worlds-menu"/);
 assert.match(shell,/aria-expanded={menuOpen}/);
 assert.match(shell,/<nav className="atm-primary-nav" aria-label="Main ANEVUM navigation">/);
 assert.match(shell,/setMenuOpen\(false\)/);
 assert.match(shell,/aria-current={chosenId===world.id\?"page":undefined}/);
 assert.match(shell,/No actual simultaneous editing/);
 assert.match(shell,/no live message inbox/i);
 assert.doesNotMatch(shell,/fakeMessages|fakeUsers|Math\.random|grantXp\(|faker/);
});
test("real nested site and protected member pages remain routed inside persistent shell",()=>{
 const app=read("web/src/App.tsx");
 const shell=read("web/src/pages/AtlasMorphPage.tsx");
 for(const fragment of [
  'path="atlas/orbit"','path="atlas"','<AtlasMorphLayout/>',
  'path="discover" element={<DiscoverPage/>}',
  'path="projects/:id" element={<ProjectPage/>}',
  'path="creators/:handle" element={<CreatorPage/>}',
  'path="community" element={<CommunityPage/>}',
  'path="workspace" element={<WorkspacePage/>}',
  'path="create/new" element={<ProjectEditorPage/>}',
  'path="levels" element={<LevelsPage/>}',
  'path="signals" element={<AtlasSignals/>}',
  'path="collaborate" element={<AtlasCollaboration/>}',
  'path="*" element={<Navigate to="/atlas" replace/>}'
 ])assert.ok(app.includes(fragment),fragment);
 assert.match(app,/<Route element={<MemberGate\/>}>/);
 assert.match(shell,/<Outlet\/>/);
 assert.match(shell,/navigate\("\/atlas"\+relative\+url\.search\+url\.hash\)/);
 assert.match(shell,/import\.meta\.env\.BASE_URL/);
 assert.match(shell,/navigate\("\/atlas"\)/);
 assert.doesNotMatch(shell,/dangerouslySetInnerHTML|document\.write|location\.reload/);
});
test("headroom, phone breakpoints, spacing and reduced motion are explicitly checked",()=>{
 const css=read("web/src/pages/atlas-morph.css");
 assert.match(css,/--atm-nav-height:82px/);
 assert.match(css,/@media\(max-width:640px\)\{\s*\.atm-shell\{--atm-nav-height:66px\}/);
 assert.match(css,/@media\(max-width:375px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.atm-world-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.atm-world-grid\{grid-template-columns:1fr;gap:15px/);
 assert.match(css,/\.atm-embedded \.portal-discover-results\{gap:18px/);
 assert.match(css,/\.atm-content\{[^}]*overflow:auto/);
 assert.match(css,/\.atm-shell\{[^}]*position:fixed;inset:0/);
});
test("server-verified XP only; do not invent collaborative events or active participants",()=>{
 const shell=read("web/src/pages/AtlasMorphPage.tsx");
 assert.match(shell,/memberHealth\(controller.signal\)/);
 assert.match(shell,/memberMe\(controller.signal\)/);
 assert.match(shell,/memberProgress\(controller.signal\)/);
 assert.match(shell,/before\.id===member\.id/);
 assert.match(shell,/progression\.level>before\.level&&progression\.xp>before\.xp/);
 assert.match(shell,/role="status" aria-live="polite"/);
 assert.doesNotMatch(shell,/localStorage|sessionStorage|setInterval|postMessage/);
});
test("one header includes keyboard switchboard, search, account and home without creating bottom navigation",()=>{
 const morph=read("web/src/pages/AtlasMorphPage.tsx");
 const launcher=read("web/src/components/PortalLauncher.tsx");
 const shell=read("web/src/components/Shell.tsx");
 assert.match(morph,/<PortalLauncher open={launcherOpen} onClose=\{\(\)=>setLauncherOpen\(false\)\} routePrefix="\/atlas"\/>/);
 assert.match(morph,/isEditableTarget\(event\.target\)/);
 assert.match(morph,/event\.key==="\/"/);
 assert.match(morph,/event\.metaKey\|\|event\.ctrlKey/);
 assert.match(morph,/className="atm-search"/);
 assert.match(morph,/atm-worlds-trigger/);
 assert.match(morph,/to="\/atlas\/account"/);
 assert.match(launcher,/routePrefix\?: "" \| "\/atlas"/);
 assert.match(launcher,/insideWorkspace\(entry\.path\)/);
 assert.match(launcher,/insideWorkspace\(entries\[selected\]\.path\)/);
 assert.match(shell,/<PortalLauncher open={launcherOpen} onClose=/);
});
test("isolated review Worker still has no production routes, storage or private API",()=>{
 const config=JSON.parse(read("wrangler.atlas-review.jsonc"));
 const worker=read("web/atlas-review-worker.mjs");
 assert.equal(config.name,"anevum-atlas-review-20261013");
 assert.equal(config.workers_dev,true);
 assert.equal(config.preview_urls,false);
 for(const key of ["routes","d1_databases","r2_buckets","vars","durable_objects","services"])assert.equal(Object.hasOwn(config,key),false);
 assert.match(worker,/if\(request.method!=="GET"&&request.method!=="HEAD"\)/);
 assert.match(worker,/if\(!PUBLIC\.test\(url.pathname\)\)/);
});


test("Play, Tools and Creative become bespoke visual worlds only inside Morph",()=>{
 const app=read("web/src/App.tsx");
 const discover=read("web/src/pages/DiscoverPage.tsx");
 const heading=read("web/src/components/PortalHeading.tsx");
 assert.match(app,/path="discover" element={<DiscoverPage immersive\/>}/);
 assert.match(app,/path="discover" element={<DiscoverPage\/>}/);
 assert.match(discover,/export function DiscoverPage\(\{immersive=false\}/);
 for(const phrase of ["games:{","tools:{","creative:{","ENTER THE","ARCADE.","SOFTWARE","WITH SOUL.","FIND THE","UNEXPECTED.","scene:\"games\"","scene:\"tools\"","scene:\"creative\""]){
   assert.ok(discover.includes(phrase),phrase);
 }
 assert.match(discover,/world=immersive\?immersiveWorlds\[category as Category\]:undefined/);
 assert.match(discover,/scene={world\?\.scene\|\|"portal"}/);
 assert.match(heading,/scene="portal"/);
 assert.match(heading,/CosmicArtwork scene={scene}/);
 assert.doesNotMatch(discover,/Math\.random|fakeProjects|fabricatedResult/);
});
