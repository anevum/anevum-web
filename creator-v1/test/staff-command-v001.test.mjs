import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalStaffOps,cleanupStaffOps,staffOpsPermission,staffRosterIds,validCanvasStroke,STAFF_OPS_PATH} from '../canonical-auth/staff-ops.mjs';

const origin='https://a.anevum.com';
function req(method='GET',body,query=''){
 return new Request(origin+STAFF_OPS_PATH+query,{
  method,headers:{origin,...(body===undefined?{}:{'content-type':'application/json'})},
  body:body===undefined?undefined:JSON.stringify(body)
 });
}
function setup(){
 const f=fixture();
 f.db.exec(readFileSync(new URL('../canonical-auth/migrations/0010_staff_command.sql',import.meta.url),'utf8'));
 function seed(key,{verified=true,profile=true}={}){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,1,1)')
   .run(key,'Fixture '+key,key+'@synthetic.invalid',verified?1:0);
  if(profile)f.db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at) VALUES(?,?,?,?,?,1,1)")
   .run(key,'fixture_'+key,'Fixture '+key,'','private');
  return {id:key,emailVerified:verified};
 }
 const owner=seed('owner'),reviewer=seed('reviewer'),second=seed('second',{profile:false});
 const outsider=seed('outsider'),unverified=seed('unverified',{verified:false});
 const env={...f.env,CANONICAL_STAFF_OPS_ENABLED:'true',CANONICAL_STAFF_OWNER_IDS:'owner',
  CANONICAL_FORUM_REVIEWER_IDS:'reviewer',CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS:'second,unverified'};
 const call=(member=owner,method='GET',body,query='',now=5000)=>
  canonicalStaffOps(req(method,body,query),env,member,now);
 return {...f,seed,env,owner,reviewer,second,outsider,unverified,call};
}
const parse=async response=>response.json();

test('IREN V001: immutable ID grants, secondary reviewer, verified-session and feature flag fail closed',async()=>{
 const f=setup();
 try{
  assert.deepEqual(staffOpsPermission(f.env,f.owner),{memberId:'owner',role:'owner'});
  assert.deepEqual(staffOpsPermission(f.env,f.reviewer),{memberId:'reviewer',role:'reviewer'});
  assert.deepEqual(staffOpsPermission(f.env,f.second),{memberId:'second',role:'reviewer'});
  assert.equal(staffOpsPermission(f.env,f.outsider),null);
  assert.equal(staffOpsPermission(f.env,f.unverified),null);
  assert.deepEqual(staffRosterIds(f.env),['owner','reviewer','second','unverified']);
  assert.equal((await f.call(null)).status,401);
  assert.equal((await f.call(f.unverified)).status,401);
  assert.equal((await f.call(f.outsider)).status,403);
  assert.equal((await f.call(f.owner)).status,200);
  f.env.CANONICAL_STAFF_OPS_ENABLED='false';
  assert.equal((await f.call(f.owner)).status,404);
  f.env.CANONICAL_STAFF_OPS_ENABLED='true';
  const missing={...f.env};
  delete missing.CANONICAL_STAFF_OWNER_IDS;
  assert.equal(staffOpsPermission(missing,f.owner),null);
 }finally{f.db.close()}
});

test('IREN V001: owner sees verified member totals without emails; reviewers see no aggregate member counts',async()=>{
 const f=setup();
 try{
  const owner=await parse(await f.call(f.owner));
  const reviewer=await parse(await f.call(f.reviewer));
  assert.deepEqual(owner.memberMetrics,{total:5,verified:4});
  assert.equal(reviewer.memberMetrics,null);
  assert.equal(owner.roster.length,3);
  assert.equal(owner.roster.some(x=>x.id==='unverified'),false);
  assert.equal(owner.roster.some(x=>x.id==='second'),true);
  for(const response of [owner,reviewer]){
   const serial=JSON.stringify(response);
   assert.doesNotMatch(serial,/@synthetic\.invalid/);
   assert.equal(response.invitations.length,0);
   assert.equal(response.messages.length,0);
  }
 }finally{f.db.close()}
});

