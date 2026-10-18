import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalStudioSafety,takedownReviewedCreation,studioSafetyReady} from '../canonical-auth/studio-safety.mjs';
import {canonicalPublicStudioCreations,canonicalStudioPublicationConsent} from '../canonical-auth/studio-publications.mjs';
import {memberRecognitionState} from '../canonical-auth/recognition.mjs';
import {canonicalStudio} from '../canonical-auth/studio.mjs';
import {database,project,consent,publish,now,base,env,owner,api,scalar} from './studio-publication-evidence-v070.test.mjs';

const safetyEnv=db=>({...env(db),CANONICAL_STUDIO_SAFETY_REVIEWER_IDS:'safety'});
const audit=(p,time=now+100)=>({
 projectId:p.id,expectedPublishedAt:p.publishedAt??now,reasonCode:'rights',
 reason:'Independently verified that public distribution rights were not held by the creator.',
 moderatorId:'safety',now:time,allow:true
});
async function released(db,index,at=now){
 const p=project(db,index,{link:'https://originalworks.example.com/worlds/'+index});
 assert.equal((await consent(db,p,at-20)).status,200);
 const r=await publish(db,p,at);
 assert.equal(r.ok,true,JSON.stringify(r));
 return {...p,publishedAt:at};
}
const earned=async db=>(await memberRecognitionState(db,'owner')).earnedBadges.map(x=>x.id);
async function visible(db){
 const response=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),safetyEnv(db));
 assert.equal(response.status,200,await response.clone().text());
 return (await response.json()).creations;
}
test('V071 public card shows canonical identity; staff takedown hides creation and revokes earned badge atomically',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await released(db,1);
 assert.equal(await studioSafetyReady(db),true);
 assert.deepEqual(await earned(db),['first_creation']);
 const records=await visible(db);
 assert.equal(records.length,1);
 assert.equal(records[0].creator.handle,'owner_sample');
 assert.equal(records[0].creator.displayName,'Owner Sample');
 assert.equal(records[0].creator.level,1);
 assert.deepEqual(records[0].creator.featuredAwards,[],'member has not shared private badges');
 assert.doesNotMatch(JSON.stringify(records),/internal_owner_id|user_id|reviewer_id|storage_key/);
 const queued=await canonicalStudioSafety(new Request(base+'/api/v1/member/studio/safety'),safetyEnv(db),owner('safety'));
 assert.equal(queued.status,200);
 assert.equal((await queued.json()).creations[0].publicationStatus,'published');
 const reqBody={action:'takedown',projectId:p.id,expectedPublishedAt:p.publishedAt,
  reasonCode:'rights',reason:'Verified the creator lacked distribution rights to this published work.'};
 const decision=await canonicalStudioSafety(new Request(base+'/api/v1/member/studio/safety',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(reqBody)
 }),safetyEnv(db),owner('safety'),now+100);
 assert.equal(decision.status,200,await decision.clone().text());
 assert.deepEqual((await decision.json()).revokedBadges,['first_creation']);
 assert.deepEqual(await earned(db),[]);
 assert.deepEqual(await visible(db),[]);
 const detail=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations/'+p.id),safetyEnv(db));
 assert.equal(detail.status,404);
 assert.equal(scalar(db,'SELECT status FROM member_studio_publications WHERE project_id=?',p.id).status,'withdrawn');
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_takedowns').c,1);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_studio_recognition_revocations WHERE recognition_id='first_creation'").c,1);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_reward_notifications WHERE reference='first_creation'").c,0);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_recognition_grants WHERE recognition_id='first_creation'").c,1);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_xp_events').c,0);
 assert.equal((await takedownReviewedCreation(db,audit(p,now+105))).ok,false);
});
test('V071 withdrawn historic evidence remains reviewable for fraud, without republishing content',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await released(db,1);
 const withdrawal=await canonicalStudioPublicationConsent(api(p.id,'DELETE',{
  submissionId:p.submissionId,revision:2,scope:'external_metadata_only',accepted:true
 }),safetyEnv(db),owner('owner'),p.id,now+10);
 assert.equal(withdrawal.status,200);
 assert.deepEqual(await visible(db),[]);
 assert.deepEqual(await earned(db),['first_creation']);
 const queue=await canonicalStudioSafety(new Request(base+'/api/v1/member/studio/safety'),safetyEnv(db),owner('safety'));
 assert.equal((await queue.json()).creations[0].publicationStatus,'withdrawn');
 const result=await takedownReviewedCreation(db,audit(p,now+11));
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.deepEqual(result.revokedBadges,['first_creation']);
 assert.deepEqual(await earned(db),[]);
 assert.deepEqual(await visible(db),[]);
});
test('V071 safety authority is distinct from publication approver and ordinary members',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await released(db,1);
 for(const reviewerId of ['owner','reviewer']){
  const result=await takedownReviewedCreation(db,{...audit(p),moderatorId:reviewerId});
  assert.equal(result.ok,false);
 }
 for(const id of ['owner','reviewer','other']){
  const response=await canonicalStudioSafety(new Request(base+'/api/v1/member/studio/safety'),safetyEnv(db),owner(id));
  assert.equal(response.status,403);
 }
 assert.equal((await canonicalStudioSafety(new Request(base+'/api/v1/member/studio/safety'),safetyEnv(db),{
  id:'safety',emailVerified:false
 })).status,401);
 assert.equal((await canonicalStudioSafety(new Request(base+'/api/v1/member/studio/safety'),{
  ...safetyEnv(db),CANONICAL_STUDIO_SAFETY_ENABLED:'false'
 },owner('safety'))).status,403);
 assert.deepEqual(await earned(db),['first_creation']);
});
test('V071 five qualifying releases re-earn Five Worlds only after a new independent sixth release',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const arr=[];
 for(let i=1;i<=5;i++)arr.push(await released(db,i,now+i));
 assert.deepEqual(await earned(db),['maker_five','first_creation']);
 const removal=await takedownReviewedCreation(db,audit(arr[0],now+100));
 assert.equal(removal.ok,true,JSON.stringify(removal));
 assert.deepEqual(removal.revokedBadges,['maker_five']);
 assert.deepEqual(await earned(db),['first_creation']);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_reward_notifications WHERE reference='maker_five'").c,0);
 await released(db,6,now+200);
 assert.deepEqual(await earned(db),['maker_five','first_creation']);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_recognition_grants WHERE recognition_id='maker_five'").c,1);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_reward_notifications WHERE reference='maker_five'").c,1);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_studio_recognition_revocations WHERE recognition_id='maker_five'").c,1);
});
test('V071 removal of the twentieth genuine world revokes Architect of Worlds but not lower thresholds',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const works=[];
 for(let i=1;i<=20;i++)works.push(await released(db,i,now+i));
 assert.deepEqual(await earned(db),['maker_twenty','maker_five','first_creation']);
 const result=await takedownReviewedCreation(db,audit(works[3],now+100));
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.deepEqual(result.revokedBadges,['maker_twenty']);
 assert.deepEqual(await earned(db),['maker_five','first_creation']);
 assert.equal((await visible(db)).length,19);
});
test('V071 failed audit insert rolls back removal and award revocation in one transaction',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await released(db,1);
 db.raw.exec("CREATE TRIGGER deny_safety BEFORE INSERT ON member_studio_publication_takedowns BEGIN SELECT RAISE(ABORT,'audit sink offline'); END;");
 await assert.rejects(()=>takedownReviewedCreation(db,audit(p)),/audit sink offline/);
 assert.equal(scalar(db,'SELECT status FROM member_studio_publications WHERE project_id=?',p.id).status,'published');
 assert.deepEqual(await earned(db),['first_creation']);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_takedowns').c,0);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_recognition_revocations').c,0);
 assert.equal((await visible(db)).length,1);
});
test('V071 safety endpoint rejects caller-supplied award, user and XP arguments',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await released(db,1);
 const valid={action:'takedown',projectId:p.id,expectedPublishedAt:p.publishedAt,
  reasonCode:'fraud',reason:'Reviewed evidence indicates falsified ownership and rights declarations.'};
 for(const bad of [
  {...valid,moderatorId:'owner'},
  {...valid,amount:999},
  {...valid,reason:'short'},
  {...valid,reasonCode:'bonus'},
  {...valid,expectedPublishedAt:now+1},
  {...valid,action:'award_badge'}
 ]){
  const response=await canonicalStudioSafety(new Request(base+'/api/v1/member/studio/safety',{
   method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(bad)
  }),safetyEnv(db),owner('safety'),now+100);
  assert.notEqual(response.status,200);
 }
 assert.deepEqual(await earned(db),['first_creation']);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_takedowns').c,0);
});

