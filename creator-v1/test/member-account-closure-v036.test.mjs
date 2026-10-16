import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalAccountClosure} from '../canonical-auth/account-closure.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {supporterMember} from '../canonical-auth/supporter.mjs';
const NOW=1792155000000,DAY=86400000;
const ORIGIN='https://a.anevum.com',PATH='/api/v1/member/account-closure';
const PHRASE='DELETE MY ANEVUM ACCOUNT';
const person={id:'member-one',email:'one@fixture.invalid',emailVerified:true,name:'One'};
const stranger={id:'member-two',email:'two@fixture.invalid',emailVerified:true,name:'Two'};
const sess='session_member_one_123';
const session={id:sess};
const req=(method='GET',payload,origin=ORIGIN)=>new Request(ORIGIN+PATH,{
 method,headers:{origin,'content-type':'application/json','sec-fetch-site':'same-origin'},
 body:payload===undefined?undefined:JSON.stringify(payload)
});
const confirmation={confirmation:PHRASE,memberEmail:person.email};
function setup({enabled=true,commerce=false}={}){
 const {db,env}=fixture();
 db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_supporter_commerce.sql',import.meta.url),'utf8'));
 env.CANONICAL_ACCOUNT_CLOSURE_ENABLED=enabled?'true':'false';
 if(commerce)Object.assign(env,{
  CANONICAL_SUPPORTER_COMMERCE_ENABLED:'true',
  CANONICAL_STRIPE_SECRET_KEY:'sk_test_'+('m'.repeat(40)),
  CANONICAL_STRIPE_WEBHOOK_SECRET:'whsec_'+('w'.repeat(40)),
  CANONICAL_STRIPE_MONTHLY_PRICE_ID:'price_ClosingMonth12345',
  CANONICAL_STRIPE_ANNUAL_PRICE_ID:'price_ClosingYear12345'
 });
 for(const p of [person,stranger]){
  db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,?,?)')
   .run(p.id,p.name,p.email,NOW-DAY,NOW-DAY);
  db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,?,?)')
   .run(p.id,p.id.endsWith('one')?'ones':'twos',p.name,'Creator',Math.floor(NOW/1000)-DAY/1000,Math.floor(NOW/1000)-DAY/1000);
 }
 db.prepare('INSERT INTO session(id,expiresAt,token,createdAt,updatedAt,userId) VALUES(?,?,?,?,?,?)')
  .run(sess,NOW+DAY,'member_one_token',NOW-60000,NOW-60000,person.id);
 db.prepare('INSERT INTO session(id,expiresAt,token,createdAt,updatedAt,userId) VALUES(?,?,?,?,?,?)')
  .run('session_member_two_123',NOW+DAY,'member_two_token',NOW-DAY,NOW-DAY,stranger.id);
 return {db,env};
}
test('closure is disabled by default even for verified members',async()=>{
 const {db,env}=setup({enabled:false});
 try{
  const result=await (await canonicalAccountClosure(req(),env,person,session,{now:NOW})).json();
  assert.equal(result.available,false);
  assert.equal(result.canClose,false);
  assert.equal((await canonicalAccountClosure(req('POST',confirmation),env,person,session,{now:NOW})).status,404);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user').get().n,2);
 }finally{db.close()}
});
test('recent verified session, exact email and confirmation are mandatory',async()=>{
 const {db,env}=setup();
 try{
  assert.equal((await canonicalAccountClosure(req('POST',{...confirmation,confirmation:'DELETE'}),env,person,session,{now:NOW})).status,400);
  assert.equal((await canonicalAccountClosure(req('POST',{...confirmation,memberEmail:stranger.email}),env,person,session,{now:NOW})).status,400);
  assert.equal((await canonicalAccountClosure(req('POST',{...confirmation,xp:9999}),env,person,session,{now:NOW})).status,400);
  assert.equal((await canonicalAccountClosure(req('POST',confirmation),env,person,{id:'unknown-session'},{now:NOW})).status,403);
  const invalid=await canonicalAccountClosure(req('POST',confirmation),env,{...person,emailVerified:false},session,{now:NOW});
  assert.equal(invalid.status,403);
  db.prepare('UPDATE session SET createdAt=? WHERE id=?').run(NOW-700000,sess);
  assert.equal((await canonicalAccountClosure(req('POST',confirmation),env,person,session,{now:NOW})).status,403);
  const state=await (await canonicalAccountClosure(req(),env,person,session,{now:NOW})).json();
  assert.equal(state.canClose,true);
  assert.equal(state.reauthRequired,true);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user').get().n,2);
 }finally{db.close()}
});
test('owner can permanently remove only their free canonical account and all sessions',async()=>{
 const {db,env}=setup();
 try{
  db.prepare('INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at,revision) VALUES(?,?,?,?,?,1)')
   .run('54a5d80e-091c-4b2a-8840-ad203d31223b',person.id,'Personal wall entry',Math.floor(NOW/1000),Math.floor(NOW/1000));
  db.prepare('INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,?,?,?,?)')
   .run(person.id,'test-event-123','test_button',5,Math.floor(NOW/1000));
  const eligible=await (await canonicalAccountClosure(req(),env,person,session,{now:NOW})).json();
  assert.deepEqual(eligible,{available:true,canClose:true,reason:null,reauthRequired:false});
  const response=await canonicalAccountClosure(req('POST',confirmation),env,person,session,{now:NOW});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{deleted:true,sessionRevoked:true});
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user WHERE id=?').get(person.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM session WHERE userId=?').get(person.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_creator_profiles WHERE user_id=?').get(person.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_wall_posts WHERE user_id=?').get(person.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events WHERE user_id=?').get(person.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_account_closure_guards').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user WHERE id=?').get(stranger.id).n,1);
  assert.equal((await canonicalAccountClosure(req(),env,person,session,{now:NOW})).status,403);
 }finally{db.close()}
});
test('billing history and canceled subscribers cannot be silently deleted',async()=>{
 const {db,env}=setup();
 try{
  db.prepare('INSERT INTO supporter_customers(member_user_id,stripe_customer_id,created_at_ms) VALUES(?,?,?)')
   .run(person.id,'cus_HistoryOwner123456',NOW-DAY);
  const view=await (await canonicalAccountClosure(req(),env,person,session,{now:NOW})).json();
  assert.equal(view.canClose,false);
  assert.equal(view.reason,'billing-review');
  assert.equal((await canonicalAccountClosure(req('POST',confirmation),env,person,session,{now:NOW})).status,409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user WHERE id=?').get(person.id).n,1);
  assert.equal(db.prepare('SELECT stripe_customer_id FROM supporter_customers WHERE member_user_id=?').get(person.id).stripe_customer_id,'cus_HistoryOwner123456');
 }finally{db.close()}
});
test('even an abandoned or completed payment intent blocks automated deletion',async()=>{
 const {db,env}=setup();
 try{
  db.prepare('INSERT INTO supporter_checkout_intents(stripe_checkout_session_id,member_user_id,billing_interval,created_at_ms,abandoned_at_ms) VALUES(?,?,?,?,?)')
   .run('cs_test_HistoricalCheckout123',person.id,'month',NOW-DAY,NOW-700000);
  const view=await (await canonicalAccountClosure(req(),env,person,session,{now:NOW})).json();
  assert.equal(view.reason,'checkout-review');
  assert.equal((await canonicalAccountClosure(req('POST',confirmation),env,person,session,{now:NOW})).status,409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user WHERE id=?').get(person.id).n,1);
 }finally{db.close()}
});
test('concurrent Checkout guard blocks deletion and closure guard blocks new Stripe Checkout',async()=>{
 const {db,env}=setup({commerce:true});
 try{
  db.prepare('INSERT INTO supporter_checkout_guards(member_user_id,billing_interval,request_nonce,expires_at_ms,created_at_ms) VALUES(?,?,?,?,?)')
   .run(person.id,'month','nonce_active_checkout',NOW+100000,NOW-10000);
  assert.equal((await canonicalAccountClosure(req('POST',confirmation),env,person,session,{now:NOW})).status,409);
  db.prepare('DELETE FROM supporter_checkout_guards WHERE member_user_id=?').run(person.id);
  db.prepare('INSERT INTO member_account_closure_guards(member_user_id,request_nonce,expires_at_ms,created_at_ms) VALUES(?,?,?,?)')
   .run(person.id,'nonce_account_closing',NOW+600000,NOW);
  let stripeCalls=0;
  const attempt=await supporterMember(new Request(ORIGIN+'/api/v1/member/supporter/checkout',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   body:JSON.stringify({interval:'month'})
  }),env,person,{now:NOW,http:async()=>{stripeCalls++;throw Error('Stripe must not be called');}});
  assert.equal(attempt.status,409);
  assert.equal(stripeCalls,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_intents').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user WHERE id=?').get(person.id).n,1);
 }finally{db.close()}
});
test('canonical authenticated closure route rejects cross-site and logged-out deletion',async()=>{
 const {db,env}=setup();
 // The Worker evaluates Date.now() itself; use the current test clock for
 // this one end-to-end route exercise, not the deterministic frozen NOW.
 const current=Date.now();
 db.prepare('UPDATE session SET createdAt=?,expiresAt=? WHERE id=?')
  .run(current-60000,current+DAY,sess);
 const worker=createCanonicalStageWorker({authFactory:()=>({
  api:{getSession:async({headers})=>
   headers.get('cookie')==='anevum_can_stage.session_token=good'?{user:person,session}:{user:null,session:null}},
  handler:async()=>new Response('{}',{status:200})
 })});
 try{
  const noAuth=await worker.fetch(req('POST',confirmation),env);
  assert.equal(noAuth.status,401);
  const foreign=new Request(ORIGIN+PATH,{method:'POST',
   headers:{origin:'https://evil.invalid','sec-fetch-site':'cross-site','content-type':'application/json',cookie:'anevum_can_stage.session_token=good'},
   body:JSON.stringify(confirmation)});
  assert.equal((await worker.fetch(foreign,env)).status,403);
  const method=new Request(ORIGIN+PATH,{method:'DELETE',headers:{origin:ORIGIN,cookie:'anevum_can_stage.session_token=good'}});
  assert.equal((await worker.fetch(method,env)).status,405);
  const successful=new Request(ORIGIN+PATH,{method:'POST',
   headers:{origin:ORIGIN,'content-type':'application/json',cookie:'anevum_can_stage.session_token=good'},
   body:JSON.stringify(confirmation)});
  assert.equal((await worker.fetch(successful,env)).status,200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user WHERE id=?').get(person.id).n,0);
 }finally{db.close()}
});
