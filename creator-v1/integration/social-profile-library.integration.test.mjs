import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createMemberWorker} from '../auth/worker.mjs';
import {ACHIEVEMENTS,deriveAchievements} from '../auth/social.mjs';
import {SOCIAL_CLIENT} from '../auth/social-ui.mjs';

const now=Math.floor(Date.now()/1000);
const fixed=i=>i.toString(16).padStart(32,'0');
const pep='d'.repeat(64);
const testUsers=[
 {id:'member-alice',email:'alice@fixture.test',handle:'alice_builds',token:'a'.repeat(64)},
 {id:'member-bob',email:'bob@fixture.test',handle:'bob_tests',token:'b'.repeat(64)},
 {id:'member-chris',email:'chris@fixture.test',handle:'chris_makes',token:'c'.repeat(64)}
];
async function sessionHash(token){const key=await crypto.subtle.importKey('raw',Uint8Array.from(pep.match(/../g).map(x=>parseInt(x,16))),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('session\0'+token))).toString('hex')}
async function setup(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY NOT NULL,handle TEXT NOT NULL COLLATE NOCASE UNIQUE,display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',is_staff INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE projects(id TEXT PRIMARY KEY NOT NULL,owner_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id),slug TEXT NOT NULL,title TEXT NOT NULL,summary TEXT NOT NULL,category TEXT NOT NULL,status TEXT NOT NULL,source_url TEXT,demo_url TEXT,published_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE project_releases(id TEXT PRIMARY KEY NOT NULL,project_id TEXT NOT NULL REFERENCES projects(id),version TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',released_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE project_favorites(member_id TEXT NOT NULL REFERENCES creator_profiles(member_id),project_id TEXT NOT NULL REFERENCES projects(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(member_id,project_id));`);
 for(const filename of ['0003_member_identity_staging.sql','0005_voting_progression.sql','0008_creator_follows.sql'])sqlite.exec(readFileSync(new URL('../auth/migrations/'+filename,import.meta.url),'utf8'));
 function stm(sql,params=[]){return{sql,params,bind(...args){return stm(sql,args)},async all(){return{success:true,results:sqlite.prepare(sql).all(...params)}},async run(){const r=sqlite.prepare(sql).run(...params);return{success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}}}}}
 const db={prepare:sql=>stm(sql),async batch(q){sqlite.exec('BEGIN IMMEDIATE');try{const results=[];for(const s of q){const r=sqlite.prepare(s.sql).run(...s.params);results.push({success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}})}sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 for(const u of testUsers){sqlite.prepare("INSERT INTO member_accounts(id,email,verified_at,created_at,status) VALUES (?,?,?,?,'active')").run(u.id,u.email,now,now);sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,status) VALUES (?,?,?,'Fixture biography','active')").run(u.id,u.handle,u.handle);sqlite.prepare('INSERT INTO member_sessions(token_hash,member_id,expires_at,created_at) VALUES (?,?,?,?)').run(await sessionHash(u.token),u.id,now+86400,now)}
 sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,status,is_staff) VALUES ('anevum-official','anevum','ANEVUM','Workshop owner','active',1)").run();
 const insert=(i,owner='member-alice',status='published',future=false)=>sqlite.prepare("INSERT INTO projects(id,owner_member_id,slug,title,summary,category,status,published_at,source_url,demo_url) VALUES (?,?,?,?,?,'tools',?,?,?,?)").run(fixed(i),owner,'project-'+i,'Project '+i,'Actually usable software.',status,future?"2999-01-01 00:00:00":status==='published'?"2000-01-01 00:00:00":null,'https://github.com/example/project-'+i,'https://example.com/demo/'+i);
 insert(1);insert(2);insert(3);insert(4,'member-bob');insert(5,'member-alice','draft');insert(6,'member-alice','archived');insert(7,'member-alice','published',true);
 const app=createMemberWorker({clock:()=>now,fetcher:async()=>{throw Error('No external requests expected')}});
 const env={COMMUNITY_DB:db,AUTH_PEPPER:pep};
 const call=(path,method='GET',data=undefined,user=testUsers[0],origin='https://next.anevum.com')=>app.fetch(new Request('https://next.anevum.com/api/v1/member'+path,{method,headers:{origin,'sec-fetch-site':origin==='https://next.anevum.com'?'same-origin':'cross-site','content-type':'application/json',...(user?{cookie:'__Host-anevum_stage_sid='+user.token}:{})},body:data===undefined?undefined:JSON.stringify(data)}),env);
 const save=(i,saved=true,user=testUsers[0],origin='https://next.anevum.com')=>call('/library/'+fixed(i),'POST',{saved},user,origin);
 const userProfile=(handle='alice_builds',user=null)=>call('/creators/'+handle,'GET',undefined,user);
 return {sqlite,db,call,save,userProfile,insert};
}

test('achievement catalog is defined and locked before reaching thresholds',()=>{
 assert.equal(new Set(ACHIEVEMENTS.map(x=>x.key)).size,ACHIEVEMENTS.length);
 const badges=deriveAchievements({ratings:0,publishedProjects:0,releases:0});
 assert.equal(badges.length,6);assert.ok(badges.every(x=>!x.earned));
 assert.equal(deriveAchievements({ratings:5,publishedProjects:1,releases:1}).filter(x=>x.earned).length,4);
});
test('public creator profiles do not reveal emails, internal IDs or staff permissions',async()=>{
 const f=await setup();try{const res=await f.userProfile();assert.equal(res.status,200);const body=await res.json();assert.equal(body.creator.handle,'alice_builds');assert.equal(body.contributions.publishedProjects,3);assert.equal(body.progression.level,1);assert.equal(body.achievements.filter(x=>x.earned).length,2);assert.equal(body.achievements.find(x=>x.key==='first-launch').earned,true);for(const secret of ['member-alice','alice@fixture.test','is_staff','token_hash'])assert.ok(!JSON.stringify(body).includes(secret));}finally{f.sqlite.close()}
});
test('unlisted, missing, suspended and deleted creator profiles fail closed',async()=>{
 const f=await setup();try{assert.equal((await f.userProfile('does_not_exist')).status,404);assert.equal((await f.userProfile('alice_builds%27%20OR%201=1')).status,404);f.sqlite.prepare("UPDATE member_accounts SET status='suspended' WHERE id='member-alice'").run();assert.equal((await f.userProfile()).status,404);f.sqlite.prepare("UPDATE member_accounts SET status='active' WHERE id='member-alice'").run();f.sqlite.prepare("UPDATE creator_profiles SET status='deleted' WHERE member_id='member-alice'").run();assert.equal((await f.userProfile()).status,404);}finally{f.sqlite.close()}
});
test('official profile exists without importing legacy V5 member account',async()=>{
 const f=await setup();try{const res=await f.userProfile('anevum');assert.equal(res.status,200);const data=await res.json();assert.equal(data.creator.displayName,'ANEVUM');assert.equal(data.progression.xp,0);}finally{f.sqlite.close()}
});
test('public project portfolio contains only approved non-future work from that creator',async()=>{
 const f=await setup();try{const res=await f.call('/creators/alice_builds/projects','GET',undefined,null);assert.equal(res.status,200);const d=await res.json();assert.deepEqual(d.items.map(x=>x.id),[fixed(3),fixed(2),fixed(1)]);assert.ok(d.items.every(x=>x.creatorHandle==='alice_builds'));const json=JSON.stringify(d);assert.ok(!json.includes('member-alice')&&!json.includes('Fixture biography'));}finally{f.sqlite.close()}
});
test('published and versioned contributions unlock only appropriate badges',async()=>{
 const f=await setup();try{f.sqlite.prepare("INSERT INTO project_releases(id,project_id,version) VALUES ('rel-1',?,'1.0.1')").run(fixed(1));const d=await (await f.userProfile()).json();assert.equal(d.contributions.releases,1);for(const key of ['first-launch','three-builds','release-steward'])assert.equal(d.achievements.find(x=>x.key===key).earned,true);f.sqlite.prepare("UPDATE projects SET status='archived' WHERE id IN (?,?)").run(fixed(2),fixed(3));const after=await (await f.userProfile()).json();assert.equal(after.achievements.find(x=>x.key==='three-builds').earned,false);}finally{f.sqlite.close()}
});
test('moderator-hidden rating removes rating badge progression, but not unrelated publishing badges',async()=>{
 const f=await setup();try{f.sqlite.prepare("INSERT INTO community_project_votes(member_id,project_id,score,status,created_at,updated_at) VALUES ('member-alice',?,5,'active',?,?)").run(fixed(4),now,now);f.sqlite.prepare("INSERT INTO community_xp_events(id,member_id,kind,target_id,amount,award_day,created_at) VALUES ('xp01','member-alice','vote_first',?,2,'2026-10-12',?)").run(fixed(4),now);let d=await (await f.userProfile()).json();assert.equal(d.progression.xp,2);assert.equal(d.achievements.find(x=>x.key==='first-signal').earned,true);f.sqlite.prepare("UPDATE community_project_votes SET status='hidden' WHERE member_id='member-alice'").run();f.sqlite.prepare("INSERT INTO community_xp_events(id,member_id,kind,target_id,amount,award_day,created_at) VALUES ('rev01','member-alice','vote_adjustment','vote-rev',-2,'2026-10-12',?)").run(now);d=await (await f.userProfile()).json();assert.equal(d.progression.xp,0);assert.equal(d.achievements.find(x=>x.key==='first-signal').earned,false);assert.equal(d.achievements.find(x=>x.key==='first-launch').earned,true);}finally{f.sqlite.close()}
});
test('library is private, and anonymous viewers are redirected from private HTML',async()=>{
 const f=await setup();try{assert.equal((await f.call('/library','GET',undefined,null)).status,401);const page=await f.call('/library/manage','GET',undefined,null);assert.equal(page.status,303);assert.match(page.headers.get('location'),/\/api\/v1\/member\/join$/);const ownerPage=await f.call('/library/manage','GET');assert.equal(ownerPage.status,200);assert.match(await ownerPage.text(),/My Library/);}finally{f.sqlite.close()}
});
test('saving a published project is idempotent and awards no XP',async()=>{
 const f=await setup();try{const a=await f.save(4);assert.equal(a.status,200,await a.clone().text());assert.deepEqual(await a.json(),{saved:true,changed:true});assert.deepEqual(await (await f.save(4)).json(),{saved:true,changed:false});let list=await (await f.call('/library')).json();assert.equal(list.count,1);assert.equal(list.items[0].id,fixed(4));assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM community_xp_events').get().n,0);const removed=await f.save(4,false);assert.deepEqual(await removed.json(),{saved:false,changed:true});assert.deepEqual(await (await f.save(4,false)).json(),{saved:false,changed:false});list=await (await f.call('/library')).json();assert.equal(list.count,0);}finally{f.sqlite.close()}
});
test('one member cannot read or mutate another member library',async()=>{
 const f=await setup();try{assert.equal((await f.save(1,true,testUsers[1])).status,200);const alice=await (await f.call('/library')).json();const bob=await (await f.call('/library','GET',undefined,testUsers[1])).json();assert.equal(alice.count,0);assert.equal(bob.count,1);assert.equal((await f.save(1,false,testUsers[0])).status,200);assert.equal((await (await f.call('/library','GET',undefined,testUsers[1])).json()).count,1);}finally{f.sqlite.close()}
});
test('cross-origin, anonymous and incomplete-profile save attempts fail closed',async()=>{
 const f=await setup();try{assert.equal((await f.save(4,true,null)).status,401);assert.equal((await f.save(4,true,testUsers[0],'https://evil.example')).status,403);f.sqlite.prepare("UPDATE creator_profiles SET status='suspended' WHERE member_id='member-alice'").run();assert.equal((await f.save(4)).status,409);}finally{f.sqlite.close()}
});
test('drafts, archived, future and suspended-creator projects cannot be newly saved',async()=>{
 const f=await setup();try{for(const i of [5,6,7])assert.equal((await f.save(i)).status,404);f.sqlite.prepare("UPDATE creator_profiles SET status='suspended' WHERE member_id='member-bob'").run();assert.equal((await f.save(4)).status,404);}finally{f.sqlite.close()}
});
test('stale saved projects vanish from visible library without leaking unpublished records',async()=>{
 const f=await setup();try{await f.save(4);f.sqlite.prepare('UPDATE projects SET status=\'archived\' WHERE id=?').run(fixed(4));const data=await (await f.call('/library')).json();assert.equal(data.count,0);const drop=await f.save(4,false);assert.equal(drop.status,200);assert.equal((await drop.json()).saved,false);}finally{f.sqlite.close()}
});
test('request rejects extra fields, malformed JSON and out-of-range IDs',async()=>{
 const f=await setup();try{assert.equal((await f.call('/library/'+fixed(4),'POST',{saved:true,owner:'member-bob'})).status,400);assert.equal((await f.call('/library/'+fixed(4),'POST',{saved:1})).status,400);assert.equal((await f.call('/library/not-a-project','POST',{saved:true})).status,404);assert.equal((await f.call('/creators/alice_builds','POST',{saved:true})).status,405);}finally{f.sqlite.close()}
});
test('public profile and social JS stay safely encoded and isolated from untrusted URLs',async()=>{
 const f=await setup();try{const p=await f.call('/creators/alice_builds/view','GET',undefined,null);assert.equal(p.status,200);assert.match(p.headers.get('content-security-policy'),/connect-src 'self'/);assert.match(await p.text(),/Achievement cabinet/);assert.match((await f.call('/social.js')).headers.get('content-type'),/javascript/);assert.ok(SOCIAL_CLIENT.includes("u.protocol!=='https:'"));assert.ok(!SOCIAL_CLIENT.includes('innerHTML'));}finally{f.sqlite.close()}
});
test('creator follow is server-confirmed, idempotent, reversible and grants no XP',async()=>{
 const f=await setup();try{
  const route='/creators/bob_tests/follow';
  const initial=await (await f.userProfile('bob_tests',null)).json();
  assert.equal(initial.followers,0);
  assert.equal(initial.viewerFollows,false);
  assert.equal((await f.call(route,'POST',{following:true},null)).status,401);
  assert.equal((await f.call('/creators/alice_builds/follow','POST',{following:true})).status,403);
  const created=await f.call(route,'POST',{following:true});
  assert.equal(created.status,200,await created.clone().text());
  assert.deepEqual(await created.json(),{following:true,changed:true,followers:1,viewerFollows:true});
  assert.deepEqual(await (await f.call(route,'POST',{following:true})).json(),{following:true,changed:false,followers:1,viewerFollows:true});
  const publicProfile=await (await f.userProfile('bob_tests',null)).json();
  assert.equal(publicProfile.followers,1);
  assert.equal(publicProfile.viewerFollows,false);
  const ownProfile=await (await f.userProfile('bob_tests',testUsers[0])).json();
  assert.equal(ownProfile.viewerFollows,true);
  assert.equal((await f.call('/following','GET',undefined,null)).status,401);
  const following=await (await f.call('/following')).json();
  assert.equal(following.items.length,1);
  assert.equal(following.items[0].handle,'bob_tests');
  assert.equal(following.hasMore,false);
  assert.ok(!JSON.stringify(following).includes('member-bob'));
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM community_xp_events').get().n,0);
  assert.deepEqual(await (await f.call(route,'POST',{following:false})).json(),{following:false,changed:true,followers:0,viewerFollows:false});
  assert.deepEqual(await (await f.call(route,'POST',{following:false})).json(),{following:false,changed:false,followers:0,viewerFollows:false});
  assert.equal((await (await f.call('/following')).json()).items.length,0);
 }finally{f.sqlite.close()}
});
test('creator follows cannot be forged, posted cross-site, or leaked between accounts',async()=>{
 const f=await setup();try{
  const follow='/creators/bob_tests/follow';
  for(const bad of [{following:1},{following:true,memberId:'member-bob'},{saved:true},{}])
   assert.equal((await f.call(follow,'POST',bad)).status,400);
  assert.equal((await f.call(follow,'POST',{following:true},testUsers[0],'https://evil.example')).status,403);
  assert.equal((await f.call('/creators/absent_creator/follow','POST',{following:true})).status,404);
  assert.equal((await f.call('/creators/chris_makes/follow','POST',{following:true})).status,404); // no public releases
  assert.equal((await f.call(follow,'GET')).status,405);
  assert.equal((await f.call(follow,'POST',{following:true})).status,200);
  const bob=await (await f.call('/following','GET',undefined,testUsers[1])).json();
  assert.deepEqual(bob.items,[]);
  assert.equal((await (await f.userProfile('bob_tests',testUsers[1])).json()).viewerFollows,false);
  assert.equal((await f.call(follow,'POST',{following:false},testUsers[1])).status,403);
  assert.equal((await (await f.call('/following')).json()).items.length,1);
 }finally{f.sqlite.close()}
});
test('suspended creators disappear from follow lists, and suspended followers do not count',async()=>{
 const f=await setup();try{
  assert.equal((await f.call('/creators/bob_tests/follow','POST',{following:true})).status,200);
  f.sqlite.prepare("UPDATE projects SET status='archived' WHERE owner_member_id='member-bob'").run();
  assert.equal((await (await f.call('/following')).json()).items.length,0);
  assert.equal((await f.call('/creators/bob_tests/follow','POST',{following:true})).status,404);
  f.sqlite.prepare("UPDATE projects SET status='published' WHERE owner_member_id='member-bob'").run();
  f.sqlite.prepare("UPDATE creator_profiles SET status='suspended' WHERE member_id='member-bob'").run();
  assert.equal((await f.call('/creators/bob_tests/follow','POST',{following:true})).status,404);
  assert.equal((await (await f.call('/following')).json()).items.length,0);
  f.sqlite.prepare("UPDATE creator_profiles SET status='active' WHERE member_id='member-bob'").run();
  f.sqlite.prepare("UPDATE member_accounts SET status='suspended' WHERE id='member-alice'").run();
  assert.equal((await (await f.userProfile('bob_tests',null)).json()).followers,0);
  assert.equal((await f.call('/following')).status,401);
  f.sqlite.prepare("UPDATE member_accounts SET status='active' WHERE id='member-alice'").run();
  assert.equal((await (await f.userProfile('bob_tests',null)).json()).followers,1);
  f.sqlite.prepare("DELETE FROM member_accounts WHERE id='member-alice'").run();
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM member_creator_follows").get().n,0);
 }finally{f.sqlite.close()}
});
