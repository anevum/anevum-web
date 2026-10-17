import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalForums} from '../canonical-auth/forums.mjs';

const origin='https://a.anevum.com',randomId=()=>crypto.randomUUID();
const request=(path,method='GET',body)=>new Request(origin+path,{
 method,headers:{origin,...(body?{'content-type':'application/json'}:{})},
 body:body?JSON.stringify(body):undefined
});
function setup(){
 const f=fixture();
 f.db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_member_community_forums.sql',import.meta.url),'utf8'));
 const add=(id,{verified=true,profile=true}={})=>{
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,1,1)')
   .run(id,'Fixture '+id,id+'@synthetic.invalid',verified?1:0);
  if(profile)f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at) VALUES(?,?,?,?,?,1,1)')
   .run(id,'fixture_'+id,'Fixture '+id,'','public');
  return {id,emailVerified:verified};
 };
 return {...f,add,env:{...f.env,CANONICAL_FORUM_ENABLED:'true',
  CANONICAL_FORUM_REVIEWER_IDS:'owner',
  CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS:'second'}};
}
async function submit(f,author,at=1000){
 const response=await canonicalForums(request('/api/v1/community/threads','POST',{
  requestId:randomId(),topic:'community',title:'A community contribution requiring independent review',
  body:'This synthetic contribution should be approved only by a different trusted reviewer.'
 }),f.env,author,at);
 assert.equal(response.status,201);return (await response.json()).id;
}
const approve=(f,user,id,at=1200)=>
 canonicalForums(request('/api/v1/member/forum-review','POST',{
  targetKind:'thread',targetId:id,action:'publish'
 }),f.env,user,at);

test('V044 additive reviewer secret preserves primary access, verified secondary access and third-party denials',async()=>{
 const f=setup();try{
  const owner=f.add('owner'),second=f.add('second',{profile:false}),other=f.add('other');
  const ownThread=await submit(f,owner);
  const noSession=await canonicalForums(request('/api/v1/member/forum-review'),f.env,null,1001);
  assert.equal(noSession.status,401);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,other,1001)).status,403);
  const ownerQueue=await canonicalForums(request('/api/v1/member/forum-review'),f.env,owner,1001);
  const secondQueue=await canonicalForums(request('/api/v1/member/forum-review'),f.env,second,1001);
  assert.equal(ownerQueue.status,200);
  assert.equal(secondQueue.status,200);
  const ownerSnapshot=await ownerQueue.json(),secondSnapshot=await secondQueue.json();
  assert.equal(ownerSnapshot.totals.threads,1);
  assert.equal(ownerSnapshot.threads[0].selfAuthored,true);
  assert.equal(ownerSnapshot.threads[0].canPublish,false);
  assert.equal(secondSnapshot.threads[0].selfAuthored,false);
  assert.equal(secondSnapshot.threads[0].canPublish,true);
  assert.equal((await approve(f,owner,ownThread,1002)).status,403);
  assert.equal((await approve(f,second,ownThread,1003)).status,200);
  const audit=f.db.prepare('SELECT reviewer_id,action,target_kind FROM member_forum_review_log WHERE target_id=?')
   .get(ownThread);
  assert.deepEqual({...audit},{reviewer_id:'second',action:'publish',target_kind:'thread'});
  const recent=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,owner,1004)).json();
  assert.equal(recent.recent[0].reviewerHandle,null);
  const serial=JSON.stringify(recent);
  for(const forbidden of ['second@synthetic.invalid','reviewer_id','reporter_id','author_id'])
   assert.equal(serial.includes(forbidden),false,forbidden);
 }finally{f.db.close()}
});

test('V044 secondary reviewer must still verify email and cannot approve own content',async()=>{
 const f=setup();try{
  const owner=f.add('owner'),second=f.add('second'),unverified=f.add('unverified',{verified:false});
  const own=await submit(f,second,1000);
  assert.equal((await approve(f,second,own,1002)).status,403);
  assert.equal((await approve(f,owner,own,1003)).status,200);
  f.env.CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS='second,unverified';
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,unverified,1010)).status,401);
  assert.equal((await approve(f,unverified,own,1011)).status,401);
  const page=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,owner,1012)).json();
  assert.equal(page.totals.threads,0);
 }finally{f.db.close()}
});

test('V044 additional reviewer binding fails closed when omitted or empty; old reviewer remains',async()=>{
 const f=setup();try{
  const owner=f.add('owner'),second=f.add('second'),other=f.add('other');
  for(const value of [undefined,'','  ',', , ']){
   f.env.CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS=value;
   assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,owner)).status,200);
   assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,second)).status,403);
   assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,other)).status,403);
  }
  f.env.CANONICAL_FORUM_REVIEWER_IDS='owner,earlier';
  f.env.CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS='  second  ';
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,owner)).status,200);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,second)).status,200);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,other)).status,403);
 }finally{f.db.close()}
});

test('V044 additive reviewer can access V043 pagination but not unauthenticated query or unrelated mutation',async()=>{
 const f=setup();try{
  const owner=f.add('owner'),second=f.add('second',{profile:false}),outsider=f.add('outsider');
  for(let i=0;i<51;i++)f.db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending_review',?,?)")
   .run(randomId(),owner.id,randomId(),'community','Synthetic backlog '+i,'Reviewer paginated case fixture.',1000+i,1000+i);
  const head=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,second,2000)).json();
  assert.equal(head.totals.threads,51);
  assert.equal(head.threads.length,50);
  assert.ok(head.nextCursors.threads);
  const path='/api/v1/member/forum-review?'+new URLSearchParams({lane:'threads',after:head.nextCursors.threads});
  assert.equal((await canonicalForums(request(path),f.env)).status,401);
  assert.equal((await canonicalForums(request(path),f.env,outsider)).status,403);
  const continuation=await canonicalForums(request(path),f.env,second,2001);
  assert.equal(continuation.status,200);
  const body=await continuation.json();
  assert.equal(body.items.length,1);
  assert.equal(body.nextCursor,null);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review?lane=threads&after=bad'),f.env,second)).status,400);
 }finally{f.db.close()}
});
