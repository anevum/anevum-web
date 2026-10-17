import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import worker from '../web/a-canonical-stage.review.mjs';
import {canonicalProgression,levelProgress,readProgression,syncRewardNotifications} from '../canonical-auth/progression.mjs';
import {canonicalSpace} from '../canonical-auth/space.mjs';
const base='https://a.anevum.com';
function seed(db,id){db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)').run(id,id,id+'@fixture.invalid');db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)').run(id,id+'___',id,'');return {id,emailVerified:true}}
const req=(path,body)=>new Request(base+'/api/v1/member/'+path,{method:body===undefined?'GET':'POST',headers:{origin:base,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
test('test XP has fixed value, durable level notices, isolated users, idempotent concurrent retries and guarded acknowledgement',async()=>{
 const {db,env}=fixture();try{const a=seed(db,'alpha'),b=seed(db,'beta');const post=(id)=>canonicalProgression(req('xp-test',{requestId:id}),env,a,1000);
 const id=crypto.randomUUID();const results=await Promise.all([post(id),post(id),post(id)]);assert.ok(results.every(r=>r.status===200));assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,1);assert.equal((await readProgression(env.MEMBER_DB,a.id)).xp,5);
 for(let i=0;i<4;i++)assert.equal((await post(crypto.randomUUID())).status,200);
 const p=await readProgression(env.MEMBER_DB,a.id);assert.equal(p.xp,25);assert.equal(p.level,2);assert.equal(p.artifact,'Copper Key');assert.equal((await readProgression(env.MEMBER_DB,b.id)).xp,0);
 const inbox=await (await canonicalProgression(req('notifications'),env,a)).json();assert.deepEqual(inbox.items.map(i=>[i.kind,i.level]),[['level',2]]);
 assert.equal((await canonicalProgression(req('notifications/ack',{id:inbox.items[0].id}),env,b)).status,404);
 assert.equal((await canonicalProgression(req('notifications/ack',{id:inbox.items[0].id}),env,a)).status,200);
 assert.equal((await (await canonicalProgression(req('notifications'),env,a)).json()).items.length,0);
 await syncRewardNotifications(env.MEMBER_DB,a.id,1002);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_reward_notifications').get().n,1);
 const own=await (await canonicalSpace(new Request(base+'/api/v1/member/space'),env,a)).json();assert.equal(own.stats.xp,25);assert.equal(own.stats.level,2);
 assert.equal((await canonicalProgression(req('xp-test',{requestId:crypto.randomUUID(),xp:90000}),env,a)).status,400);
 assert.equal((await canonicalProgression(req('xp-test',{requestId:crypto.randomUUID()}),{...env,CANONICAL_XP_TEST_ENABLED:'false'},a)).status,404);
 assert.equal((await worker.fetch(req('xp-test',{requestId:crypto.randomUUID()}),env)).status,401);
 assert.equal((await worker.fetch(new Request(base+'/api/v1/member/xp-test',{method:'POST',headers:{origin:'https://foreign.invalid','content-type':'application/json'},body:'{}'}),env)).status,403);
 }finally{db.close()}
});
test('button minute allowance is atomic, profile awards remain one-time, and migration preserves existing progress',async()=>{
 const {db,env}=fixture();try{const a=seed(db,'alpha');
 for(let i=0;i<119;i++)db.prepare("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,?,'test_button',5,1000)").run(a.id,crypto.randomUUID());
 const results=await Promise.all(Array.from({length:6},()=>canonicalProgression(req('xp-test',{requestId:crypto.randomUUID()}),env,a,1001)));assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===429).length,5);
 assert.equal((await readProgression(env.MEMBER_DB,a.id)).xp,600);
 db.prepare("INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES(?,'first_signal',1002)").run(a.id);
 await syncRewardNotifications(env.MEMBER_DB,a.id,1002);await syncRewardNotifications(env.MEMBER_DB,a.id,1003);
 assert.equal((await readProgression(env.MEMBER_DB,a.id)).xp,610);assert.equal(db.prepare("SELECT COUNT(*) AS n FROM member_reward_notifications WHERE kind='award'").get().n,1);
 assert.equal(levelProgress(87025).level,60);assert.equal(levelProgress(90000).level,61);assert.equal(levelProgress(90000).artifact,null);
 }finally{db.close()}
});
test('sixty independently drawn vector emblems retain the established artifact names',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../shared/level-artifacts.json',import.meta.url),'utf8'));
 assert.equal(catalog.length,60);assert.equal(catalog[0].name,'Foundry Spark');assert.equal(catalog[59].name,'The First Light');
 const silhouettes=[];
 for(const a of catalog){const svg=readFileSync(new URL('../web/public'+a.icon,import.meta.url),'utf8');assert.match(svg,/viewBox="0 0 256 256"/);assert.ok(svg.includes(a.name));assert.doesNotMatch(svg,/<script|<image|https?:\/\/(?!www.w3.org)/);silhouettes.push(svg.split('<g fill="url(#inlay)"')[1].split('</g>')[0]);}
 assert.equal(new Set(silhouettes).size,60);
});
