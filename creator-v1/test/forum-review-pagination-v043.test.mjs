import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalForums} from '../canonical-auth/forums.mjs';
import {parseReviewPage} from '../canonical-auth/forum-review-console.mjs';

const origin='https://a.anevum.com';
const id=()=>crypto.randomUUID();
const req=uri=>new Request(origin+uri,{headers:{origin}});
function createFixture(){
 const f=fixture();
 f.db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_member_community_forums.sql',import.meta.url),'utf8'));
 const insertUser=name=>{
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)')
   .run(name,name,name+'@synthetic.invalid');
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at) VALUES(?,?,?,?,?,1,1)')
   .run(name,'fixture_'+name,'Fixture '+name,'','public');
  return {id:name,emailVerified:true};
 };
 const author=insertUser('author'),reviewer=insertUser('reviewer'),reporter=insertUser('reporter');
 const thread=(number,createdAt,status='pending_review')=>{
  const threadId=id();
  f.db.prepare('INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
   .run(threadId,author.id,id(),'community','Review item '+number,
    'Synthetic moderated content for pagination tests.',status,createdAt,createdAt);
  return threadId;
 };
 const reply=(threadId,createdAt)=>{
  const replyId=id();
  f.db.prepare("INSERT INTO member_forum_replies(id,thread_id,author_id,client_request_id,body,status,created_at,updated_at) VALUES(?,?,?,?,?,'pending_review',?,?)")
   .run(replyId,threadId,author.id,id(),'Synthetic followup reply awaiting review.',createdAt,createdAt);
  return replyId;
 };
 const report=(threadId,reason,createdAt)=>{
  const reportId=id();
  f.db.prepare('INSERT INTO member_forum_reports(id,reporter_id,target_kind,target_id,reason,created_at) VALUES(?,?,?,?,?,?)')
   .run(reportId,reporter.id,'thread',threadId,reason,createdAt);
  return reportId;
 };
 const audit=(threadId,createdAt)=>{
  const logId=id();
  f.db.prepare('INSERT INTO member_forum_review_log(id,reviewer_id,target_kind,target_id,action,created_at) VALUES(?,?,?,?,?,?)')
   .run(logId,reviewer.id,'thread',threadId,'publish',createdAt);
  return logId;
 };
 return {...f,author,reviewer,reporter,thread,reply,report,audit,env:{
  ...f.env,CANONICAL_FORUM_ENABLED:'true',CANONICAL_FORUM_REVIEWER_IDS:reviewer.id
 }};
}
const page=(f,lane,after,who=f.reviewer)=>
 canonicalForums(req('/api/v1/member/forum-review?'+new URLSearchParams({lane,after})),f.env,who,20000);

test('V043 strict reviewer cursor validation rejects malformed, duplicated and unknown requests',async()=>{
 const f=createFixture();try{
  const valid=id(),url=new URLSearchParams({lane:'threads',after:'1000.'+valid});
  assert.deepEqual(parseReviewPage(url),{lane:'threads',stamp:1000,priority:null,id:valid});
  for(const value of ['','1000','1000.wrong','01.'+valid,'-1.'+valid,'1.'+valid+'.more']){
   assert.equal(parseReviewPage(new URLSearchParams({lane:'threads',after:value})),null,value);
  }
  for(const bad of [
   'lane=hidden&after=1000.'+valid,
   'lane=threads&after=1000.'+valid+'&after=1000.'+valid,
   'lane=threads&after=1000.'+valid+'&extra=1',
   'lane=reports&after=4.1000.'+valid,
   'lane=reports&after=1000.'+valid,
   'lane=activity&after=bad',
   'lane=threads',
   'after=1000.'+valid
  ]){
   assert.equal((await canonicalForums(req('/api/v1/member/forum-review?'+bad),f.env,f.reviewer)).status,400,bad);
  }
  const expected='/api/v1/member/forum-review?'+new URLSearchParams({lane:'threads',after:'1000.'+valid});
  assert.equal((await canonicalForums(req(expected),f.env)).status,401);
  assert.equal((await canonicalForums(req(expected),f.env,f.author)).status,403);
 }finally{f.db.close()}
});

