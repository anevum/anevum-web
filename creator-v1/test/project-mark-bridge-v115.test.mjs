import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {createAnevumAchievements} from '../sdk/achievement-bridge-v115/browser.mjs';
import {createAnevumPublisher} from '../sdk/achievement-bridge-v115/server.mjs';
import {markBridgeReady} from '../canonical-auth/project-mark-bridge-v115.mjs';

const ORIGIN='https://a.anevum.com';
const P='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DEF='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEF3='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const KEY_ID='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SECRET='a'.repeat(64),DIGEST='f'.repeat(64);
const CALLBACK='https://creator.example.org/anevum/callback';
const NOW=1792800000;
const U={id:'v115-alice',emailVerified:true,email:'alice@test.invalid',name:'Alice'},
 B={id:'v115-bob',emailVerified:true,email:'bob@test.invalid',name:'Bob'};
const migration=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
function setup(t,{enabled=true,migrated=true,approved=true}={}){
 const f=fixture();
 f.db.exec(migration('0008_private_creator_studio.sql'));
 f.db.exec(migration('0015_private_creator_achievements.sql'));
 for(const user of [U,B]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(user.id,user.name,user.email);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(user.id,user.name.toLowerCase()+'115',user.name,100,100);
 }
 f.db.prepare("INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,category,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)")
  .run(P,U.id,randomUUID(),'observatory','Observatory','An approved synthetic game for offline test.','games',100,100);
 if(migrated)f.db.exec(migration('0016_project_mark_bridge_v115.sql'));
 if(migrated){
  f.db.prepare("INSERT INTO member_mark_publishers(project_id,creator_id,release_ref,public_title,redirect_uri,status,reviewer_id,reviewed_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
   .run(P,U.id,'approved-release-v1','Observatory Quest',CALLBACK,approved?'approved':'suspended',U.id,100,100,100);
  f.db.prepare("INSERT INTO member_mark_publisher_keys(key_id,project_id,secret_sha256,created_at,expires_at) VALUES(?,?,?,?,?)")
   .run(KEY_ID,P,createHash('sha256').update(SECRET).digest('hex'),100,NOW+100000);
  for(const [id,key,trigger,count,title] of [
   [DEF,'hidden_observatory','secret.observatory',1,'Hidden Observatory'],
   [DEF3,'ten_creations','creation.completed',3,'Archive of Three']
  ]){
   f.db.prepare("INSERT INTO member_mark_definitions(id,project_id,release_ref,stable_key,trigger_key,target_count,title,description,motif,visibility,reward_label,reviewer_id,reviewed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(id,P,'approved-release-v1',key,trigger,count,title,'Complete a legitimate milestone in the synthetic game.',
     'atlas',key==='hidden_observatory'?'secret':'visible','Observatory explorer',U.id,100);
  }
 }
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true',CANONICAL_CREATOR_ACHIEVEMENTS_V114:'true',
  CANONICAL_PROJECT_MARK_BRIDGE_V115:enabled?'true':'false'};
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  const cookie=headers.get('cookie')||'';
  const user=cookie.includes('v115-alice')?U:cookie.includes('v115-bob')?B:null;
  return user?{user,session:{id:'synthetic-v115'}}:null;
 }},handler:async()=>new Response('not a public issuer',{status:404})})});
 async function call(path,method='GET',payload,who=null,extra={}){
  const headers=new Headers({accept:'application/json',...(who?{cookie:'__Secure-anevum_can_stage.session_token=v115-'+who}:{}),
   ...(['POST','PATCH','PUT'].includes(method)&&who?{origin:ORIGIN,'sec-fetch-site':'same-origin'}:{}),
   ...(payload!==undefined?{'content-type':'application/json'}:{}),...extra});
  return worker.fetch(new Request(ORIGIN+path,{method,headers,...(payload===undefined?{}:{body:JSON.stringify(payload)})}),env);
 }
 const pubHeaders={authorization:'Bearer '+KEY_ID+'.'+SECRET};
 const issuer=(action,payload,extra={})=>call('/api/v1/marks/publisher/'+action,'POST',{projectId:P,...payload},null,{...pubHeaders,...extra});
 const member=(path,method='GET',payload,who='bob',extra)=>call('/api/v1/member/marks'+path,method,payload,who,extra);
 const connect=async(who='bob')=>{
  const state='b'.repeat(48);
  const r=await member('/connect','POST',{projectId:P,state},who);
  assert.equal(r.status,200,await r.clone().text());
  const b=await r.json(),callback=new URL(b.redirectUrl);
  assert.equal(callback.origin,'https://creator.example.org');assert.equal(callback.pathname,'/anevum/callback');
  assert.equal(callback.searchParams.get('state'),state);
  return callback.searchParams.get('code');
 };
 const exchange=async(who='bob')=>{
  const code=await connect(who);
  const r=await issuer('exchange',{code});assert.equal(r.status,201,await r.clone().text());
  return (await r.json()).linkId;
 };
 t.after(()=>f.db.close());
 return {f,env,call,member,issuer,connect,exchange};
}
const event=(linkId,stableKey='hidden_observatory',extra={})=>({linkId,stableKey,eventId:randomUUID(),evidenceDigest:DIGEST,...extra});
test('default-OFF, missing schema and unapproved publisher are closed',async t=>{
 const disabled=setup(t,{enabled:false});
 assert.equal((await disabled.member('')).status,404);
 assert.equal((await disabled.issuer('exchange',{code:'b'.repeat(64)})).status,404);
 const missing=setup(t,{migrated:false});
 assert.equal(await markBridgeReady(missing.env.MEMBER_DB),false);
 assert.equal((await missing.member('')).status,503);
 const paused=setup(t,{approved:false});
 assert.equal((await paused.member('/connect','POST',{projectId:P,state:'c'.repeat(48)})).status,404);
 assert.equal((await paused.issuer('events',event(randomUUID()))).status,401);
});
test('unlisted Studio draft is not a public publisher and does not leak owner',async t=>{
 const s=setup(t);
 const r=await s.call('/api/v1/public/marks/projects/'+P);
 assert.equal(r.status,200);const p=await r.json();
 assert.deepEqual(Object.keys(p).sort(),['connection','projectId','title','trust']);
 assert.equal('creatorId' in p,false);assert.equal('redirectUri' in p,false);
 assert.equal((await s.call('/api/v1/public/marks/projects/'+randomUUID())).status,404);
});
test('one-time account linking requires actual consent, origin and verified sign-in',async t=>{
 const s=setup(t),payload={projectId:P,state:'f'.repeat(48)};
 assert.equal((await s.member('/connect','POST',payload,null)).status,401);
 assert.equal((await s.member('/connect','POST',payload,'bob',{origin:'https://evil.invalid'})).status,403);
 assert.equal((await s.member('/connect','POST',{...payload,state:'bad'})).status,400);
 const code=await s.connect();
 assert.equal(code.length,64);
 const r=await s.issuer('exchange',{code});assert.equal(r.status,201,await r.clone().text());
 const out=await r.json();assert.equal(out.trust,'creator_attested');
 assert.equal('memberId' in out,false);assert.equal('email' in out,false);
 assert.equal((await s.issuer('exchange',{code})).status,409,'One code cannot be exchanged twice');
 assert.equal(s.f.db.prepare('SELECT consumed_at FROM member_mark_link_codes').get().consumed_at>0,true);
});
test('publisher secret, cookie-bearing requests and invalid tokens cannot issue',async t=>{
 const s=setup(t),linkId=await s.exchange();
 assert.equal((await s.issuer('events',event(linkId),{authorization:'Bearer bad'})).status,401);
 assert.equal((await s.issuer('events',event(linkId),{origin:ORIGIN})).status,401);
 assert.equal((await s.issuer('events',event(linkId),{cookie:'x=1'})).status,401);
 assert.equal((await s.issuer('events',event(randomUUID()))).status,404);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_events').get().n,0);
});
test('creator-attested one-time award uses unique event ID and never mints XP',async t=>{
 const s=setup(t),linkId=await s.exchange(),before=s.f.db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n;
 const e=event(linkId),r=await s.issuer('events',e);
 assert.equal(r.status,201,await r.clone().text());
 const data=await r.json();assert.equal(data.status,'earned');assert.equal(data.platformXp,0);assert.equal(data.trust,'creator_attested');
 assert.equal((await s.issuer('events',e)).status,200);
 assert.equal((await (await s.issuer('events',e)).json()).status,'duplicate');
 assert.equal((await s.issuer('events',{...e,evidenceDigest:'c'.repeat(64)})).status,409);
 assert.equal((await s.issuer('events',event(linkId))).status,409,'Cannot endlessly re-issue earned mark');
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_grants').get().n,1);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_events').get().n,1);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,before);
 assert.equal(s.f.db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='trigger' AND name LIKE '%xp%'").get().n>=0,true);
 const inventory=await (await s.member('')).json();
 assert.equal(inventory.marks.length,1);assert.equal(inventory.marks[0].stableKey,'hidden_observatory');
 assert.equal(inventory.platformXp,0);
 assert.equal((await (await s.member('',undefined,undefined,'alice')).json()).marks.length,0);
});
test('cumulative requirements count only accepted unique events, not arbitrary totals',async t=>{
 const s=setup(t),linkId=await s.exchange();
 for(let i=1;i<=3;i++){
  const r=await s.issuer('events',event(linkId,'ten_creations'));
  assert.equal(r.status,i===3?201:200,await r.clone().text());
  const data=await r.json();assert.equal(data.progress,i);
  assert.equal(data.status,i===3?'earned':'recorded');
 }
 assert.equal(s.f.db.prepare('SELECT count FROM member_mark_progress WHERE definition_id=?').get(DEF3).count,3);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_grants WHERE definition_id=?').get(DEF3).n,1);
});
test('public profile defaults private, curator may pin only owned active awards',async t=>{
 const s=setup(t),linkId=await s.exchange();
 await s.issuer('events',event(linkId));
 s.f.db.prepare("UPDATE member_creator_profiles SET visibility='public' WHERE user_id=?").run(B.id);
 assert.deepEqual(await (await s.call('/api/v1/members/bob115/marks')).json(),{marks:[]});
 assert.equal((await s.member('/display','PATCH',{mode:'curated',pinnedIds:[randomUUID()],revision:0})).status,400);
 const updated=await s.member('/display','PATCH',{mode:'curated',pinnedIds:[DEF],revision:0});
 assert.equal(updated.status,200,await updated.clone().text());
 const display=await updated.json();assert.equal(display.display.revision,1);
 const publicMarks=await (await s.call('/api/v1/members/bob115/marks')).json();
 assert.equal(publicMarks.marks.length,1);assert.equal(publicMarks.marks[0].id,DEF);
 assert.equal('memberId' in publicMarks.marks[0],false);
 assert.equal((await s.member('/display','PATCH',{mode:'hidden',pinnedIds:[],revision:0})).status,409);
 assert.equal((await s.member('/display','PATCH',{mode:'hidden',pinnedIds:[],revision:1})).status,200);
 assert.deepEqual(await (await s.call('/api/v1/members/bob115/marks')).json(),{marks:[]});
});
test('disconnect and moderation suspension halt grants and hide public marks',async t=>{
 const s=setup(t),linkId=await s.exchange();
 await s.issuer('events',event(linkId));
 s.f.db.prepare("UPDATE member_creator_profiles SET visibility='public' WHERE user_id=?").run(B.id);
 await s.member('/display','PATCH',{mode:'curated',pinnedIds:[DEF],revision:0});
 assert.equal((await s.member('/disconnect','POST',{linkId},'alice')).status,404);
 assert.equal((await s.member('/disconnect','POST',{linkId})).status,200);
 assert.equal((await s.issuer('events',event(linkId,'ten_creations'))).status,404);
 assert.equal((await (await s.member('')).json()).marks.length,1,'Earned history remains after unlink');
 s.f.db.prepare("UPDATE member_mark_publishers SET status='suspended' WHERE project_id=?").run(P);
 assert.deepEqual(await (await s.call('/api/v1/members/bob115/marks')).json(),{marks:[]});
});
test('creator account deletion suspends historical publisher; player delete cleans dependent records',async t=>{
 const s=setup(t),linkId=await s.exchange();
 await s.issuer('events',event(linkId));
 s.f.db.prepare('DELETE FROM "user" WHERE id=?').run(U.id);
 const p=s.f.db.prepare('SELECT status,creator_id FROM member_mark_publishers WHERE project_id=?').get(P);
 assert.equal(p.status,'suspended');assert.equal(p.creator_id,null);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_grants').get().n,1);
 s.f.db.prepare('DELETE FROM "user" WHERE id=?').run(B.id);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_grants').get().n,0);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_events').get().n,0);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_mark_links').get().n,0);
});
test('browser SDK contains no publisher secret and reports only to creator backend',async ()=>{
 const storage=new Map(),urls=[],requests=[];
 const instance=createAnevumAchievements({projectId:P,anevumOrigin:ORIGIN,
  storage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  navigation:{assign:url=>urls.push(url)},
  fetchImpl:async(path,opt)=>{requests.push({path,opt});return {ok:true,headers:new Headers({'content-type':'application/json'}),json:async()=>({queued:true})};}});
 instance.connect();assert.equal(urls.length,1);assert.equal(new URL(urls[0]).origin,ORIGIN);
 await instance.achievements.unlock('hidden_observatory');
 assert.equal(requests[0].path,'/api/anevum/achievements/report');
 assert.equal(requests[0].opt.credentials,'same-origin');
 assert.equal('authorization' in requests[0].opt.headers,false);
 assert.equal(requests[0].opt.body.includes(SECRET),false);
});
test('server SDK uses confidential bearer against only approved ANEVUM host',async ()=>{
 const requests=[],client=createAnevumPublisher({projectId:P,keyId:KEY_ID,secret:SECRET,anevumOrigin:ORIGIN,
  fetchImpl:async(url,opt)=>{requests.push({url,opt});return {ok:true,headers:new Headers({'content-type':'application/json'}),json:async()=>({trust:'creator_attested'})};}});
 await client.exchange('d'.repeat(64));
 await client.award({linkId:randomUUID(),stableKey:'hidden_observatory',evidenceDigest:DIGEST});
 assert.equal(requests.length,2);
 assert.equal(requests[0].url,ORIGIN+'/api/v1/marks/publisher/exchange');
 assert.equal(requests[1].url,ORIGIN+'/api/v1/marks/publisher/events');
 assert.equal(requests[1].opt.headers.authorization,'Bearer '+KEY_ID+'.'+SECRET);
 assert.throws(()=>createAnevumPublisher({projectId:P,keyId:KEY_ID,secret:SECRET,anevumOrigin:'https://evil.invalid'}));
});
