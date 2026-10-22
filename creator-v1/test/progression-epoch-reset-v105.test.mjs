import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {readProgression,canonicalProgression} from '../canonical-auth/progression.mjs';
import {grantMilestones,spaceSnapshot} from '../canonical-auth/space.mjs';
import {memberRecognitionState} from '../canonical-auth/recognition.mjs';
import {publicMemberColumns} from '../canonical-auth/public-member-card.mjs';
const now=2000000000;
function profile(db,id){
 db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)').run(id,id,id+'@fixture.invalid');
 db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,1,1)').run(id,id.replaceAll('-','_')+'___',id);
}
const count=(db,table)=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
const card=(db,id)=>db.prepare('SELECT '+publicMemberColumns('p.user_id')+' FROM member_creator_profiles p LEFT JOIN member_space_settings s ON s.user_id=p.user_id WHERE p.user_id=?').get(id);
test('non-destructive epoch starts all active XP and levels at zero while retaining evidence and grants',async()=>{
 const {db,env}=fixture();try{
  const id='reset-member';profile(db,id);profile(db,'other-member');
  db.exec(readFileSync(new URL('../canonical-auth/migrations/0010_player_recognition.sql',import.meta.url),'utf8'));
  db.prepare("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,'old','test_button',5,100)").run(id);
  db.prepare("INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES(?,'first_signal',100)").run(id);
  db.prepare("INSERT INTO member_reward_notifications(user_id,kind,reference,level,created_at) VALUES(?,'level','evo60-2',2,100)").run(id);
  db.prepare("INSERT INTO member_reward_notifications(user_id,kind,reference,created_at) VALUES(?,'award','first_signal',100)").run(id);
  db.prepare("INSERT INTO member_recognition_grants(user_id,kind,recognition_id,earned_at,granted_by,evidence_ref) VALUES(?,'badge','first_orbit',100,'reviewed','fixture-evidence')").run(id);
  assert.equal((await readProgression(env.MEMBER_DB,id)).xp,15);
  assert.equal(card(db,id).member_xp,15);
  db.prepare('INSERT INTO member_progression_reset_epoch(epoch,cutoff_event_id,cutoff_at) SELECT 1,COALESCE(MAX(id),0),? FROM member_xp_events').run(now);
  assert.equal(count(db,'member_xp_events'),1);
  assert.equal(count(db,'member_space_milestones'),1);
  assert.equal(count(db,'member_recognition_grants'),1);
  assert.equal(count(db,'member_reward_notifications'),2);
  for(const member of [id,'other-member']){
   const active=await readProgression(env.MEMBER_DB,member);
   assert.equal(active.xp,0);assert.equal(active.level,1);
   assert.ok(active.awards.every(a=>a.earnedAt===null));
   assert.equal(card(db,member).member_xp,0);
  }
  assert.equal(card(db,id).earned_awards,null);
  const snapshot=await spaceSnapshot(env.MEMBER_DB,id);
  assert.equal(snapshot.stats.xp,0);assert.equal(snapshot.stats.level,1);
  assert.equal(snapshot.stats.awards,0);
  const recognition=await memberRecognitionState(env.MEMBER_DB,id);
  assert.equal(recognition.earnedBadges.some(b=>b.id==='first_orbit'),true);
  assert.equal(recognition.earnedBadges.some(b=>b.id==='first_signal'),false);
  const member={id,emailVerified:true};
  const oldButton=await canonicalProgression(new Request('https://a.anevum.com/api/v1/member/xp-test',{method:'POST'}),env,member,now+1);
  assert.equal(oldButton.status,404);
  const inbox=await canonicalProgression(new Request('https://a.anevum.com/api/v1/member/notifications'),{...env,CANONICAL_RECOGNITION_ENABLED:'true'},member,now+1);
  assert.equal(inbox.status,200);
  const notices=await inbox.json();
  assert.deepEqual(notices.recent.map(n=>n.award),['first_orbit']);
 }finally{db.close()}
});
test('post-reset milestones require new activity and do not rewrite old earned timestamps',async()=>{
 const {db,env}=fixture();try{
  const id='reset-member';profile(db,id);
  db.prepare("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,'old','test_button',5,100)").run(id);
  db.prepare("INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES(?,'first_signal',100)").run(id);
  db.prepare("INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at) VALUES('old-wall',?,'historical',100,100)").run(id);
  db.prepare('INSERT INTO member_progression_reset_epoch(epoch,cutoff_event_id,cutoff_at) SELECT 1,MAX(id),? FROM member_xp_events').run(now);
  await grantMilestones(env.MEMBER_DB,id,now+1);
  assert.equal(count(db,'member_progression_epoch_milestones'),0);
  db.prepare("INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at) VALUES('new-wall',?,'new contribution',?,?)").run(id,now+20,now+20);
  await grantMilestones(env.MEMBER_DB,id,now+20);
  await grantMilestones(env.MEMBER_DB,id,now+21);
  assert.equal(count(db,'member_progression_epoch_milestones'),1);
  assert.equal(db.prepare("SELECT earned_at FROM member_space_milestones WHERE user_id=? AND milestone='first_signal'").get(id).earned_at,100);
  const active=await readProgression(env.MEMBER_DB,id);
  assert.equal(active.xp,10);assert.equal(active.awards[0].earnedAt,now+20);
  assert.equal(card(db,id).member_xp,10);
  assert.equal(card(db,id).earned_awards,'first_signal');
  assert.equal(db.prepare("SELECT COUNT(*) n FROM member_reward_notifications WHERE reference='epoch1:first_signal'").get().n,1);
  db.prepare("UPDATE member_creator_profiles SET bio='New introduction',updated_at=? WHERE user_id=?").run(now+30,id);
  const bytes=new Uint8Array([255,216,255,217]);
  for(const slot of ['avatar','banner']) db.prepare('INSERT INTO member_space_media(user_id,slot,data,updated_at) VALUES(?,?,?,?)').run(id,slot,bytes,now+31);
  await grantMilestones(env.MEMBER_DB,id,now+32);
  assert.equal((await readProgression(env.MEMBER_DB,id)).xp,35);
  assert.equal(count(db,'member_progression_epoch_milestones'),2);
  assert.equal(count(db,'member_space_milestones'),1);
  assert.equal(count(db,'member_xp_events'),1);
 }finally{db.close()}
});
