import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("all public portal routes are real React components, not empty links",()=>{
 const app=read("web/src/App.tsx");
 for(const [route,component] of [
   ['discover','DiscoverPage'],['creators','CreatorsPage'],['creators/:handle','CreatorPage'],
   ['projects/:id','ProjectPage'],['community','CommunityPage'],['levels','LevelsPage']
 ]){
   assert.ok(app.includes('path="'+route+'"'),"Missing "+route);
   assert.ok(app.includes(component),"Missing "+component);
 }
 assert.doesNotMatch(app,/path="community" element={<ComingPage/);
});
test("Orbital Underground visual identity and responsive routes are shared site-wide",()=>{
 const main=read("web/src/main.tsx"),css=read("web/src/portal-overhaul.css"),shell=read("web/src/components/Shell.tsx");
 assert.match(main,/import "\.\/portal-overhaul\.css"/);
 assert.match(shell,/portalCategories/);
 assert.match(shell,/\/levels/);
 for(const width of ["1200px","900px","640px","340px"]) assert.ok(css.includes(width),width);
 for(const token of ["--portal-iron","--portal-violet","--portal-buzz"])assert.ok(css.includes(token),token);
 assert.match(css,/prefers-reduced-motion/);
});
test("Explore has real public queries, category filters, meaningful layout toggle and pagination",()=>{
 const s=read("web/src/pages/DiscoverPage.tsx");
 for(const part of ["readProjects","readCategories","PageNav","selectCategory","setView","aria-pressed","portal-discover-results"])assert.ok(s.includes(part),part);
 assert.match(s,/cursor:cursor\|\|undefined/);
 assert.doesNotMatch(s,/sampleVotes|sampleLikes|Math\.random/);
});
test("creator identity is a public project-based channel, never a guessed or purchased level",()=>{
 const page=read("web/src/pages/CreatorsPage.tsx");
 const api=read("web/src/lib/member-api.ts");
 for(const part of ["readCreators","readCreator","readProjects","memberCreatorProfile","achievements","progression","PageNav"])assert.ok(page.includes(part),part);
 assert.match(api,/^export const memberCreatorProfile=/m);
 assert.match(page,/detailed\?\.achievements/);
 assert.doesNotMatch(page,/followerCount|fakeCreator|createFake/);
});
test("project pages keep safe external creator-hosted actions and staging-only member engagement",()=>{
 const page=read("web/src/pages/ProjectPage.tsx");
 for(const part of ["safeReturnPath","safeExternal","target=\"_blank\"","noopener noreferrer","RepositoryPanel","MemberEngagementPanel","AI INVOLVEMENT","HUMAN CONTRIBUTION"])assert.ok(page.includes(part),part);
 assert.doesNotMatch(page,/<iframe|dangerouslySetInnerHTML/);
});
test("Community is a truthful project-and-creator hub without fabricated threads",()=>{
 const page=read("web/src/pages/CommunityPage.tsx");
 assert.match(page,/readProjects/);
 assert.match(page,/readCreators/);
 assert.match(page,/COMMUNITY CONVERSATIONS ARE UNDER PRIVATE REVIEW/);
 assert.match(page,/Only actual approved posts appear publicly/);
 assert.match(page,/<HotCommunityPosts\/>/);
 assert.match(page,/to="\/community\/write"/);
 assert.doesNotMatch(page,/fakeMessage|sampleComments|createThread\(/);
});
test("unlimited levels preserve server authoritative progress and first named artifact series",()=>{
 const levels=read("web/src/pages/LevelsPage.tsx");
 const panel=read("web/src/components/LevelPanel.tsx");
 const engine=read("auth/community.mjs");
 assert.match(levels,/FIRST 60 ARTIFACTS/);
 assert.match(levels,/NO FINAL LEVEL/);
 assert.match(panel,/memberProgress/);
 assert.match(panel,/NO LEVEL CAP/);
 assert.match(engine,/maxLevel:null/);
 assert.doesNotMatch(engine,/Math\.min\(maxLevel/);
});
test("member account shows server-verified achievements and unlimited XP without guessed progress",()=>{
 const page=read("web/src/pages/MemberAccountPage.tsx");
 const shell=read("web/src/components/Shell.tsx");
 assert.match(page,/memberCreatorProfile/);
 assert.match(page,/MY ACHIEVEMENT CABINET/);
 assert.match(page,/a\.earned/);
 assert.match(page,/NO FIXED/i);
 assert.ok(shell.includes('["/levels", "Levels"]'));
 assert.ok(shell.includes('["/library","Saved library"]'));
 assert.ok(shell.includes('["/account","My profile"]'));
 assert.doesNotMatch(shell,/mobile-bottom-nav|const mobileNav/);
});

test("offline review fixtures never enter a production bundle or public data path",()=>{
 const main=read("web/src/main.tsx"),page=read("web/src/pages/HomePage.tsx"),fixture=read("test/portal-offline-preview.mjs");
 assert.match(fixture,/SYNTHETIC OFFLINE REVIEW/);
 assert.match(fixture,/OFFLINE SYNTHETIC DESIGN FIXTURE/);
 assert.ok(existsSync(new URL("../test/portal-offline-preview.mjs",import.meta.url)));
 assert.doesNotMatch(main,/portal-offline-preview/);
 assert.doesNotMatch(page,/portal-offline-preview|nova_demo/);
});
