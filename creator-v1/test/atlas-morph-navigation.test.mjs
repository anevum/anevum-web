import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ATLAS_WORLDS} from "../web/src/lib/atlas-worlds.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Morph reuses the real React pages as nested routes and keeps the original Atlas accessible",()=>{
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
 assert.match(shell,/navigate\("\/atlas"\)/);
 assert.match(shell,/navigate\("\/atlas"\+relative\+url\.search\+url\.hash\)/);
 assert.match(shell,/import\.meta\.env\.BASE_URL/);
 assert.doesNotMatch(shell,/dangerouslySetInnerHTML|document\.write|location\.reload/);
});
test("all worlds resolve to persistent shell routes with real or explicitly future states",()=>{
 const shell=read("web/src/pages/AtlasMorphPage.tsx");
 assert.equal(ATLAS_WORLDS.length,10);
 assert.match(shell,/function worldFor/);
 assert.match(shell,/URLSearchParams\(search\)/);
 assert.match(shell,/ROUTES\.has\(first\)/);
 for(const id of ATLAS_WORLDS.map(x=>x.id))assert.match(shell,new RegExp('  '+id+':"\\/atlas\\/'));
 assert.match(shell,/No actual simultaneous editing/);
 assert.match(shell,/no live message inbox/i);
 assert.doesNotMatch(shell,/fakeMessages|fakeUsers|Math\.random|grantXp\(|faker/);
});
test("motion uses front-facing, transform-only world positions and semantic content panel",()=>{
 const css=read("web/src/pages/atlas-morph.css");
 const source=read("web/src/pages/AtlasMorphPage.tsx");
 assert.match(source,/atm-shell--focused/);
 assert.match(source,/atm-workspace/);
 assert.match(source,/onPointerMove={move}/);
 assert.match(source,/setPointerCapture\(e.pointerId\)/);
 assert.match(source,/onClickCapture={onInternalLink}/);
 assert.match(source,/aria-label="ANEVUM worlds"/);
 assert.match(source,/aria-current={active\?"page":undefined}/);
 assert.match(source,/type="button" onClick={back}/);
 assert.match(css,/atm-shell--focused \.atm-node/);
 assert.match(css,/--node-mobile-x/);
 assert.match(css,/--atm-pan-x/);
 assert.match(css,/touch-action:none/);
 assert.match(css,/\.atm-constellation/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.atm-content\{[^}]*overflow:auto/);
 assert.match(css,/\.atm-shell\{[^}]*position:fixed/);
 assert.doesNotMatch(css,/\.atm-node-art\{[^}]*rotate[XY]\(/);
});
test("progression feedback follows member-confirmed level increase and never awards XP from navigation",()=>{
 const shell=read("web/src/pages/AtlasMorphPage.tsx");
 assert.match(shell,/memberHealth\(controller.signal\)/);
 assert.match(shell,/memberMe\(controller.signal\)/);
 assert.match(shell,/memberProgress\(controller.signal\)/);
 assert.match(shell,/before\.id===member\.id/);
 assert.match(shell,/progression\.level>before\.level&&progression\.xp>before\.xp/);
 assert.match(shell,/role="status" aria-live="polite"/);
 assert.doesNotMatch(shell,/localStorage|sessionStorage|setInterval|postMessage/);
});
test("review Worker stays read-only and disconnected from private member APIs",()=>{
 const config=JSON.parse(read("wrangler.atlas-review.jsonc"));
 const worker=read("web/atlas-review-worker.mjs");
 assert.equal(config.name,"anevum-atlas-review-20261013");
 assert.equal(config.workers_dev,true);
 assert.equal(config.preview_urls,false);
 assert.deepEqual(Object.keys(config.assets).sort(),["binding","directory","not_found_handling","run_worker_first"].sort());
 for(const name of ["routes","d1_databases","r2_buckets","vars","durable_objects","services"])assert.equal(Object.hasOwn(config,name),false);
 assert.match(worker,/if\(request.method!=="GET"&&request.method!=="HEAD"\)/);
 assert.match(worker,/if\(!PUBLIC\.test\(url.pathname\)\)/);
 assert.match(worker,/never forward/i);
});


test("universal quick-jump stays scoped to the Morph world and retains the original shell launcher",()=>{
 const morph=read("web/src/pages/AtlasMorphPage.tsx");
 const launcher=read("web/src/components/PortalLauncher.tsx");
 const shell=read("web/src/components/Shell.tsx");
 assert.match(morph,/<PortalLauncher open={launcherOpen} onClose=\{\(\)=>setLauncherOpen\(false\)\} routePrefix="\/atlas"\/>/);
 assert.match(morph,/isEditableTarget\(event\.target\)/);
 assert.match(morph,/event\.key==="\/"/);
 assert.match(morph,/event\.metaKey\|\|event\.ctrlKey/);
 assert.match(morph,/className="atm-mobile-jump"/);
 assert.match(morph,/className="atm-overview-quick"/);
 assert.match(launcher,/routePrefix\?: "" \| "\/atlas"/);
 assert.match(launcher,/insideWorkspace\(entry\.path\)/);
 assert.match(launcher,/insideWorkspace\(entries\[selected\]\.path\)/);
 assert.match(launcher,/insideWorkspace\("\/start"\)/);
 assert.match(shell,/<PortalLauncher open={launcherOpen} onClose=/);
});
