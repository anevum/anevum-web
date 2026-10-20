import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createMemberWorker} from '../auth/worker.mjs';
import studio from '../authoring/worker.mjs';
import publicApi from '../api/worker.mjs';

const dbSqlite=new DatabaseSync(':memory:');
dbSqlite.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY NOT NULL,handle TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(handle) BETWEEN 3 AND 30),display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),bio TEXT NOT NULL DEFAULT '',avatar_url TEXT,website_url TEXT,is_staff INTEGER NOT NULL DEFAULT 0 CHECK(is_staff IN (0,1)),status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deleted')),created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE projects(id TEXT PRIMARY KEY NOT NULL,owner_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id) ON DELETE RESTRICT,slug TEXT NOT NULL CHECK(length(slug) BETWEEN 3 AND 90),title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 100),summary TEXT NOT NULL CHECK(length(summary) BETWEEN 1 AND 280),description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=25000),category TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_review','changes_requested','published','rejected','archived')),free_to_use INTEGER NOT NULL DEFAULT 1 CHECK(free_to_use IN (0,1)),license_name TEXT,source_url TEXT,demo_url TEXT,ai_disclosure TEXT NOT NULL DEFAULT '',human_contribution TEXT NOT NULL DEFAULT '',published_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(owner_member_id,slug));`);
for(const filename of ['../authoring/migrations/0002_staff_authoring.sql','../auth/migrations/0003_member_identity_staging.sql','../auth/migrations/0004_member_project_workflow.sql','../auth/migrations/0005_voting_progression.sql'])dbSqlite.exec(readFileSync(new URL(filename,import.meta.url),'utf8'));
// These two existing V1 schema tables are part of the base community
// migration; model them explicitly in this isolated full-journey fixture.
dbSqlite.exec(`
CREATE TABLE project_favorites(
 member_id TEXT NOT NULL REFERENCES creator_profiles(member_id),
 project_id TEXT NOT NULL REFERENCES projects(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(member_id,project_id)
);
CREATE TABLE project_releases(
 id TEXT PRIMARY KEY NOT NULL,
 project_id TEXT NOT NULL REFERENCES projects(id),
 version TEXT NOT NULL,
 notes TEXT NOT NULL DEFAULT '',
 released_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

function statement(sql,params=[]){return {sql,params,
 bind(...p){return statement(sql,p)},
 async all(){return {success:true,results:dbSqlite.prepare(sql).all(...params).map(o=>({...o}))}},
 async run(){const r=dbSqlite.prepare(sql).run(...params);return{success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}}}
};}
const db={prepare(sql){return statement(sql)},async batch(queries){dbSqlite.exec('BEGIN IMMEDIATE');try{const out=[];for(const q of queries){const s=dbSqlite.prepare(q.sql);const v=s.run(...q.params);out.push({success:true,meta:{changes:Number(v.changes),rows_written:Number(v.changes)}})}dbSqlite.exec('COMMIT');return out}catch(e){dbSqlite.exec('ROLLBACK');throw e}}};
const now=1791700000,env={COMMUNITY_DB:db,AUTH_PEPPER:'a'.repeat(64)};
const app=createMemberWorker({clock:()=>now,fetcher:async()=>{throw Error('Network access prohibited in tests')}});
const textEncoder=new TextEncoder();
async function hashSession(token){const key=await crypto.subtle.importKey('raw',Uint8Array.from(env.AUTH_PEPPER.match(/../g).map(x=>parseInt(x,16))),{name:'HMAC',hash:'SHA-256'},false,['sign']);const h=await crypto.subtle.sign('HMAC',key,textEncoder.encode('session\0'+token));return Buffer.from(h).toString('hex')}
const identities=[{id:'alice-member',email:'alice@example.com',token:'a'.repeat(64),handle:'alice_dev'},{id:'bob-member',email:'bob@example.com',token:'b'.repeat(64),handle:'bob_dev'}];
for(const m of identities){dbSqlite.prepare('INSERT INTO member_accounts(id,email,verified_at,status,created_at) VALUES (?,?,?,\'active\',?)').run(m.id,m.email,now,now);dbSqlite.prepare('INSERT INTO member_sessions(token_hash,member_id,expires_at,created_at) VALUES (?,?,?,?)').run(await hashSession(m.token),m.id,now+5000,now);}
const memberReq=(path,method='GET',value=undefined,m=identities[0],origin='https://next.anevum.com')=>new Request('https://next.anevum.com/api/v1/member'+path,{method,headers:{origin,'sec-fetch-site':'same-origin','content-type':'application/json',...(m?{cookie:'__Host-anevum_stage_sid='+m.token}:{})},body:value===undefined?undefined:JSON.stringify(value)});
const memberCall=(path,method='GET',value=undefined,m=identities[0],origin='https://next.anevum.com')=>app.fetch(memberReq(path,method,value,m,origin),env);
const studioEnv={COMMUNITY_DB:db,STUDIO_ACCESS_ISSUER:'https://fixture.cloudflareaccess.com',STUDIO_ACCESS_AUDIENCE:'owner-aud',STUDIO_ALLOWED_EMAILS:'owner@example.com'};
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='fixture-key';
const encode=v=>Buffer.from(v instanceof Uint8Array?v:typeof v==='string'?v:JSON.stringify(v)).toString('base64url');
async function jwt(overrides={}){const t=Math.floor(Date.now()/1000);const fields=[encode({alg:'RS256',kid:'fixture-key'}),encode({iss:studioEnv.STUDIO_ACCESS_ISSUER,aud:[studioEnv.STUDIO_ACCESS_AUDIENCE],email:'owner@example.com',iat:t-20,exp:t+900,...overrides})];const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,textEncoder.encode(fields.join('.')));return fields.concat(encode(new Uint8Array(sig))).join('.')}
const token=await jwt(),savedFetch=globalThis.fetch;globalThis.fetch=async url=>String(url).endsWith('/cdn-cgi/access/certs')?Response.json({keys:[jwk]}):Promise.reject(Error('Unexpected external fetch'));
test.after(()=>{globalThis.fetch=savedFetch;dbSqlite.close()});
const studioCall=(path,method='GET',value=undefined,t=token,origin='https://studio.next.anevum.com')=>studio.fetch(new Request('https://studio.next.anevum.com'+path,{method,headers:{'cf-access-jwt-assertion':t,origin,'sec-fetch-site':'same-origin','content-type':'application/json'},body:value===undefined?undefined:JSON.stringify(value)}),studioEnv);
const valid={slug:'helpful-utility',title:'Helpful Utility',summary:'A real software project submitted by a creator.',category:'tools',description:'Documented test build, no hidden code execution.',sourceUrl:'https://github.com/anevum/anevum-web',demoUrl:'',aiDisclosure:'AI helped build and review the initial interface.',humanContribution:'Developer verified accessibility and manually tested the user journey.',license:'MIT',freeToUse:true};
const projectRows=()=>dbSqlite.prepare('SELECT id,owner_member_id,status,revision,title FROM projects ORDER BY rowid').all();
const events=()=>dbSqlite.prepare('SELECT action,actor_kind,to_status,reason FROM project_submission_events ORDER BY rowid').all();
let projectId,revision;

