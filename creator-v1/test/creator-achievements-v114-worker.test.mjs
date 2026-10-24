import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';

const ORIGIN='https://a.anevum.com';
const PROJECT='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ROOT='/api/v1/member/studio/projects/'+PROJECT+'/achievements';
const migration=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
const alice={id:'v114-alice',name:'Alice',email:'alice@fixture.invalid',emailVerified:true};
const bob={id:'v114-bob',name:'Bob',email:'bob@fixture.invalid',emailVerified:true};
const definition={
 stableKey:'first_chapter',title:'First Chapter',description:'Complete the opening chapter.',
 triggerKey:'chapter.completed',targetCount:1,visibility:'visible',motif:'beacon',rewardLabel:'Chapter One'
};
function setup(t,{enabled=true}={}){
 const f=fixture();
 f.db.exec(migration('0008_private_creator_studio.sql'));
 f.db.exec(migration('0015_private_creator_achievements.sql'));
 for(const member of [alice,bob]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(member.id,member.name,member.email);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(member.id,member.name.toLowerCase()+'114',member.name,100,100);
 }
 f.db.prepare("INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,description,category,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
  .run(PROJECT,alice.id,'cccccccc-cccc-4ccc-8ccc-cccccccccccc','v114-project','V114 Project','Synthetic private achievement integration project','','games',100,100);
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true',
  CANONICAL_CREATOR_ACHIEVEMENTS_V114:enabled?'true':'false'};
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  const cookie=headers.get('cookie')||'';
  const member=cookie.includes('v114-alice')?alice:cookie.includes('v114-bob')?bob:null;
  return member?{user:member,session:{id:'synthetic-v114'}}:null;
 }},handler:async()=>new Response('not used',{status:404})})});
 async function call(path=ROOT,method='GET',body,who='alice',extra={}){
  const headers=new Headers({accept:'application/json',...(who?{cookie:'__Secure-anevum_can_stage.session_token=v114-'+who}:{}),
   ...(['POST','PATCH','PUT','DELETE'].includes(method)?{origin:ORIGIN,'sec-fetch-site':'same-origin','content-type':'application/json'}:{}),...extra});
  return worker.fetch(new Request(ORIGIN+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 }
 t.after(()=>f.db.close());
 return {f,env,call};
}
test('V114 canonical route is default-off before session lookup',async t=>{
 const s=setup(t,{enabled:false});
 assert.equal((await s.call()).status,404);
 assert.equal((await s.call(ROOT,'GET',undefined,null)).status,404);
});
test('V114 mounted route requires canonical sign-in and project ownership',async t=>{
 const s=setup(t);
 assert.equal((await s.call(ROOT,'GET',undefined,null)).status,401);
 assert.equal((await s.call(ROOT,'GET',undefined,'bob')).status,404);
 const response=await s.call();assert.equal(response.status,200);
 const data=await response.json();assert.equal(data.project.id,PROJECT);assert.equal(data.issuanceEnabled,false);
});
test('V114 canonical worker enforces same-origin writes and creates only a private definition',async t=>{
 const s=setup(t),xpBefore=s.f.db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n;
 assert.equal((await s.call(ROOT,'POST',{clientRequestId:crypto.randomUUID(),draft:definition},'alice',{origin:'https://evil.invalid'})).status,403);
 const id=crypto.randomUUID(),created=await s.call(ROOT,'POST',{clientRequestId:id,draft:definition});
 assert.equal(created.status,201,await created.clone().text());
 const saved=(await created.json()).achievement;assert.equal(saved.status,'private_draft');
 assert.equal((await s.call(ROOT,'POST',{clientRequestId:id,draft:definition})).status,200);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_studio_achievements').get().n,1);
 assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,xpBefore);
});
test('V114 unsupported mutation methods fail at the canonical router',async t=>{
 const s=setup(t);assert.equal((await s.call(ROOT,'DELETE',undefined)).status,405);
});
