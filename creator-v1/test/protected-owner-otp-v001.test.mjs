// ANEVUM.WEB.PATCH.2026-10-18.001.FOUNDER-OTP-RECOVERY
// Synthetic mailboxes and in-memory canonical Better Auth D1 only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {permitCanonicalUserCreation,permitCanonicalUserCreationApproved} from '../canonical-auth/policy.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';

const ORIGIN='https://anevum.com';
const AUTH='/api/v1/member/auth';
const read=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
const post=(path,body,cookie)=>new Request(ORIGIN+path,{
 method:'POST',headers:{origin:ORIGIN,'sec-fetch-site':'same-origin','content-type':'application/json',
  ...(cookie?{cookie}:{})},
 body:JSON.stringify(body)
});
function setup(){
 const f=fixture();
 // V069's release source predates IREN schema 0011, but canonical production
 // already has the actual table. Model ONLY that existing dependency locally.
 f.db.exec(`CREATE TABLE staff_access_grants(
   member_id TEXT PRIMARY KEY REFERENCES "user"(id),
   role TEXT NOT NULL CHECK(role IN ('owner','reviewer')),
   granted_by TEXT REFERENCES "user"(id),
   created_at INTEGER NOT NULL,
   updated_at INTEGER NOT NULL,
   revoked_at INTEGER
  )`);
 f.db.exec(read('0013_protected_email_login.sql'));
 f.env.ANEVUM_CANONICAL_APEX_ENABLED='true';
 f.env.CANONICAL_PUBLIC_SIGNUP_ENABLED='true';
 f.env.CANONICAL_INVITED_SIGNUP_ENABLED='false';
 f.env.CANONICAL_PROTECTED_EMAILS='owner@fixture.invalid,second_reserved@fixture.invalid';
 f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
  .run('trusted-founder','Synthetic Trusted Founder','trusted@fixture.invalid',1,
   '2026-10-18T01:00:00.000Z','2026-10-18T01:00:00.000Z');
 f.db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES(?,'owner',?,?,?)")
  .run('trusted-founder','trusted-founder',1792300000,1792300000);
 const approve=(email,by='trusted-founder')=>f.db.prepare(
  'INSERT INTO canonical_protected_email_login_allowance(email,approved_by,approved_at) VALUES(?,?,?)'
 ).run(email,by,1792300001);
 return {...f,approve};
}
const sendRequest=(email)=>post(AUTH+'/email-otp/send-verification-otp',{email,type:'sign-in'});
const count=(db,table)=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;

test('owner-authorized exceptions are auditable and do not undermine protected-email controls',async()=>{
 const f=setup();
 try{
  assert.equal(permitCanonicalUserCreation(f.env,'owner@fixture.invalid'),false);
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'owner@fixture.invalid'),false);
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'regular@fixture.invalid'),true);
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'second_reserved@fixture.invalid'),false);
  assert.throws(()=>f.approve('owner@fixture.invalid','unknown-actor'),/FOREIGN KEY|Protected address/);
  f.approve('owner@fixture.invalid');
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'owner@fixture.invalid'),true);
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'second_reserved@fixture.invalid'),false);
  assert.equal(count(f.db,'staff_access_grants'),1);
  assert.equal(f.db.prepare("SELECT role FROM staff_access_grants").get().role,'owner');
  assert.deepEqual(f.db.prepare('SELECT action FROM canonical_protected_email_login_audit').all().map(r=>r.action),['approved']);
  assert.throws(()=>f.db.prepare("UPDATE canonical_protected_email_login_allowance SET email='another@fixture.invalid' WHERE email='owner@fixture.invalid'").run(),/allowance is immutable/);
  assert.throws(()=>f.db.prepare("UPDATE canonical_protected_email_login_allowance SET revoked_at=1792300002 WHERE email='owner@fixture.invalid'").run(),/NOT NULL|CHECK constraint|allowance is immutable/);
  f.db.prepare("UPDATE canonical_protected_email_login_allowance SET revoked_at=1792300002,revoked_by='trusted-founder' WHERE email='owner@fixture.invalid'").run();
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'owner@fixture.invalid'),false);
  assert.deepEqual(f.db.prepare('SELECT action FROM canonical_protected_email_login_audit ORDER BY created_at').all().map(r=>r.action),['approved','revoked']);
  assert.equal(count(f.db,'staff_access_grants'),1);
  f.env.CANONICAL_PUBLIC_SIGNUP_ENABLED='false';
  f.env.CANONICAL_INVITED_SIGNUP_ENABLED='true';
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'owner@fixture.invalid'),false);
 }finally{f.db.close()}
});

test('protected mailbox gets real hashed OTP only after owner approval and no elevated role on signup',{timeout:30000},async()=>{
 const f=setup(),worker=createCanonicalStageWorker();
 const prior=globalThis.fetch;
 const sent=new Map();
 globalThis.fetch=async(url,options)=>{
  assert.equal(String(url),'https://api.resend.com/emails');
  const mail=JSON.parse(options.body);
  assert.equal(mail.subject,'Your ANEVUM sign-in code');
  const code=mail.text.match(/verification code is (\d{8})/)?.[1];
  assert.match(code||'',/^\d{8}$/);
  sent.set(mail.to[0],code);
  return Response.json({id:'synthetic-resend-success'},{status:200});
 };
 try{
  const blocked=await worker.fetch(sendRequest('owner@fixture.invalid'),f.env);
  assert.equal(blocked.status,200,'Protected address returns non-enumerating generic acceptance');
  assert.equal(sent.size,0,'Protected owner mailbox is not sent a code without approval');
  const other=await worker.fetch(sendRequest('second_reserved@fixture.invalid'),f.env);
  assert.equal(other.status,200);
  assert.equal(sent.size,0);

  f.approve('owner@fixture.invalid');
  const allowed=await worker.fetch(sendRequest('owner@fixture.invalid'),f.env);
  assert.equal(allowed.status,200,'Owner-approved protected address must enter real OTP send');
  assert.match(sent.get('owner@fixture.invalid')||'',/^\d{8}$/);
  assert.equal(sent.has('second_reserved@fixture.invalid'),false);

  const signIn=await worker.fetch(post(AUTH+'/sign-in/email-otp',{
   email:'owner@fixture.invalid',otp:sent.get('owner@fixture.invalid')
  }),f.env);
  assert.equal(signIn.status,200,'Approved protected identity must complete Better Auth registration');
  const cookie=signIn.headers.get('set-cookie')||'';
  assert.match(cookie,/anevum_can_apex\.session_token=/);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM \"user\" WHERE email='owner@fixture.invalid' AND emailVerified=1").get().n,1);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_grants WHERE role='owner'").get().n,1);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_grants g JOIN \"user\" u ON u.id=g.member_id WHERE u.email='owner@fixture.invalid'").get().n,0,'A protected identity does not gain owner or reviewer privilege by signing in');

  f.db.prepare("UPDATE canonical_protected_email_login_allowance SET revoked_at=1792300003,revoked_by='trusted-founder' WHERE email='owner@fixture.invalid'").run();
  const afterRevoke=await worker.fetch(sendRequest('owner@fixture.invalid'),f.env);
  assert.equal(afterRevoke.status,200);
  assert.equal(sent.size,1,'Revocation prevents new code sends while maintaining generic public response');
  assert.equal(await permitCanonicalUserCreationApproved(f.env,'owner@fixture.invalid'),false);
 }finally{globalThis.fetch=prior;f.db.close()}
});
