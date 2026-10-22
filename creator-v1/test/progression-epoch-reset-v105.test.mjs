import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/canonical-fixture.mjs';
import {readProgression,canonicalProgression} from '../canonical-auth/progression.mjs';
import {publicMemberColumns} from '../canonical-auth/public-member-card.mjs';
const now=2000000000;
test('epoch reset preserves historical XP, milestones and recognition while resetting active levels',async()=>{
 const {db,env}=fixture();try{
  const id='reset-member';
  db.prepare("INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)").run(id,id,'reset@fixture.invalid');
  db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,1,1)").run(id,'reset_member','Reset Member');
  db.prepare("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,'old','test_button',5,100)").run(id);
  db.prepare("INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES(?,'first_signal',100)").run(id);
  const before=await readProgression(env.MEMBER_DB,id);assert.equal(before.xp,15);
  db.prepare("INSERT INTO member_progression_reset_epoch(epoch,cutoff_event_id,cutoff_at) SELECT 1,MAX(id),? FROM member_xp_events").run(now);
  const after=await readProgression(env.MEMBER_DB,id);
  assert.equal(after.xp,0);assert.equal(after.level,1);assert.equal(after.awards[0].earnedAt,null);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM member_xp_events").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM member_space_milestones").get().n,1);
  const response=await canonicalProgression(new Request('https://a.anevum.com/api/v1/member/xp-test',{method:'POST'}),env,{id,emailVerified:true},now+1);
  assert.equal(response.status,404);
  assert.match(publicMemberColumns('p.user_id'),/member_progression_reset_epoch/);
 }finally{db.close();}
});
