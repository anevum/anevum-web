import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {canonicalRecognitionCatalog} from '../canonical-auth/recognition-catalog.mjs';
import {canonicalRecognition,publicRecognitionSummary} from '../canonical-auth/recognition.mjs';
import {awardPublicProfileBadge} from '../canonical-auth/recognition-issuer.mjs';

const migration=readFileSync(new URL('../canonical-auth/migrations/0010_player_recognition.sql',import.meta.url),'utf8');
const ORIGIN='https://anevum.com';
const url=ORIGIN+'/api/v1/member/recognition';
const catalogUrl=ORIGIN+'/api/v1/public/recognition/catalog';
function makeDb({recognition=true,progression=true}={}){
 const raw=new DatabaseSync(':memory:');
 raw.exec([
  'CREATE TABLE "user"(id TEXT PRIMARY KEY);',
  'CREATE TABLE member_creator_profiles(user_id TEXT PRIMARY KEY REFERENCES "user"(id),handle TEXT,visibility TEXT);',
  "CREATE TABLE member_space_settings(user_id TEXT PRIMARY KEY,featured_json TEXT NOT NULL DEFAULT '[]',show_stats INTEGER NOT NULL DEFAULT 1);",
  'CREATE TABLE member_space_milestones(user_id TEXT,milestone TEXT,earned_at INTEGER,PRIMARY KEY(user_id,milestone));',
  'CREATE TABLE member_reward_notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,kind TEXT,reference TEXT,created_at INTEGER,UNIQUE(user_id,kind,reference));',
  'CREATE TABLE member_creator_edit_limits(user_id TEXT PRIMARY KEY,window_start INTEGER NOT NULL,requests INTEGER NOT NULL);',
  "INSERT INTO \"user\"(id) VALUES ('alpha'),('beta');",
  "INSERT INTO member_creator_profiles(user_id,handle,visibility) VALUES ('alpha','alpha_sample','public'),('beta','beta_sample','private');",
  "INSERT INTO member_space_settings(user_id,featured_json) VALUES ('alpha','[]'),('beta','[]');"
 ].join('\n'));
 if(progression)raw.exec([
  'CREATE TABLE member_xp_events(id INTEGER PRIMARY KEY,user_id TEXT,amount INTEGER);',
  'CREATE TABLE member_notification_receipts(user_id TEXT PRIMARY KEY,through_id INTEGER);'
 ].join('\n'));
 if(recognition)raw.exec(migration);
 const calls=[];
 return {raw,calls,prepare(sql){
  calls.push(sql);const stmt=raw.prepare(sql);const obj={
   args:[],
   bind(...args){obj.args=args;return obj},
   async first(){return stmt.get(...obj.args)||null},
   async all(){return {success:true,results:stmt.all(...obj.args)}},
   async run(){const result=stmt.run(...obj.args);return {success:true,meta:{changes:result.changes},results:[]}}
  };return obj;
 }};
}
const env=(db,flag='true')=>({MEMBER_DB:db,CANONICAL_RECOGNITION_ENABLED:flag});
const owner=id=>({id,emailVerified:true});
const patch=(body)=>new Request(url,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('public catalog exposes only issuer availability, never XP, emails or owned grants',async t=>{
 const db=makeDb();t.after(()=>db.raw.close());
 const response=await canonicalRecognitionCatalog(new Request(catalogUrl),env(db));
 assert.equal(response.status,200);
 const data=await response.json();
 assert.deepEqual(Object.keys(data).sort(),['activeBadgeIds','activeMedalIds','activeRibbonIds','version']);
 assert.equal(data.version,1);
 assert.deepEqual(data.activeBadgeIds,['first_signal','world_shaper','first_orbit','first_thread','first_reply','conversationalist']);
 assert.deepEqual(data.activeRibbonIds,[]);
 assert.deepEqual(data.activeMedalIds,[]);
 assert.equal(JSON.stringify(data).includes('alpha'),false);
 assert.equal(JSON.stringify(data).includes('user_id'),false);
 const head=await canonicalRecognitionCatalog(new Request(catalogUrl,{method:'HEAD'}),env(db));
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
});
test('public catalog fails closed for disabled feature or missing recognition schema',async t=>{
 const db=makeDb(),missing=makeDb({recognition:false});
 t.after(()=>{db.raw.close();missing.raw.close()});
 for(const [database,flag] of [[db,'false'],[missing,'true']]){
  const response=await canonicalRecognitionCatalog(new Request(catalogUrl),env(database,flag));
  assert.deepEqual((await response.json()).activeBadgeIds,['first_signal','world_shaper']);
 }
 const unprepared=makeDb({progression:false});t.after(()=>unprepared.raw.close());
 const noProgression=await canonicalRecognitionCatalog(new Request(catalogUrl),env(unprepared,'false'));
 assert.deepEqual((await noProgression.json()).activeBadgeIds,[]);
});
test('catalog rejects query and writes and cannot expose grant records',async t=>{
 const db=makeDb();t.after(()=>db.raw.close());
 let response=await canonicalRecognitionCatalog(new Request(catalogUrl+'?member=alpha'),env(db));
 assert.equal(response.status,400);
 const count=db.calls.length;
 response=await canonicalRecognitionCatalog(new Request(catalogUrl,{method:'POST'}),env(db));
 assert.equal(response.status,405);
 assert.equal(db.calls.length,count,'unsupported request must not query member state');
 assert.ok(!db.calls.some(s=>s.includes('member_recognition_grants WHERE user_id')));
});
test('authenticated card settings save/reload, revision conflict and visibility projection roundtrip in SQLite',async t=>{
 const db=makeDb();t.after(()=>db.raw.close());
 await awardPublicProfileBadge(db,'alpha',1700000000,true);
 const initial=await canonicalRecognition(new Request(url),env(db),owner('alpha'),1700000001);
 assert.equal(initial.status,200);
 const before=await initial.json();
 assert.equal(before.badgeMode,'hidden','migration never opts-in an existing member');
 assert.equal(before.revision,1);
 assert.deepEqual(before.earnedBadges.map(x=>x.id),['first_orbit']);
 const body={badgeMode:'curated',badgeIds:['first_orbit'],medalId:null,ribbonIds:[],aura:'nebula',revision:before.revision};
 const saved=await canonicalRecognition(patch(body),env(db),owner('alpha'),1700000020);
 assert.equal(saved.status,200,await saved.clone().text());
 const state=await saved.json();
 assert.equal(state.revision,2);
 assert.equal(state.aura,'nebula');
 assert.equal(state.badgeMode,'curated');
 const reload=await canonicalRecognition(new Request(url),env(db),owner('alpha'),1700000021);
 assert.equal(reload.status,200);
 assert.deepEqual((await reload.json()).badgeIds,['first_orbit']);
 assert.deepEqual((await publicRecognitionSummary(db,'alpha')).featuredAwards,['first_orbit']);
 assert.equal((await publicRecognitionSummary(db,'alpha')).aura,'nebula');
 const stale=await canonicalRecognition(patch(body),env(db),owner('alpha'),1700000022);
 assert.equal(stale.status,409,'stale tab must not overwrite updated preferences');
 const fake=await canonicalRecognition(patch({...body,badgeIds:['first_light'],revision:2}),env(db),owner('alpha'),1700000023);
 assert.equal(fake.status,400,'invalid badge ID rejected');
 const notOwned=await canonicalRecognition(patch({...body,badgeIds:['first_reply'],revision:2}),env(db),owner('alpha'),1700000024);
 assert.equal(notOwned.status,400,'known but unearned badge rejected');
 const other=await canonicalRecognition(new Request(url),env(db),owner('beta'),1700000025);
 assert.equal(other.status,200);
 assert.deepEqual((await other.json()).earnedBadges,[],'another member cannot receive alpha grants');
 const hidden=await canonicalRecognition(patch({...body,badgeMode:'hidden',badgeIds:[],aura:'none',revision:2}),env(db),owner('alpha'),1700000026);
 assert.equal(hidden.status,200);
 assert.deepEqual((await publicRecognitionSummary(db,'alpha')).featuredAwards,[]);
});
test('recognition owner API remains verified-email-only and write path remains gated',async t=>{
 const db=makeDb();t.after(()=>db.raw.close());
 assert.equal((await canonicalRecognition(new Request(url),env(db),{id:'alpha',emailVerified:false})).status,401);
 const writes=db.calls.length;
 assert.equal((await canonicalRecognition(patch({}),env(db,'false'),owner('alpha'))).status,404);
 assert.equal(db.calls.length,writes);
});

test('public route is exact and bypasses private authentication only for read-only catalog',()=>{
 const platform=readFileSync(new URL('../apex-prelaunch/platform.mjs',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../canonical-auth/worker.mjs',import.meta.url),'utf8');
 assert.match(platform,/PUBLIC_RECOGNITION_CATALOG="\/api\/v1\/public\/recognition\/catalog"/);
 assert.match(platform,/url\.pathname===PUBLIC_RECOGNITION_CATALOG/);
 assert.match(platform,/if\(url\.origin!==ORIGIN\|\|url\.protocol!=="https:"/);
 assert.match(worker,/const publicRecognitionCatalog=path==='\/api\/v1\/public\/recognition\/catalog'/);
 assert.match(worker,/publicRecognitionCatalog&&!READ_METHODS\.has\(request\.method\)/);
 assert.match(worker,/if\(publicRecognitionCatalog\)return safeResponse\(await canonicalRecognitionCatalog\(request,env\)\)/);
 assert.match(worker,/if\(!stageReady\)return fail\(request,503\)/);
 assert.match(worker,/sameOriginMutation/);
});
