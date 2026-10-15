import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("one shared site map drives a four-destination pop-out menu",()=>{
 const navigation=read("web/src/lib/site-navigation.ts");
 const shell=read("web/src/components/Shell.tsx");
 for(const route of ['to:"/"','to:"/discover"','to:"/community"','to:"/account"'])
   assert.ok(navigation.includes(route),"Primary destination missing: "+route);
 assert.match(navigation,/PRIMARY_NAV/);
 assert.match(shell,/DRAWER_GROUPS\.map/);
 assert.match(shell,/aria-controls="mobile-menu"/);
 assert.match(shell,/firstMenuLink\.current\?\.focus/);
 assert.match(shell,/dismissOutside/);
 assert.match(shell,/window\.removeEventListener\("pointerdown", dismissOutside\)/);
 assert.doesNotMatch(shell,/className="portal-navigation"/);
 assert.doesNotMatch(shell,/<Link to="\/create" className="header-create"/);
});

test("Creator Studio lives under authenticated Account without breaking old project links",()=>{
 const app=read("web/src/App.tsx");
 const member=read("web/src/components/MemberGate.tsx");
 const account=read("web/src/pages/MemberAccountPage.tsx");
 const navigation=read("web/src/lib/site-navigation.ts");
 assert.equal((app.match(/path="account\/studio" element={<MemberProjectsPage\/>}/g)||[]).length,2);
 for(const route of ['path="create"','path="create/new"','path="create/:projectId"'])
   assert.ok(app.includes(route),route);
 assert.match(app,/<MemberGate\/>/);
 assert.match(account,/YOUR ANEVUM WORKSPACE/);
 assert.match(account,/to="\/account\/studio"/);
 assert.match(account,/to="\/library"/);
 assert.match(account,/memberProgress/);
 assert.match(member,/to="\/account\/studio"/);
 assert.match(navigation,/MEMBER_NAV/);
});

test("Community is a single genuine public forum, not a demo of invented rooms",()=>{
 const community=read("web/src/pages/CommunityPage.tsx");
 const forum=read("web/src/pages/HotCommunityPosts.tsx");
 assert.match(community,/<HotCommunityPosts\/>/);
 assert.match(community,/COMMUNITY CONVERSATIONS ARE UNDER PRIVATE REVIEW/);
 assert.match(community,/Only actual approved posts appear publicly/);
 assert.match(community,/to="\/community\/write"/);
 assert.match(forum,/readCommunityPosts/);
 assert.match(forum,/\/community\/posts\//);
 assert.doesNotMatch(community,/portal-room-grid|rooms\.map|fakeMessage|sampleComments/);
 assert.doesNotMatch(community,/<main /);
});

test("Homepage leads with approved community submissions without changing cinematic imagery",()=>{
 const landing=read("web/src/pages/CinematicLandingPage.tsx");
 const shell=read("web/src/components/Shell.tsx");
 const main=read("web/src/main.tsx");
 assert.match(landing,/COMMUNITY DASHBOARD/);
 assert.match(landing,/CosmicArtwork scene="hero" priority/);
 assert.match(landing,/<CinematicSiteRail\/>/);
 assert.ok(landing.indexOf("<CommunityHomeFeed")>0);
 assert.ok(landing.indexOf("<CommunityHomeFeed")<landing.indexOf('<nav className="cinema-gateways"'));
 assert.match(shell,/<CinematicSiteRail\/>/);
 for(const visual of ["cinematic-world-v005.css","tactile-editorial-v006.css"])
   assert.ok(main.includes(visual),"Existing visual package must remain: "+visual);
 assert.match(main,/community-structure\.css/);
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
});
