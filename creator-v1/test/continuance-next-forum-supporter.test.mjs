import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalForums} from '../canonical-auth/forums.mjs';
import {readSupporterRewards,publicForumSupporterAppearanceMap} from '../canonical-auth/supporter-rewards.mjs';
import {hydratedPublicMemberCard,hydratedPublicMemberCards} from '../canonical-auth/public-member-card.mjs';

const NOW=Math.floor(Date.now()/1000)*1000,DAY=86400000,BASE='https://a.anevum.com';
const req=path=>new Request(BASE+path);
const migrate=(db,name)=>db.exec(readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8'));
function setup(withSupporter=true){
 const f=fixture();migrate(f.db,'0006_member_community_forums.sql');
 if(withSupporter)migrate(f.db,'0006_supporter_commerce.sql');
 Object.assign(f.env,{
  CANONICAL_FORUM_ENABLED:'true',CANONICAL_SUPPORTER_COMMERCE_ENABLED:'true',
  CANONICAL_STRIPE_SECRET_KEY:'sk_test_'+'a'.repeat(40),
  CANONICAL_STRIPE_WEBHOOK_SECRET:'whsec_'+'b'.repeat(40),
  CANONICAL_STRIPE_MONTHLY_PRICE_ID:'price_anevumMonthly12345',
  CANONICAL_STRIPE_ANNUAL_PRICE_ID:'price_anevumAnnual12345'
 });
 const seed=(id,visibility='public',verified=1)=>{
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,1,1)')
   .run(id,id,id+'@synthetic.invalid',verified);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at) VALUES(?,?,?,?,?,1,1)')
   .run(id,'test_'+id,'Test '+id,'',visibility);
 };
 const support=(id,{consent=1,age=120,frame='stellar'}={})=>{
  const customer='cus_'+id+'ForumExample',subscription='sub_'+id+'ForumExample',started=NOW-age*DAY;
  f.db.prepare('INSERT INTO supporter_customers(member_user_id,stripe_customer_id,created_at_ms) VALUES(?,?,?)').run(id,customer,started);
  f.db.prepare('INSERT INTO supporter_subscriptions(stripe_subscription_id,member_user_id,stripe_customer_id,stripe_price_id,billing_interval,status,current_period_end_ms,started_at_ms,cancel_at_period_end,synced_at_ms) VALUES(?,?,?,?,?,?,?,?,0,?)')
   .run(subscription,id,customer,f.env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,'month','active',NOW+DAY*14,started,NOW);
  f.db.prepare('INSERT INTO supporter_visibility(member_user_id,public_insignia,revision,updated_at_ms) VALUES(?,?,1,?)').run(id,consent,NOW);
  f.db.prepare('INSERT INTO supporter_appearance(member_user_id,selected_seal,selected_frame,selected_aura,revision,updated_at_ms) VALUES(?,?,?,?,1,?)')
   .run(id,'orbit',frame,'eclipse',NOW);
  return customer;
 };
 const post=id=>{
  const threadId=crypto.randomUUID();
  f.db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,published_at,updated_at) VALUES(?,?,?,?,?,?,'published',?,?,?)")
   .run(threadId,id,crypto.randomUUID(),'making','Test-only public writing','Synthetic approved writing',1000,1000,1000);
  return threadId;
 };
 return {...f,seed,support,post};
}

test('only consented, verified public subscriber appearance reaches list and detail without financial data',async()=>{
 const f=setup();try{
  f.seed('author');f.seed('private','private');f.seed('no_consent');f.seed('unverified','public',0);
  f.support('author');f.support('private');f.support('no_consent',{consent:0});f.support('unverified');
  const thread=f.post('author');f.post('private');f.post('no_consent');f.post('unverified');
  const map=await publicForumSupporterAppearanceMap(f.env,['author','author','private','no_consent','unverified'],NOW);
  assert.deepEqual([...map.keys()],['author']);
  const canonical=await readSupporterRewards(f.env,'author',NOW,true);
  assert.deepEqual(map.get('author'),{supporterAppearance:canonical.selected});
  assert.deepEqual(map.get('author'),{supporterAppearance:{seal:'orbit',frame:'stellar',aura:'eclipse'}});
  const list=await (await canonicalForums(req('/api/v1/community/threads'),f.env)).json();
  assert.equal(list.items.length,2,'Private and unverified members do not appear');
  const member=list.items.find(x=>x.author.handle==='test_author').author;
  assert.deepEqual(member.supporterAppearance,canonical.selected);
  assert.equal(member.email,undefined);assert.equal(member.member_identity_key,undefined);
  assert.equal(member.stripe_customer_id,undefined);assert.equal(member.unlocks,undefined);
  assert.equal(list.items.find(x=>x.author.handle==='test_no_consent').author.supporterAppearance,undefined);
  const detail=await (await canonicalForums(req('/api/v1/community/threads/'+thread),f.env)).json();
  assert.deepEqual(detail.author.supporterAppearance,canonical.selected);
 }finally{f.db.close()}
});