test('schema is staged, revisioned, indexed and cannot accidentally grant staff',()=>{
 const tables=dbSqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);
 assert.ok(tables.includes('project_submission_events'));assert.ok(dbSqlite.prepare("SELECT version FROM schema_migrations WHERE version='0004_member_project_workflow'").get());
 assert.equal(dbSqlite.prepare("SELECT is_staff FROM creator_profiles WHERE member_id='anevum-official'").get().is_staff,1);
});
test('member requires signed-in session and completed profile before any project',async()=>{
 assert.equal((await memberCall('/projects','GET',undefined,null)).status,401);
 assert.equal((await memberCall('/projects','POST',valid)).status,409);
 assert.equal((await memberCall('/projects','POST',valid,identities[0],'https://malicious.example')).status,403);
 const anon=await app.fetch(memberReq('/projects/manage','GET',undefined,null),env);assert.equal(anon.status,303);assert.match(anon.headers.get('location'),/\/join$/);
 for(const m of identities){const r=await memberCall('/profile','POST',{handle:m.handle,displayName:m.handle,bio:'Open-source maker working on useful tools.'},m);assert.equal(r.status,200,await r.clone().text())}
});
test('draft UI and Studio queue are genuine private interfaces',async()=>{
 const join=await memberCall('/join');assert.match(await join.text(),/Manage my projects/);
 const r=await memberCall('/projects/manage');assert.equal(r.status,200);const html=await r.text();assert.match(html,/Your projects/);assert.match(html,/\<form id="editor"/);
 assert.equal((await memberCall('/projects/manage.css')).status,200);
 assert.equal((await memberCall('/projects/manage.js')).status,200);
 const studioPage=await studioCall('/');assert.equal(studioPage.status,200);assert.match(await studioPage.text(),/Community submissions/);
 assert.equal((await studioCall('/api/review-queue','GET',undefined,'fake')).status,401);
});
test('draft creation validates project, never exposes another members draft or public listing',async()=>{
 for(const data of [{...valid,demoUrl:'javascript:alert(1)'},{...valid,slug:'../../bad'},{...valid,summary:'tiny'}])assert.equal((await memberCall('/projects','POST',data)).status,400);
 const r=await memberCall('/projects','POST',valid);assert.equal(r.status,201,await r.clone().text());const body=await r.json();projectId=body.id;revision=body.revision;assert.match(projectId,/^[a-f0-9]{32}$/);assert.equal(revision,1);
 assert.equal((await memberCall('/projects/'+projectId,'GET',undefined,identities[1])).status,404);
 assert.equal((await memberCall('/projects/'+projectId,'PATCH',{...valid,revision},identities[1])).status,404);
 assert.equal((await memberCall('/projects/'+projectId+'/submit','POST',{revision},identities[1])).status,404);
 assert.equal((await (await memberCall('/projects','GET',undefined,identities[1])).json()).projects.length,0);
 assert.equal((await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env)).json()).items.length,0);
 const queue=await (await studioCall('/api/review-queue')).json();assert.equal(queue.projects.length,0);
});
test('revision protects against stale and cross-origin edits',async()=>{
 const changed=await memberCall('/projects/'+projectId,'PATCH',{...valid,title:'Improved Helpful Utility',revision});assert.equal(changed.status,200,await changed.clone().text());revision=(await changed.json()).revision;
 assert.equal(revision,2);assert.equal((await memberCall('/projects/'+projectId,'PATCH',{...valid,revision:1})).status,409);
 assert.equal((await memberCall('/projects/'+projectId,'PATCH',{...valid,revision},identities[0],'https://malicious.example')).status,403);
 assert.equal((await studioCall('/api/review-queue/'+projectId+'/publish','POST',{reason:'Cannot publish',revision})).status,404);
});
test('submit locks edits and enters Access-only review without leaking email or public listing',async()=>{
 const r=await memberCall('/projects/'+projectId+'/submit','POST',{revision});assert.equal(r.status,200,await r.clone().text());revision=(await r.json()).revision;
 assert.equal((await memberCall('/projects/'+projectId,'PATCH',{...valid,revision})).status,409);
 const out=await studioCall('/api/review-queue');assert.equal(out.status,200);const result=await out.json();assert.equal(result.projects.length,1);assert.equal(result.projects[0].id,projectId);assert.equal(result.projects[0].creatorHandle,'alice_dev');assert.ok(!JSON.stringify(result).includes('alice@example.com'));
 assert.equal((await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env)).json()).items.length,0);
});
test('signed staff can request changes with reason, and creator alone can revise and resubmit',async()=>{
 assert.equal((await studioCall('/api/review-queue/'+projectId+'/request-changes','POST',{reason:'too short',revision})).status,400);
 assert.equal((await studioCall('/api/review-queue/'+projectId+'/publish','POST',{reason:'Accepted by attacker',revision},token,'https://malicious.example')).status,403);
 const bad=await jwt({aud:['wrong']});assert.equal((await studioCall('/api/review-queue/'+projectId+'/publish','POST',{reason:'Unauthorized publishing attempt',revision},bad)).status,401);
 const reviewed=await studioCall('/api/review-queue/'+projectId+'/request-changes','POST',{reason:'Please explain how the software was tested.',revision});assert.equal(reviewed.status,200,await reviewed.clone().text());revision=(await reviewed.json()).revision;
 const detail=await (await memberCall('/projects/'+projectId)).json();assert.equal(detail.project.status,'changes_requested');assert.match(detail.reviewHistory[0].reason,/how the software was tested/);assert.ok(!JSON.stringify(detail).includes('owner@example.com'));
 assert.equal((await memberCall('/projects/'+projectId,'PATCH',{...valid,title:'Forged B edit',revision},identities[1])).status,404);
 const updated=await memberCall('/projects/'+projectId,'PATCH',{...valid,title:'Tested Helpful Utility',revision});assert.equal(updated.status,200,await updated.clone().text());revision=(await updated.json()).revision;
 const submitted=await memberCall('/projects/'+projectId+'/submit','POST',{revision});assert.equal(submitted.status,200,await submitted.clone().text());revision=(await submitted.json()).revision;
});
test('moderator publication is conditional, auditable and changes the real public API',async()=>{
 assert.equal((await studioCall('/api/review-queue/'+projectId+'/publish','POST',{reason:'Checks passed and project has valid source.',revision:revision-1})).status,409);
 const published=await studioCall('/api/review-queue/'+projectId+'/publish','POST',{reason:'Verified disclosures, source, and baseline usability.',revision});assert.equal(published.status,200,await published.clone().text());revision=(await published.json()).revision;
 assert.equal((await studioCall('/api/review-queue/'+projectId+'/publish','POST',{reason:'Duplicate publish not permitted',revision})).status,404);
 const publicList=await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env)).json();assert.equal(publicList.items.length,1);assert.equal(publicList.items[0].title,'Tested Helpful Utility');
 assert.equal((await memberCall('/projects/'+projectId,'PATCH',{...valid,revision})).status,409);
 const eventLog=events().filter(x=>x.to_status!=='rejected');assert.deepEqual(eventLog.map(x=>x.action),['create','edit','submit','request_changes','edit','submit','publish']);
});
test('staff may reject instead of publish, leaving public discovery unchanged',async()=>{
 const v={...valid,slug:'second-project',title:'Second Project'};const created=await memberCall('/projects','POST',v);assert.equal(created.status,201,await created.clone().text());const data=await created.json();
 const submission=await memberCall('/projects/'+data.id+'/submit','POST',{revision:data.revision});assert.equal(submission.status,200);
 const rejected=await studioCall('/api/review-queue/'+data.id+'/reject','POST',{reason:'Project is not ready for release and needs a revision.',revision:2});assert.equal(rejected.status,200,await rejected.clone().text());
 assert.equal((await memberCall('/projects/'+data.id,'PATCH',{...v,revision:3})).status,409);
 assert.equal((await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env)).json()).items.length,1);
 assert.deepEqual(projectRows().map(x=>x.status),['published','rejected']);
 assert.equal(dbSqlite.prepare("SELECT COUNT(*) AS n FROM project_submission_events WHERE action='reject'").get().n,1);
});

