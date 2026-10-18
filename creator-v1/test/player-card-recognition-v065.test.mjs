import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {memberRecognitionState,publicRecognitionSummary,recognitionReady,canonicalRecognition} from '../canonical-auth/recognition.mjs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const milestones=[
 {milestone:'first_signal',earned_at:1000},
 {milestone:'world_shaper',earned_at:1500}
];
const issued=[
 {kind:'badge',recognition_id:'first_thread',earned_at:2000},
 {kind:'badge',recognition_id:'first_creation',earned_at:2500},
 {kind:'medal',recognition_id:'first_light',earned_at:3000},
 {kind:'ribbon',recognition_id:'steadfast_signal',earned_at:3500},
 {kind:'ribbon',recognition_id:'open_hand',earned_at:3600}
];
function dbMock({pref=null,legacy=milestones,grants=issued,migration=true,profile=true}={}){
 const sqls=[];
 return {
  sqls,
  prepare(sql){
   sqls.push(sql);
   const api={
    bind(){return api},
    async all(){
     if(sql.includes('sqlite_master'))return {success:true,results:migration?[{name:'member_recognition_grants'},{name:'member_recognition_preferences'}]:[]};
     if(sql.includes('member_space_milestones'))return {success:true,results:legacy};
     if(sql.includes('member_recognition_grants'))return {success:true,results:grants};
     return {success:true,results:[]};
    },
    async first(){
     if(sql.includes('member_recognition_preferences'))return pref;
     if(sql.includes('member_creator_profiles'))return profile?{handle:'verified_member'}:null;
     return null;
    }
   };
   return api;
  }
 };
}
const pref=(mode,ids=[])=>({
 badge_mode:mode,badge_ids_json:JSON.stringify(ids),
 medal_id:null,ribbon_ids_json:'null',aura:'none',revision:1
});
test('V065 registry preserves exactly three conventional badges and distinct scarce honors',()=>{
 const client=source('web/src/lib/player-recognition.ts');
 const card=source('web/src/components/CompactMemberIdentity.tsx');
 const honor=source('web/src/components/HonorInsignia.tsx');
 const migration=source('canonical-auth/migrations/0010_player_recognition.sql');
 const renderer=source('web/src/components/LevelEmblem.tsx');
 assert.match(client,/\.slice\(0,3\)/);
 assert.match(client,/\.slice\(0,2\)/);
 assert.match(client,/type DistinctionKind='ribbon'\|'medal'/);
 assert.match(card,/LevelEmblem level=/);
 assert.match(card,/MemberPortrait/);
 assert.match(card,/badgeDisplay/);
 assert.match(card,/HonorInsignia/);
 assert.match(card,/safeConstellation/);
 assert.match(honor,/av65-medal/);
 assert.match(honor,/av65-ribbon/);
 assert.doesNotMatch(renderer,/registerAnimatedSpecimen/);
 assert.match(renderer,/av73-static-level-icon/);
 assert.match(migration,/reviewed_by<>granted_by/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS member_recognition_grants/);
 assert.doesNotMatch(migration,/UPDATE member_xp_events|DELETE FROM member_space_milestones/);
});
test('public recognition defaults to three latest OWNED badges, never fake medals',async()=>{
 const db=dbMock();
 const state=await memberRecognitionState(db,'verified-owner');
 assert.equal(state.badgeMode,'automatic');
 assert.deepEqual(state.featuredBadges.map(v=>v.id),['first_creation','first_thread','world_shaper']);
 assert.equal(state.earnedBadges.length,4);
 const pub=await publicRecognitionSummary(db,'verified-owner');
 assert.deepEqual(pub.featuredAwards,['first_creation','first_thread','world_shaper']);
 assert.deepEqual(pub.distinctions.medals,['first_light']);
 assert.deepEqual(pub.distinctions.ribbons,['open_hand','steadfast_signal']);
 assert.equal(pub.earnedBadges.length,3,'unselected achievement inventory must not be public');
 assert.equal(Object.hasOwn(pub,'rawXp'),false);
 assert.ok(db.sqls.some(x=>x.includes('revoked_at IS NULL')),'revoked grants are excluded');
});
test('preexisting profile settings preserve explicit curation and deliberate hidden state',async()=>{
 const curated=await publicRecognitionSummary(dbMock({pref:pref('curated',['first_signal','world_shaper'])}),'verified-owner');
 assert.deepEqual(curated.featuredAwards,['first_signal','world_shaper']);
 const hidden=await publicRecognitionSummary(dbMock({pref:pref('hidden',['first_signal'])}),'verified-owner');
 assert.deepEqual(hidden.featuredAwards,[]);
 assert.deepEqual(hidden.earnedBadges,[]);
 const wrong=await publicRecognitionSummary(dbMock({pref:pref('curated',['first_signal','unissued_medal'])}),'verified-owner');
 assert.deepEqual(wrong.featuredAwards,['first_signal']);
});
test('missing additive migration falls back to V061 without fabricating recognition',async()=>{
 const db=dbMock({migration:false});
 assert.equal(await recognitionReady(db),false);
 assert.equal(await publicRecognitionSummary(db,'owner'),null);
 const response=await canonicalRecognition(new Request('https://anevum.com/api/v1/member/recognition'),{
  MEMBER_DB:db,CANONICAL_RECOGNITION_ENABLED:'true'
 },{id:'owner',emailVerified:true});
 assert.equal(response.status,503);
});
test('disabled-by-default recognition route never mutates a member account',async()=>{
 const db=dbMock();
 const response=await canonicalRecognition(new Request('https://anevum.com/api/v1/member/recognition',{method:'PATCH'}),{
  MEMBER_DB:db,CANONICAL_RECOGNITION_ENABLED:'false'
 },{id:'owner',emailVerified:true});
 assert.equal(response.status,404);
 assert.equal(db.sqls.length,0);
});
test('old entry points and opt-in privacy remain intact',()=>{
 const member=source('canonical-auth/public-member-card.mjs');
 const forum=source('canonical-auth/forums.mjs');
 const community=source('canonical-auth/community.mjs');
 const worker=source('canonical-auth/worker.mjs');
 assert.match(member,/levelProgress\(xp\)/);
 assert.match(member,/row\.show_stats===0\?null/);
 assert.match(member,/earned\.has\(id\)/);
 assert.match(member,/member_identity_key/);
 assert.match(forum,/hydratedPublicMemberCard/);
 assert.match(community,/hydratedPublicMemberCard/);
 assert.match(forum,/p\.visibility='public' AND u\.emailVerified=1/);
 assert.match(community,/p\.visibility='public'/);
 assert.match(worker,/ownRecognition/);
 assert.match(worker,/CANONICAL_RECOGNITION_ENABLED/);
 assert.match(worker,/sameOriginMutation/);
 assert.match(worker,/canonicalRecognition\(clean,env,session\.user\)/);
});

