import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {memberReputationMap,publicReputationProjection} from '../canonical-auth/member-reputation.mjs';
import {hydratedPublicMemberCard} from '../canonical-auth/public-member-card.mjs';
import {renderEvolutionCardArt} from '../canonical-auth/evolution-card-art.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function makeFixture(){
 const raw=new DatabaseSync(':memory:');
 raw.exec(`
 CREATE TABLE "user"(id TEXT PRIMARY KEY);
 CREATE TABLE member_creator_profiles(user_id TEXT PRIMARY KEY,handle TEXT,visibility TEXT);
 CREATE TABLE member_forum_threads(id TEXT PRIMARY KEY,author_id TEXT,status TEXT);
 CREATE TABLE member_forum_replies(id TEXT PRIMARY KEY,thread_id TEXT,author_id TEXT,status TEXT);
 CREATE TABLE member_forum_reactions(thread_id TEXT,user_id TEXT);
 CREATE TABLE member_recognition_grants(user_id TEXT,kind TEXT,recognition_id TEXT,revoked_at INTEGER);
 INSERT INTO "user"(id) VALUES('alpha'),('beta'),('gamma'),('delta');
 INSERT INTO member_creator_profiles VALUES('alpha','alpha','public'),('beta','beta','public');
 INSERT INTO member_forum_threads VALUES
  ('t1','alpha','published'),('t2','alpha','published'),('t3','alpha','published'),
  ('t4','alpha','hidden'),('t5','alpha','pending_review'),('bt','beta','published');
 INSERT INTO member_forum_replies VALUES
  ('r1','bt','alpha','published'),('r2','t1','alpha','published'),
  ('r3','t2','alpha','pending_review'),('r4','t4','alpha','published');
 INSERT INTO member_forum_reactions VALUES
  ('t1','beta'),('t2','beta'),('t3','gamma'),('t1','alpha'),('t4','delta');
 INSERT INTO member_recognition_grants VALUES
  ('alpha','badge','first_thread',NULL),('alpha','badge','revoked_mark',100),
  ('beta','badge','revoked_mark',100);
 `);
 raw.exec(read('canonical-auth/migrations/0011_verified_roles_v081.sql'));
 raw.exec(`
 INSERT INTO member_role_grants VALUES
 ('alpha','moderator',100,'issuer','reviewer','case-mod',NULL),
 ('alpha','founder',101,'issuer','reviewer','case-founder',NULL),
 ('beta','curator',100,'issuer','reviewer','case-revoked',110);
 `);
 const db={prepare(sql){const statement=raw.prepare(sql),args=[];return {
  bind(...input){args.splice(0,args.length,...input);return this},
  async all(){return {success:true,results:statement.all(...args)}},
  async first(){return statement.get(...args)||null}
 }}};
 return {raw,db};
}

test('V081 signals score only independently published evidence, excludes spam and self votes',async t=>{
 const {raw,db}=makeFixture();t.after(()=>raw.close());
 const result=await memberReputationMap(db,['alpha','beta','alpha']);
 const alpha=result.get('alpha');
 assert.deepEqual(alpha.reputation.stats,{discussions:3,replies:2,appreciations:2,badges:1});
 assert.equal(alpha.reputation.score,72);
 assert.equal(alpha.reputation.tier,'signal');
 assert.equal(alpha.reputation.nextAt,160);
 assert.equal(alpha.earnedAura,'signal');
 assert.equal(alpha.role,'founder','highest independently verified role wins');
 assert.equal(result.get('beta').role,undefined,'revoked roles do not appear');
 assert.ok(!JSON.stringify([...result.values()]).includes('user_id'));
 raw.exec("UPDATE member_forum_threads SET status='hidden' WHERE id='t3'");
 assert.equal((await memberReputationMap(db,['alpha'])).get('alpha').reputation.score,53,
  'hidden work and its appreciation no longer count');
 raw.exec("UPDATE member_recognition_grants SET revoked_at=110 WHERE user_id='alpha'");
 assert.equal((await memberReputationMap(db,['alpha'])).get('alpha').reputation.score,43,
  'revoking a mark removes associated reputation');
});

test('V081 respects private stats without leaking scores or assigning privileges',async t=>{
 const {raw,db}=makeFixture();t.after(()=>raw.close());
 const hidden={handle:'alpha',display_name:'Alpha',avatar:1,member_identity_key:'alpha',
  show_stats:0,member_xp:15000,featured_json:'[]',earned_awards:''};
 const card=await hydratedPublicMemberCard(db,hidden,false,true);
 assert.equal(card.level,null);
 assert.equal(card.role,'founder');
 assert.equal(Object.hasOwn(card,'reputation'),false,'stats visibility hides activity');
 assert.equal(Object.hasOwn(card,'earnedAura'),false);
 assert.equal(Object.hasOwn(card,'user_id'),false);
 const enabled={...hidden,show_stats:1};
 const visible=await hydratedPublicMemberCard(db,enabled,false,true);
 assert.equal(visible.reputation.score,72);
 assert.equal(visible.level,15);
 assert.equal((await hydratedPublicMemberCard(db,enabled,false,false)).reputation,undefined,
  'feature flag leaves old public payload unchanged');
 assert.deepEqual(publicReputationProjection({role:'moderator',reputation:{score:1}},0),{role:'moderator'});
});

test('V081 fails closed without activity tables or role migration',async t=>{
 const {raw,db}=makeFixture();t.after(()=>raw.close());
 raw.exec('DROP TABLE member_forum_replies');
 assert.equal((await memberReputationMap(db,['alpha'])).size,0);
 const migration=read('canonical-auth/migrations/0011_verified_roles_v081.sql');
 assert.match(migration,/reviewed_by<>granted_by/);
 assert.doesNotMatch(migration,/INSERT INTO member_role_grants|UPDATE member_xp_events|ALTER TABLE member_space_milestones/);
 const server=read('canonical-auth/member-reputation.mjs');
 assert.doesNotMatch(server,/member_xp_events|localStorage|req\.json/);
});

test('V081 30 vector masters retain unique earned plates and no WebGL',()=>{
 const plate=read('canonical-auth/evolution-card-art.mjs');
 const icon=read('web/src/components/LevelEmblem.tsx');
 const inspector=read('web/src/components/RewardInspector.tsx');
 const collection=read('web/src/components/LevelCollection.tsx');
 const identity=read('web/src/components/CompactMemberIdentity.tsx');
 const styles=read('web/src/components/player-card-v081.css');
 for(const source of [icon,inspector,collection,identity])
  assert.doesNotThrow(()=>parse(source,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(plate,/sigilInterior/);
 assert.match(plate,/length:48/);
 assert.match(icon,/artwork='card'/);
 assert.match(inspector,/av81-sigil-stage/);
 assert.doesNotMatch(inspector,/WebGL|canvas|RewardModelRenderer/);
 assert.doesNotMatch(collection,/level-artifacts\.json|LEVEL_ARTIFACTS|LIVING 3D ARCHIVE/);
 assert.match(identity,/safePublicReputation/);
 assert.match(identity,/safeVerifiedRole/);
 assert.match(styles,/prefers-reduced-motion:reduce/);
 assert.match(styles,/forced-colors:active/);
 const motifs=new Set();
 for(let level=1;level<=30;level++){
  const image=renderEvolutionCardArt(level);
  assert.match(image,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(image,/id="sigilInterior"/);
  assert.ok(!/<(?:script|image|foreignObject)/.test(image));
  motifs.add(image);
 }
 assert.equal(motifs.size,30);
});