test('integrated journey: publication becomes public creator content and independent member participation',async()=>{
  // Prior tests drive authenticated A -> separately signed staff review -> publish.
  // Here the same database is used by public and member endpoints, not a
  // projection seeded with artificial users or manually inserted ratings.
  const publicIndex=await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env);
  assert.equal(publicIndex.status,200);
  const listings=(await publicIndex.json()).items;
  assert.deepEqual(listings.map(x=>x.id),[projectId]);

  const creators=await (await publicApi.fetch(new Request('https://anevum.com/api/v1/creators'),env)).json();
  assert.deepEqual(creators.items,[{handle:'alice_dev',displayName:'alice_dev',publishedProjects:1}]);
  assert.equal((await publicApi.fetch(new Request('https://anevum.com/api/v1/creators/bob_dev'),env)).status,404);
  const alicePublic=await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects?creator=alice_dev'),env)).json();
  assert.deepEqual(alicePublic.items.map(x=>x.id),[projectId]);
  assert.equal((await publicApi.fetch(new Request('https://anevum.com/api/v1/projects?creator=bob_dev'),env)).status,200);
  for(const value of [JSON.stringify(creators),JSON.stringify(alicePublic)]){
    assert.ok(!value.includes('alice@example.com'));
    assert.ok(!value.includes('alice-member'));
    assert.ok(!value.includes('is_staff'));
  }
  // Creator A may view public stats but never earn a rating for their own work.
  assert.equal((await memberCall('/community/projects/'+projectId+'/vote','POST',{score:5,revision:0},identities[0])).status,403);
  assert.equal((await memberCall('/community/projects/'+projectId,'GET',undefined,null)).status,200);
  assert.equal((await memberCall('/library','GET',undefined,null)).status,401);
  assert.equal((await memberCall('/library','GET',undefined,identities[0])).status,200);

  // Member B votes and saves through the real staged endpoints.
  const first=await memberCall('/community/projects/'+projectId+'/vote','POST',{score:5,revision:0},identities[1]);
  assert.equal(first.status,200,await first.clone().text());
  const voted=await first.json();
  assert.equal(voted.changed,true);
  assert.equal(voted.rating.votes,1);
  assert.deepEqual(voted.rating.myVote,{score:5,revision:1});
  assert.equal(voted.progression.xp,2);
  const again=await memberCall('/community/projects/'+projectId+'/vote','POST',{score:5,revision:1},identities[1]);
  assert.equal(again.status,200);
  assert.equal((await again.json()).changed,false);
  const save=await memberCall('/library/'+projectId,'POST',{saved:true},identities[1]);
  assert.equal(save.status,200,await save.clone().text());
  assert.deepEqual(await save.json(),{saved:true,changed:true});
  const duplicateSave=await memberCall('/library/'+projectId,'POST',{saved:true},identities[1]);
  assert.deepEqual(await duplicateSave.json(),{saved:true,changed:false});
  const bLibrary=await (await memberCall('/library','GET',undefined,identities[1])).json();
  assert.deepEqual(bLibrary.items.map(x=>x.id),[projectId]);
  const aLibrary=await (await memberCall('/library','GET',undefined,identities[0])).json();
  assert.equal(aLibrary.count,0);
  assert.equal((await (await memberCall('/community/me','GET',undefined,identities[1])).json()).progression.xp,2);
  assert.equal(dbSqlite.prepare("SELECT COUNT(*) AS n FROM community_xp_events WHERE member_id='bob-member'").get().n,1);
  assert.equal(dbSqlite.prepare("SELECT is_staff FROM creator_profiles WHERE member_id='bob-member'").get().is_staff,0);
});

