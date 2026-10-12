import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createMemberWorker} from '../auth/worker.mjs';
import {progressionFromXp,thresholdForLevel} from '../auth/community.mjs';
import {voteModeration} from '../authoring/vote-moderation.mjs';
import studio from '../authoring/worker.mjs';

const sqlite=new DatabaseSync(':memory:');
sqlite.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY NOT NULL,handle TEXT COLLATE NOCASE UNIQUE NOT NULL CHECK(length(handle) BETWEEN 3 AND 30),display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',is_staff INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','suspended','deleted')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE projects(id TEXT PRIMARY KEY NOT NULL,owner_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id),slug TEXT NOT NULL,title TEXT NOT NULL,summary TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('draft','pending_review','changes_requested','published','rejected','archived')),free_to_use INTEGER NOT NULL DEFAULT 1,license_name TEXT,source_url TEXT,demo_url TEXT,ai_disclosure TEXT NOT NULL DEFAULT '',human_contribution TEXT NOT NULL DEFAULT '',published_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,revision INTEGER NOT NULL DEFAULT 1,UNIQUE(owner_member_id,slug));`);
for(const name of ['0003_member_identity_staging.sql','0005_voting_progression.sql']) sqlite.exec(readFileSync(new URL('../auth/migrations/'+name,import.meta.url),'utf8'));
function stmt(sql,params=[]){return {sql,params,bind(...next){return stmt(sql,next)},async all(){return {success:true,results:sqlite.prepare(sql).all(...params).map(x=>({...x}))}},async run(){const r=sqlite.prepare(sql).run(...params);return {success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}}}};}
const db={prepare:sql=>stmt(sql),async batch(queries){sqlite.exec('BEGIN IMMEDIATE');try{const results=[];for(const q of queries){const r=sqlite.prepare(q.sql).run(...q.params);results.push({success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}})}sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const now=Math.floor(Date.now()/1000);
const env={COMMUNITY_DB:db,AUTH_PEPPER:'c'.repeat(64)};
const app=createMemberWorker({clock:()=>now,fetcher:async()=>{throw Error('No external network needed in vote tests')}});
const people=[
 {id:'member-one',email:'one@test.example',handle:'marble_maker',token:'a'.repeat(64)},
 {id:'member-two',email:'two@test.example',handle:'prism_tester',token:'b'.repeat(64)},
 {id:'member-three',email:'three@test.example',handle:'first_creator',token:'c'.repeat(64)}
];
const encode=new TextEncoder();
async function tokenHash(raw){const key=await crypto.subtle.importKey('raw',Uint8Array.from(env.AUTH_PEPPER.match(/../g).map(x=>parseInt(x,16))),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Buffer.from(await crypto.subtle.sign('HMAC',key,encode.encode('session\0'+raw))).toString('hex')}
for(const p of people){
 sqlite.prepare("INSERT INTO member_accounts(id,email,verified_at,created_at,status) VALUES (?,?,?,?,'active')").run(p.id,p.email,now,now);
 sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,is_staff,status) VALUES (?,?,?,'',0,'active')").run(p.id,p.handle,p.handle);
 sqlite.prepare('INSERT INTO member_sessions(token_hash,member_id,expires_at,created_at) VALUES (?,?,?,?)').run(await tokenHash(p.token),p.id,now+86400,now);
}
sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,is_staff,status) VALUES ('anevum-official','anevum','ANEVUM','',1,'active')").run();
const fixed=(i)=>i.toString(16).padStart(32,'0');
const author=(i,owner='anevum-official',status='published')=>sqlite.prepare(`INSERT INTO projects(id,owner_member_id,slug,title,summary,category,status,free_to_use,published_at,revision) VALUES (?,?,?,?,?,'tools',?,1,datetime('now','-1 day'),1)`).run(fixed(i),owner,'tool-'+i,'Software '+i,'A real test project.',status);
for(let i=1;i<=9;i++)author(i);
author(10,people[0].id);author(11,'anevum-official','draft');author(12,'anevum-official','archived');
const url=(path)=>'https://next.anevum.com/api/v1/member'+path;
const req=(path,method='GET',data=undefined,user=people[0],origin='https://next.anevum.com')=>new Request(url(path),{method,headers:{origin,'sec-fetch-site':'same-origin','content-type':'application/json',...(user?{cookie:'__Host-anevum_stage_sid='+user.token}:{})},body:data===undefined?undefined:JSON.stringify(data)});
const call=(path,method='GET',data=undefined,user=people[0],origin='https://next.anevum.com')=>app.fetch(req(path,method,data,user,origin),env);
const vote=(id,score,revision=0,user=people[0],origin='https://next.anevum.com')=>call('/community/projects/'+fixed(id)+'/vote','POST',{score,revision},user,origin);
const stats=(id,user=people[0])=>call('/community/projects/'+fixed(id),'GET',undefined,user);
const profile=(user=people[0])=>call('/community/me','GET',undefined,user);
const ledger=(id=people[0].id)=>sqlite.prepare('SELECT kind,target_id,amount,award_day FROM community_xp_events WHERE member_id=? ORDER BY rowid').all(id);
test.after(()=>sqlite.close());

test('migrations create one-vote and one-award constraints without touching staff authorization',()=>{
 const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);
 for(const t of ['community_project_votes','community_vote_events','community_xp_events'])assert.ok(tables.includes(t));
 assert.equal(sqlite.prepare("SELECT count(*) AS n FROM schema_migrations WHERE version='0005_voting_progression'").get().n,1);
 assert.equal(sqlite.prepare("SELECT is_staff FROM creator_profiles WHERE member_id='member-one'").get().is_staff,0);
});
test('draft, archived and unknown projects have no public rating surface',async()=>{
 for(const id of [11,12,1200]){assert.equal((await stats(id)).status,404);assert.equal((await vote(id,4)).status,404)}
});
test('anonymous and cross-origin members cannot cast ratings',async()=>{
 assert.equal((await vote(1,4,0,null)).status,401);
 assert.equal((await vote(1,4,0,people[0],'https://malicious.example')).status,403);
 assert.equal((await profile(null)).status,401);
});
test('scores are integral from 0 to 5, and revisions are explicit',async()=>{
 for(const bad of [-1,6,2.5,'5',null])assert.equal((await vote(1,bad)).status,400);
 assert.equal((await call('/community/projects/'+fixed(1)+'/vote','POST',{score:5})).status,400);
 assert.equal((await call('/community/projects/'+fixed(1)+'/vote','POST',{score:5,revision:0,member:'other'})).status,400);
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM community_project_votes').get().n,0);
});
test('self-rating is rejected even for a verified creator',async()=>{
 assert.equal((await vote(10,5)).status,403);
 assert.equal((await profile()).status,200);
 assert.equal(ledger().length,0);
});
test('first vote is one durable rating with two XP and a named physical artifact',async()=>{
 const r=await vote(1,5);assert.equal(r.status,200,await r.clone().text());
 const p=await r.json();assert.equal(p.changed,true);assert.equal(p.rating.votes,1);assert.equal(p.rating.average,5);
 assert.deepEqual(p.rating.myVote,{score:5,revision:1});assert.equal(p.progression.xp,2);
 assert.equal(p.progression.level,1);assert.equal(p.progression.artifact,'Foundry Spark');
 assert.equal(ledger().length,1);assert.equal(ledger()[0].amount,2);
 assert.equal(sqlite.prepare("SELECT action FROM community_vote_events").get().action,'cast');
});
test('repeat vote is idempotent and does not grant additional XP',async()=>{
 const before=ledger().length;const r=await vote(1,5,1);assert.equal(r.status,200);const data=await r.json();
 assert.equal(data.changed,false);assert.equal(data.rating.myVote.revision,1);assert.equal(data.progression.xp,2);
 assert.equal(ledger().length,before);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM community_vote_events').get().n,1);
});
test('vote revision replaces score without re-awarding XP or increasing vote count',async()=>{
 const r=await vote(1,0,1);assert.equal(r.status,200,await r.clone().text());const data=await r.json();
 assert.equal(data.rating.average,0);assert.equal(data.rating.votes,1);assert.equal(data.rating.myVote.revision,2);
 assert.equal(data.progression.xp,2);assert.equal(ledger().length,1);
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM community_vote_events').get().n,2);
 assert.equal((await vote(1,4,1)).status,409);
});
test('separate voter changes aggregate rating, and vote identity remains private',async()=>{
 const r=await vote(1,4,0,people[1]);assert.equal(r.status,200,await r.clone().text());
 const publicRating=await (await stats(1,null)).json();
 assert.equal(publicRating.rating.votes,2);assert.equal(publicRating.rating.average,2);
 assert.equal(publicRating.rating.myVote,null);
 assert.ok(!JSON.stringify(publicRating).includes('test.example'));
 assert.equal((await profile(people[1])).status,200);
 assert.equal((await (await profile(people[1])).json()).progression.xp,2);
});
test('daily earning cap limits vote-first XP but never prevents genuine ratings',async()=>{
 for(let i=2;i<=7;i++){const r=await vote(i,3);assert.equal(r.status,200,await r.clone().text())}
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM community_project_votes WHERE member_id=?').get(people[0].id).n,7);
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM community_xp_events WHERE member_id=?').get(people[0].id).n,5);
 assert.equal(ledger().reduce((acc,row)=>acc+row.amount,0),10);
 assert.equal((await (await profile()).json()).progression.xp,10);
 const edited=await vote(7,1,1);assert.equal(edited.status,200);assert.equal((await edited.json()).progression.xp,10);
});
test('forged user ID cannot move a vote to another account',async()=>{
 assert.equal((await call('/community/projects/'+fixed(8)+'/vote','POST',{score:4,revision:0,memberId:people[1].id})).status,400);
 assert.equal((await vote(8,2,0,people[1])).status,200);
 const own=await (await stats(8,people[0])).json();assert.equal(own.rating.myVote,null);
});
test('suspended creators and later archived projects lose rating visibility',async()=>{
 sqlite.prepare("UPDATE creator_profiles SET status='suspended' WHERE member_id='anevum-official'").run();
 assert.equal((await stats(1)).status,404);assert.equal((await vote(1,3,2)).status,404);
 sqlite.prepare("UPDATE creator_profiles SET status='active' WHERE member_id='anevum-official'").run();
 sqlite.prepare("UPDATE projects SET status='archived' WHERE id=?").run(fixed(1));
 assert.equal((await stats(1)).status,404);
 sqlite.prepare("UPDATE projects SET status='published' WHERE id=?").run(fixed(1));
 assert.equal((await stats(1)).status,200);
});
test('moderator-hidden votes disappear from scores and cannot be edited',async()=>{
 sqlite.prepare("UPDATE community_project_votes SET status='hidden' WHERE member_id=? AND project_id=?").run(people[1].id,fixed(1));
 const r=await (await stats(1)).json();assert.equal(r.rating.votes,1);assert.equal(r.rating.average,0);
 assert.equal((await vote(1,5,1,people[1])).status,403);
 sqlite.prepare("UPDATE community_project_votes SET status='active' WHERE member_id=? AND project_id=?").run(people[1].id,fixed(1));
});
test('level thresholds and 60 unique collectible object names are deterministic',()=>{
 assert.equal(thresholdForLevel(1),0);assert.equal(thresholdForLevel(2),20);assert.equal(thresholdForLevel(3),80);
 assert.equal(progressionFromXp(0).level,1);assert.equal(progressionFromXp(19).level,1);
 assert.equal(progressionFromXp(20).level,2);assert.equal(progressionFromXp(80).level,3);
 assert.equal(progressionFromXp(999999).level,60);assert.equal(progressionFromXp(999999).nextLevelXp,null);
 const objects=new Set(Array.from({length:60},(_,i)=>progressionFromXp(thresholdForLevel(i+1)).artifact));
 assert.equal(objects.size,60);
});
test('unknown and unsupported community methods stay unavailable',async()=>{
 assert.equal((await call('/community/leaderboard')).status,404);
 assert.equal((await call('/community/me','POST',{})).status,404);
 assert.equal((await call('/community/projects/'+fixed(2),'DELETE')).status,405);
});

const mod=(path,method='GET',data)=>voteModeration(new Request('https://studio.next.anevum.com'+path,{method,headers:{'content-type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)}),db,'authorized-editor@example.test');
test('votes are inspectable only on the Access-authenticated Studio route',async()=>{
 const raw=await studio.fetch(new Request('https://studio.next.anevum.com/api/community-votes?project='+fixed(1)),{COMMUNITY_DB:db});
 assert.equal(raw.status,401);
 const list=await mod('/api/community-votes?project='+fixed(1));assert.equal(list.status,200);
 const data=await list.json();assert.equal(data.votes.length,2);
 assert.ok(!JSON.stringify(data).includes('test.example'));
 assert.equal((await mod('/api/community-votes?project=not-an-id')).status,400);
});
test('moderator actions require a substantive reason and valid current state',async()=>{
 const path='/api/community-votes/'+fixed(1)+'/'+people[0].id+'/hide';
 assert.equal((await mod(path,'POST',{reason:'bad'})).status,400);
 assert.equal((await mod(path,'GET')).status,405);
 assert.equal((await mod('/api/community-votes/'+fixed(1)+'/ghost/hide','POST',{reason:'A legitimate reason for removal.'})).status,404);
});
test('hiding a vote changes ratings and removes only XP originally earned',async()=>{
 const r=await mod('/api/community-votes/'+fixed(1)+'/'+people[0].id+'/hide','POST',{reason:'Verified rating manipulation with independent evidence.'});
 assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).xpAdjustment,-2);
 const rating=await (await stats(1)).json();assert.equal(rating.rating.votes,1);assert.equal(rating.rating.average,4);
 assert.equal((await (await profile()).json()).progression.xp,8);
 assert.equal((await vote(1,5,2)).status,403);
 assert.equal((await mod('/api/community-votes/'+fixed(1)+'/'+people[0].id+'/hide','POST',{reason:'Second removal should be prevented.'})).status,409);
 const notes=sqlite.prepare("SELECT count(*) AS n FROM community_vote_events WHERE action='hide' AND project_id=?").get(fixed(1));assert.equal(notes.n,1);
});
test('restoring an appealed vote and its original XP does not mint extra points',async()=>{
 const r=await mod('/api/community-votes/'+fixed(1)+'/'+people[0].id+'/restore','POST',{reason:'Appeal accepted; initial report was not substantiated.'});
 assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).xpAdjustment,2);
 const rating=await (await stats(1)).json();assert.equal(rating.rating.votes,2);assert.equal(rating.rating.average,2);
 assert.equal((await (await profile()).json()).progression.xp,10);
 assert.equal((await mod('/api/community-votes/'+fixed(1)+'/'+people[0].id+'/restore','POST',{reason:'A duplicate appeal outcome must fail.'})).status,409);
 assert.equal(sqlite.prepare("SELECT SUM(amount) AS earned FROM community_xp_events WHERE member_id=? AND kind='vote_adjustment'").get(people[0].id).earned,0);
});
test('a capped vote earns nothing when restored after moderation',async()=>{
 const hide=await mod('/api/community-votes/'+fixed(7)+'/'+people[0].id+'/hide','POST',{reason:'Temporary review triggered by a community report.'});
 assert.equal(hide.status,200);assert.equal((await hide.json()).xpAdjustment,0);
 const restore=await mod('/api/community-votes/'+fixed(7)+'/'+people[0].id+'/restore','POST',{reason:'Review completed; no policy issue found.'});
 assert.equal(restore.status,200);assert.equal((await restore.json()).xpAdjustment,0);
 assert.equal((await (await profile()).json()).progression.xp,10);
});