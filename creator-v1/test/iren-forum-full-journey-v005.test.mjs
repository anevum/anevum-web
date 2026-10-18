// ANEVUM.WEB.BUILD.2026-10-18.001.FORUM-ACCEPTANCE
// Uses real Better Auth sessions, a fake delivery provider, in-memory SQLite
// D1 adapter and the actual apex/staff Worker routers. All users and content
// are synthetic. NO external email, Cloudflare, GitHub, or member-data writes.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import apex from '../canonical-auth/worker.mjs';
import {createIrenApexStaffWorker} from '../staff-portal/worker.mjs';

const HOST='https://anevum.com';
const AUTH='/api/v1/member/auth';
const PROFILE='/api/v1/member/creator-profile';
const THREADS='/api/v1/community/threads';
const REVIEW='/api/v1/member/forum-review';
const STAFF='/api/v1/member/staff-ops';
const migration=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');

const req=(path,method='GET',body,cookie,origin=HOST)=>new Request(HOST+path,{
 method,
 headers:{...(method==='GET'?{}:{origin,'sec-fetch-site':'same-origin'}),
  ...(body===undefined?{}:{'content-type':'application/json'}),
  ...(cookie?{cookie}:{})},
 body:body===undefined?undefined:JSON.stringify(body),
 redirect:'error'
});
const cookieFrom=response=>(response.headers.get('set-cookie')||'').split(';')[0];
const json=async response=>response.json();