test('IREN V001: friend invitations are manual owner-only records and cannot provision staff roles',async()=>{
 const f=setup();
 try{
  const invite={kind:'invite-create',alias:'Trusted friend',channel:'direct',note:'Friend expressed interest in helping'};
  assert.equal((await f.call(f.reviewer,'POST',invite)).status,403);
  const made=await f.call(f.owner,'POST',invite);
  assert.equal(made.status,201);
  const id=(await made.json()).id;
  const owner=await parse(await f.call(f.owner));
  assert.equal(owner.invitations.length,1);
  assert.equal(owner.invitations[0].stage,'invited');
  assert.equal(owner.invitations[0].alias,'Trusted friend');
  assert.equal((await f.call(f.owner,'POST',{kind:'invite-update',id,stage:'staff-candidate'})).status,200);
  const updated=await parse(await f.call(f.owner));
  assert.equal(updated.invitations[0].stage,'staff-candidate');
  assert.equal(updated.roster.length,3);
  assert.equal(staffOpsPermission(f.env,f.outsider),null);
  assert.equal((await f.call(f.reviewer,'POST',{kind:'invite-update',id,stage:'joined'})).status,403);
  assert.equal((await f.call(f.owner,'POST',{kind:'invite-update',id,stage:'staff-candidate'})).status,409);
  assert.equal((await f.call(f.owner,'POST',{kind:'invite-create',alias:'',channel:'direct',note:''})).status,400);
  assert.equal(updated.history.some(x=>x.eventType==='invite-created'),true);
  assert.equal(updated.history.some(x=>x.eventType==='invite-updated'),true);
 }finally{f.db.close()}
});

test('IREN V001: shared tasks, staff messages and audit records persist across independent staff accounts',async()=>{
 const f=setup();
 try{
  const created=await f.call(f.reviewer,'POST',{kind:'task-create',title:'Review first invited creator report',priority:'important'});
  assert.equal(created.status,201);
  const id=(await created.json()).id;
  assert.equal((await f.call(f.second,'POST',{kind:'task-update',id,stage:'in-progress'})).status,200);
  const message=await f.call(f.reviewer,'POST',{kind:'message',room:'review',body:'I will check the member report.'});
  assert.equal(message.status,201);
  const response=await parse(await f.call(f.second,'GET',undefined,'?room=review'));
  assert.equal(response.tasks[0].stage,'in-progress');
  assert.equal(response.messages.length,1);
  assert.equal(response.messages[0].body,'I will check the member report.');
  assert.equal(response.messages[0].author,'Fixture reviewer');
  assert.equal(response.history.filter(x=>x.eventType.startsWith('task-')).length,2);
  assert.equal((await f.call(f.second,'POST',{kind:'message',room:'review',body:'\u0001ctrl'})).status,400);
  assert.equal((await f.call(f.second,'POST',{kind:'message',room:'private',body:'not a valid room'})).status,400);
  assert.equal((await f.call(f.second,'POST',{kind:'task-update',id,stage:'done'})).status,200);
  assert.equal((await f.call(f.second,'POST',{kind:'task-update',id,stage:'done'})).status,409);
 }finally{f.db.close()}
});

test('IREN V001: bounded shared canvas validates normalized geometry and owner-only privileged input is not needed to draw',async()=>{
 const f=setup();
 try{
  const valid={points:[[0.1,0.2],[0.5,0.6],[0.9,0.5]],width:2,color:'#a99aff'};
  assert.equal(validCanvasStroke(valid),true);
  assert.equal(validCanvasStroke({...valid,points:[[0.2,0.2],[1.5,0.5]]}),false);
  assert.equal(validCanvasStroke({...valid,color:'javascript:alert(1)'}),false);
  assert.equal(validCanvasStroke({...valid,points:Array.from({length:70},()=>[0.1,0.2])}),false);
  assert.equal((await f.call(f.reviewer,'POST',{kind:'stroke',room:'operations',stroke:valid})).status,201);
  const snapshot=await parse(await f.call(f.owner));
  assert.equal(snapshot.canvas.length,1);
  assert.deepEqual(snapshot.canvas[0].data,valid);
  assert.equal((await f.call(f.reviewer,'POST',{kind:'stroke',room:'operations',stroke:{...valid,color:'bad'}})).status,400);
  assert.equal((await f.call(f.owner,'POST',{kind:'clear-canvas',room:'operations'})).status,201);
  const cleared=await parse(await f.call(f.reviewer));
  assert.deepEqual(cleared.canvas.map(x=>x.eventType),['stroke','clear']);
  assert.equal(cleared.history[0].eventType,'board-cleared');
 }finally{f.db.close()}
});

