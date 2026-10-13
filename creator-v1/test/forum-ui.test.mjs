import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const app=read("web/src/App.tsx"),community=read("web/src/pages/CommunityPage.tsx");
const page=read("web/src/pages/ForumPages.tsx"),card=read("web/src/components/ForumProfileCard.tsx");
const css=read("web/src/forum.css"),client=read("web/src/lib/forum-api.ts");
const member=read("auth/worker.mjs"),staff=read("authoring/worker.mjs");
const server=read("auth/forum.mjs"),review=read("authoring/forum-moderation.mjs");
const fixture=read("test/portal-offline-preview.mjs"),shell=read("web/src/main.tsx");

test("public discussion and profile routes exist without the account gate hiding guests",()=>{
 for(const route of [
  '<Route path="community/room/:roomId" element={<ForumRoomPage/>}/>',
  '<Route path="community/thread/:threadId" element={<ForumThreadPage/>}/>',
  '<Route path="community/member/:handle" element={<ForumMemberPage/>}/>'
 ]) assert.ok(app.includes(route),route);
 assert.ok(app.indexOf('path="community/thread/:threadId"')<app.indexOf("<Route element={<MemberGate/>}>"));
 assert.match(community,/const board=useResource\(readForumRooms,\[\]\)/);
 assert.match(community,/board\.data\.rooms\.map/);
 assert.match(community,/portal-community-notice/);
 assert.match(page,/submit.*review/is);
 assert.match(page,/POSTING|post/i);
 assert.match(page,/staff approval/i);
});
test("every approved message renders an actual author card with earned-only badges and no simulated uploads",()=>{
 assert.ok(card.includes('className={"forum-author-card'));
 assert.match(card,/className="forum-author-avatar"/);
 assert.match(card,/author\.badges\.slice\(0,5\)/);
 assert.match(card,/author\.level/);
 assert.match(card,/forumMemberPath\(author\.handle\)/);
 assert.match(card,/NO EARNED BADGES YET/);
 assert.match(card,/<p className="forum-post-message">{post.body}<\/p>/);
 assert.doesNotMatch(card,/src=|<img|contentEditable|dangerouslySetInnerHTML/);
 assert.doesNotMatch(server,/paywall|purchased|staffPrivilegeByLevel|fakeAchievements/);
 assert.match(server,/deriveAchievements\(stats\)\.filter\(x=>x\.earned\)/);
 assert.match(server,/community_xp_events/);
});
test("staging forum writes inherit existing signed-in and origin checks, moderator inherits signed Access",()=>{
 assert.match(member,/if\(path==='\/forum'\|\|path\.startsWith\('\/forum\/'\)\)/);
 assert.match(member,/req\.method==='POST'&&!checkWrite\(req\)/);
 assert.match(member,/return forumRoutes\(req,db,member,limit,clock\(\)\)/);
 assert.match(staff,/return forumModeration\(request,db,actor\)/);
 assert.match(staff,/verifyStaffAssertion\(request\.headers\.get\('cf-access-jwt-assertion'\),env\)/);
 assert.match(staff,/if\(request\.headers\.get\('origin'\)!==ORIGIN\)/);
 assert.match(review,/forum_moderation_events/);
 assert.match(review,/forum_report_events/);
 assert.match(server,/status:'pending'/);
 assert.ok(server.includes("status='visible'"));
});
test("new styles are mobile-first and preserve reduced-motion, keyboard focus and legibility",()=>{
 assert.match(shell,/import "\.\/forum\.css";/);
 assert.ok(shell.lastIndexOf("forum.css")>shell.lastIndexOf("cosmic-observatory.css"));
 for(const part of [".forum-post",".forum-author-card",".forum-author-rank",".forum-author-achievements",".forum-post-message",".forum-report",".forum-composer",".forum-community-room"])assert.ok(css.includes(part),part);
 for(const part of ["max-width:640px","max-width:360px","prefers-reduced-motion:reduce","overflow-wrap:anywhere","white-space:pre-wrap"])assert.ok(css.includes(part),part);
 assert.match(client,/credentials:options\.method\?"same-origin":"omit"/);
 assert.match(client,/redirect:"error"/);
 assert.match(client,/\/\^\[a-z\]/);
});
test("offline screenshots mark all mock forum text as synthetic and no production records are seeded",()=>{
 assert.match(fixture,/SYNTHETIC OFFLINE REVIEW/);
 assert.match(fixture,/FICTIONAL_FORUM_AUTHOR/);
 assert.match(fixture,/OFFLINE SYNTHETIC DESIGN FIXTURE/);
 assert.ok(fixture.includes('req.method==="GET"&&url.pathname==="/api/v1/member/forum/rooms"'));
 assert.ok(!fixture.includes('req.method==="POST"&&url.pathname==="/api/v1/member/forum'));
});
