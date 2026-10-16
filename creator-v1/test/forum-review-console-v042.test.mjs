import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalForums} from '../canonical-auth/forums.mjs';
const origin='https://a.anevum.com',id=()=>crypto.randomUUID();
const request=(path,method='GET',body)=>new Request(origin+path,{
 method,headers:{origin,...(body?{'content-type':'application/json'}:{})},
 body:body===undefined?undefined:JSON.stringify(body)
});
function setup(){
 const f=fixture();
 f.db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_member_community_forums.sql',import.meta.url),'utf8'));
 function seed(key,visibility='public'){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)')
   .run(key,key,key+'@synthetic.invalid');
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at) VALUES(?,?,?,?,?,1,1)')
   .run(key,'test_'+key,'Fixture '+key,'',visibility);
  return {id:key,emailVerified:true};
 }
 return {...f,seed,env:{...f.env,CANONICAL_FORUM_ENABLED:'true',CANONICAL_FORUM_REVIEWER_IDS:'reviewer'}};
}
async function makeThread(f,author,time=1000){
 const response=await canonicalForums(request('/api/v1/community/threads','POST',{
  requestId:id(),topic:'community',title:'Building our shared commons',
  body:'What kinds of discussion and collaboration will improve this creative commons?'
 }),f.env,author,time);
 assert.equal(response.status,201);return (await response.json()).id;
}
async function publish(f,targetKind,targetId,at=1100){
 return canonicalForums(request('/api/v1/member/forum-review','POST',{
  targetKind,targetId,action:'publish'
 }),f.env,{id:'reviewer',emailVerified:true},at);
}

test('V042 reviewer-only snapshot omits reporter identities and account IDs',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer'),reporter=f.seed('reporter','private');
  const threadId=await makeThread(f,author);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env)).status,401);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review'),f.env,author)).status,403);
  let snapshot=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1010)).json();
  assert.equal(snapshot.totals.threads,1);assert.equal(snapshot.totals.replies,0);
  assert.equal(snapshot.threads.length,1);
  assert.equal(snapshot.threads[0].canPublish,true);
  assert.equal(snapshot.threads[0].selfAuthored,false);
  assert.equal(snapshot.threads[0].author.handle,'test_author');
  assert.equal(snapshot.threads[0].author.visibility,'public');
  assert.deepEqual(snapshot.threads[0].author.featuredAwards,[]);
  assert.equal(snapshot.checkedAt,1010);
  assert.equal(snapshot.pageSize,50);assert.equal(snapshot.auditSize,25);
  assert.equal((await publish(f,'thread',threadId)).status,200);
  const report=await canonicalForums(request('/api/v1/community/reports','POST',{
   targetKind:'thread',targetId:threadId,reason:'unsafe'
  }),f.env,reporter,1105);
  assert.equal(report.status,201);
  snapshot=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1110)).json();
  assert.equal(snapshot.totals.threads,0);assert.equal(snapshot.totals.reports,1);
  assert.equal(snapshot.reports[0].threadTitle,'Building our shared commons');
  assert.equal(snapshot.reports[0].targetStatus,'published');
  assert.equal(snapshot.reports[0].reason,'unsafe');
  assert.equal(snapshot.reports[0].canHide,true);
  assert.equal(snapshot.reports[0].authorHandle,'test_author');
  assert.match(snapshot.reports[0].contentPreview,/creative commons/);
  assert.equal(snapshot.recent[0].action,'publish');
  assert.equal(snapshot.recent[0].reviewerHandle,'test_reviewer');
  const privatePayload=JSON.stringify(snapshot);
  for(const forbidden of ['reporter_id','reporterId','test_reporter','author_id','reviewer_id','@synthetic.invalid'])
   assert.equal(privatePayload.includes(forbidden),false,forbidden);
 }finally{f.db.close()}
});

test('V042 totals count beyond the first 50 and queue remains oldest-first',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer');
  for(let i=0;i<57;i++){
   f.db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending_review',?,?)")
    .run(id(),author.id,id(),'community','Moderation queue '+i,
     'Reviewable synthetic discussion for full-count pagination.',1000+i,1000+i);
  }
  const response=await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1800);
  assert.equal(response.status,200);const queue=await response.json();
  assert.equal(queue.totals.threads,57);assert.equal(queue.threads.length,50);
  assert.equal(queue.totals.oldestThreadAt,1000);
  assert.equal(queue.threads[0].createdAt,1000);
  assert.equal(queue.threads.at(-1).createdAt,1049);
  assert.ok(queue.threads.every(x=>x.canPublish));
  assert.equal(queue.recent.length,0);
 }finally{f.db.close()}
});

test('V042 unsafe reports lead spam and contextual previews survive author privacy changes',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer'),reporter=f.seed('reporter','private');
  const threadId=await makeThread(f,author,1000);
  assert.equal((await publish(f,'thread',threadId,1002)).status,200);
  const reply=await canonicalForums(request('/api/v1/community/threads/'+threadId+'/replies','POST',{
   requestId:id(),body:'This reply supplies material for contextual moderation review.'
  }),f.env,author,1003);
  assert.equal(reply.status,201);const replyId=(await reply.json()).id;
  assert.equal((await publish(f,'reply',replyId,1004)).status,200);
  assert.equal((await canonicalForums(request('/api/v1/community/reports','POST',{
   targetKind:'thread',targetId:threadId,reason:'spam'
  }),f.env,reporter,1005)).status,201);
  assert.equal((await canonicalForums(request('/api/v1/community/reports','POST',{
   targetKind:'reply',targetId:replyId,reason:'unsafe'
  }),f.env,reporter,1006)).status,201);
  let queue=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1007)).json();
  assert.deepEqual(queue.reports.map(x=>x.reason),['unsafe','spam']);
  assert.equal(queue.reports[0].threadId,threadId);
  assert.equal(queue.reports[0].targetKind,'reply');
  assert.equal(queue.reports[0].parentStatus,'published');
  assert.match(queue.reports[0].contentPreview,/contextual moderation/);
  f.db.prepare("UPDATE member_creator_profiles SET visibility='private' WHERE user_id=?").run(author.id);
  queue=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1010)).json();
  assert.equal(queue.reports.length,2);
  assert.equal(queue.reports[0].authorVisibility,'private');
  assert.equal((await canonicalForums(request('/api/v1/community/threads/'+threadId),f.env)).status,404);
 }finally{f.db.close()}
});