test('IREN V005 two real OTP sessions cross independent public and staff Workers without bypassing review',{timeout:30000},async()=>{
 const f=fixture(),db=f.db;
 for(const name of ['0006_member_community_forums.sql','0010_staff_command.sql','0011_staff_roles.sql','0012_staff_founder_guard.sql'])
  db.exec(migration(name));
 const publicEnv={...f.env,
  ANEVUM_CANONICAL_APEX_ENABLED:'true',
  CANONICAL_PUBLIC_SIGNUP_ENABLED:'true',
  CANONICAL_INVITED_SIGNUP_ENABLED:'false',
  CANONICAL_FORUM_ENABLED:'false',
  CANONICAL_STAFF_OPS_ENABLED:'false',
  CANONICAL_RECOGNITION_ENABLED:'false'};
 const staffEnv={...publicEnv,CANONICAL_STAFF_OPS_ENABLED:'true',CANONICAL_FORUM_ENABLED:'true',
  APEX_AUTH:{async fetch(request){
   assert.equal(new URL(request.url).origin,HOST);
   assert.equal(new URL(request.url).pathname,AUTH+'/get-session');
   assert.equal(request.method,'GET');
   assert.equal(request.headers.get('authorization'),null);
   return apex.fetch(request,publicEnv);
  }}};
 const iren=createIrenApexStaffWorker(),otps=new Map();
 const formerFetch=globalThis.fetch;
 globalThis.fetch=async (url,options)=>{
  assert.equal(String(url),'https://api.resend.com/emails');
  const email=JSON.parse(options.body);
  const otp=/verification code is (\d{8})/.exec(email.text)?.[1];
  assert.match(otp||'',/^\d{8}$/);
  otps.set(email.to[0],otp);
  return Response.json({id:'synthetic-email'},{status:200});
 };
 const account=async(email)=>{
  const send=await apex.fetch(req(AUTH+'/email-otp/send-verification-otp','POST',{email,type:'sign-in'}),publicEnv);
  assert.equal(send.status,200,'New verified account receives OTP: '+email);
  const signin=await apex.fetch(req(AUTH+'/sign-in/email-otp','POST',{email,otp:otps.get(email)}),publicEnv);
  assert.equal(signin.status,200,'Valid separate Better Auth session');
  const cookie=cookieFrom(signin);
  assert.match(cookie,/anevum_can_apex\.session_token=/);
  const response=await apex.fetch(req(AUTH+'/get-session','GET',undefined,cookie),publicEnv);
  assert.equal(response.status,200);
  const data=await json(response);
  assert.equal(data.user.emailVerified,true);
  return {cookie,id:data.user.id,email};
 };
 const memberProfile=async(user,handle)=>{
  const created=await apex.fetch(req(PROFILE,'POST',{handle,displayName:handle,bio:'Synthetic community acceptance account'},user.cookie),publicEnv);
  assert.equal(created.status,201,'Member claims a private canonical profile');
  const first=await json(created);
  assert.equal(first.profile.visibility,'private');
  const published=await apex.fetch(req(PROFILE,'PATCH',{displayName:handle,bio:'Synthetic community acceptance account',visibility:'public',revision:first.profile.revision},user.cookie),publicEnv);
  assert.equal(published.status,200,'Member explicitly makes their profile public');
  assert.equal((await json(published)).profile.visibility,'public');
 };
 const staffCall=(user,path=REVIEW,method='GET',body,origin=HOST)=>{
  return iren.fetch(req(path,method,body,user?.cookie,origin),staffEnv);
 };
 try{
  const owner=await account('forum_owner@fixture.invalid');
  const reviewer=await account('forum_reviewer@fixture.invalid');
  const peer=await account('forum_peer@fixture.invalid');
  assert.equal(new Set([owner.id,reviewer.id,peer.id]).size,3);
  await memberProfile(owner,'forum_owner');
  await memberProfile(peer,'forum_peer');

  // A real founder grant is inserted only into the disposable fixture;
  // production grants may ONLY be managed through authorized operations.
  const now=Math.floor(Date.now()/1000);
  db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES(?,'owner',?,?,?)")
   .run(owner.id,owner.id,now,now);
  assert.equal((await staffCall(peer,STAFF)).status,403);
  assert.equal((await staffCall(reviewer,REVIEW)).status,403);
  assert.equal((await staffCall(owner,STAFF,'POST',{kind:'staff-grant',memberId:reviewer.id})).status,200);
  assert.equal((await staffCall(reviewer,STAFF)).status,200);
  assert.equal((await staffCall(owner,REVIEW,'POST',{targetKind:'thread',targetId:'not-valid',action:'publish'})).status,400);

  // Public is OFF and remains inaccessible even with valid member sessions.
  assert.equal((await apex.fetch(req(THREADS),publicEnv)).status,404);
  assert.equal((await apex.fetch(req(THREADS,'POST',{requestId:crypto.randomUUID(),topic:'community',
   title:'Closed forum',body:'This must not submit while public writes are disabled.'},owner.cookie),publicEnv)).status,404);

  // Simulate a distinct guarded activation. This never changes live flags.
  publicEnv.CANONICAL_FORUM_ENABLED='true';
  const body={requestId:crypto.randomUUID(),topic:'making',
   title:'Independent review of a first member discussion',
   body:'What would make an independent creator and family community easier to use every day?'};
  const threadResponse=await apex.fetch(req(THREADS,'POST',body,owner.cookie),publicEnv);
  assert.equal(threadResponse.status,201,'Verified real session can submit to moderation');
  const thread=await json(threadResponse);
  assert.equal(thread.status,'pending_review');
  assert.equal((await json(await apex.fetch(req(THREADS),publicEnv))).items.length,0,'Unapproved content is invisible');
  const pending=await json(await staffCall(reviewer));
  assert.equal(pending.threads.length,1,'Reviewer sees private queue');
  assert.equal(pending.threads[0].id,thread.id);
  assert.equal((await staffCall(peer)).status,403,'Ordinary user cannot inspect queue');
  assert.equal((await staffCall(owner,REVIEW,'POST',{targetKind:'thread',targetId:thread.id,action:'publish'})).status,403,'Author cannot self-approve');
  assert.equal((await staffCall(reviewer,REVIEW,'POST',{targetKind:'thread',targetId:thread.id,action:'publish'},'https://foreign.invalid')).status,403,'Cross-origin review rejected');
  const decision=await staffCall(reviewer,REVIEW,'POST',{targetKind:'thread',targetId:thread.id,action:'publish'});
  assert.equal(decision.status,200,'Independently granted reviewer publishes via separate Worker');
  assert.equal((await json(decision)).status,'published');
  const publicThread=await json(await apex.fetch(req(THREADS),publicEnv));
  assert.equal(publicThread.items.length,1,'Guest sees one genuinely reviewed thread');
  assert.equal(publicThread.items[0].id,thread.id);
  assert.equal(publicThread.items[0].author.handle,'forum_owner');
  assert.doesNotMatch(JSON.stringify(publicThread),/fixture\.invalid|session_token|emailVerified|forum_reviewer/);

  const replyResponse=await apex.fetch(req(THREADS+'/'+thread.id+'/replies','POST',{
   requestId:crypto.randomUUID(),body:'A shared place to ask questions and show finished work would help.'},peer.cookie),publicEnv);
  assert.equal(replyResponse.status,201,'Independent member can reply');
  const reply=await json(replyResponse);
  assert.equal((await json(await apex.fetch(req(THREADS+'/'+thread.id+'/replies'),publicEnv))).items.length,0,'Pending reply remains private');
  assert.equal((await staffCall(reviewer,REVIEW,'POST',{targetKind:'reply',targetId:reply.id,action:'publish'})).status,200);
  assert.equal((await json(await apex.fetch(req(THREADS+'/'+thread.id+'/replies'),publicEnv))).items.length,1);

  // Empty-body mutation still MUST supply an exact Origin: browser fetch sends it.
  const forgedNoOrigin=new Request(HOST+THREADS+'/'+thread.id+'/reaction',{
   method:'POST',headers:{cookie:peer.cookie}
  });
  assert.equal((await apex.fetch(forgedNoOrigin,publicEnv)).status,403,'Origin-less cookie mutation fails closed');
  assert.equal((await apex.fetch(req(THREADS+'/'+thread.id+'/reaction','POST',undefined,peer.cookie),publicEnv)).status,200);
  const reportResponse=await apex.fetch(req('/api/v1/community/reports','POST',{
   targetKind:'thread',targetId:thread.id,reason:'other'},peer.cookie),publicEnv);
  assert.equal(reportResponse.status,201,'Member report enters private staff review');
  const reported=await json(await staffCall(reviewer));
  assert.equal(reported.reports.length,1);
  const reportId=reported.reports[0].id;
  assert.equal((await staffCall(reviewer,REVIEW,'POST',{targetKind:'report',targetId:reportId,action:'dismiss_report'})).status,200);
  assert.equal((await staffCall(reviewer,REVIEW,'POST',{targetKind:'thread',targetId:thread.id,action:'hide'})).status,200);
  assert.equal((await apex.fetch(req(THREADS+'/'+thread.id),publicEnv)).status,404,'Moderated takedown removes public visibility');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM member_forum_review_log").get().n,4,'Every independent action has a durable audit record');

  publicEnv.CANONICAL_FORUM_ENABLED='false';
  assert.equal((await apex.fetch(req(THREADS),publicEnv)).status,404,'Public read-side fails closed');
  assert.equal((await staffCall(reviewer)).status,200,'Separate staff queue remains enabled');
  assert.equal((await staffCall(undefined)).status,401,'Guest cannot read reviewer queue');
  assert.equal((await staffCall(owner,STAFF,'POST',{kind:'staff-revoke',memberId:reviewer.id})).status,200);
  assert.equal((await staffCall(reviewer)).status,403,'Revoked reviewer loses moderation access');
  assert.equal((await apex.fetch(req(AUTH+'/sign-out','POST',{},peer.cookie),publicEnv)).status,200);
  assert.equal((await staffCall(peer,STAFF)).status,401,'Signed out session cannot access staff');

  const roles=db.prepare("SELECT role,COUNT(*) AS n FROM staff_access_grants WHERE revoked_at IS NULL GROUP BY role").all();
  assert.deepEqual(roles.map(x=>[x.role,x.n]),[['owner',1]],'Disposable fixture retains only protected owner');
 }finally{
  globalThis.fetch=formerFetch;
  db.close();
 }
});