test('V071 creator cannot delete a withdrawn historical publication by first returning its private project to draft',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await released(db,1);
 const revoked=await canonicalStudioPublicationConsent(api(p.id,'DELETE',{
  submissionId:p.submissionId,revision:2,scope:'external_metadata_only',accepted:true
 }),safetyEnv(db),owner('owner'),p.id,now+10);
 assert.equal(revoked.status,200);
 const withdraw=await canonicalStudio(new Request(base+'/api/v1/member/studio/projects/'+p.id+'/withdraw',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revision:2})
 }),safetyEnv(db),owner('owner'),now+11);
 assert.equal(withdraw.status,200,await withdraw.clone().text());
 const w=await withdraw.json();
 const deleted=await canonicalStudio(new Request(base+'/api/v1/member/studio/projects/'+p.id,{
  method:'DELETE',headers:{'content-type':'application/json'},
  body:JSON.stringify({revision:w.project.revision})
 }),safetyEnv(db),owner('owner'),now+12);
 assert.equal(deleted.status,409,'member project deletion may not cascade away public release audit');
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publications WHERE project_id=?',p.id).c,1);
 assert.deepEqual(await earned(db),['first_creation']);
 const decision=await takedownReviewedCreation(db,audit(p,now+13));
 assert.equal(decision.ok,true);
 assert.deepEqual(await earned(db),[]);
});
