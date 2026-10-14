import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {createMemberWorker} from "../auth/worker.mjs";
import {forumModeration} from "../authoring/forum-moderation.mjs";
import {deriveAchievements} from "../auth/social.mjs";

const now=1791800000,pep="e".repeat(64);
const fixed=i=>i.toString(16).padStart(32,"0");
const members=[
 {id:"alice_member",email:"alice@fixture.test",handle:"alice_makes",token:"a".repeat(64)},
 {id:"bob_member",email:"bob@fixture.test",handle:"bob_plays",token:"b".repeat(64)},
 {id:"chris_member",email:"chris@fixture.test",handle:"chris_helps",token:"c".repeat(64)}
];
async function hashed(t){
 const k=await crypto.subtle.importKey("raw",Uint8Array.from(pep.match(/../g).map(v=>parseInt(v,16))),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return Buffer.from(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode("session\0"+t))).toString("hex");
}
async function fixture(){
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE schema_migrations(version TEXT PRIMARY KEY);
 CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,handle TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT NOT NULL,slug TEXT NOT NULL,title TEXT NOT NULL,summary TEXT NOT NULL,category TEXT NOT NULL,status TEXT NOT NULL,published_at TEXT);
 CREATE TABLE project_releases(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,version TEXT NOT NULL,released_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE project_favorites(member_id TEXT,project_id TEXT,created_at TEXT,PRIMARY KEY(member_id,project_id));`);
 for(const n of ["0003_member_identity_staging.sql","0005_voting_progression.sql","0006_account_privacy.sql","0012_forum_discussions.sql"])
  sqlite.exec(readFileSync(new URL("../auth/migrations/"+n,import.meta.url),"utf8"));
 function sql(s,args=[]){
  return {raw:s,args,bind(...v){return sql(s,v)},
   async all(){return {success:true,results:sqlite.prepare(s).all(...args)}},
   async run(){const r=sqlite.prepare(s).run(...args);return{success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}}}
  };
 }
 const db={prepare:s=>sql(s),async batch(statements){
  sqlite.exec("BEGIN IMMEDIATE");
  try{
   const out=[];
   for(const st of statements){const r=sqlite.prepare(st.raw).run(...st.args);out.push({success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}});}
   sqlite.exec("COMMIT");return out;
  }catch(e){sqlite.exec("ROLLBACK");throw e}
 }};
 for(const p of members){
  sqlite.prepare("INSERT INTO member_accounts(id,email,status,verified_at,created_at) VALUES (?,?,'active',?,?)").run(p.id,p.email,now,now);
  sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,status) VALUES (?,?,?,'Member fixture','active')").run(p.id,p.handle,p.handle.toUpperCase());
  sqlite.prepare("INSERT INTO member_sessions(token_hash,member_id,expires_at,created_at) VALUES (?,?,?,?)").run(await hashed(p.token),p.id,now+3600,now-90);
 }
 sqlite.prepare("INSERT INTO projects(id,owner_member_id,slug,title,summary,category,status,published_at) VALUES (?,?,?,?,?,'games','published','2020-01-01 00:00:00')").run(fixed(1),members[0].id,"first-game","First Game","Published for genuine evidence test");
 sqlite.prepare("INSERT INTO community_project_votes(member_id,project_id,score,revision,status,created_at,updated_at) VALUES (?,?,5,1,'active',?,?)").run(members[1].id,fixed(1),now,now);
 sqlite.prepare("INSERT INTO community_xp_events(id,member_id,kind,target_id,amount,award_day,created_at) VALUES (?,?,'vote_first',?,2,'2026-10-13',?)").run(fixed(2),members[1].id,fixed(1),now);
 const app=createMemberWorker({clock:()=>now,fetcher:async()=>{throw Error("Fixture never fetches third parties")}});
 const env={COMMUNITY_DB:db,AUTH_PEPPER:pep,MEMBER_FORUM_ENABLED:'true'};
 const request=(path,method="GET",body=undefined,member=members[0],settings={})=>{
  const origin=settings.origin??"https://next.anevum.com";
  return app.fetch(new Request("https://next.anevum.com/api/v1/member"+path,{
   method,headers:{
    ...(origin?{origin}:{}),
    "sec-fetch-site":settings.site??(origin==="https://next.anevum.com"?"same-origin":"cross-site"),
    "content-type":settings.contentType??"application/json",
    ...(member?{cookie:"__Host-anevum_stage_sid="+member.token}:{})
   },body:body===undefined?settings.raw:settings.raw??JSON.stringify(body)
  }),env);
 };
 const mod=(path,method="GET",payload=null)=>{
  const req=new Request("https://studio.next.anevum.com/api/forum"+path,{method,
   headers:{"content-type":"application/json"},body:payload===null?undefined:JSON.stringify(payload)});
  return forumModeration(req,db,"reviewer@anevum.test");
 };
 return{sqlite,db,request,mod};
}
async function using(fn){const f=await fixture();try{await fn(f)}finally{f.sqlite.close()}}
async function makeApproved(f,body="A discussion about useful playtesting feedback",user=members[0]){
 const response=await f.request("/forum/threads","POST",{room:"arcade",title:"Useful playtesting for independent games",body},user);
 assert.equal(response.status,202,await response.clone().text());
 const {id}=await response.json();
 const before=await f.request("/forum/threads/"+id,"GET",undefined,null);
 assert.equal(before.status,404);
 const q=await(await f.mod("/queue")).json();
 const p=q.items.find(p=>p.threadId===id&&p.starter===1);
 assert.ok(p,"Pending starter visible only to Access-gated staff");
 const approve=await f.mod("/posts/"+p.id+"/approve","POST",{reason:"Reviewed as safe and constructive"});
 assert.equal(approve.status,200,await approve.clone().text());
 assert.equal((await approve.json()).status,"visible");
 return{id,starterId:p.id};
}

test("migration defines isolated foreign keys, audit queue and report retention",async()=>using(async f=>{
 const names=["forum_threads","forum_posts","forum_reports","forum_moderation_events","forum_report_events"];
 for(const name of names)assert.ok(f.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name));
 assert.equal(f.sqlite.prepare("SELECT version FROM schema_migrations WHERE version='0012_forum_discussions'").get().version,"0012_forum_discussions");
 assert.throws(()=>f.sqlite.prepare("INSERT INTO forum_posts(id,thread_id,author_member_id,body,created_at) VALUES (?,?,?,?,?)").run(fixed(99),fixed(98),"alice_member","Bad parent",now));
 assert.equal(deriveAchievements({publishedProjects:1,ratings:0,releases:0}).filter(x=>x.earned).length,1);
}));

test("public forum is truly empty before approved messages; guests cannot write",async()=>using(async f=>{
 const rooms=await f.request("/forum/rooms","GET",undefined,null);
 assert.equal(rooms.status,200);
 const result=await rooms.json();
 assert.deepEqual(result.rooms.map(x=>x.threads),[0,0,0,0]);
 assert.equal(result.rooms[0].name,"The Arcade");
 assert.equal((await f.request("/forum/threads","POST",{room:"arcade",title:"A real subject",body:"An actual helpful question."},null)).status,401);
 assert.equal((await f.request("/forum/rooms/arcade","GET",undefined,null)).status,200);
 assert.equal((await f.request("/forum/rooms/arcade","GET",undefined,null)).headers.get("x-robots-tag"),"noindex, nofollow");
 assert.equal((await f.request("/forum/rooms/arcade?cursor=garbage","GET",undefined,null)).status,400);
 assert.equal((await f.request("/forum/rooms?random=1","GET",undefined,null)).status,400);
}));

test("pending thread and reply remain private until reviewed by the signed staff boundary",async()=>using(async f=>{
 const submit=await f.request("/forum/threads","POST",{room:"arcade",title:"A first conversation",body:"This stays pending."});
 assert.equal(submit.status,202);
 const {id}=await submit.json();
 assert.equal((await f.request("/forum/rooms/arcade","GET",undefined,null)).status,200);
 assert.equal((await(await f.request("/forum/rooms/arcade","GET",undefined,null)).json()).items.length,0);
 assert.equal((await f.request("/forum/threads/"+id,"GET",undefined,null)).status,404);
 const q=await (await f.mod("/queue")).json();
 assert.equal(q.items.length,1);
 assert.equal(q.items[0].status,"pending");
 assert.equal(q.items[0].body,"This stays pending.");
 assert.ok(!JSON.stringify(q).includes("alice@fixture.test"));
 const decision=await f.mod("/posts/"+q.items[0].id+"/approve","POST",{reason:"Constructive and suitable for the board"});
 assert.equal(decision.status,200,await decision.clone().text());
 const visible=await (await f.request("/forum/rooms/arcade","GET",undefined,null)).json();
 assert.equal(visible.items.length,1);
 assert.equal(visible.items[0].id,id);
 assert.equal(visible.items[0].postCount,1);
 const thread=await (await f.request("/forum/threads/"+id,"GET",undefined,null)).json();
 assert.equal(thread.posts.length,1);
 assert.equal(thread.posts[0].author.handle,"alice_makes");
 assert.deepEqual(thread.posts[0].author.badges.map(x=>x.key),["first-launch"]);
 assert.equal(thread.posts[0].author.level,1);
 for(const forbidden of ["alice@fixture.test","alice_member","token_hash","is_staff"])
  assert.ok(!JSON.stringify(thread).includes(forbidden),forbidden);
 const reply=await f.request("/forum/threads/"+id+"/replies","POST",{body:"Useful feedback on this first topic"},members[1]);
 assert.equal(reply.status,202,await reply.clone().text());
 assert.equal((await(await f.request("/forum/threads/"+id,"GET",undefined,null)).json()).posts.length,1);
 const pending=(await(await f.mod("/queue")).json()).items.find(x=>x.starter===0);
 assert.ok(pending);
 assert.equal((await f.mod("/posts/"+pending.id+"/approve","POST",{reason:"Constructive answer with useful feedback"})).status,200);
 const updated=await(await f.request("/forum/threads/"+id,"GET",undefined,null)).json();
 assert.equal(updated.posts.length,2);
 assert.equal(updated.posts[1].author.handle,"bob_plays");
 assert.deepEqual(updated.posts[1].author.badges.map(x=>x.key),["first-signal"]);
 assert.equal(updated.posts[1].author.level,1);
 assert.equal((await(await f.request("/forum/rooms/arcade","GET",undefined,null)).json()).items[0].postCount,2);
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM community_xp_events").get().n,1,"Posting cannot grant additional XP");
}));

test("moderator hides/restores one reply, then entire thread, and audits each change",async()=>using(async f=>{
 const {id,starterId}=await makeApproved(f);
 await f.request("/forum/threads/"+id+"/replies","POST",{body:"I want to test the reply approval."},members[1]);
 const q=(await(await f.mod("/queue")).json()).items;
 const reply=q.find(x=>x.starter===0);
 assert.equal((await f.mod("/posts/"+reply.id+"/approve","POST",{reason:"The reply is constructive and harmless"})).status,200);
 assert.equal((await f.mod("/posts/"+reply.id+"/hide","POST",{reason:"Staff later reviewed context more carefully"})).status,200);
 assert.ok((await(await f.mod("/hidden")).json()).items.some(post=>post.id===reply.id),"Hidden forum messages remain visible to reviewed staff only");
 assert.equal((await(await f.request("/forum/threads/"+id,"GET",undefined,null)).json()).posts.length,1);
 assert.equal((await f.mod("/posts/"+reply.id+"/restore","POST",{reason:"A second review approved the original response"})).status,200);
 assert.ok(!(await(await f.mod("/hidden")).json()).items.some(post=>post.id===reply.id),"Restored content exits the hidden queue");
 assert.equal((await(await f.request("/forum/threads/"+id,"GET",undefined,null)).json()).posts.length,2);
 assert.equal((await f.mod("/posts/"+starterId+"/hide","POST",{reason:"Staff must temporarily hide the whole discussion"})).status,200);
 assert.equal((await f.request("/forum/threads/"+id,"GET",undefined,null)).status,404);
 assert.equal((await(await f.request("/forum/rooms/arcade","GET",undefined,null)).json()).items.length,0);
 assert.equal((await f.mod("/posts/"+starterId+"/restore","POST",{reason:"Reassessed the original discussion as appropriate"})).status,200);
 assert.equal((await(await f.request("/forum/rooms/arcade","GET",undefined,null)).json()).items.length,1);
 assert.equal(f.sqlite.prepare("SELECT count(*) n FROM forum_moderation_events").get().n,6);
 assert.equal((await f.mod("/posts/"+starterId+"/approve","POST",{reason:"Double click on previous review action"})).status,409);
}));

test("reporting is member-only, own posts denied, duplicate idempotent, and requires a staff disposition",async()=>using(async f=>{
 const {id,starterId}=await makeApproved(f);
 const report={reason:"harassment",details:"Please look at this; moderation decides."};
 assert.equal((await f.request("/forum/posts/"+starterId+"/report","POST",report,null)).status,401);
 assert.equal((await f.request("/forum/posts/"+starterId+"/report","POST",report)).status,403);
 assert.equal((await f.request("/forum/posts/"+starterId+"/report","POST",report,members[1])).status,202);
 assert.equal((await f.request("/forum/posts/"+starterId+"/report","POST",report,members[1])).status,202);
 assert.equal(f.sqlite.prepare("SELECT count(*) n FROM forum_reports").get().n,1);
 const queue=(await(await f.mod("/reports")).json()).items;
 assert.equal(queue.length,1);
 assert.equal(queue[0].postId,starterId);
 const mod=await f.mod("/reports/"+queue[0].id+"/resolve","POST",{reason:"Investigated and documented the member report"});
 assert.equal(mod.status,200);
 assert.equal((await(await f.mod("/reports")).json()).items.length,0);
 assert.equal(f.sqlite.prepare("SELECT count(*) n FROM forum_report_events").get().n,1);
 assert.equal((await f.mod("/reports/"+queue[0].id+"/dismiss","POST",{reason:"Duplicate review attempt must be blocked"})).status,409);
 const t=(await(await f.request("/forum/threads/"+id,"GET",undefined,null)).json());
 assert.ok(!JSON.stringify(t).includes("harassment"));
 assert.ok(!JSON.stringify(t).includes("Please look at this"));
}));

test("forged account ids, malformed JSON, origin violations and future discussion access fail closed",async()=>using(async f=>{
 for(const data of [
  {room:"arcade",title:"Hello everybody",body:"Hello world",memberId:"bob_member"},
  {room:"invalid",title:"A good question",body:"Hello community"},
  {room:"arcade",title:"Bad",body:"Hello world"},
  {room:"arcade",title:"A valid title",body:""},
  {room:"arcade",title:"A valid title",body:"x".repeat(2500)},
  {room:"arcade",title:"A valid title",body:["not","plain","text"]},
  {room:"arcade",title:"A valid title",body:"Normal text",xp:2000}
 ]){
  assert.equal((await f.request("/forum/threads","POST",data)).status,400,JSON.stringify(data).slice(0,80));
 }
 assert.equal((await f.request("/forum/threads","POST",{room:"arcade",title:"Reasonable title",body:"Substantive question"},members[0],{origin:"https://other.example"})).status,403);
 assert.equal((await f.request("/forum/threads","POST",{room:"arcade",title:"Reasonable title",body:"Substantive question"},members[0],{site:"cross-site"})).status,403);
 assert.equal((await f.request("/forum/threads","POST",undefined,members[0],{raw:"{bad"})).status,400);
 assert.equal((await f.request("/forum/threads","POST",{room:"arcade",title:"Reasonable title",body:"Substantive question"},members[0],{contentType:"text/plain"})).status,400);
 assert.equal((await f.request("/forum/posts/"+fixed(11)+"/report","POST",{reason:"no",details:"Bad"},members[1])).status,400);
 assert.equal((await f.request("/forum/posts/"+fixed(11)+"/report","POST",{reason:"spam",details:"Valid"},members[1])).status,404);
 assert.equal((await f.request("/forum/threads/"+fixed(91)+"/replies","POST",{body:"Cannot reply."},members[1])).status,404);
 assert.equal((await f.request("/forum/threads/"+fixed(91)+"?cursor=not-valid","GET",undefined,null)).status,400);
 f.sqlite.prepare("UPDATE member_accounts SET status='suspended' WHERE id='alice_member'").run();
 assert.equal((await f.request("/forum/threads","POST",{room:"arcade",title:"Nope after suspension",body:"I cannot post"})).status,401);
 assert.equal(f.sqlite.prepare("SELECT count(*) n FROM forum_posts").get().n,0);
}));

test("account export includes only self-authored posts and own reports, never another member's",async()=>using(async f=>{
 const {id}=await makeApproved(f);
 await f.request("/forum/threads/"+id+"/replies","POST",{body:"A reply from Bob in private review."},members[1]);
 const alice=await f.request("/privacy/export?section=forumPosts","GET");
 assert.equal(alice.status,200,await alice.clone().text());
 const own=await alice.json();
 assert.equal(own.items.length,1);
 assert.ok(own.items[0].body.includes("playtesting"));
 assert.ok(!JSON.stringify(own).includes("A reply from Bob"));
 const bob=(await(await f.request("/privacy/export?section=forumPosts","GET",undefined,members[1])).json());
 assert.equal(bob.items.length,1);
 assert.ok(bob.items[0].body.includes("Bob"));
 const thread=(await(await f.request("/privacy/export?section=forumThreads")).json());
 assert.equal(thread.items[0].id,id);
 const report=(await(await f.request("/privacy/export?section=forumReports")).json());
 assert.deepEqual(report.items,[]);
 assert.equal((await f.request("/privacy/export?section=forumPosts","GET",undefined,null)).status,401);
 assert.throws(()=>f.sqlite.prepare("DELETE FROM member_accounts WHERE id='alice_member'").run(),"Deletion is staff-reviewed; authored content cannot vanish silently");
}));

test("client rendering remains text-only and never claims moderation/XP authority from posts",()=>{
 const source=readFileSync(new URL("../web/src/pages/ForumPages.tsx",import.meta.url),"utf8");
 const cards=readFileSync(new URL("../web/src/components/ForumProfileCard.tsx",import.meta.url),"utf8");
 assert.match(source,/<ForumPostCard key={post.id} post={post}>/);
 assert.match(cards,/<p className="forum-post-message">{post.body}<\/p>/);
 assert.match(cards,/author.badges\.length/);
 assert.match(cards,/forum-author-rank/);
 assert.match(source,/status!=="pending"/);
 assert.match(source,/reportForumPost/);
 for(const bad of ["dangerouslySetInnerHTML","document.innerHTML","innerHTML=","localStorage","fakePostCount","buyBadge","awardXp"]){
  assert.ok(!source.includes(bad)&&!cards.includes(bad),bad);
 }
});

test("public member activity lists only approved messages and respects active-account privacy",async()=>using(async f=>{
 const {id}=await makeApproved(f);
 const route="/forum/members/alice_makes/activity";
 let response=await f.request(route,"GET",undefined,null);
 assert.equal(response.status,200);
 let result=await response.json();
 assert.equal(result.items.length,1);
 assert.equal(result.items[0].threadId,id);
 assert.match(result.items[0].excerpt,/useful playtesting/i);
 for(const secret of ["alice_member","alice@fixture.test","token_hash","reporter_member_id"])
   assert.ok(!JSON.stringify(result).includes(secret),secret);
 const pending=await f.request("/forum/threads/"+id+"/replies","POST",{body:"This is private until staff approves it."},members[0]);
 assert.equal(pending.status,202);
 result=await(await f.request(route,"GET",undefined,null)).json();
 assert.equal(result.items.length,1,"Unreviewed replies must never appear");
 assert.equal((await f.request("/forum/members/does_not_exist/activity","GET",undefined,null)).status,404);
 f.sqlite.prepare("UPDATE member_accounts SET status='suspended' WHERE id=?").run(members[0].id);
 assert.equal((await f.request(route,"GET",undefined,null)).status,404);
}));