test('IREN V001: direct call signaling limited to configured staff and recipient-scoped reads',async()=>{
 const f=setup();
 try{
  assert.equal((await f.call(f.owner,'POST',{kind:'presence',room:'bridge'},'',6000)).status,200);
  assert.equal((await f.call(f.second,'POST',{kind:'presence',room:'bridge'},'',6000)).status,200);
  const seen=await parse(await f.call(f.reviewer,'GET',undefined,'',6025));
  assert.deepEqual(seen.peers.map(x=>x.id).sort(),['owner','second']);
  const posted=await f.call(f.owner,'POST',{kind:'signal',recipientId:'second',
   signalType:'offer',data:{type:'offer',sdp:'synthetic-session'}},'',6010);
  assert.equal(posted.status,201);
  const recipient=await parse(await f.call(f.second,'GET',undefined,'?lane=signals&after=0',6012));
  assert.equal(recipient.signals.length,1);
  assert.equal(recipient.signals[0].senderId,'owner');
  assert.equal(recipient.signals[0].data.type,'offer');
  const other=await parse(await f.call(f.reviewer,'GET',undefined,'?lane=signals&after=0',6012));
  assert.equal(other.signals.length,0);
  assert.equal((await f.call(f.owner,'POST',{kind:'signal',recipientId:'outsider',signalType:'candidate',data:{}},'',6020)).status,400);
  assert.equal((await f.call(f.owner,'POST',{kind:'signal',recipientId:'owner',signalType:'candidate',data:{}},'',6020)).status,400);
  assert.equal((await f.call(f.owner,'GET',undefined,'?lane=signals&after=-4')).status,400);
 }finally{f.db.close()}
});

test('IREN V001: per-minute messages are throttled and tampered request shapes rejected',async()=>{
 const f=setup();
 try{
  for(let i=0;i<24;i++)assert.equal((await f.call(f.owner,'POST',{
   kind:'message',room:'projects',body:'Message '+i
  })).status,201);
  assert.equal((await f.call(f.owner,'POST',{kind:'message',room:'projects',body:'Too many'})).status,429);
  assert.equal((await f.call(f.owner,'POST',{kind:'message',room:'projects',body:'Other',authorId:'reviewer'},'',5100)).status,400);
  assert.equal((await f.call(f.owner,'POST',{kind:'invite-create',alias:'Friend',channel:'email',note:'',role:'owner'})).status,400);
  assert.equal((await f.call(f.owner,'GET',undefined,'?lane=unknown')).status,400);
  assert.equal((await f.call(f.owner,'GET',undefined,'?room=operations&room=review')).status,400);
 }finally{f.db.close()}
});

test('IREN V001: call signaling expires and maintenance does not touch D1 when feature gate is disabled',async()=>{
 const f=setup();
 try{
  assert.equal((await f.call(f.owner,'POST',{kind:'signal',recipientId:'reviewer',
   signalType:'offer',data:{type:'offer',sdp:'temporary'}} ,'',1000)).status,201);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM staff_webrtc_signals').get().n,1);
  assert.deepEqual(await cleanupStaffOps(f.env,2000),{ok:true});
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM staff_webrtc_signals').get().n,0);
  f.env.CANONICAL_STAFF_OPS_ENABLED='false';
  assert.deepEqual(await cleanupStaffOps(f.env,3000),{skipped:true});
 }finally{f.db.close()}
});
