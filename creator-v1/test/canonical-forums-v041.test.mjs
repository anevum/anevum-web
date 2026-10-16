import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalForums} from '../canonical-auth/forums.mjs';
const base='https://a.anevum.com';
const id=()=>crypto.randomUUID();
const req=(path,method='GET',body)=>new Request(base+path,{method,headers:{origin:base,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
function setup(){
 const f=fixture();f.db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_member_community_forums.sql',import.meta.url),'utf8'));
 const seed=(userId,visibility='public')=>{
  f.db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)').run(userId,userId,userId+'@local.invalid');
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at) VALUES(?,?,?,?,?,1,1)').run(userId,'test_'+userId,'Test '+userId,'',visibility);
  return {id:userId,emailVerified:true};
 };
 return {...f,seed,env:{...f.env,CANONICAL_FORUM_ENABLED:'true',CANONICAL_FORUM_REVIEWER_IDS:'reviewer'}};
}
test('canonical forum fails closed until opt-in and isolated migration',async()=>{
 const f=fixture();try{
  assert.equal((await canonicalForums(req('/api/v1/community/threads'),f.env)).status,404);
  assert.equal((await canonicalForums(req('/api/v1/community/threads'),{...f.env,CANONICAL_FORUM_ENABLED:'true'})).status,503);
 }finally{f.db.close()}
});
test('unapproved thread is invisible, reviewer publishes, public author card honors opt-out',async()=>{
 const f=setup();try{
  const author=f.seed('author');const reviewer=f.seed('reviewer');f.seed('private','private');
  const body={requestId:id(),topic:'making',title:'Designing a useful workshop',body:'What tools would improve our shared creative workspace?'};
  const created=await canonicalForums(req('/api/v1/community/threads','POST',body),f.env,author,1000);
  assert.equal(created.status,201);const post=await created.json();
  assert.equal(post.status,'pending_review');
  const replay=await canonicalForums(req('/api/v1/community/threads','POST',body),f.env,author,1000);
  assert.equal((await replay.json()).id,post.id);
  const pre=await canonicalForums(req('/api/v1/community/threads'),f.env);assert.equal((await pre.json()).items.length,0);
  const outsider=await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:post.id,action:'publish'}),f.env,author);
  assert.equal(outsider.status,403);
  const review=await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:post.id,action:'publish'}),f.env,reviewer,1001);
  assert.equal(review.status,200);
  const result=await (await canonicalForums(req('/api/v1/community/threads'),f.env)).json();
  assert.equal(result.items.length,1);assert.equal(result.items[0].author.handle,'test_author');
  assert.equal(result.items[0].author.level,1);assert.equal(result.items[0].author.email,undefined);
  const input={requestId:id(),body:'I recommend a clear shared roadmap and regular feedback.'};
  const reply=await canonicalForums(req('/api/v1/community/threads/'+post.id+'/replies','POST',input),f.env,author,1003);
  assert.equal(reply.status,201);const replyId=(await reply.json()).id;
  const queue=await (await canonicalForums(req('/api/v1/member/forum-review'),f.env,reviewer)).json();
  assert.equal(queue.replies[0].id,replyId);
  await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'reply',targetId:replyId,action:'publish'}),f.env,reviewer,1004);
  const replies=await (await canonicalForums(req('/api/v1/community/threads/'+post.id+'/replies'),f.env)).json();
  assert.equal(replies.items.length,1);
  f.db.prepare("UPDATE member_creator_profiles SET visibility='private' WHERE user_id='author'").run();
  assert.equal((await (await canonicalForums(req('/api/v1/community/threads'),f.env)).json()).items.length,0);
  assert.equal((await canonicalForums(req('/api/v1/community/threads/'+post.id),f.env)).status,404);
 }finally{f.db.close()}
});
test('reports and reactions require a verified member and public profile',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer'),privateMember=f.seed('private','private');
  const thread={requestId:id(),topic:'games',title:'How should achievements work',body:'What kinds of evidence should count toward earned recognition?'};
  assert.equal((await canonicalForums(req('/api/v1/community/threads','POST',thread),f.env,privateMember)).status,403);
  const created=await (await canonicalForums(req('/api/v1/community/threads','POST',thread),f.env,author,1000)).json();
  assert.equal((await canonicalForums(req('/api/v1/community/threads/'+created.id+'/reaction','POST'),f.env,author)).status,404);
  await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:created.id,action:'publish'}),f.env,reviewer,1001);
  assert.equal((await canonicalForums(req('/api/v1/community/threads/'+created.id+'/reaction','POST'),f.env)).status,401);
  assert.equal((await canonicalForums(req('/api/v1/community/threads/'+created.id+'/reaction','POST'),f.env,author)).status,200);
  assert.equal((await canonicalForums(req('/api/v1/community/reports','POST',{targetKind:'thread',targetId:created.id,reason:'spam'}),f.env,author)).status,201);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM member_forum_reports').get().n,1);
 }finally{f.db.close()}
});
test('forum moderation rejects self-approval and records independent review decisions',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer');
  const input={requestId:id(),topic:'community',title:'Community governance question',body:'What makes a moderation process useful and transparent to contributors?'};
  const own=await (await canonicalForums(req('/api/v1/community/threads','POST',input),f.env,reviewer,1000)).json();
  assert.equal((await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:own.id,action:'publish'}),f.env,reviewer,1001)).status,403);
  const other=await (await canonicalForums(req('/api/v1/community/threads','POST',{...input,requestId:id()}),f.env,author,1000)).json();
  assert.equal((await canonicalForums(req('/api/v1/member/forum-review'),f.env,author)).status,403);
  assert.equal((await canonicalForums(req('/api/v1/member/forum-review'),f.env)).status,401);
  const approved=await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:other.id,action:'publish'}),f.env,reviewer,1002);
  assert.equal(approved.status,200);
  assert.equal((await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:other.id,action:'publish'}),f.env,reviewer,1003)).status,409);
  const audit=f.db.prepare("SELECT reviewer_id,action FROM member_forum_review_log WHERE target_id=?").all(other.id);
  assert.deepEqual(audit.map(x=>[x.reviewer_id,x.action]),[['reviewer','publish']]);
 }finally{f.db.close()}
});
test('reports require publicly visible targets, are deduplicated and can be resolved with audit trail',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer'),other=f.seed('other');
  const input={requestId:id(),topic:'games',title:'Accessibility testing for games',body:'How can we ensure every creator can test keyboard and reduced-motion use?'};
  const post=await (await canonicalForums(req('/api/v1/community/threads','POST',input),f.env,author,1000)).json();
  const report={targetKind:'thread',targetId:post.id,reason:'spam'};
  assert.equal((await canonicalForums(req('/api/v1/community/reports','POST',report),f.env,other,1000)).status,404);
  await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:post.id,action:'publish'}),f.env,reviewer,1001);
  assert.equal((await canonicalForums(req('/api/v1/community/reports','POST',report),f.env,other,1002)).status,201);
  const duplicate=await (await canonicalForums(req('/api/v1/community/reports','POST',report),f.env,other,1003)).json();
  assert.equal(duplicate.previouslyReported,true);
  const queue=await (await canonicalForums(req('/api/v1/member/forum-review'),f.env,reviewer)).json();
  assert.equal(queue.reports.length,1);
  const reportId=queue.reports[0].id;
  assert.equal(queue.reports[0].reporter_id,undefined);
  assert.equal((await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'report',targetId:reportId,action:'dismiss_report'}),f.env,reviewer,1004)).status,200);
  assert.equal((await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'report',targetId:reportId,action:'dismiss_report'}),f.env,reviewer,1005)).status,409);
  assert.equal(f.db.prepare('SELECT resolved_by FROM member_forum_reports WHERE id=?').get(reportId).resolved_by,'reviewer');
  const hide=await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:post.id,action:'hide'}),f.env,reviewer,1006);
  assert.equal(hide.status,200);
  assert.equal((await canonicalForums(req('/api/v1/community/threads/'+post.id),f.env)).status,404);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_forum_review_log WHERE target_id=?").get(post.id).n,2);
 }finally{f.db.close()}
});
test('canonical forum cursor is stable for chronological pages, with no fabricated activity',async()=>{
 const f=setup();try{
  f.seed('author');
  for(let i=0;i<25;i++){
   f.db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,published_at,updated_at) VALUES(?,?,?,?,?,?,'published',?,?,?)")
    .run(id(),'author',id(),'games','Thread '+String(i).padStart(3,'0'),'This is an independently approved public test thread.',1000+i,1000+i,1000+i);
  }
  const first=await (await canonicalForums(req('/api/v1/community/threads?topic=games'),f.env)).json();
  assert.equal(first.items.length,20);assert.ok(first.nextCursor);
  const second=await (await canonicalForums(req('/api/v1/community/threads?topic=games&after='+encodeURIComponent(first.nextCursor)),f.env)).json();
  assert.equal(second.items.length,5);assert.equal(second.nextCursor,null);
  const all=[...first.items,...second.items];
  assert.equal(new Set(all.map(x=>x.id)).size,25);
  for(let i=1;i<all.length;i++)assert.ok(all[i-1].publishedAt>=all[i].publishedAt);
  assert.equal((await canonicalForums(req('/api/v1/community/threads?after=invalid'),f.env)).status,400);
  assert.equal((await canonicalForums(req('/api/v1/community/threads?topic=games&topic=arts'),f.env)).status,400);
 }finally{f.db.close()}
});
test('posted replies respect author visibility and server-side reply totals',async()=>{
 const f=setup();try{
  const author=f.seed('author'),replyer=f.seed('replyer'),reviewer=f.seed('reviewer');
  const input={requestId:id(),topic:'arts',title:'Story feedback and sharing',body:'How should writers safely share unfinished stories with contributors?'};
  const post=await (await canonicalForums(req('/api/v1/community/threads','POST',input),f.env,author,1000)).json();
  await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'thread',targetId:post.id,action:'publish'}),f.env,reviewer,1001);
  const reply=await (await canonicalForums(req('/api/v1/community/threads/'+post.id+'/replies','POST',{requestId:id(),body:'Respect the author permissions and give specific feedback.'}),f.env,replyer,1002)).json();
  await canonicalForums(req('/api/v1/member/forum-review','POST',{targetKind:'reply',targetId:reply.id,action:'publish'}),f.env,reviewer,1003);
  const before=await (await canonicalForums(req('/api/v1/community/threads/'+post.id),f.env)).json();
  assert.equal(before.thread.replyCount,1);
  f.db.prepare("UPDATE member_creator_profiles SET visibility='private' WHERE user_id='replyer'").run();
  const after=await (await canonicalForums(req('/api/v1/community/threads/'+post.id),f.env)).json();
  assert.equal(after.thread.replyCount,0);
  assert.equal((await (await canonicalForums(req('/api/v1/community/threads/'+post.id+'/replies'),f.env)).json()).items.length,0);
 }finally{f.db.close()}
});
test('thread and reply submission limits are enforced by database and requests remain idempotent',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer');
  const payload={topic:'community',title:'A practical feedback topic',body:'How do we keep our community useful and accessible to everyone?'};
  for(let n=0;n<4;n++){
   const response=await canonicalForums(req('/api/v1/community/threads','POST',{...payload,requestId:id()}),f.env,author,1000);
   assert.equal(response.status,201);
  }
  const blocked=await canonicalForums(req('/api/v1/community/threads','POST',{...payload,requestId:id()}),f.env,author,1000);
  assert.equal(blocked.status,429);
  const own=await (await canonicalForums(req('/api/v1/member/forum-submissions'),f.env,author)).json();
  assert.equal(own.items.length,4);
  assert.equal((await canonicalForums(req('/api/v1/member/forum-submissions'),f.env)).status,401);
  assert.equal((await canonicalForums(req('/api/v1/community/threads','POST',{...payload,title:'x',requestId:id()}),f.env,author,2000)).status,400);
 }finally{f.db.close()}
});
