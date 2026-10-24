import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {studioAchievements} from '../canonical-auth/studio-achievements-v114.mjs';
import {normalizeAchievementDraft,previewAchievement,ACHIEVEMENT_STARTERS} from '../shared/creator-achievements-v114.mjs';
const migration=readFileSync(new URL('../canonical-auth/migrations/0015_private_creator_achievements.sql',import.meta.url),'utf8');
const P='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',Q='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ORIGIN='https://a.anevum.com',ROOT='/api/v1/member/studio/projects/'+P+'/achievements';
const A={id:'alice',emailVerified:true},B={id:'bob',emailVerified:true};
const draft=(extra={})=>({...ACHIEVEMENT_STARTERS[0].draft,...extra});
const create=(extra={})=>({clientRequestId:crypto.randomUUID(),draft:draft(extra)});
const edit=(row,extra={})=>({revision:row.revision,draft:draft(Object.fromEntries(Object.entries(row).filter(([k])=>Object.keys(draft()).includes(k)))),archived:false,...extra});
function setup(t,{migrated=true,enabled=true}={}){
 const db=new DatabaseSync(':memory:');
 // Explicit minimal SQL fixture, not a live account, production D1 or auth test.
 db.exec('PRAGMA foreign_keys=ON; CREATE TABLE "user"(id TEXT PRIMARY KEY); '+
  'CREATE TABLE member_studio_projects(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,title TEXT NOT NULL,status TEXT NOT NULL); '+
  'CREATE TABLE member_xp_events(id INTEGER PRIMARY KEY,user_id TEXT,amount INTEGER); '+
  'CREATE TABLE member_recognition_grants(user_id TEXT,recognition_id TEXT);');
 db.prepare('INSERT INTO "user" VALUES (?)').run(A.id);db.prepare('INSERT INTO "user" VALUES (?)').run(B.id);
 db.prepare('INSERT INTO member_studio_projects VALUES (?,?,?,?)').run(P,A.id,'Synthetic project A','draft');
 db.prepare('INSERT INTO member_studio_projects VALUES (?,?,?,?)').run(Q,B.id,'Synthetic project B','draft');
 db.exec("INSERT INTO member_xp_events VALUES(1,'alice',35)");
 if(migrated)db.exec(migration);
 let beforeWrite=null;
 const binding={prepare(sql){let params=[];const run=kind=>{
  if(beforeWrite&&/^(INSERT INTO member_studio_achievements\(|UPDATE member_studio_achievements SET)/.test(sql)){
   const hook=beforeWrite;beforeWrite=null;hook();
  }
  return db.prepare(sql)[kind](...params);
 };const statement={bind(...xs){params=xs;return statement;},async first(){return run('get')??null;},async all(){return {success:true,results:run('all')};}};return statement;}};
 const env={CANONICAL_CREATOR_STUDIO_ENABLED:'true',CANONICAL_CREATOR_ACHIEVEMENTS_V114:enabled?'true':'false',MEMBER_DB:binding};
 let now=10000;
 const call=(method='GET',input,options={})=>{
  const headers={'content-type':'application/json',origin:ORIGIN,'sec-fetch-site':'same-origin',...options.headers};
  const req=new Request(ORIGIN+(options.path??ROOT),{method,headers,...(input===undefined?{}:{body:typeof input==='string'?input:JSON.stringify(input)})});
  return studioAchievements(req,env,options.user===undefined?A:options.user,now);
 };
 t.after(()=>db.close());
 return {db,env,call,advance(n=3601){now+=n;},hook(fn){beforeWrite=fn;}};
}
async function add(s,extra={}){const r=await s.call('POST',create(extra));assert.equal(r.status,201,await r.clone().text());return (await r.json()).achievement;}

test('draft normalizer accepts the three bounded starters',()=>{for(const x of ACHIEVEMENT_STARTERS)assert.deepEqual(normalizeAchievementDraft(x.draft),x.draft);});
test('unexpected identity, XP and issuer fields are rejected',()=>{for(const key of ['userId','projectId','xp','kind','issued','verified','issuer'])assert.throws(()=>normalizeAchievementDraft({...draft(),[key]:'forged'}));});
test('invalid keys, control characters, counts and motifs fail closed',()=>{
 for(const x of [{stableKey:'../secret'},{triggerKey:'eval()'},{title:'\u202eFake'},{description:'bad\u0000input'},
  {targetCount:0},{targetCount:1.2},{targetCount:NaN},{targetCount:100001},{visibility:'public'},{motif:'official_medal'}])
  assert.throws(()=>normalizeAchievementDraft(draft(x)));
});
test('secret preview hides title, description and emblem until simulated milestone',()=>{
 const d=draft({visibility:'secret'}),before=previewAchievement(d,{triggerKey:d.triggerKey,count:0});
 assert.equal(before.title,'Undiscovered project mark');assert.equal(before.motif,null);
 const after=previewAchievement(d,{triggerKey:d.triggerKey,count:1});assert.equal(after.ready,true);assert.equal(after.simulation,true);assert.equal(after.platformXp,0);
});
test('wrong event key and invalid simulation totals do not unlock previews',()=>{
 assert.equal(previewAchievement(draft(),{triggerKey:'other.event',count:100}).ready,false);
 for(const count of [-1,Infinity,1.5,100001])assert.throws(()=>previewAchievement(draft(),{triggerKey:'chapter.completed',count}));
});
test('flag OFF, missing parent flag, and missing schema deny access',async t=>{
 const s=setup(t,{enabled:false});assert.equal((await s.call()).status,404);
 s.env.CANONICAL_CREATOR_ACHIEVEMENTS_V114='true';s.env.CANONICAL_CREATOR_STUDIO_ENABLED='false';assert.equal((await s.call()).status,404);
 const missing=setup(t,{migrated:false});assert.equal((await missing.call()).status,503);
});
test('guest, unverified member and another owner cannot read drafts',async t=>{
 const s=setup(t);assert.equal((await s.call('GET',undefined,{user:null})).status,403);
 assert.equal((await s.call('GET',undefined,{user:{...A,emailVerified:false}})).status,403);
 assert.equal((await s.call('GET',undefined,{user:B})).status,404);
});
test('create and read persist a private draft without exposing internal account data',async t=>{
 const s=setup(t),row=await add(s);assert.equal(row.status,'private_draft');assert.equal(row.revision,1);
 const r=await s.call();assert.equal(r.headers.get('cache-control'),'private, no-store');
 const out=await r.json();assert.equal(out.issuanceEnabled,false);assert.equal(out.achievements[0].id,row.id);
 assert.equal('userId' in row,false);assert.equal('request_json' in row,false);
 assert.equal((await s.call('GET',undefined,{path:ROOT+'/'+row.id})).status,200);
});
test('identical creation retry returns one record, changed content with same ID conflicts',async t=>{
 const s=setup(t),input=create();assert.equal((await s.call('POST',input)).status,201);
 const retry=await s.call('POST',input);assert.equal(retry.status,200);assert.equal((await retry.json()).replayed,true);
 assert.equal((await s.call('POST',{...input,draft:draft({title:'Different title'})})).status,409);
 assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_studio_achievements').get().n,1);
});
test('concurrent duplicate creates converge to one durable definition',async t=>{
 const s=setup(t),input=create(),rs=await Promise.all([s.call('POST',input),s.call('POST',input)]);
 assert.deepEqual(rs.map(r=>r.status).sort(),[200,201]);
 assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_studio_achievement_versions').get().n,1);
});
test('stable key collision is prevented even with distinct request IDs',async t=>{
 const s=setup(t);await add(s);assert.equal((await s.call('POST',create())).status,409);
});
test('revisioned save rejects stale writers and records original criteria',async t=>{
 const s=setup(t),row=await add(s),input=edit(row,{draft:draft({targetCount:3})}),path=ROOT+'/'+row.id;
 assert.equal((await s.call('PATCH',input,{path})).status,200);
 assert.equal((await s.call('PATCH',input,{path})).status,409);
 const h=await (await s.call('GET',undefined,{path:path+'/versions'})).json();
 assert.equal(h.versions.length,2);assert.equal(h.versions[0].snapshot.targetCount,3);assert.equal(h.versions[1].snapshot.targetCount,1);
});
test('simultaneous revision writes cannot silently overwrite each other',async t=>{
 const s=setup(t),row=await add(s),path=ROOT+'/'+row.id;
 const rs=await Promise.all([s.call('PATCH',edit(row,{draft:draft({title:'First writer'})}),{path}),s.call('PATCH',edit(row,{draft:draft({title:'Second writer'})}),{path})]);
 assert.deepEqual(rs.map(r=>r.status).sort(),[200,409]);
});
test('stable achievement identity is immutable through API and SQL guard',async t=>{
 const s=setup(t),row=await add(s);
 assert.equal((await s.call('PATCH',edit(row,{draft:draft({stableKey:'other_key'})}),{path:ROOT+'/'+row.id})).status,422);
 assert.throws(()=>s.db.prepare('UPDATE member_studio_achievements SET user_id=?,revision=revision+1 WHERE id=?').run(B.id,row.id));
 assert.throws(()=>s.db.prepare('UPDATE member_studio_achievements SET title=? WHERE id=?').run('No revision',row.id));
});
test('original create receipt still deduplicates after subsequent edits',async t=>{
 const s=setup(t),input=create();const row=(await (await s.call('POST',input)).json()).achievement;
 await s.call('PATCH',edit(row,{draft:draft({title:'Revised title'})}),{path:ROOT+'/'+row.id});
 const out=await (await s.call('POST',input)).json();assert.equal(out.replayed,true);assert.equal(out.achievement.title,'Revised title');assert.equal(out.achievement.revision,2);
});
test('archive and restore keep stable keys and revision history',async t=>{
 const s=setup(t),row=await add(s),path=ROOT+'/'+row.id;
 const archived=(await (await s.call('PATCH',edit(row,{archived:true}),{path})).json()).achievement;
 assert.ok(archived.archivedAt);assert.equal(archived.revision,2);
 assert.equal((await s.call('POST',create())).status,409);
 const restored=(await (await s.call('PATCH',edit(archived),{path})).json()).achievement;
 assert.equal(restored.archivedAt,null);assert.equal(restored.id,row.id);assert.equal(restored.revision,3);
});
test('pending review blocks create, edit and archive but preserves private reads',async t=>{
 const s=setup(t),row=await add(s);s.db.prepare('UPDATE member_studio_projects SET status=? WHERE id=?').run('pending_review',P);
 assert.equal((await s.call('POST',create({stableKey:'second_mark'}))).status,409);
 assert.equal((await s.call('PATCH',edit(row,{archived:true}),{path:ROOT+'/'+row.id})).status,409);
 assert.equal((await s.call()).status,200);
});
test('project review lock racing a create is checked again inside SQL',async t=>{
 const s=setup(t);s.hook(()=>s.db.prepare('UPDATE member_studio_projects SET status=? WHERE id=?').run('pending_review',P));
 assert.equal((await s.call('POST',create())).status,409);assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_studio_achievements').get().n,0);
});
test('project review lock racing an update is checked again inside SQL',async t=>{
 const s=setup(t),row=await add(s);s.hook(()=>s.db.prepare('UPDATE member_studio_projects SET status=? WHERE id=?').run('pending_review',P));
 assert.equal((await s.call('PATCH',edit(row),{path:ROOT+'/'+row.id})).status,409);
 assert.equal(s.db.prepare('SELECT revision FROM member_studio_achievements').get().revision,1);
});
test('cross-account and cross-project achievement IDs cannot be used to read or mutate',async t=>{
 const s=setup(t),row=await add(s),wrong=ROOT.replace(P,Q)+'/'+row.id;
 assert.equal((await s.call('GET',undefined,{path:wrong,user:B})).status,404);
 assert.equal((await s.call('PATCH',edit(row),{path:ROOT+'/'+row.id,user:B})).status,404);
 assert.equal((await s.call('GET',undefined,{path:ROOT+'/'+row.id+'/versions',user:B})).status,404);
});
test('cross-origin and explicitly cross-site writes fail, missing Fetch Metadata is allowed',async t=>{
 const s=setup(t);assert.equal((await s.call('POST',create(),{headers:{origin:'https://evil.invalid'}})).status,403);
 assert.equal((await s.call('POST',create(),{headers:{'sec-fetch-site':'cross-site'}})).status,403);
 const req=new Request(ORIGIN+ROOT,{method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},body:JSON.stringify(create())});
 assert.equal((await studioAchievements(req,s.env,A,10000)).status,201);
});
test('query strings, non-v4 IDs and unsupported methods fail',async t=>{
 const s=setup(t);assert.equal((await s.call('GET',undefined,{path:ROOT+'?all=true'})).status,404);
 assert.equal((await s.call('GET',undefined,{path:ROOT.replace(P,'a'.repeat(36))})).status,404);
 assert.equal((await s.call('DELETE')).status,405);assert.equal((await s.call('PATCH',{})).status,405);
});
test('oversized, malformed and non-JSON bodies fail without writes',async t=>{
 const s=setup(t);for(const body of ['{','x'.repeat(9000),JSON.stringify({...create(),xp:10000})])assert.equal((await s.call('POST',body)).status,400);
 assert.equal((await s.call('POST',create(),{headers:{'content-type':'text/plain'}})).status,400);
 assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_studio_achievements').get().n,0);
});
test('per-account edit budget is enforced and renews after its time window',async t=>{
 const s=setup(t);s.db.prepare('INSERT INTO member_studio_achievement_edit_limits VALUES(?,?,?)').run(A.id,10000,40);
 assert.equal((await s.call('POST',create())).status,429);s.advance();assert.equal((await s.call('POST',create())).status,201);
});
test('active cap, archive space and bounded total retention are enforced',async t=>{
 const s=setup(t);let first;
 for(let i=0;i<50;i++){if(i===35)s.advance();const r=await add(s,{stableKey:'mark_'+i});first??=r;}
 assert.equal((await s.call('POST',create({stableKey:'mark_over'}))).status,409);
 const archived=(await (await s.call('PATCH',edit(first,{archived:true}),{path:ROOT+'/'+first.id})).json()).achievement;
 await add(s,{stableKey:'mark_over'});
 assert.equal((await s.call('PATCH',edit(archived),{path:ROOT+'/'+first.id})).status,409);
});
test('revision history is bounded to twelve snapshots',async t=>{
 const s=setup(t);let row=await add(s);for(let i=0;i<15;i++)row=(await (await s.call('PATCH',edit(row,{draft:draft({title:'Revision '+i})}),{path:ROOT+'/'+row.id})).json()).achievement;
 const out=await (await s.call('GET',undefined,{path:ROOT+'/'+row.id+'/versions'})).json();assert.equal(out.versions.length,12);assert.equal(out.versions[0].revision,16);
});
test('user deletion cascades private definitions, histories and edit counters',async t=>{
 const s=setup(t);await add(s);s.db.prepare('DELETE FROM "user" WHERE id=?').run(A.id);
 for(const table of ['member_studio_achievements','member_studio_achievement_versions','member_studio_achievement_edit_limits'])assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,0);
});
test('draft service and preview cannot mint XP, grants or official honors',async t=>{
 const s=setup(t);await add(s);previewAchievement(draft(),{triggerKey:'chapter.completed',count:1});
 assert.deepEqual({...s.db.prepare('SELECT COUNT(*) AS n,SUM(amount) AS total FROM member_xp_events').get()},{n:1,total:35});
 assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_recognition_grants').get().n,0);
 for(const extra of [{xp:1000},{userId:B.id},{status:'published'}])assert.equal((await s.call('POST',{...create(),...extra})).status,400);
});

test('one hundred total retained drafts cannot be bypassed by archiving',async t=>{
 const s=setup(t);
 for(let i=0;i<100;i++){
  if(i%10===0)s.advance();
  const row=await add(s,{stableKey:'retained_'+i});
  assert.equal((await s.call('PATCH',edit(row,{archived:true}),{path:ROOT+'/'+row.id})).status,200);
 }
 s.advance();assert.equal((await s.call('POST',create({stableKey:'retained_overflow'}))).status,409);
 assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_studio_achievements').get().n,100);
});
test('storage faults return generic errors without leaking SQL or account details',async t=>{
 const s=setup(t);s.env.MEMBER_DB={prepare(){throw Error('private SQL password marker');}};
 const r=await s.call();assert.equal(r.status,503);assert.equal((await r.text()).includes('password'),false);
});