test('public supporter consent is independent from show_stats, and instant opt-out fails closed',async()=>{
 const f=setup();try{
  f.seed('author');f.support('author');const thread=f.post('author');
  f.db.prepare("INSERT INTO member_space_settings(user_id,featured_json,show_stats) VALUES(?,'[]',0)").run('author');
  let card=(await (await canonicalForums(req('/api/v1/community/threads/'+thread),f.env)).json()).author;
  assert.equal(card.level,null,'Stats opt-out remains enforced');
  assert.deepEqual(card.supporterAppearance,{seal:'orbit',frame:'stellar',aura:'eclipse'});
  f.db.prepare('UPDATE supporter_visibility SET public_insignia=0 WHERE member_user_id=?').run('author');
  card=(await (await canonicalForums(req('/api/v1/community/threads/'+thread),f.env)).json()).author;
  assert.equal(card.supporterAppearance,undefined,'Consent revocation is effective without caching');
  f.db.prepare('UPDATE supporter_visibility SET public_insignia=1 WHERE member_user_id=?').run('author');
  f.db.prepare("UPDATE member_creator_profiles SET visibility='private' WHERE user_id=?").run('author');
  assert.equal((await canonicalForums(req('/api/v1/community/threads/'+thread),f.env)).status,404);
  assert.equal((await publicForumSupporterAppearanceMap(f.env,['author'],NOW)).size,0);
 }finally{f.db.close()}
});

test('dispute, stale reconciliation, canceled status and locked frame follow canonical rules',async()=>{
 const f=setup();try{
  f.seed('author');const customer=f.support('author');
  assert.equal((await publicForumSupporterAppearanceMap(f.env,['author'],NOW)).size,1);
  f.db.prepare("INSERT INTO supporter_billing_holds(stripe_customer_id,reason,stripe_event_id,created_at_ms) VALUES(?,'dispute','evt_TestForumDispute001',?)").run(customer,NOW);
  assert.equal((await publicForumSupporterAppearanceMap(f.env,['author'],NOW)).size,0);
  f.db.prepare('DELETE FROM supporter_billing_holds WHERE stripe_customer_id=?').run(customer);
  f.db.prepare('UPDATE supporter_subscriptions SET synced_at_ms=? WHERE member_user_id=?').run(NOW-4*DAY,'author');
  assert.equal((await publicForumSupporterAppearanceMap(f.env,['author'],NOW)).size,0);
  f.db.prepare("UPDATE supporter_subscriptions SET synced_at_ms=?,status='canceled' WHERE member_user_id=?").run(NOW,'author');
  assert.equal((await publicForumSupporterAppearanceMap(f.env,['author'],NOW)).size,0);
  f.db.prepare("UPDATE supporter_subscriptions SET status='active',started_at_ms=? WHERE member_user_id=?").run(NOW-10*DAY,'author');
  assert.equal((await publicForumSupporterAppearanceMap(f.env,['author'],NOW)).get('author').supporterAppearance.frame,'orbital',
   '90-day Stellar frame is downgraded by the existing entitlement authority');
 }finally{f.db.close()}
});

test('disabled and missing supporter schema remain invisible without breaking default forum',async()=>{
 for(const withSupporter of [false,true]){
  const f=setup(withSupporter);try{
   f.seed('author');const thread=f.post('author');
   const disabled={...f.env,CANONICAL_SUPPORTER_COMMERCE_ENABLED:'false'};
   const unsafeLiveKey={...f.env,CANONICAL_STRIPE_SECRET_KEY:'sk_live_'+'a'.repeat(40)};
   assert.equal((await publicForumSupporterAppearanceMap(disabled,['author'],NOW)).size,0);
   assert.equal((await publicForumSupporterAppearanceMap(unsafeLiveKey,['author'],NOW)).size,0);
   if(!withSupporter){
    assert.equal((await publicForumSupporterAppearanceMap(f.env,['author'],NOW)).size,0);
    const response=await canonicalForums(req('/api/v1/community/threads/'+thread),f.env);
    assert.equal(response.status,200);
    assert.equal((await response.json()).author.supporterAppearance,undefined);
   }
  }finally{f.db.close()}
 }
});

test('public hydration API remains backward compatible with all non-forum callers',async()=>{
 const f=setup();try{
  f.seed('author');f.support('author');
  const raw={member_identity_key:'author',handle:'test_author',display_name:'Test author',avatar_version:0,
   member_xp:0,earned_awards:null,featured_json:'[]',show_stats:1};
  const old=await hydratedPublicMemberCard(f.env.MEMBER_DB,raw);
  assert.equal(old.supporterAppearance,undefined);
  const complete=await hydratedPublicMemberCard(f.env.MEMBER_DB,raw,false,false,false,f.env);
  const many=await hydratedPublicMemberCards(f.env.MEMBER_DB,[raw,raw],false,false,false,f.env);
  assert.deepEqual(complete.supporterAppearance,{seal:'orbit',frame:'stellar',aura:'eclipse'});
  assert.deepEqual(many[0].supporterAppearance,complete.supporterAppearance);
  assert.deepEqual(many[1].supporterAppearance,complete.supporterAppearance);
  assert.ok(Object.keys(complete).every(k=>!['id','customerId','subscription','member_identity_key','billing'].includes(k)));
 }finally{f.db.close()}
});
