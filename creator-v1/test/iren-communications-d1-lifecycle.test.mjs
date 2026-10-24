/**
 * Uses real SQLite (same SQL semantics as D1), no external network / provider.
 * Node 22 `node:sqlite` is experimental; pinned in CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createCommunicationsWorker} from '../communications/worker.mjs';

const migration=fs.readFileSync(new URL('../communications/migrations/0001_optional_mail_consent.sql',import.meta.url),'utf8');
const start=Date.parse('2026-10-24T12:00:00Z');
function harness({secret='rate-key-should-be-at-least-32-characters',enabled='true'}={}){
 const raw=new DatabaseSync(':memory:');
 raw.exec('PRAGMA foreign_keys=ON;');
 raw.exec(migration);
 const sent=[];
 const db={prepare(sql){
  const stmt=raw.prepare(sql);
  const invoke=args=>({
   async first(){return stmt.get(...args)??null},
   async all(){return {success:true,results:stmt.all(...args)}},
   async run(){const result=stmt.run(...args);return {success:true,meta:{changes:Number(result.changes)}}}
  });
  return {...invoke([]),bind(...args){return invoke(args)}};
 }};
 let instant=start;
 const worker=createCommunicationsWorker({clock:()=>instant,send:async(_env,email)=>{sent.push(email)}});
 const env={
  COMMUNICATIONS_DB:db,COMMUNICATIONS_EMAIL_ENABLED:enabled,
  COMMUNICATIONS_PUBLIC_ORIGIN:'https://anevum.com',
  COMMUNICATIONS_RESEND_API_KEY:'test-token-not-used-for-transport-12345678',
  COMMUNICATIONS_RATE_SECRET:secret,
  COMMUNICATIONS_FROM:'ANEVUM Updates <updates@anevum.com>'
 };
 const execute=(action,body,{origin='https://anevum.com',method='POST',ip='203.0.113.44',host='anevum.com',contentType='application/json'}={})=>
 worker.fetch(new Request('https://'+host+'/api/v1/communications/'+action,{
   method,headers:{Origin:origin,'content-type':contentType,'cf-connecting-ip':ip,'sec-fetch-site':'same-origin'},
   body:method==='POST'?(typeof body==='string'?body:JSON.stringify(body)):undefined
 }),env);
 const email='someone@example.org',topics={releases:true,weekly:true};
 const subscribe=(address=email,t=topics,options={})=>execute('subscribe',{email:address,topics:t,consent:true},options);
 const get=address=>raw.prepare('SELECT * FROM communication_subscribers WHERE email=?').get(address);
 const logs=address=>raw.prepare('SELECT event FROM communication_consent_log WHERE subscriber_id=(SELECT id FROM communication_subscribers WHERE email=?) ORDER BY id').all(address).map(x=>x.event);
 const token=mail=>decodeURIComponent(mail.text.match(/token=([^\s]+)/)?.[1]||'');
 return {raw,db,env,sent,worker,email,topics,execute,subscribe,get,logs,token,advance:ms=>instant+=ms,close:()=>raw.close()};
}
test('actual SQLite schema initializes, enforces manifest and correct table isolation',()=>{
 const h=harness();
 try{
  assert.equal(h.raw.prepare("SELECT issuer FROM communication_manifest WHERE id=1").get().issuer,'anevum-communications-v1');
  assert.equal(h.raw.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('communication_subscribers','communication_consent_log','communication_rate_windows')").get().n,3);
  assert.throws(()=>h.raw.prepare("INSERT INTO communication_subscribers (id,email,status,created_at,updated_at) VALUES ('x','invalid','confirmed',1,1)").run());
 }finally{h.close()}
});
test('subscription requires explicit topics, consent, same origin, correct secret and manifest',async()=>{
 const h=harness();
 try{
  assert.equal((await h.execute('subscribe',{email:h.email,topics:h.topics,consent:false})).status,400);
  assert.equal((await h.execute('subscribe',{email:h.email,topics:{releases:false,weekly:false},consent:true})).status,400);
  assert.equal((await h.execute('subscribe',{email:h.email,topics:{releases:true,weekly:true},consent:true,role:'owner'})).status,400);
  assert.equal((await h.execute('subscribe',{email:h.email,topics:h.topics,consent:true},{origin:'https://evil.example'})).status,403);
  assert.equal((await h.execute('subscribe',{email:h.email,topics:h.topics,consent:true},{host:'evil.example'})).status,404);
  assert.equal((await h.execute('subscribe',{email:h.email,topics:h.topics,consent:true},{contentType:'text/plain'})).status,400);
  assert.equal(h.sent.length,0);
  h.env.COMMUNICATIONS_RATE_SECRET='short';
  assert.equal((await h.subscribe()).status,503);
  h.env.COMMUNICATIONS_RATE_SECRET='rate-key-should-be-at-least-32-characters';
  h.raw.prepare("DELETE FROM communication_manifest WHERE id=1").run();
  assert.equal((await h.subscribe()).status,503);
 }finally{h.close()}
});
test('double opt-in stores zero active topics until confirmed; token expires and cannot replay',async()=>{
 const h=harness();
 try{
  const response=await h.subscribe();assert.equal(response.status,202);
  assert.deepEqual(await response.json(),{status:'check_email'});
  const pending=h.get(h.email);
  assert.equal(pending.status,'pending');assert.equal(pending.releases,0);assert.equal(pending.weekly,0);
  assert.equal(pending.pending_releases,1);assert.equal(pending.pending_weekly,1);
  assert.equal(pending.confirm_hash.length,64);
  assert.equal(h.sent.length,1);
  assert.match(h.sent[0].html,/<a href="https:\/\/anevum\.com\/updates\/preferences\?action=confirm&amp;token=/);
  assert.doesNotMatch(h.sent[0].html,/<script|onclick=|href="https:\/\/evil/i);
  const token=h.token(h.sent[0]);
  assert.match(token,/^[A-Za-z0-9_-]{43}$/);
  assert.equal(h.logs(h.email).join(','),'optin-requested');
  const confirmed=await h.execute('confirm',{token});
  assert.equal(confirmed.status,200);
  const active=h.get(h.email);
  assert.equal(active.status,'confirmed');assert.equal(active.releases,1);assert.equal(active.weekly,1);
  assert.equal(active.confirm_hash,null);assert.equal(active.confirm_expires_at,null);
  assert.equal(h.logs(h.email).join(','),'optin-requested,confirmed');
  assert.equal((await h.execute('confirm',{token})).status,410);
 }finally{h.close()}
});
test('new confirmation reactivates a properly unsubscribed address only after new opt-in',async()=>{
 const h=harness();
 try{
  assert.equal((await h.subscribe()).status,202);
  let token=h.token(h.sent.at(-1));
  assert.equal((await h.execute('confirm',{token})).status,200);
  assert.equal((await h.execute('manage',{email:h.email})).status,202);
  assert.match(h.sent.at(-1).html,/<a href="https:\/\/anevum\.com\/updates\/preferences\?action=unsubscribe&amp;token=/);
  const stop=h.token(h.sent.at(-1));
  assert.equal((await h.execute('unsubscribe',{token:stop,topic:'all'})).status,200);
  assert.equal(h.get(h.email).status,'unsubscribed');
  assert.equal(h.get(h.email).releases,0);
  assert.equal(h.get(h.email).weekly,0);
  assert.equal((await h.execute('unsubscribe',{token:stop,topic:'all'})).status,410);
  assert.equal((await h.subscribe(h.email,{releases:true,weekly:false})).status,202);
  assert.equal(h.get(h.email).status,'unsubscribed');
  token=h.token(h.sent.at(-1));
  assert.equal((await h.execute('confirm',{token})).status,200);
  assert.equal(h.get(h.email).releases,1);
  assert.equal(h.get(h.email).weekly,0);
  assert.deepEqual(h.logs(h.email),['optin-requested','confirmed','unsubscribed','optin-requested','confirmed']);
 }finally{h.close()}
});
test('topic-specific unsubscribe preserves other consent and invalidates replay',async()=>{
 const h=harness();
 try{
  await h.subscribe();
  await h.execute('confirm',{token:h.token(h.sent.at(-1))});
  const before=h.get(h.email).unsub_version;
  await h.execute('manage',{email:h.email});
  let token=h.token(h.sent.at(-1));
  assert.match(token,/^v1\.[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/);
  const disabled=await h.execute('unsubscribe',{token,topic:'weekly'});
  assert.equal(disabled.status,200);
  assert.equal(h.get(h.email).releases,1);
  assert.equal(h.get(h.email).weekly,0);
  assert.equal(h.get(h.email).status,'confirmed');
  assert.ok(h.get(h.email).unsub_version>before);
  assert.equal((await h.execute('unsubscribe',{token,topic:'all'})).status,410);
  assert.equal(h.logs(h.email).at(-1),'preferences-disabled');
  await h.execute('manage',{email:h.email});
  token=h.token(h.sent.at(-1));
  assert.equal((await h.execute('unsubscribe',{token,topic:'all'})).status,200);
  assert.equal(h.get(h.email).status,'unsubscribed');
  assert.equal(h.logs(h.email).at(-1),'unsubscribed');
 }finally{h.close()}
});
test('confirmation and management token expiration cannot change consent',async()=>{
 const h=harness();
 try{
  await h.subscribe();
  const confirmation=h.token(h.sent.at(-1));
  h.advance(172801000);
  assert.equal((await h.execute('confirm',{token:confirmation})).status,410);
  assert.equal(h.get(h.email).status,'pending');
 }finally{h.close()}
 const k=harness();
 try{
  await k.subscribe();
  await k.execute('confirm',{token:k.token(k.sent.at(-1))});
  await k.execute('manage',{email:k.email});
  const token=k.token(k.sent.at(-1));
  k.advance(86401000);
  assert.equal((await k.execute('unsubscribe',{token,topic:'all'})).status,410);
  assert.equal(k.get(k.email).status,'confirmed');
 }finally{k.close()}
});
test('requesting a manage link does not cancel pending re-consent for confirmed users',async()=>{
 const h=harness();
 try{
  await h.subscribe();
  await h.execute('confirm',{token:h.token(h.sent.at(-1))});
  await h.subscribe(h.email,{releases:false,weekly:true});
  const pending=h.token(h.sent.at(-1));
  assert.ok(h.get(h.email).confirm_hash);
  await h.execute('manage',{email:h.email});
  assert.ok(h.get(h.email).confirm_hash,'manage link must preserve the pending confirmation');
  assert.equal((await h.execute('confirm',{token:pending})).status,200);
  assert.equal(h.get(h.email).releases,0);
  assert.equal(h.get(h.email).weekly,1);
 }finally{h.close()}
});
test('subscriber lookup and delivery failures do not enumerate existing addresses',async()=>{
 const h=harness();
 try{
  let r=await h.execute('manage',{email:h.email});
  assert.equal(r.status,202);
  assert.equal(h.sent.length,0);
  await h.subscribe();
  await h.execute('confirm',{token:h.token(h.sent.at(-1))});
  r=await h.execute('manage',{email:h.email});
  assert.equal(r.status,202);
  assert.equal(h.sent.length,2);
 }finally{h.close()}
 const h2=harness();
 try{
  const failWorker=createCommunicationsWorker({send:async()=>{throw Error('Provider down')},clock:()=>start});
  const req=new Request('https://anevum.com/api/v1/communications/subscribe',{
   method:'POST',headers:{Origin:'https://anevum.com','content-type':'application/json','cf-connecting-ip':'203.0.113.44'},
   body:JSON.stringify({email:h2.email,topics:h2.topics,consent:true})
  });
  assert.equal((await failWorker.fetch(req,h2.env)).status,202);
  assert.equal(h2.get(h2.email).status,'pending');
  assert.equal(h2.get(h2.email).confirmed_at,null);
 }finally{h2.close()}
});
test('IP and email quotas suppress repeat messages and never reveal subscription status',async()=>{
 const h=harness();
 try{
  for(let i=0;i<9;i++){
   const result=await h.subscribe('same@example.org',{weekly:false,releases:true});
   assert.equal(result.status,202);
   assert.deepEqual(await result.json(),{status:'check_email'});
  }
  assert.equal(h.sent.length,3);
 }finally{h.close()}
});
