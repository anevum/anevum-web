import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("one active cinematic route shell and preserved member boundaries",()=>{
 const app=read("web/src/App.tsx");
 assert.equal((app.match(/<Route element={<Shell\/>}>/g)||[]).length,1);
 assert.match(app,/path="atlas\/\*" element={<LegacyAtlasRedirect\/>}/);
 assert.match(app,/function LegacyAtlasRedirect/);
 assert.doesNotMatch(app,/<AtlasMorphLayout\/>|<AtlasPage\/>|<WorkspacePage\/>/);
 for(const route of ["discover","community","boards","creators","levels","account","library","create","status"])
   assert.ok(app.includes('path="'+route+'"'),route);
 assert.match(app,/<MemberGate\/>/);
 assert.match(app,/path="workspace" element={<Navigate to="\/account" replace\/>}/);
});
test("active board, post, editor and scoped discussion link within canonical routes",()=>{
 for(const path of ["web/src/pages/PublicBoardsPage.tsx","web/src/pages/CommunityPostPage.tsx",
   "web/src/pages/CommunityPostEditorPage.tsx","web/src/components/ContextDiscussions.tsx"]){
  assert.doesNotMatch(read(path),/\/atlas(?:\/|")/,path);
 }
 const boards=read("web/src/pages/PublicBoardsPage.tsx");
 assert.match(boards,/\/projects\//);
 assert.doesNotMatch(boards,/\/experience\//);
});
test("public navigation omits unselected experimental and owner material",()=>{
 const nav=read("web/src/lib/portal-destinations.ts");
 const shell=read("web/src/components/Shell.tsx");
 const status=read("web/src/pages/StatusPage.tsx");
 assert.doesNotMatch(nav,/path:"\/atlas"|path:"\/workspace"|title:"The Commons"/);
 assert.match(nav,/id:"boards".*path:"\/boards"/);
 assert.doesNotMatch(shell+status,/DEVON.S PORTFOLIO|lab\.anevum\.com|\/portfolio\//i);
 assert.match(shell,/canonicalMember\?"\/member":"\/join"/);
 assert.match(read("web/src/App.tsx"),/path="account" element={<MemberAccountPage\/>}/);
 assert.match(read("web/src/pages/AtlasMorphPage.tsx"),/export function AtlasMorphLayout/);
 assert.match(read("web/src/pages/WorkspacePage.tsx"),/PRIVATE LAB/);
});
test("visual tokens extend to old community and private pages without changing gates",()=>{
 const css=read("web/src/sitewide-cleanup-v012.css");
 const main=read("web/src/main.tsx");
 assert.match(main,/sitewide-cleanup-v012\.css/);
 for(const token of ["--av9-paper","--av9-body","--av10-editorial","--av9-glass"])assert.ok(css.includes(token),token);
 for(const name of [".cnb-hub",".discussion-page",".discussion-composer",".member-shell"])assert.ok(css.includes(name),name);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 const browser=read("test/capture-sitewide-v012.mjs");
 assert.match(browser,/SITEWIDE_V012_VISUAL_OR_ROUTE_DRIFT/);
 assert.match(browser,/--av10-editorial/);
 assert.match(browser,/forbidden/);

 assert.match(css,/\.levels-masthead \.levels-emblem\s*\{/);
 assert.match(css,/position:absolute;/);
 assert.match(css,/\.levels-masthead p\s*\{/);
 const gate=read("web/src/components/MemberGate.tsx");
 assert.match(gate,/memberHealth\(signal\)/);
 assert.match(gate,/memberMe\(signal\)/);
 assert.match(read("web/src/components/MemberEngagementPanel.tsx"),/Public voting is not open/);
});