test('V043 thread pagination returns 50 + remainder with no omissions, including identical timestamps',async()=>{
 const f=createFixture();try{
  const seeded=Array.from({length:73},(_,i)=>f.thread(i,1000));
  let snapshot=await (await canonicalForums(req('/api/v1/member/forum-review'),f.env,f.reviewer,20000)).json();
  assert.equal(snapshot.totals.threads,73);
  assert.equal(snapshot.threads.length,50);
  assert.ok(snapshot.nextCursors.threads);
  const continuation=await page(f,'threads',snapshot.nextCursors.threads);
  assert.equal(continuation.status,200);
  const next=await continuation.json();
  assert.equal(next.lane,'threads');
  assert.equal(next.items.length,23);
  assert.equal(next.nextCursor,null);
  const all=[...snapshot.threads,...next.items];
  assert.equal(new Set(all.map(x=>x.id)).size,73);
  assert.deepEqual(new Set(all.map(x=>x.id)),new Set(seeded));
  assert.deepEqual(all.map(x=>x.id),all.map(x=>x.id).slice().sort());
  assert.ok(all.every(x=>x.canPublish===true&&x.selfAuthored===false));
  assert.ok(!JSON.stringify(next).includes('@synthetic.invalid'));
  assert.ok(!JSON.stringify(next).includes('author_id'));
 }finally{f.db.close()}
});

test('V043 replies, priority reports, and audit keysets preserve stable order and anonymity',async()=>{
 const f=createFixture();try{
  const parent=f.thread(0,100,'published');
  for(let i=0;i<55;i++)f.reply(parent,500+i%3);
  for(let i=0;i<57;i++){
   const threadId=f.thread(i+1,700+i,'published');
   f.report(threadId,['spam','unsafe','harassment','other'][i%4],900+i%5);
  }
  for(let i=0;i<51;i++)f.audit(parent,1000+i%3);
  const snapshot=await (await canonicalForums(req('/api/v1/member/forum-review'),f.env,f.reviewer,20000)).json();
  assert.equal(snapshot.totals.replies,55);
  assert.equal(snapshot.replies.length,50);
  assert.equal(snapshot.totals.reports,57);
  assert.equal(snapshot.reports.length,50);
  assert.equal(snapshot.recent.length,25);
  const results=await Promise.all([
   page(f,'replies',snapshot.nextCursors.replies),
   page(f,'reports',snapshot.nextCursors.reports),
   page(f,'activity',snapshot.nextCursors.activity)
  ]);
  assert.deepEqual(results.map(x=>x.status),[200,200,200]);
  const [replyPage,reportPage,auditPage]=await Promise.all(results.map(x=>x.json()));
  assert.equal(replyPage.items.length,5);
  assert.equal(reportPage.items.length,7);
  assert.equal(auditPage.items.length,25);
  assert.equal(replyPage.nextCursor,null);
  assert.equal(reportPage.nextCursor,null);
  assert.ok(auditPage.nextCursor);
  const tail=await (await page(f,'activity',auditPage.nextCursor)).json();
  assert.equal(tail.items.length,1);
  assert.equal(tail.nextCursor,null);
  const replies=[...snapshot.replies,...replyPage.items];
  assert.equal(new Set(replies.map(x=>x.id)).size,55);
  const reports=[...snapshot.reports,...reportPage.items];
  assert.equal(new Set(reports.map(x=>x.id)).size,57);
  const priority=x=>({unsafe:0,harassment:1,spam:2,other:3})[x.reason];
  assert.deepEqual(reports.map(x=>priority(x)),reports.map(x=>priority(x)).slice().sort((a,b)=>a-b));
  assert.ok(reports.every(x=>x.reason&&x.contentPreview&&!('reporterId' in x)&&!('reporter_id' in x)));
  const audit=[...snapshot.recent,...auditPage.items,...tail.items];
  assert.equal(new Set(audit.map(x=>x.id)).size,51);
  assert.ok(audit.every(x=>x.reviewerHandle==='fixture_reviewer'));
 }finally{f.db.close()}
});

test('V043 client preserves server authorization and advertises only loaded record search',()=>{
 const pageSource=readFileSync(new URL('../web/src/pages/ForumReviewPage.tsx',import.meta.url),'utf8');
 const apiSource=readFileSync(new URL('../canonical-auth/forum-review-console.mjs',import.meta.url),'utf8');
 assert.match(pageSource,/LOAD MORE/);
 assert.match(pageSource,/new URLSearchParams\(\{lane:name,after:cursor\}\)/);
 assert.match(pageSource,/resetPaging\(\);setRevision\(v=>v\+1\)/);
 assert.match(pageSource,/Search filters currently loaded records only/);
 assert.match(pageSource,/credentials:'same-origin'/);
 assert.match(pageSource,/REPORTER IDENTITY IS WITHHELD/);
 assert.match(apiSource,/WHERE l\.created_at</);
 assert.match(apiSource,/reportPrioritySql/);
 assert.doesNotMatch(pageSource,/dangerouslySetInnerHTML|window\.confirm\(/);
});
