import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ATLAS_WORLDS} from "../web/src/lib/atlas-worlds.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("one compact Menu and actual member identity use the sole top navigation",()=>{
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  const css=read("web/src/pages/atlas-morph.css");
  assert.match(shell,/<header className="atm-header">/);
  assert.match(shell,/className={"atm-menu-button"/);
  assert.match(shell,/aria-controls="atm-navigation-overlay" aria-haspopup="dialog"/);
  assert.match(shell,/className="atm-profile-card"/);
  assert.match(shell,/className="atm-profile-settings"/);
  assert.match(shell,/memberMe\(controller.signal\)/);
  assert.match(shell,/setName\(member\.displayName\?\.trim\(\)\|\|member\.handle\|\|"MEMBER"\)/);
  assert.match(shell,/to="\/atlas\/account\/edit"/);
  assert.match(shell,/to="\/atlas\/account"/);
  assert.doesNotMatch(shell,/<nav className="atm-primary-nav"/);
  for(const forbidden of ["atm-node","atm-constellation","atm-mobile-dock","atm-workspace","atm-footer","atm-floating-jump","atm-world-tile"])
    assert.ok(!shell.includes(forbidden),"The obsolete secondary navigation must not render: "+forbidden);
  assert.match(css,/\.atm-content\{[^}]*position:absolute;inset:var\(--atm-nav-height\) 0 0/);
  assert.match(css,/\.atm-content--overview\{padding:0;/);
  assert.match(css,/\.atm-navigation-overlay\{position:fixed;inset:var\(--atm-nav-height\) 0 0/);
});

test("native full-height overlay exposes all real destinations and honest feature states",()=>{
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  const css=read("web/src/pages/atlas-morph.css");
  assert.equal(ATLAS_WORLDS.length,10);
  for(const id of ATLAS_WORLDS.map(w=>w.id))assert.match(shell,new RegExp("  "+id+':"/atlas/'));
  assert.match(shell,/<dialog ref={menuDialog} id="atm-navigation-overlay"/);
  assert.match(shell,/dialog\.showModal\(\)/);
  assert.match(shell,/dialog\.close\(\)/);
  assert.match(shell,/onCancel=\{\(\)=>setMenuOpen\(false\)\}/);
  assert.match(shell,/className="atm-navigation-links"/);
  assert.match(shell,/ATLAS_WORLDS\.map\(world=><button type="button" key={world.id}/);
  assert.match(shell,/onMouseEnter=\{\(\)=>setPreviewWorld\(world\.id\)\}/);
  assert.match(shell,/FUTURE FEATURE — NOT LIVE/);
  assert.match(css,/\.atm-navigation-links\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/\.atm-navigation-links\{grid-template-columns:1fr/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(shell,/fakeMessages|fakeUsers|Math\.random|grantXp\(|faker/);
});

test("front page is a functioning console of actual public data and navigable releases",()=>{
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  const home=read("web/src/pages/MorphHomeConsole.tsx");
  const feed=read("web/src/pages/MorphActivityStream.tsx");
  const css=read("web/src/pages/morph-home-console.css");
  assert.match(shell,/<MorphHomeConsole onExplore=\{\(\)=>setMenuOpen\(true\)\}\/>/);
  for(const signal of ["mhc-feature-zone","mhc-headliner","MorphActivityStream","mhc-newsroom","mhc-release-rail","mhc-departments","mhc-community"]){
    assert.ok(home.includes(signal),signal);
  }
  for(const signal of ["readStatus(signal)","readProjects({limit:\"16\"},signal)","readCreators({limit:\"6\"},signal)","Promise.allSettled","publishedAt","spotlightIndex","advance(-1)","advance(1)"]){
    assert.ok(home.includes(signal),signal);
  }
  assert.match(home,/document\.visibilityState==="visible"/);
  assert.match(home,/dateLabel\(project\.publishedAt\)/);
  assert.match(css,/\.mhc-feature-zone\{display:grid/);
  assert.match(css,/\.mhc-spotlight-controls/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/\.mhc-release-rail\{grid-template-columns:1fr/);
  assert.match(feed,/readProjects\(\{/);
  assert.match(feed,/limit:PAGE_SIZE/);
  assert.match(feed,/category:filter as Category/);
  assert.match(feed,/page\.nextCursor/);
  assert.match(feed,/aria-pressed={filter===item.id}/);
  assert.match(feed,/LOAD MORE RELEASES/);
  assert.match(feed,/document\.visibilityState==="visible"/);
  assert.match(feed,/if\(cursor\)return;/);
  assert.match(feed,/IREN EDITORIAL: NOT CONNECTED/);
  assert.match(feed,/No activity was invented/);
  assert.match(css,/\.mhc-feed-filters/);
  assert.match(css,/\.mhc-feed-pager/);
  assert.doesNotMatch(home+feed,/fakeUsers|fakeProjects|Math\.random|manufactured|awardXp\(/);
});

test("Atlas Quick Jump searches approved project records and genuine creator channels while retaining local routes",()=>{
  const launcher=read("web/src/components/PortalLauncher.tsx");
  const css=read("web/src/portal-launcher.css");
  assert.match(launcher,/readProjects\(\{q:liveQuery,limit:"5"\},controller\.signal\)/);
  assert.match(launcher,/readCreators\(\{q:liveQuery,limit:"4"\},controller\.signal\)/);
  assert.match(launcher,/Promise\.allSettled/);
  assert.match(launcher,/AbortController\(\)/);
  assert.match(launcher,/window\.setTimeout\(async\(\)=>\{/);
  assert.match(launcher,/controller\.abort\(\)/);
  assert.match(launcher,/live\.query===liveQuery/);
  assert.match(launcher,/\/projects\/"\+encodeURIComponent\(project\.id\)/);
  assert.match(launcher,/\/creators\/"\+encodeURIComponent\(creator\.handle\)/);
  assert.match(launcher,/role="status" aria-live="polite"/);
  assert.match(launcher,/insideWorkspace\(entry\.path\)/);
  assert.match(css,/\.portal-launcher-live-status/);
});

test("all real nested site routes and member permissions persist with navigation",()=>{
  const app=read("web/src/App.tsx");
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  for(const fragment of [
    'path="atlas/orbit"','path="atlas"','<AtlasMorphLayout/>',
    'path="discover" element={<DiscoverPage immersive/>}',
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

test("member card uses genuine server-confirmed progression and no random rewards",()=>{
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  assert.match(shell,/memberHealth\(controller.signal\)/);
  assert.match(shell,/memberMe\(controller.signal\)/);
  assert.match(shell,/memberProgress\(controller.signal\)/);
  assert.match(shell,/before\.id===member\.id/);
  assert.match(shell,/progression\.level>before\.level&&progression\.xp>before\.xp/);
  assert.match(shell,/role="status" aria-live="polite"/);
  assert.doesNotMatch(shell,/localStorage|sessionStorage|setInterval|postMessage/);
});

test("keyboard quick jump stays in Atlas while member controls remain server-gated",()=>{
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  const launcher=read("web/src/components/PortalLauncher.tsx");
  const memberGate=read("web/src/components/MemberGate.tsx");
  assert.match(shell,/<PortalLauncher open={launcherOpen} onClose=\{\(\)=>setLauncherOpen\(false\)\} routePrefix="\/atlas"\/>/);
  assert.match(shell,/isEditableTarget\(event\.target\)/);
  assert.match(shell,/event\.key==="\/"/);
  assert.match(shell,/event\.metaKey\|\|event\.ctrlKey/);
  assert.match(shell,/className="atm-navigation-search"/);
  assert.match(launcher,/routePrefix\?: "" \| "\/atlas"/);
  assert.match(launcher,/insideWorkspace\(entry\.path\)/);
  assert.match(memberGate,/memberHealth\(signal\)/);
  assert.match(memberGate,/memberMe\(signal\)/);
  assert.match(memberGate,/INVITED TESTING/);
});

test("Play, Tools and Creative still have distinct existing art and original Discover is unchanged",()=>{
  const app=read("web/src/App.tsx");
  const discover=read("web/src/pages/DiscoverPage.tsx");
  const heading=read("web/src/components/PortalHeading.tsx");
  assert.match(app,/path="discover" element={<DiscoverPage immersive\/>}/);
  assert.match(app,/path="discover" element={<DiscoverPage\/>}/);
  assert.match(discover,/export function DiscoverPage\(\{immersive=false\}/);
  for(const phrase of ["games:{","tools:{","creative:{","ENTER THE","ARCADE.","SOFTWARE","WITH SOUL.","FIND THE","UNEXPECTED.","scene:\"games\"","scene:\"tools\"","scene:\"creative\""])
    assert.ok(discover.includes(phrase),phrase);
  assert.match(discover,/world=immersive\?immersiveWorlds\[category as Category\]:undefined/);
  assert.match(discover,/scene={world\?\.scene\|\|"portal"}/);
  assert.match(heading,/CosmicArtwork scene={scene}/);
});

test("isolated review is read-only and cannot reach private accounts or mutate the production site",()=>{
  const config=JSON.parse(read("wrangler.atlas-review.jsonc"));
  const worker=read("web/atlas-review-worker.mjs");
  assert.equal(config.name,"anevum-atlas-review-20261013");
  assert.equal(config.workers_dev,true);
  assert.equal(config.preview_urls,false);
  for(const key of ["routes","d1_databases","r2_buckets","vars","durable_objects","services"])
    assert.equal(Object.hasOwn(config,key),false);
  assert.match(worker,/if\(request.method!=="GET"&&request.method!=="HEAD"\)/);
  assert.match(worker,/if\(!PUBLIC\.test\(url.pathname\)\)/);
});