test('integrated journey: signed Studio moderation reverses and restores only earned XP',async()=>{
  assert.equal((await studioCall('/api/community-votes?project='+projectId,'GET',undefined,'invalid-access-assertion')).status,401);
  const queue=await studioCall('/api/community-votes?project='+projectId);
  assert.equal(queue.status,200);
  assert.equal((await queue.json()).votes.length,1);
  assert.equal((await studioCall('/api/community-votes/'+projectId+'/bob-member/hide','POST',{reason:'bad'})).status,400);
  const hide=await studioCall('/api/community-votes/'+projectId+'/bob-member/hide','POST',{reason:'Confirmed rating rule violation requiring staff review.'});
  assert.equal(hide.status,200,await hide.clone().text());
  assert.equal((await hide.json()).xpAdjustment,-2);
  assert.equal((await (await memberCall('/community/me','GET',undefined,identities[1])).json()).progression.xp,0);
  const hiddenRating=await (await memberCall('/community/projects/'+projectId,'GET',undefined,null)).json();
  assert.equal(hiddenRating.rating.votes,0);
  assert.equal((await memberCall('/community/projects/'+projectId+'/vote','POST',{score:4,revision:1},identities[1])).status,403);
  assert.equal((await studioCall('/api/community-votes/'+projectId+'/bob-member/hide','POST',{reason:'A repeat moderation action must be rejected.'})).status,409);

  const restore=await studioCall('/api/community-votes/'+projectId+'/bob-member/restore','POST',{reason:'The appeal was supported and the original rating is reinstated.'});
  assert.equal(restore.status,200,await restore.clone().text());
  assert.equal((await restore.json()).xpAdjustment,2);
  assert.equal((await (await memberCall('/community/me','GET',undefined,identities[1])).json()).progression.xp,2);
  const visibleRating=await (await memberCall('/community/projects/'+projectId,'GET',undefined,null)).json();
  assert.equal(visibleRating.rating.votes,1);
  assert.equal(visibleRating.rating.average,5);
  assert.equal((await studioCall('/api/community-votes/'+projectId+'/bob-member/restore','POST',{reason:'A duplicate restoration must be rejected.'})).status,409);
  const awards=dbSqlite.prepare("SELECT kind,amount FROM community_xp_events WHERE member_id='bob-member' ORDER BY rowid").all();
  assert.deepEqual(awards.map(x=>x.amount),[2,-2,2]);
  assert.equal(awards.reduce((sum,x)=>sum+x.amount,0),2);
  assert.equal(dbSqlite.prepare("SELECT is_staff FROM creator_profiles WHERE member_id='bob-member'").get().is_staff,0);
});

test('integrated journey: sign-out revokes B while public content and A remain independent',async()=>{
  const out=await memberCall('/sign-out','POST',{},identities[1]);
  assert.equal(out.status,200,await out.clone().text());
  assert.match(out.headers.get('set-cookie')||'',/Max-Age=0/);
  assert.equal((await memberCall('/library','GET',undefined,identities[1])).status,401);
  assert.equal((await memberCall('/community/me','GET',undefined,identities[1])).status,401);
  assert.equal((await memberCall('/community/projects/'+projectId+'/vote','POST',{score:3,revision:1},identities[1])).status,401);
  assert.equal((await memberCall('/me','GET',undefined,identities[0])).status,200);
  const anonymous=await publicApi.fetch(new Request('https://anevum.com/api/v1/projects/'+projectId),env);
  assert.equal(anonymous.status,200);
  assert.equal((await anonymous.json()).item.creatorHandle,'alice_dev');
  assert.equal((await publicApi.fetch(new Request('https://anevum.com/api/v1/creators/alice_dev'),env)).status,200);
});