test('V042 independently verifies publisher and parent; own/private submissions are blocked',async()=>{
 const f=setup();try{
  const reviewer=f.seed('reviewer'),author=f.seed('author');
  const ownId=await makeThread(f,reviewer,1000),otherId=await makeThread(f,author,1000);
  let queue=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1001)).json();
  const own=queue.threads.find(x=>x.id===ownId),other=queue.threads.find(x=>x.id===otherId);
  assert.equal(own.selfAuthored,true);assert.equal(own.canPublish,false);
  assert.equal(other.selfAuthored,false);assert.equal(other.canPublish,true);
  assert.equal((await publish(f,'thread',ownId,1002)).status,403);
  f.db.prepare('UPDATE "user" SET emailVerified=0 WHERE id=?').run(author.id);
  queue=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1003)).json();
  assert.equal(queue.threads.find(x=>x.id===otherId).canPublish,false);
  assert.equal((await publish(f,'thread',otherId,1004)).status,409);
  f.db.prepare('UPDATE "user" SET emailVerified=1 WHERE id=?').run(author.id);
  assert.equal((await publish(f,'thread',otherId,1005)).status,200);
  const reply=await canonicalForums(request('/api/v1/community/threads/'+otherId+'/replies','POST',{
   requestId:id(),body:'This follow-up reply must respect its parent visibility.'
  }),f.env,author,1006);
  assert.equal(reply.status,201);
  f.db.prepare("UPDATE member_creator_profiles SET visibility='private' WHERE user_id=?").run(author.id);
  queue=await (await canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1007)).json();
  assert.equal(queue.replies.length,1);
  assert.equal(queue.replies[0].canPublish,false);
  assert.equal(queue.replies[0].author.visibility,'private');
  assert.equal(queue.replies[0].author.avatar,false);
  assert.equal(queue.replies[0].author.level,null);
  assert.deepEqual(queue.replies[0].author.featuredAwards,[]);
 }finally{f.db.close()}
});

test('V042 audited hide resolves exact-target reports and preserves decision ordering',async()=>{
 const f=setup();try{
  const author=f.seed('author'),reviewer=f.seed('reviewer'),reporter=f.seed('reporter');
  const threadId=await makeThread(f,author,1000);
  await publish(f,'thread',threadId,1002);
  await canonicalForums(request('/api/v1/community/reports','POST',{
   targetKind:'thread',targetId:threadId,reason:'harassment'
  }),f.env,reporter,1003);
  const get=()=>canonicalForums(request('/api/v1/member/forum-review'),f.env,reviewer,1004);
  let q=await (await get()).json();
  assert.equal(q.totals.reports,1);assert.equal(q.recent.length,1);
  const hidden=await canonicalForums(request('/api/v1/member/forum-review','POST',{
   targetKind:'thread',targetId:threadId,action:'hide'
  }),f.env,reviewer,1005);
  assert.equal(hidden.status,200);
  q=await (await get()).json();
  assert.equal(q.totals.reports,0);
  assert.deepEqual(q.recent.map(x=>x.action),['hide','publish']);
  assert.equal(q.recent[0].reviewerHandle,'test_reviewer');
  assert.equal((await canonicalForums(request('/api/v1/community/threads/'+threadId),f.env)).status,404);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review','POST',{
   targetKind:'thread',targetId:threadId,action:'hide'
  }),f.env,reviewer,1006)).status,409);
  assert.equal((await canonicalForums(request('/api/v1/member/forum-review?after=1'),f.env,reviewer)).status,400);
 }finally{f.db.close()}
});

test('V042 client contracts show modal confirmation, safe rendering, and responsive policy',()=>{
 const page=readFileSync(new URL('../web/src/pages/ForumReviewPage.tsx',import.meta.url),'utf8');
 const service=readFileSync(new URL('../canonical-auth/forum-review-console.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../web/src/pages/forum-moderator.css',import.meta.url),'utf8');
 assert.match(page,/aria-labelledby="mc-dialog-title"/);
 assert.match(page,/onCancel=/);
 assert.match(page,/await reviewRequest\('POST',\{targetKind:choice.kind,targetId:choice.id,action:choice.action\}\)/);
 assert.match(page,/disabled=\{busy\|\|!t.canPublish\}/);
 assert.match(page,/REPORTER IDENTITY IS WITHHELD/);
 assert.match(page,/Showing the first/);
 assert.match(page,/REFRESH QUEUE/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/max-width:360px/);
 assert.doesNotMatch(service,/\b(?:reporter_id|reporterId)\b/);
 assert.doesNotMatch(page,/innerHTML|dangerouslySetInnerHTML|window\.confirm\(/);
});
