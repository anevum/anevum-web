// Real canonical Worker dispatch, synthetic session resolver, disposable SQLite.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
const ROOT='/api/v1/member/workbench';
function setup(apex=false){
 const f=fixture(),seen=[];
 for(const name of ['0008_private_creator_studio.sql','0009_private_review_snapshots.sql','0013_workbench_alpha_access.sql'])f.db.exec(readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8'));
 f.db.exec('CREATE TABLE staff_access_grants(member_id TEXT PRIMARY KEY,role TEXT,revoked_at INTEGER)');
 for(const id of ['owner','pilot']){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)').run(id,id,id+'@fixture.invalid');
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)').run(id,id,id,1,1);
 }
 f.db.exec("INSERT INTO staff_access_grants VALUES('owner','owner',NULL)");
 const origin=apex?'https://anevum.com':'https://a.anevum.com',prefix=apex?'anevum_can_apex':'anevum_can_stage';
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true',CANONICAL_WORKBENCH_ALPHA_ENABLED:'true',CANONICAL_WORKBENCH_SCHEMA_APPROVED:'true',...(apex?{ANEVUM_CANONICAL_APEX_ENABLED:'true'}:{})};
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  seen.push(Object.fromEntries(headers));
  const value=(headers.get('cookie')||'').match(new RegExp(prefix+'\\.session_token=(owner|pilot)(?:;|$)'))?.[1];
  return value?{user:{id:value,emailVerified:true},session:{id:'synthetic-session'}}:null;
 }},handler:()=>Response.json({error:'Not part of this fixture'},{status:404})})});
 const call=(path='/status',who='owner',body,headers={})=>worker.fetch(new Request(origin+ROOT+path,{
  method:body?'POST':'GET',headers:{cookie:'__Secure-'+prefix+'.session_token='+who,accept:'application/json',...(body?{origin,'sec-fetch-site':'same-origin','content-type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env);
 return {...f,env,origin,prefix,seen,call};
}
for(const apex of [false,true])test('canonical '+(apex?'apex':'staging')+' session gates Workbench and strips foreign credentials',async()=>{
 const s=setup(apex);try{
  const r=await s.call();assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).canManage,true);
  assert.equal(s.seen.length,1);
  const denied=await s.call('/status','owner',undefined,{cookie:'creator_session=owner',authorization:'Bearer forged'});
  assert.equal(denied.status,401);assert.equal(s.seen.at(-1).authorization,undefined);assert.equal(s.seen.at(-1).cookie,undefined);
  const grant={memberId:'pilot',expectedRevision:0,action:'grant',days:7,reason:'Explicit synthetic pilot test.'};
  assert.equal((await s.call('/access','owner',grant,{origin:'https://other.invalid'})).status,403);
  assert.equal((await s.call('/access','owner',grant)).status,200);
  assert.equal((await (await s.call('/status','pilot')).json()).allowed,true);
  const privateResponse=await s.call('/projects','pilot');assert.equal(privateResponse.status,200);
  assert.match(privateResponse.headers.get('cache-control'),/no-store/);assert.equal(privateResponse.headers.get('access-control-allow-origin'),null);
  s.env.CANONICAL_WORKBENCH_ALPHA_ENABLED='false';const count=s.seen.length;
  assert.equal((await s.call()).status,404);assert.equal(s.seen.length,count,'Flag-off does not resolve a session');
 }finally{s.db.close();}
});
