import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {memberVerifiedRoleMap} from '../canonical-auth/member-verified-roles.mjs';
import {hydratedPublicMemberCard,hydratedPublicMemberCards} from '../canonical-auth/public-member-card.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function fixture(withRoles=true){
 const raw=new DatabaseSync(':memory:');
 raw.exec(`CREATE TABLE "user"(id TEXT PRIMARY KEY);
 CREATE TABLE member_creator_profiles(user_id TEXT PRIMARY KEY,handle TEXT,visibility TEXT);
 CREATE TABLE member_forum_threads(id TEXT PRIMARY KEY,author_id TEXT,status TEXT);
 CREATE TABLE member_forum_replies(id TEXT PRIMARY KEY,thread_id TEXT,author_id TEXT,status TEXT);
 CREATE TABLE member_recognition_grants(user_id TEXT,kind TEXT,recognition_id TEXT,revoked_at INTEGER);
 INSERT INTO "user" VALUES('alpha'),('beta'),('hidden');
 INSERT INTO member_creator_profiles VALUES('alpha','alpha','public'),('beta','beta','public'),('hidden','hidden','private');`);
 if(withRoles){
  raw.exec(read('canonical-auth/migrations/0011_verified_roles_v081.sql'));
  raw.exec(`INSERT INTO member_role_grants VALUES
   ('alpha','moderator',100,'grantor','reviewer','audit-mod',NULL),
   ('alpha','founder',101,'grantor','reviewer','audit-founder',NULL),
   ('beta','curator',102,'grantor','reviewer','audit-curator',NULL),
   ('beta','moderator',103,'grantor','reviewer','audit-revoked',104),
   ('hidden','administrator',105,'grantor','reviewer','audit-private',NULL);`);
 }
 const db={prepare(sql){const statement=raw.prepare(sql),args=[];return {
  bind(...input){args.splice(0,args.length,...input);return this},
  async all(){return {success:true,results:statement.all(...args)}},
  async first(){return statement.get(...args)||null}
 }}};
 return {db,raw};
}
const row=(id,visible=1)=>({
 member_identity_key:id,handle:id,display_name:id.toUpperCase(),
 avatar_version:0,member_xp:700,show_stats:visible,
 featured_json:'[]',earned_awards:''
});
test('V092 verified institutional seals require explicit, non-revoked reviewed grants',async t=>{
 const {raw,db}=fixture();t.after(()=>raw.close());
 const grants=await memberVerifiedRoleMap(db,['alpha','beta','alpha','unknown']);
 assert.equal(grants.get('alpha'),'founder');
 assert.equal(grants.get('beta'),'curator');
 assert.equal(grants.has('unknown'),false);
 raw.exec("UPDATE member_role_grants SET revoked_at=200 WHERE user_id='alpha' AND role='founder'");
 assert.equal((await memberVerifiedRoleMap(db,['alpha'])).get('alpha'),'moderator');
 raw.exec("UPDATE member_role_grants SET revoked_at=200 WHERE user_id='alpha' AND role='moderator'");
 assert.equal((await memberVerifiedRoleMap(db,['alpha'])).has('alpha'),false);
});
test('V092 role projection does not depend on reputation and respects stats privacy',async t=>{
 const {raw,db}=fixture();t.after(()=>raw.close());
 const hiddenStats=await hydratedPublicMemberCard(db,row('alpha',0),false,false,true);
 assert.equal(hiddenStats.role,'founder');
 assert.equal(hiddenStats.level,null);
 assert.equal(hiddenStats.reputation,undefined);
 assert.equal(hiddenStats.earnedAura,undefined);
 assert.equal(JSON.stringify(hiddenStats).includes('member_identity_key'),false);
 const withoutRoleFlag=await hydratedPublicMemberCard(db,row('alpha'),false,false,false);
 assert.equal(withoutRoleFlag.role,undefined);
 const cards=await hydratedPublicMemberCards(db,[row('alpha'),row('beta',0)],false,false,true);
 assert.deepEqual(cards.map(card=>card.role),['founder','curator']);
 assert.equal(cards[1].level,null);
});
test('V092 role schema not yet applied fails closed without affecting ordinary cards',async t=>{
 const {raw,db}=fixture(false);t.after(()=>raw.close());
 assert.equal((await memberVerifiedRoleMap(db,['alpha'])).size,0);
 const [card]=await hydratedPublicMemberCards(db,[row('alpha')],false,false,true);
 assert.equal(card.role,undefined);
 assert.equal(card.displayName,'ALPHA');
 assert.equal((await memberVerifiedRoleMap(db,[null,'',{},'alpha'])).size,0);
});
test('V092 projection never supplies permission or guesses from email/staff grants',()=>{
 const module=read('canonical-auth/member-verified-roles.mjs');
 const space=read('canonical-auth/space.mjs');
 const publicCard=read('canonical-auth/public-member-card.mjs');
 const forum=read('canonical-auth/forums.mjs');
 const community=read('canonical-auth/community.mjs');
 assert.match(module,/member_role_grants WHERE revoked_at IS NULL/);
 assert.match(module,/LIMIT 100/);
 assert.match(space,/CANONICAL_VERIFIED_ROLES_ENABLED==='true'/);
 assert.match(publicCard,/rolesEnabled=false/);
 assert.match(forum,/CANONICAL_VERIFIED_ROLES_ENABLED==='true'/);
 assert.match(community,/CANONICAL_VERIFIED_ROLES_ENABLED==='true'/);
 const executable=module.replace(/\/\\*[\\s\\S]*?\\*\/|\/\/[^\\n]*/g,'');
 assert.doesNotMatch(executable,/staff_access_grants|member_xp_events|INSERT INTO|UPDATE |email|grant_by_user/i);
 assert.doesNotMatch(space,/if.*\.email\.includes\(/);
});
