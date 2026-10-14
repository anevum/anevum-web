import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("all new community features are OFF without independently enabled env flags",()=>{
 const worker=read("auth/worker.mjs");
 const staff=read("authoring/worker.mjs");
 const social=read("auth/social.mjs");
 const worlds=read("auth/worlds.mjs");
 assert.match(worker,/MEMBER_FORUM_ENABLED!=='true'/);
 assert.match(worker,/MEMBER_FOLLOWS_ENABLED!=='true'/);
 assert.match(worker,/MEMBER_WORLDS_ENABLED!=='true'/);
 assert.match(worker,/req\.method==='POST'&&!checkWrite\(req\)/);
 assert.match(staff,/FORUM_MODERATION_ENABLED==='true'/);
 assert.match(staff,/verifyStaffAssertion\(request\.headers\.get\('cf-access-jwt-assertion'\),env\)/);
 assert.match(staff,/if\(request\.headers\.get\('origin'\)!==ORIGIN\)/);
 assert.match(social,/followsEnabled=false,worldsEnabled=false/);
 assert.match(worlds,/visibility:"private"/);
});
test("forum identity comes from the verified XP and approved achievement ledger only",()=>{
 const server=read("auth/forum.mjs"),card=read("web/src/components/ForumProfileCard.tsx");
 assert.match(server,/progressionFromXp\(number\(person\.xp\)\)/);
 assert.match(server,/deriveAchievements\(stats\)\.filter\(x=>x\.earned\)/);
 assert.match(card,/author\.badges\.slice\(0,5\)/);
 assert.match(card,/author\.level/);
 assert.match(card,/forumMemberPath\(author\.handle\)/);
 assert.match(card,/NO EARNED BADGES YET/);
 for(const s of [server,card]){
   assert.doesNotMatch(s,/purchaseXP|rewardForPost|grantXpOnMessage|dangerouslySetInnerHTML/);
 }
});
test("legacy routes and all new moderation/creator routes have honest safe empty states",()=>{
 const app=read("web/src/App.tsx"),community=read("web/src/pages/CommunityPage.tsx");
 const forum=read("web/src/pages/ForumPages.tsx");
 const follow=read("web/src/pages/MemberFollowingPage.tsx");
 for(const route of ["community/room/:roomId","community/thread/:threadId","community/member/:handle","account/following","account/world",":vanity"]){
  assert.ok(app.includes('path="'+route+'"'),route);
 }
 assert.match(community,/board\.state==="error"/);
 assert.match(community,/No invented posts, likes, member accounts or activity totals/);
 assert.match(forum,/await startForumThread/);
 assert.match(forum,/staff approval/i);
 assert.match(follow,/NO FOLLOWED CREATORS YET/);
 assert.match(follow,/memberSetFollowing\(handle,false\)/);
 assert.doesNotMatch(community,/exampleMembers|fakeFeed|sampleFollowers|infiniteDemoFeed/);
});
test("follows, forums and worlds use distinct migration names with no schema redefinition",()=>{
 const migrations=[
  ["auth/migrations/0010_member_worlds.sql","0010_member_worlds","member_world_appearances"],
  ["auth/migrations/0011_creator_follows.sql","0011_creator_follows","member_creator_follows"],
  ["auth/migrations/0012_forum_discussions.sql","0012_forum_discussions","forum_threads"]
 ];
 for(const [file,version,table] of migrations){
  const sql=read(file);assert.ok(sql.includes(version),version);
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS "+table),table);
 }
 const forums=read("auth/migrations/0012_forum_discussions.sql");
 assert.match(forums,/forum_moderation_events/);
 assert.match(forums,/forum_report_events/);
 const privacy=read("auth/privacy.mjs");
 for(const section of ["following","forumThreads","forumPosts","forumReports","world"])assert.ok(privacy.includes(section));
 assert.match(privacy,/options\.forumEnabled/);
 assert.match(privacy,/options\.followsEnabled/);
});
test("forum and follows support accessibility on small screens",()=>{
 const styles=read("web/src/forum.css"),following=read("web/src/creator-follows.css");
 const main=read("web/src/main.tsx");
 assert.match(main,/import "\.\/forum\.css";/);
 assert.match(main,/import "\.\/creator-follows\.css";/);
 for(const part of [".forum-post",".forum-author-card",".forum-post-message",".forum-community-room"])assert.ok(styles.includes(part),part);
 assert.match(styles,/prefers-reduced-motion/);
 assert.match(styles,/max-width:360px/);
 assert.match(following,/prefers-reduced-motion/);
});
