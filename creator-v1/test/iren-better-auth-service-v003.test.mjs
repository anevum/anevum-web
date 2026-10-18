// IREN V003 — actual canonical Better Auth cookie + service-binding contract.
// Uses an in-memory D1 fixture and a stubbed OTP delivery endpoint. No network,
// live staff grant, stored credentials, production secrets or deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import canonicalWorker from '../canonical-auth/worker.mjs';
import {createIrenApexStaffWorker} from '../staff-portal/worker.mjs';

const ORIGIN='https://anevum.com', AUTH='/api/v1/member/auth';
const staffURL=ORIGIN+'/api/v1/member/staff-ops';
const post=(path,body,cookie)=>new Request(ORIGIN+path,{
 method:'POST',headers:{origin:ORIGIN,'sec-fetch-site':'same-origin',
 'content-type':'application/json',...(cookie?{cookie}:{})},
 body:JSON.stringify(body)
});
const get=(path,cookie)=>new Request(ORIGIN+path,{headers:cookie?{cookie}:{}});
const read=(name)=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
test('IREN V003: actual apex Better Auth OTP session, permission grant and logout', {timeout:30000},async()=>{
 const {db,env}=fixture();
 for(const migration of ['0006_member_community_forums.sql','0010_staff_command.sql','0011_staff_roles.sql'])
  db.exec(read(migration));
 env.ANEVUM_CANONICAL_APEX_ENABLED='true';
 env.CANONICAL_PUBLIC_SIGNUP_ENABLED='true';
 env.CANONICAL_INVITED_SIGNUP_ENABLED='false';
 env.CANONICAL_FORUM_ENABLED='true';
 env.CANONICAL_STAFF_OPS_ENABLED='true';
 const emails=new Map(),originalFetch=globalThis.fetch;
 globalThis.fetch=async (input,options)=>{
  assert.equal(String(input),'https://api.resend.com/emails');
  const data=JSON.parse(options.body),otp=/verification code is (\d{8})/.exec(data.text)?.[1];
  assert.match(otp||'',/^\d{8}$/);
  emails.set(data.to[0],otp);
  return Response.json({id:'fixture-email'},{status:200});
 };
 env.APEX_AUTH={
  async fetch(request){
   assert.equal(new URL(request.url).origin,ORIGIN);
   assert.equal(new URL(request.url).pathname,AUTH+'/get-session');
   assert.equal(request.headers.get('authorization'),null);
   return canonicalWorker.fetch(request,env);
  }
 };
 const staff=createIrenApexStaffWorker();
 const email='first_member@fixture.invalid';
 try{
  const start=await canonicalWorker.fetch(post(AUTH+'/email-otp/send-verification-otp',
   {email,type:'sign-in'}),env);
  assert.equal(start.status,200,'Apex OTP send must work with real Better Auth');
  const otp=emails.get(email);
  assert.match(otp||'',/^\d{8}$/);
  const signIn=await canonicalWorker.fetch(post(AUTH+'/sign-in/email-otp',{email,otp}),env);
  assert.equal(signIn.status,200,'Apex Better Auth must issue the session');
  const cookie=(signIn.headers.get('set-cookie')||'').split(';')[0];
  assert.match(cookie,/anevum_can_apex\.session_token=/);
  const sessionResponse=await canonicalWorker.fetch(get(AUTH+'/get-session',cookie),env);
  assert.equal(sessionResponse.status,200);
  const identity=await sessionResponse.json();
  assert.equal(identity.user?.email,email);
  assert.equal(identity.user?.emailVerified,true);
  assert.equal(typeof identity.session?.id,'string');
  assert.equal(typeof identity.session?.expiresAt,'string');
  assert.ok(Date.parse(identity.session.expiresAt)>Date.now());

  // A valid account is NOT sufficient for the staff portal.
  const preGrant=await staff.fetch(get('/api/v1/member/staff-ops',cookie),env);
  assert.equal(preGrant.status,403);
  const id=identity.user.id;
  // Controlled synthetic DB fixture only. Real production bootstrap is separate.
  db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES(?,'owner',?,?,?)")
   .run(id,id,1730000000,1730000000);
  const accepted=await staff.fetch(get('/api/v1/member/staff-ops',cookie),env);
  assert.equal(accepted.status,200,'Verified real Better Auth session with active owner grant');
  const data=await accepted.json();
  assert.equal(data.role,'owner');
  assert.equal(data.memberId,id);
  assert.equal(data.memberMetrics.total,1);
  assert.equal(data.memberMetrics.verified,1);
  assert.doesNotMatch(JSON.stringify(data),/first_member@fixture\.invalid/);

  // Exercise two distinct genuine Better Auth sessions, not fabricated staff
  // identities. The second member is not a moderator until a founder action.
  const peerEmail='second_member@fixture.invalid';
  const peerOtpSend=await canonicalWorker.fetch(post(AUTH+'/email-otp/send-verification-otp',
   {email:peerEmail,type:'sign-in'}),env);
  assert.equal(peerOtpSend.status,200);
  const peerSignIn=await canonicalWorker.fetch(post(AUTH+'/sign-in/email-otp',
   {email:peerEmail,otp:emails.get(peerEmail)}),env);
  assert.equal(peerSignIn.status,200);
  const peerCookie=(peerSignIn.headers.get('set-cookie')||'').split(';')[0];
  assert.notEqual(peerCookie,cookie);
  const peerSession=await (await canonicalWorker.fetch(get(AUTH+'/get-session',peerCookie),env)).json();
  assert.equal(peerSession.user?.emailVerified,true);
  assert.notEqual(peerSession.user?.id,id);
  assert.equal((await staff.fetch(get('/api/v1/member/staff-ops',peerCookie),env)).status,403);

  const promote=await staff.fetch(post('/api/v1/member/staff-ops',
   {kind:'staff-grant',memberId:peerSession.user.id},cookie),env);
  assert.equal(promote.status,200,'Only the founder can grant existing verified reviewer access');
  const reviewer=await staff.fetch(get('/api/v1/member/staff-ops',peerCookie),env);
  assert.equal(reviewer.status,200);
  const reviewerData=await reviewer.json();
  assert.equal(reviewerData.role,'reviewer');
  assert.equal(reviewerData.memberMetrics,null,'Reviewer cannot inspect global member funnel');
  assert.equal(reviewerData.eligibleMembers.length,0,'Reviewer cannot list candidates for privileged roles');
  const reviewerEscalation=await staff.fetch(post('/api/v1/member/staff-ops',
   {kind:'staff-grant',memberId:id},peerCookie),env);
  assert.equal(reviewerEscalation.status,403,'Reviewer must never promote a founder');

  const sentByFounder=await staff.fetch(post('/api/v1/member/staff-ops',
   {kind:'message',room:'operations',body:'Welcome to the operations room.'},cookie),env);
  assert.equal(sentByFounder.status,201);
  const peerRoom=await (await staff.fetch(get('/api/v1/member/staff-ops?room=operations',peerCookie),env)).json();
  assert.equal(peerRoom.messages.some(m=>m.body==='Welcome to the operations room.'),true);

  const penStroke={points:[[0.1,0.1],[0.4,0.7]],color:'#a99aff',width:2};
  const mark=await staff.fetch(post('/api/v1/member/staff-ops',
   {kind:'stroke',room:'operations',stroke:penStroke},peerCookie),env);
  assert.equal(mark.status,201);
  const founderRoom=await (await staff.fetch(get('/api/v1/member/staff-ops?room=operations',cookie),env)).json();
  assert.equal(founderRoom.canvas.some(c=>c.eventType==='stroke'&&c.authorId===peerSession.user.id),true);

  const revoke=await staff.fetch(post('/api/v1/member/staff-ops',
   {kind:'staff-revoke',memberId:peerSession.user.id},cookie),env);
  assert.equal(revoke.status,200);
  assert.equal((await staff.fetch(get('/api/v1/member/staff-ops',peerCookie),env)).status,403);
  const actions=db.prepare("SELECT action FROM staff_access_audit ORDER BY created_at,id").all().map(x=>x.action).sort();
  assert.deepEqual(actions,['grant-reviewer','revoke-reviewer']);

  const cross=await staff.fetch(new Request(staffURL,{
   method:'POST',headers:{cookie,origin:'https://external.example','content-type':'application/json'},
   body:JSON.stringify({kind:'message',room:'operations',body:'must reject'})
  }),env);
  assert.equal(cross.status,403);
  const logout=await canonicalWorker.fetch(post(AUTH+'/sign-out',{},cookie),env);
  assert.equal(logout.status,200);
  assert.equal((await staff.fetch(get('/api/v1/member/staff-ops',cookie),env)).status,401);
 }finally{
  globalThis.fetch=originalFetch;
  db.close();
 }
});
