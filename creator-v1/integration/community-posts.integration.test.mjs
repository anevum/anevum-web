import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import api from "../api/worker.mjs";
import {communityPostRoutes} from "../auth/community-posts.mjs";
import {communityPostModeration} from "../authoring/community-post-moderation.mjs";
import {communityReplyModeration} from "../authoring/community-reply-moderation.mjs";

const now=Math.floor(Date.now()/1000)-120;
const fixed=n=>n.toString(16).padStart(32,"0");
let postId="";
let replyId="";
const sqlite=new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys=ON");
sqlite.exec([
 "CREATE TABLE schema_migrations(version TEXT PRIMARY KEY)",
 "CREATE TABLE member_accounts(id TEXT PRIMARY KEY,status TEXT NOT NULL)",
 "CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY REFERENCES member_accounts(id),handle TEXT UNIQUE NOT NULL,display_name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active')",
 "CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT REFERENCES creator_profiles(member_id),slug TEXT,title TEXT,summary TEXT,category TEXT,status TEXT,published_at TEXT,source_url TEXT,demo_url TEXT,free_to_use INTEGER NOT NULL DEFAULT 1,license_name TEXT)"
].join(";")+";");
for(const [who,handle] of [["one","maker_one"],["two","tester_two"],["three","reader_three"]]){
 sqlite.prepare("INSERT INTO member_accounts(id,status) VALUES(?,'active')").run(who);
 sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,status) VALUES(?,?,?,'active')").run(who,handle,handle);
}
function stmt(sql,args=[]){return {sql,args,bind(...next){return stmt(sql,next)},async all(){return {success:true,results:sqlite.prepare(sql).all(...args).map(x=>({...x}))}},async run(){const r=sqlite.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}}}};}
const db={prepare:sql=>stmt(sql),async batch(qs){
 sqlite.exec("BEGIN IMMEDIATE");
 try{const result=[];for(const q of qs){const r=sqlite.prepare(q.sql).run(...q.args);result.push({success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}});}sqlite.exec("COMMIT");return result;}
 catch(e){sqlite.exec("ROLLBACK");throw e;}
}};
const url=path=>"https://next.anevum.com"+path;
const publicCall=(path,method="GET")=>api.fetch(new Request(url(path),{method}),{COMMUNITY_DB:db});
const members={one:{id:"one",handle:"maker_one"},two:{id:"two",handle:"tester_two"}};
const allowed=async()=>true;
const memberCall=(path,who="one",method="GET",data=undefined,limit=allowed)=>
 communityPostRoutes(new Request(url("/api/v1/member/community/posts"+path),{method,headers:{"content-type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)}),db,members[who]||null,limit,now);
const staffCall=(path,method="GET",data=undefined)=>
 communityPostModeration(new Request("https://studio.next.anevum.com/api/community-posts"+path,{method,headers:{"content-type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)}),db,"staff@anevum.example");
const staffReplyCall=(path,method="GET",data=undefined)=>
 communityReplyModeration(new Request("https://studio.next.anevum.com/api/community-post-replies"+path,{method,headers:{"content-type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)}),db,"staff@anevum.example");
test.after(()=>sqlite.close());

test("public feed remains gated before community migration",async()=>{
 const status=await (await publicCall("/api/v1/status")).json();
 assert.equal(status.features.communityPosts,false);
 assert.equal((await publicCall("/api/v1/community/posts")).status,503);
});
test("private community tables are installed only in the staging fixture",()=>{
 sqlite.exec(readFileSync(new URL("../auth/migrations/0007_community_post_stream.sql",import.meta.url),"utf8"));
 sqlite.exec(readFileSync(new URL("../auth/migrations/0008_community_reply_reviews.sql",import.meta.url),"utf8"));
 const available=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);
 for(const name of ["community_posts","community_post_votes","community_post_replies","community_post_review_events","community_reply_review_events"])assert.ok(available.includes(name));
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM schema_migrations WHERE version='0007_community_post_stream'").get().n,1);
});
test("real signed-in creator submissions are private, validated, and rate limited",async()=>{
 const draft={title:"Review the next creative release",body:"Could we get specific feedback about controls and accessible input?",topic:"games"};
 assert.equal((await communityPostRoutes(new Request(url("/api/v1/member/community/posts"),{method:"POST"}),db,null,allowed,now)).status,401);
 assert.equal((await memberCall("","one","POST",{...draft,title:"Hi"})).status,400);
 assert.equal((await memberCall("","one","POST",{...draft,script:"ignored"})).status,400);
 assert.equal((await memberCall("","one","POST",draft,async()=>false)).status,429);
 const result=await memberCall("","one","POST",draft);
 assert.equal(result.status,201);
 const receipt=await result.json();
 postId=receipt.id;
 assert.match(postId,/^[0-9a-f]{32}$/);
 assert.equal(receipt.status,"pending_review");
 assert.match(receipt.notice,/privat/i);
 const mine=(await (await memberCall("/mine","one")).json()).items;
 assert.equal(mine.length,1);
 assert.equal(mine[0].status,"pending_review");
 assert.deepEqual((await (await memberCall("/mine","two")).json()).items,[]);
 assert.deepEqual((await (await publicCall("/api/v1/community/posts?sort=new")).json()).items,[]);
});
test("staff publication creates an audit and exposes only real approved content",async()=>{
 const queue=(await (await staffCall("?status=pending_review")).json()).items;
 assert.equal(queue.length,1);
 assert.equal(queue[0].id,postId);
 assert.equal(queue[0].authorHandle,"maker_one");
 assert.equal((await staffCall("/"+postId+"/publish","POST",{reason:"short",revision:1})).status,400);
 const approved=await staffCall("/"+postId+"/publish","POST",{reason:"Reviewed original discussion for safe community publication.",revision:1});
 assert.equal(approved.status,200);
 assert.equal((await approved.json()).status,"published");
 assert.equal((await staffCall("/"+postId+"/publish","POST",{reason:"Reviewed original discussion for safe community publication.",revision:1})).status,409);
 const audit=sqlite.prepare("SELECT action,to_status,reason FROM community_post_review_events WHERE post_id=?").all(postId);
 assert.equal(audit.length,1);assert.equal(audit[0].action,"publish");
 const status=(await (await publicCall("/api/v1/status")).json()).features;
 assert.equal(status.communityPosts,true);
 const feed=(await (await publicCall("/api/v1/community/posts?sort=hot&limit=4")).json()).items;
 assert.equal(feed.length,1);
 assert.equal(feed[0].title,"Review the next creative release");
 assert.equal(feed[0].score,0);
 assert.equal(feed[0].replyCount,0);
 assert.equal(feed[0].authorHandle,"maker_one");
 assert.doesNotMatch(JSON.stringify(feed),/author_member_id|staff@anevum\.example/);
});
test("published detail, GET query validation and public read-only contract",async()=>{
 const detail=(await (await publicCall("/api/v1/community/posts/"+postId)).json()).post;
 assert.match(detail.body,/specific feedback/);
 assert.equal((await publicCall("/api/v1/community/posts/"+postId+"?debug=1")).status,400);
 assert.equal((await publicCall("/api/v1/community/posts/"+fixed(999))).status,404);
 for(const q of ["sort=unreviewed","sort=hot&sort=hot","limit=0","limit=999","cursor=unsafe"])
   assert.equal((await publicCall("/api/v1/community/posts?"+q)).status,400,q);
 assert.equal((await publicCall("/api/v1/community/posts?sort=new")).status,200);
 assert.equal((await publicCall("/api/v1/community/posts","POST")).status,405);
 assert.equal((await publicCall("/api/v1/community/posts","HEAD")).status,200);
});
test("real reactions are member-only, self-rating banned, rate-limited and revision checked",async()=>{
 const path="/"+postId+"/react";
 assert.equal((await memberCall(path,"one","POST",{score:1,revision:0})).status,403);
 assert.deepEqual((await (await memberCall(path,"two")).json()).myReaction,null);
 assert.equal((await memberCall(path,"two","POST",{score:1,revision:0},async()=>false)).status,429);
 assert.deepEqual(await (await memberCall(path,"two","POST",{score:1,revision:0})).json(),{score:1,revision:1,changed:true});
 assert.deepEqual((await (await memberCall(path,"two")).json()).myReaction,{score:1,revision:1});
 assert.equal((await memberCall(path,"two","POST",{score:0,revision:0})).status,409);
 assert.equal((await memberCall(path,"two","POST",{score:1,revision:1})).status,200);
 assert.deepEqual(await (await memberCall(path,"two","POST",{score:0,revision:1})).json(),{score:0,revision:2,changed:true});
 assert.equal((await (await publicCall("/api/v1/community/posts?sort=hot")).json()).items[0].score,0);
});
test("real member replies are private, rate-limited and staff approved before public visibility",async()=>{
 const path="/"+postId+"/replies";
 assert.equal((await communityPostRoutes(new Request(url("/api/v1/member/community/posts"+path),{method:"POST"}),db,null,allowed,now)).status,401);
 assert.equal((await memberCall(path,"two","POST",{body:"short"})).status,400);
 assert.equal((await memberCall(path,"two","POST",{body:"Valid content for review",untrusted:1})).status,400);
 assert.equal((await memberCall(path,"two","POST",{body:"I tested the mobile viewport and have detailed feedback."},async()=>false)).status,429);
 const created=await memberCall(path,"two","POST",{body:"I tested the mobile viewport and have detailed feedback."});
 assert.equal(created.status,201);
 const receipt=await created.json();
 assert.equal(receipt.status,"pending_review");
 replyId=receipt.id;assert.match(replyId,/^[a-f0-9]{32}$/);
 const authored=(await (await memberCall(path+"/mine","two")).json()).items;
 assert.equal(authored.length,1);assert.equal(authored[0].status,"pending_review");
 assert.deepEqual((await (await memberCall(path+"/mine","one")).json()).items,[]);
 const before=(await (await publicCall("/api/v1/community/posts/"+postId)).json());
 assert.equal(before.replies.length,0);
 assert.equal(before.post.replyCount,0);
 const review=(await (await staffReplyCall("?status=pending_review")).json()).items;
 assert.equal(review.length,1);assert.equal(review[0].id,replyId);
 assert.equal((await staffReplyCall("/"+replyId+"/publish","POST",{reason:"too short",revision:1})).status,400);
 const passed=await staffReplyCall("/"+replyId+"/publish","POST",{reason:"Reviewed constructive test feedback for community visibility.",revision:1});
 assert.equal(passed.status,200);assert.equal((await passed.json()).revision,2);
 assert.equal((await staffReplyCall("/"+replyId+"/publish","POST",{reason:"Reviewed constructive test feedback for community visibility.",revision:1})).status,409);
 const publicDetail=(await (await publicCall("/api/v1/community/posts/"+postId)).json());
 assert.equal(publicDetail.replies.length,1);
 assert.equal(publicDetail.post.replyCount,1);
 assert.equal(publicDetail.replies[0].authorHandle,"tester_two");
 assert.doesNotMatch(JSON.stringify(publicDetail.replies),/author_member_id|staff@anevum\.example/);
 const events=sqlite.prepare("SELECT action,to_status,reason FROM community_reply_review_events WHERE reply_id=?").all(replyId);
 assert.equal(events.length,1);assert.equal(events[0].action,"publish");
});
test("approved replies are counted; staff-hidden posts disappear immediately",async()=>{
 const detail=await (await publicCall("/api/v1/community/posts/"+postId)).json();
 assert.equal(detail.replies.length,1);
 assert.equal(detail.post.replyCount,1);
 const replyHidden=await staffReplyCall("/"+replyId+"/hide","POST",{reason:"Reviewed a report; reply is no longer appropriate for the community.",revision:2});
 assert.equal(replyHidden.status,200);
 const afterReplyHidden=await (await publicCall("/api/v1/community/posts/"+postId)).json();
 assert.equal(afterReplyHidden.replies.length,0);assert.equal(afterReplyHidden.post.replyCount,0);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM community_reply_review_events WHERE reply_id=?").get(replyId).n,2);
 const hidden=await staffCall("/"+postId+"/hide","POST",{reason:"A valid recorded staff moderation reason to remove it.",revision:2});
 assert.equal(hidden.status,200);
 assert.equal((await publicCall("/api/v1/community/posts/"+postId)).status,404);
 assert.deepEqual((await (await publicCall("/api/v1/community/posts")).json()).items,[]);
 assert.equal((await memberCall("/"+postId+"/react","two","POST",{score:1,revision:2})).status,404);
});
test("staff write routes are behind Cloudflare Access and members have same-origin write checks",()=>{
 const member=readFileSync(new URL("../auth/worker.mjs",import.meta.url),"utf8");
 const studio=readFileSync(new URL("../authoring/worker.mjs",import.meta.url),"utf8");
 assert.match(member,/communityPostRoutes\(req,db,member,limit,clock\(\)\)/);
 assert.match(member,/checkWrite\(req\)/);
 assert.match(studio,/verifyStaffAssertion\(request\.headers\.get\('cf-access-jwt-assertion'\),env\)/);
 assert.match(studio,/communityPostModeration\(request,db,actor\)/);
 assert.match(studio,/communityReplyModeration\(request,db,actor\)/);
});