test('26 badge engravings have independently modeled devices, not repeated generic stars',()=>{
 const art=source('web/src/components/BadgeInsignia.tsx');
 const catalog=source('web/src/lib/player-recognition.ts');
 const keys=[
  'first_signal','world_shaper','first_orbit','returning_signal',
  'first_thread','first_reply','conversationalist','signal_booster',
  'first_creation','maker_five','maker_twenty','revision_keeper',
  'first_source','sound_weaver','image_maker','story_teller',
  'playwright','first_collection','thoughtful_review','pathfinder',
  'first_collab','cross_discipline','good_neighbor','accessibility_builder',
  'archive_keeper','annual_return'
 ];
 assert.equal(new Set(keys).size,26);
 for(const key of keys){
  assert.ok(art.includes("case '"+key+"'"),key+' needs its own SVG device');
  assert.ok(catalog.includes("b('"+key+"'"),key+' remains in the server-defined award catalog');
 }
 assert.match(art,/prefers-reduced-motion|badge-insignia-v066\.css/);
 assert.match(art,/MATERIALS/);
 assert.doesNotMatch(art,/Math\.random|fetch\(|new WebGL/);
 for(const component of ['CompactMemberIdentity.tsx','PlayerCardStudio.tsx']){
  assert.match(source('web/src/components/'+component),/BadgeInsignia/);
 }
 assert.match(source('web/src/pages/RecognitionRegistryPage.tsx'),/EarnedRewardVault/);
 assert.match(source('web/src/components/EarnedRewardVault.tsx'),/BadgeInsignia/);
});
