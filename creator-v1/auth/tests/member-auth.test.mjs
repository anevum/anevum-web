import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import member, {createMemberWorker,authenticated} from '../worker.mjs';
const migration=readFileSync(new URL('../migrations/0003_member_identity_staging.sql',import.meta.url),'utf8');
const schema=`CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY NOT NULL,handle TEXT COLLATE NOCASE UNIQUE NOT NULL,display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',avatar_url TEXT,website_url TEXT,is_staff INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);`;
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON;'+schema+migration);
const query=(sql,params=[])=>sqlite.prepare(sql).all(...params).map(x=>({...x}));
const db={prepare(sql){
 const execute=(params,mode)=>{
   const prepared=sqlite.prepare(sql);
   if(mode==='all')return {success:true,results:query(sql,params)};
   const result=prepared.run(...params);
   return {success:true,meta:{changes:Number(result.changes)}};
 };
 return {
   all:async()=>execute([],'all'),
   run:async()=>execute([],'run'),
   bind(...params){return{
     all:async()=>execute(params,'all'),
     run:async()=>execute(params,'run')
   };}
 };
}};
let now=1791700000;let lastCode=null;let fetchCount=0;let turnstileCount=0;let failEmail=false;
const fetcher=async (url,options)=>{
  if(String(url).includes('siteverify')){turnstileCount++;return Response.json({success:true,hostname:'next.anevum.com'});}
  if(String(url).includes('resend.com/emails')){fetchCount++;if(failEmail)return Response.json({error:'blocked'},{status:500});const payload=JSON.parse(options.body);assert.equal(payload.template?.id,'anevum-v1-sign-in-otp');assert.equal(payload.template?.variables?.EXPIRES_MINUTES,10);lastCode=payload.template.variables.CODE;assert.match(lastCode,/^\d{8}$/);assert.ok(!options.headers.authorization.includes('test-sign-in-code'));assert.match(options.headers['idempotency-key'],/^anevum-otp\/[0-9a-f]{32}$/);return Response.json({id:'email-test'});}
  throw Error('Unexpected outgoing network call');
};
const app=createMemberWorker({fetcher,clock:()=>now});
const env={COMMUNITY_DB:db,STAGING_JOIN_ENABLED:'true',STAGING_INVITE_EMAILS:'tester@example.com,rate@example.com,offline@example.com,second@example.com,attacked@example.com,another@example.com',AUTH_PEPPER:'a'.repeat(64),RESEND_API_KEY:'test-sending-key',TURNSTILE_SECRET:'test-challenge-secret'};
function req(path,method='GET',body,opts={}){return new Request('https://next.anevum.com'+path,{method,headers:{origin:opts.origin??'https://next.anevum.com','sec-fetch-site':opts.fetchSite??'same-origin', 'cf-connecting-ip':opts.ip??'203.0.113.33','content-type':'application/json',...(opts.cookie?{cookie:opts.cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});}
const post=(path,body,opts)=>app.fetch(req(path,'POST',body,opts),env);
const get=(path,opts)=>app.fetch(req(path,'GET',undefined,opts),env);
const inspect=query;
test.after(()=>sqlite.close());
test('staging schema includes accounts, sessions, hashed OTP, rates and migration marker',()=>{
 const names=inspect("SELECT name FROM sqlite_master WHERE type='table'").map(x=>x.name);
 for(const n of ['member_accounts','member_sessions','member_email_challenges','member_request_limits'])assert.ok(names.includes(n),n);
 assert.ok(inspect("SELECT version FROM schema_migrations WHERE version='0003_member_identity_staging'").length);
});
test('responsive account interface is real, isolated and labels disabled registration honestly',async()=>{
 const html=await app.fetch(req('/api/v1/member/join'),env);assert.equal(html.status,200);const content=await html.text();
 for(const text of ['Join ANEVUM','Creator accounts are in private testing','/api/v1/member/join.css','/api/v1/member/join.js','0x4AAAAAAFUPr86b6UW8tGqo'])assert.ok(content.includes(text),text);
 assert.match(html.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.match(html.headers.get('x-robots-tag'),/noindex/);
 const style=await app.fetch(req('/api/v1/member/join.css'),env);assert.match(style.headers.get('content-type'),/text\/css/);assert.ok((await style.text()).includes('@media(max-width:430px)'));
 const js=await app.fetch(req('/api/v1/member/join.js'),env);assert.match(js.headers.get('content-type'),/javascript/);assert.ok((await js.text()).includes('!health.signupEnabled'));
 assert.equal((await app.fetch(req('/api/v1/member/join/other'),env)).status,404);
});
test('healthy service reports readiness without exposing secrets',async()=>{
 const r=await get('/api/v1/member/health');assert.equal(r.status,200);assert.equal((await r.json()).signupEnabled,true);
 assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.ok(!(await (await get('/api/v1/member/health')).text()).includes('test-sending-key'));
});
test('missing secrets and cross-origin requests fail closed',async()=>{
 assert.equal((await member.fetch(req('/api/v1/member/health'),{})).status,503);
 assert.equal((await post('/api/v1/member/start',{email:'tester@example.com',turnstileToken:'sample-token-123'},{origin:'https://evil.example'})).status,403);
 assert.equal((await post('/api/v1/member/start',{email:'tester@example.com',turnstileToken:'sample-token-123'},{fetchSite:'cross-site'})).status,403);
 assert.equal((await app.fetch(req('/api/v1/member/me','PUT'),env)).status,405);
 assert.equal((await app.fetch(req('/command/rhen'),env)).status,404);
});
test('OTP issuance stores only an HMAC code, enforces Turnstile, and does not echo code',async()=>{
 assert.equal((await post('/api/v1/member/start',{email:'tester@example.com',turnstileToken:'invalid'})).status,403);
 const r=await post('/api/v1/member/start',{email:'TESTER@EXAMPLE.COM',turnstileToken:'sample-token-123'});assert.equal(r.status,202,await r.clone().text());
 const text=await r.text();assert.ok(lastCode);assert.ok(!text.includes(lastCode));
 const challenge=inspect('SELECT code_hash,email_key,challenge_id,attempts FROM member_email_challenges')[0];assert.match(challenge.code_hash,/^[0-9a-f]{64}$/);assert.ok(challenge.code_hash!==lastCode);assert.equal(challenge.attempts,0);
 assert.equal(fetchCount,1);assert.equal(turnstileCount,1);
});
test('bad code increments attempts but never creates a session',async()=>{
 const r=await post('/api/v1/member/verify',{email:'tester@example.com',code:'00000000'});assert.equal(r.status,401);
 assert.equal(inspect('SELECT attempts FROM member_email_challenges')[0].attempts,1);assert.equal(inspect('SELECT count(*) n FROM member_accounts')[0].n,0);
});
let cookie,memberId;
test('valid one-time code creates a verified member and securely scoped session',async()=>{
 const r=await post('/api/v1/member/verify',{email:'tester@example.com',code:lastCode});assert.equal(r.status,200,await r.clone().text());
 cookie=r.headers.get('set-cookie');assert.match(cookie,/__Host-anevum_stage_sid=[a-f0-9]{64}/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);
 memberId=(await r.json()).member.id;assert.ok(memberId);assert.equal(inspect('SELECT count(*) n FROM member_accounts')[0].n,1);
 assert.equal(inspect('SELECT count(*) n FROM member_sessions')[0].n,1);
 assert.equal((await post('/api/v1/member/verify',{email:'tester@example.com',code:lastCode})).status,401);
 const session=inspect('SELECT token_hash FROM member_sessions')[0];assert.ok(!cookie.includes(session.token_hash));
});
test('authentication requires a live DB session not a fake cookie',async()=>{
 assert.equal((await get('/api/v1/member/me')).status,401);
 assert.equal((await get('/api/v1/member/me',{cookie:'__Host-anevum_stage_sid='+('f'.repeat(64))})).status,401);
 const r=await get('/api/v1/member/me',{cookie});assert.equal(r.status,200);const person=(await r.json()).member;
 assert.equal(person.id,memberId);assert.equal(person.email,'tester@example.com');assert.equal(person.handle,null);
});
test('profile creation is server-scoped and rejects reserved or hijacked handles',async()=>{
 const p='/api/v1/member/profile';
 assert.equal((await post(p,{handle:'memberone',displayName:'Member One'})).status,401);
 assert.equal((await post(p,{handle:'admin',displayName:'Owner'},{cookie})).status,400);
 const r=await post(p,{handle:'memberone',displayName:'A Human Creator',bio:'I build useful things.'},{cookie});assert.equal(r.status,200,await r.clone().text());
 assert.equal((await r.json()).profile.handle,'memberone');
 assert.equal(inspect('SELECT is_staff FROM creator_profiles WHERE member_id=?',[memberId])[0].is_staff,0);
 assert.equal((await post(p,{handle:'sneaky',displayName:'Spoof'},{cookie})).status,409);
 const up=await post(p,{handle:'memberone',displayName:'Updated Creator',bio:'New biography'},{cookie});assert.equal(up.status,200);
});
test('correct but expired code is refused; rate limits stop email storms',async()=>{
 now+=601;
 await post('/api/v1/member/start',{email:'rate@example.com',turnstileToken:'sample-token-123'});
 const code=lastCode;now+=601;
 assert.equal((await post('/api/v1/member/verify',{email:'rate@example.com',code})).status,401);
 now+=3601;fetchCount=0;
 for(let i=0;i<5;i++){await post('/api/v1/member/start',{email:'rate@example.com',turnstileToken:'sample-token-123'});}
 assert.equal(fetchCount,3,'only 3 issues permitted per email/hour');
});
test('email provider outage removes pending code and cannot complete login',async()=>{
 now+=3601;failEmail=true;
 const before=inspect('SELECT count(*) n FROM member_email_challenges')[0].n;
 const r=await post('/api/v1/member/start',{email:'offline@example.com',turnstileToken:'sample-token-123'});
 assert.equal(r.status,503);assert.equal(inspect('SELECT count(*) n FROM member_email_challenges')[0].n,before);
 failEmail=false;
});

test("a second verified member cannot overwrite the first member's identity or profile",async()=>{
 now+=3601;
 const started=await post('/api/v1/member/start',{email:'SECOND@EXAMPLE.COM',turnstileToken:'sample-token-123'});assert.equal(started.status,202);
 const delivered=lastCode;
 const verified=await post('/api/v1/member/verify',{email:'second@example.com',code:delivered});assert.equal(verified.status,200);
 const other=(await verified.json()).member.id,otherCookie=verified.headers.get('set-cookie');assert.notEqual(other,memberId);
 assert.equal((await post('/api/v1/member/profile',{handle:'memberone',displayName:'Impersonator'},{cookie:otherCookie})).status,409);
 assert.equal((await post('/api/v1/member/profile',{handle:'membertwo',displayName:'Another Creator'},{cookie:otherCookie})).status,200);
 const a=await (await get('/api/v1/member/me',{cookie})).json();
 const b=await (await get('/api/v1/member/me',{cookie:otherCookie})).json();
 assert.equal(a.member.handle,'memberone');assert.equal(b.member.handle,'membertwo');
 assert.notEqual(a.member.email,b.member.email);
 assert.equal(inspect('SELECT count(*) n FROM creator_profiles WHERE is_staff=1')[0].n,0);
});
test('verification attempts are capped per email and code cannot be brute-forced indefinitely',async()=>{
 now+=3601;
 assert.equal((await post('/api/v1/member/start',{email:'attacked@example.com',turnstileToken:'sample-token-123'})).status,202);
 const valid=lastCode;
 for(let n=0;n<5;n++)assert.equal((await post('/api/v1/member/verify',{email:'attacked@example.com',code:'00000000'})).status,401);
 assert.equal((await post('/api/v1/member/verify',{email:'attacked@example.com',code:valid})).status,401);
 const count=inspect('SELECT count(*) n FROM member_accounts WHERE email=?',['attacked@example.com'])[0].n;assert.equal(count,0);
});
test('foreign-site Turnstile passes no login challenge',async()=>{
 const malicious=createMemberWorker({clock:()=>now,fetcher:async()=>Response.json({success:true,hostname:'other.example.com'})});
 assert.equal((await malicious.fetch(req('/api/v1/member/start','POST',{email:'another@example.com',turnstileToken:'sample-token-123'}),env)).status,403);
});

test('sign-out revokes sessions and clears cookie',async()=>{
 const r=await post('/api/v1/member/sign-out',{}, {cookie});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
 assert.equal((await get('/api/v1/member/me',{cookie})).status,401);
});
test('missing sending configuration disables registration without issuing challenges',async()=>{
 const before=inspect('SELECT count(*) n FROM member_email_challenges')[0].n;
 const cfg={...env};delete cfg.RESEND_API_KEY;
 const r=await app.fetch(req('/api/v1/member/start','POST',{email:'new@example.com',turnstileToken:'sample-token-123'}),cfg);
 assert.equal(r.status,503);assert.equal(inspect('SELECT count(*) n FROM member_email_challenges')[0].n,before);
});

test('staging invite gating prevents uninvited mail and registration',async()=>{
  const before=fetchCount;
  const result=await post('/api/v1/member/start',{email:'outside@example.com',turnstileToken:'sample-token-123'});
  assert.equal(result.status,202);
  assert.equal(fetchCount,before);
  assert.equal(inspect('SELECT count(*) n FROM member_accounts WHERE email=?',['outside@example.com'])[0].n,0);
  assert.equal((await post('/api/v1/member/verify',{email:'outside@example.com',code:'00000001'})).status,401);
});
test('explicit stage launch gate overrides configured email and Turnstile',async()=>{
  const inactive={...env,STAGING_JOIN_ENABLED:'false'};
  const health=await app.fetch(req('/api/v1/member/health'),inactive);
  assert.equal((await health.json()).signupEnabled,false);
  const r=await app.fetch(req('/api/v1/member/start','POST',{email:'tester@example.com',turnstileToken:'sample-token-123'}),inactive);
  assert.equal(r.status,503);
});
test('staging identity assets are only served under a scoped member path',async()=>{
  for(const route of ['/join','/join.js','/join.css'])assert.equal((await get(route)).status,404);
  const html=(await (await get('/api/v1/member/join')).text());
  assert.match(html,/src="\/api\/v1\/member\/join.js"/);
  assert.match(html,/href="\/api\/v1\/member\/join.css"/);
});

test('invitation rules cannot be probed with an invalid Turnstile token',async()=>{
  const r=await post('/api/v1/member/start',{email:'outside@example.com',turnstileToken:'invalid'});
  assert.equal(r.status,403);
});