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