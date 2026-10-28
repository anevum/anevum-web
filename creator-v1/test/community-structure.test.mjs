import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("current four-destination navigation retains canonical member identity and accessible dismissal",()=>{
 const navigation=read("web/src/lib/site-navigation.ts");
 const shell=read("web/src/components/Shell.tsx");
 for(const route of ['to:"/"','to:"/severance"','to:"/discover"','to:"/member"'])
  assert.ok(navigation.includes(route),"Current stage primary destination missing: "+route);
 assert.match(read("web/src/App.tsx"),/path="community"/);
 assert.ok(shell.includes('to:"/community"'),"Community remains reachable in the drawer");
 assert.match(navigation,/PRIMARY_NAV/);
 assert.match(shell,/menuDestinations\.map/);
 assert.match(shell,/menuCategories\.map/);
 assert.match(shell,/menuUtilities\.map/);
 assert.match(shell,/aria-controls="av79-navigation"/);
 assert.match(shell,/showModal\(\)/);
 assert.match(shell,/menuButton\.current\?\.focus/);
 assert.match(shell,/onCancel=\{\(\)=>setMenuOpen\(false\)\}/);
 assert.doesNotMatch(shell,/className="portal-navigation"/);
});

test("legacy project routes lead to the verified canonical Studio",()=>{
 const app=read("web/src/App.tsx");
 const studio=read("web/src/pages/CanonicalStudioPage.tsx");
 const entry=read("web/src/lib/studio-entry-read.ts");
 assert.match(app,/path="account\/studio" element={<Navigate to="\/studio" replace\/>}/);
 assert.match(app,/path="create" element={<Navigate to="\/studio" replace\/>}/);
 assert.match(app,/path="create\/new" element={<Navigate to="\/studio\/new" replace\/>}/);
 assert.match(app,/path="create\/:projectId" element={<LegacyStudioRedirect\/>}/);
 assert.match(app,/path="studio" element=\{nativeCreatorEnabled\?/);
 assert.match(app,/path="studio\/records" element=\{<CanonicalStudioPage\/>\}/);
 assert.match(studio,/canonicalAuthClient\.useSession\(\)/);
 assert.match(studio,/session\?\.user\?\.emailVerified!==true/);
 assert.match(studio,/resolveStudioEntry\(id,mode,signal,/);
 assert.match(entry,/profile\.memberId!==memberId/);
 assert.match(entry,/canReview:capabilities\.canReview===true/);
 assert.match(studio,/setCanReview\(result\.canReview\)/);
});

test("Community mounts canonical forums and reads real public records",()=>{
 const community=read("web/src/pages/CommunityPage.tsx");
 const forum=read("web/src/pages/CanonicalForums.tsx");
 assert.match(community,/<CommunityForums\/>/);
 assert.match(community,/readCommunityPosts/);
 assert.match(community,/\/community\/posts\//);
 assert.match(forum,/forumRequest as request/);
 assert.match(forum,/\/api\/v1\/member\/forum-submissions/);
 assert.doesNotMatch(community,/portal-room-grid|rooms\.map|fakeMessage|sampleComments/);
 assert.doesNotMatch(community,/<main /);
});

test("Homepage links approved public work and keeps the premium Continuance presentation",()=>{
 const landing=read("web/src/pages/CinematicLandingPage.tsx");
 const main=read("web/src/main.tsx");
 assert.match(landing,/readProjects\(\{limit:"32"}/);
 assert.match(landing,/PUBLIC INDEX \/ VERIFIED WORK/);
 assert.match(landing,/showcase\.map\(project=>/);
 assert.doesNotMatch(landing,/Play a game|FEATURED RELEASE/);
 assert.match(landing,/av79-hero-orbit/);
 assert.match(landing,/av79-gateways/);
 assert.doesNotMatch(landing,/fakeProject|sampleProjects/);
 for(const visual of ["cinematic-world-v005.css","tactile-editorial-v006.css","home-navigation-v079.css"])
  assert.ok(main.includes(visual),"Existing visual package must remain: "+visual);
});

test("No private DM, unreviewed asset execution or game award endpoint is opened by navigation cleanup",()=>{
 const app=read("web/src/App.tsx");
 const shell=read("web/src/components/Shell.tsx");
 const account=read("web/src/pages/MemberAccountPage.tsx");
 assert.doesNotMatch(app,/path="messages"|path="collaborate\/rooms"/);
 assert.doesNotMatch(shell,/dangerouslySetInnerHTML|serviceWorker\.register|grantXp\(/);
 assert.match(account,/Private messages and shared project rooms are planned, not available/);
 const css=read("web/src/community-structure.css");
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/nav-drawer-more summary:focus-visible/);
});
