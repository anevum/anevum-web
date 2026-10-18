import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 canonicalStudioAppeals,studioAppealsReady,approvedAppealReviewer
} from '../canonical-auth/studio-appeals.mjs';
import {takedownReviewedCreation} from '../canonical-auth/studio-safety.mjs';
import {canonicalPublicStudioCreations} from '../canonical-auth/studio-publications.mjs';
import {memberRecognitionState} from '../canonical-auth/recognition.mjs';
import {database,project,consent,publish,now,base,env,owner,scalar} from './studio-publication-evidence-v070.test.mjs';

const appealEnv=db=>({
 ...env(db),CANONICAL_STUDIO_APPEALS_ENABLED:'true',
 CANONICAL_STUDIO_APPEAL_REVIEWER_IDS:'other'
});
const uri=base+'/api/v1/member/studio/appeals';
const post=(path,b)=>new Request(path,{
 method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)
});
const statement='I can provide original source records and a dated authorship history demonstrating that the publication finding requires independent reconsideration.';
const explanation='I independently reviewed the creator statement and the prior written evidence. The record and rights checks support this documented determination.';
const rights='Independently verified that the author did not hold the license necessary to distribute this external original.';
async function removed(db,index=1,at=now){
 const p=project(db,index,{link:'https://originalworks.example.com/appeal/'+index});
 assert.equal((await consent(db,p,at-30)).status,200);
 assert.equal((await publish(db,p,at)).ok,true);
 const takedown=await takedownReviewedCreation(db,{
  projectId:p.id,expectedPublishedAt:at,
  reasonCode:'rights',reason:rights,moderatorId:'safety',now:at+50,allow:true
 });
 assert.equal(takedown.ok,true,JSON.stringify(takedown));
 return {...p,publishedAt:at,takenDownAt:at+50};
}
const challenge=p=>({
 projectId:p.id,expectedTakenDownAt:p.takenDownAt,
 reasonCode:'ownership',statement
});
const decision=(id,filedAt,outcome='upheld')=>({
 appealId:id,expectedFiledAt:filedAt,
 decision:outcome,explanation
});
async function apply(db,p,at=now+75){
 const r=await canonicalStudioAppeals(post(uri,challenge(p)),appealEnv(db),owner('owner'),at);
 assert.equal(r.status,201,await r.clone().text());
 return {id:(await r.json()).appealId,filedAt:at};
}
async function ownerCases(db){
 const r=await canonicalStudioAppeals(new Request(uri),appealEnv(db),owner('owner'));
 assert.equal(r.status,200);
 return (await r.json()).cases;
}
test('V072 is additive, schema-bound, and closed unless a distinct appeal reviewer is configured',async t=>{
 const db=database();t.after(()=>db.raw.close());
 assert.equal(await studioAppealsReady(db),true);
 const migration=readFileSync(new URL('../canonical-auth/migrations/0013_studio_creation_appeals.sql',import.meta.url),'utf8');
 assert.ok(migration.includes('member_studio_publication_appeals'));
 assert.ok(migration.includes('member_studio_appeal_decisions'));
 assert.doesNotMatch(migration,/DELETE FROM member_recognition|DROP TABLE|UPDATE member_studio_publications/i);
 assert.equal(approvedAppealReviewer(appealEnv(db),'other'),true);
 assert.equal(approvedAppealReviewer(appealEnv(db),'safety'),false);
 assert.equal((await canonicalStudioAppeals(new Request(uri),
  {...appealEnv(db),CANONICAL_STUDIO_APPEALS_ENABLED:'false'},owner('owner'))).status,404);
 assert.equal((await canonicalStudioAppeals(new Request(uri),
  {...appealEnv(db),CANONICAL_STUDIO_APPEAL_REVIEWER_IDS:''},owner('owner'))).status,404);
 assert.equal((await canonicalStudioAppeals(new Request(uri),appealEnv(db),
  {id:'owner',emailVerified:false})).status,401);
});
test('V072 author-owned challenge is private, decision is independently recorded and never restores publication or revoked awards',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await removed(db);
 assert.deepEqual((await memberRecognitionState(db,'owner')).earnedBadges,[]);
 const earlier=await ownerCases(db);
 assert.equal(earlier.length,1);
 assert.equal(earlier[0].appealId,null);
 assert.equal(earlier[0].projectId,p.id);
 assert.equal((await canonicalStudioAppeals(new Request(uri),appealEnv(db),owner('reviewer')).then(r=>r.json())).cases.length,0);
 const filed=await apply(db,p);
 assert.match(filed.id,/^[a-f0-9-]{36}$/);
 const own=await ownerCases(db);
 assert.equal(own[0].appealId,filed.id);
 assert.equal(own[0].decision,null);
 assert.equal(own[0].statement,statement);
 const staff=await canonicalStudioAppeals(new Request(uri+'/review'),appealEnv(db),owner('other'));
 assert.equal(staff.status,200);
 const queue=(await staff.json()).cases;
 assert.equal(queue.length,1);
 assert.equal(queue[0].handle,'owner_sample');
 assert.equal(queue[0].id,filed.id);
 assert.equal(JSON.stringify(queue).includes('"owner_id"'),false);
 assert.equal(JSON.stringify(queue).includes('moderator_id'),false);
 const recorded=await canonicalStudioAppeals(post(uri+'/review',
  decision(filed.id,filed.filedAt,'eligible_for_re_review')),
  appealEnv(db),owner('other'),now+80);
 assert.equal(recorded.status,200,await recorded.clone().text());
 const verdict=await recorded.json();
 assert.equal(verdict.decision,'eligible_for_re_review');
 assert.equal(verdict.publicationRestored,false);
 assert.equal(verdict.awardsRestored,false);
 const recheck=await ownerCases(db);
 assert.equal(recheck[0].decision,'eligible_for_re_review');
 assert.equal(recheck[0].reviewExplanation,explanation);
 const publicResult=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),appealEnv(db));
 assert.deepEqual((await publicResult.json()).creations,[]);
 assert.equal(scalar(db,"SELECT status FROM member_studio_publications WHERE project_id=?",p.id).status,'withdrawn');
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_recognition_grants WHERE revoked_at IS NULL").c,0);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_studio_appeal_decisions").c,1);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_xp_events").c,0);
});
test('V072 cannot fabricate appeals, issue awards, modify decisions, or access another creator takedown',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await removed(db);
 const before=await canonicalStudioAppeals(post(uri,challenge(p)),appealEnv(db),owner('reviewer'),now+75);
 assert.equal(before.status,409);
 for(const forged of [
  {...challenge(p),userId:'reviewer'},
  {...challenge(p),xp:900000},
  {...challenge(p),reasonCode:'medal'},
  {...challenge(p),statement:'short'},
  {...challenge(p),expectedTakenDownAt:now+1}
 ]){
  const r=await canonicalStudioAppeals(post(uri,forged),appealEnv(db),owner('owner'),now+75);
  assert.notEqual(r.status,201);
 }
 const filed=await apply(db,p,now+76);
 const repeated=await canonicalStudioAppeals(post(uri,challenge(p)),appealEnv(db),owner('owner'),now+77);
 assert.equal(repeated.status,409);
 for(const invalid of [
  {...decision(filed.id,filed.filedAt),grant:'first_creation'},
  {...decision(filed.id,filed.filedAt),decision:'approve_and_restore'},
  {...decision(filed.id,filed.filedAt),explanation:'tiny'},
  {...decision(filed.id,now+99)}
 ]){
  const r=await canonicalStudioAppeals(post(uri+'/review',invalid),appealEnv(db),owner('other'),now+88);
  assert.notEqual(r.status,200);
 }
 const first=await canonicalStudioAppeals(post(uri+'/review',decision(filed.id,filed.filedAt)),
  appealEnv(db),owner('other'),now+100);
 assert.equal(first.status,200);
 const second=await canonicalStudioAppeals(post(uri+'/review',
  decision(filed.id,filed.filedAt,'eligible_for_re_review')),appealEnv(db),owner('other'),now+101);
 assert.notEqual(second.status,200);
 assert.equal(scalar(db,"SELECT decision FROM member_studio_appeal_decisions WHERE appeal_id=?",filed.id).decision,'upheld');
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_reward_notifications WHERE kind='award'").c,0);
});
test('V072 author, takedown officer and original release approver cannot decide their own case even when allowlisted',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await removed(db);
 const filed=await apply(db,p);
 const broadlyAllowlisted={...appealEnv(db),CANONICAL_STUDIO_APPEAL_REVIEWER_IDS:'owner,reviewer,safety,other'};
 for(const actor of ['owner','reviewer','safety']){
  const q=await canonicalStudioAppeals(new Request(uri+'/review'),broadlyAllowlisted,owner(actor));
  assert.equal(q.status,200);
  assert.deepEqual((await q.json()).cases,[]);
  const result=await canonicalStudioAppeals(
   post(uri+'/review',decision(filed.id,filed.filedAt)),broadlyAllowlisted,owner(actor),now+120);
  assert.equal(result.status,403,'independence enforced in canonical database query for '+actor);
 }
 const approved=await canonicalStudioAppeals(
  post(uri+'/review',decision(filed.id,filed.filedAt)),broadlyAllowlisted,owner('other'),now+122);
 assert.equal(approved.status,200);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_appeal_decisions').c,1);
});
test('V072 reviewer cannot read pending cases without separate approval; no unsafe HTTP methods',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=await removed(db);
 await apply(db,p);
 for(const userId of ['owner','reviewer','safety']){
  const r=await canonicalStudioAppeals(new Request(uri+'/review'),appealEnv(db),owner(userId));
  assert.equal(r.status,403);
 }
 for(const method of ['DELETE','PUT','PATCH']){
  const r=await canonicalStudioAppeals(new Request(uri,{method}),appealEnv(db),owner('owner'));
  assert.equal(r.status,405);
 }
 const invalid=await canonicalStudioAppeals(new Request(uri+'?user=owner'),appealEnv(db),owner('owner'));
 assert.equal(invalid.status,404);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_appeal_decisions').c,0);
});
test('V072 appeals rate-limit separate from XP and staff review, and cannot bypass one appeal per case',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const all=[];
 for(let i=1;i<=4;i++)all.push(await removed(db,i,now+i));
 for(let i=0;i<3;i++){
  const r=await canonicalStudioAppeals(post(uri,challenge(all[i])),appealEnv(db),owner('owner'),now+180+i);
  assert.equal(r.status,201,await r.clone().text());
 }
 const fourth=await canonicalStudioAppeals(post(uri,challenge(all[3])),appealEnv(db),owner('owner'),now+183);
 assert.equal(fourth.status,429);
 assert.equal(scalar(db,"SELECT requests FROM member_studio_appeal_limits WHERE actor_id='owner' AND action='file'").requests,3);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_appeals').c,3);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_xp_events').c,0);
});
