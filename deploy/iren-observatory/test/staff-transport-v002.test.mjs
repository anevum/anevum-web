import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';

const ORIGIN='https://anevum.com';
function staffEnv(role='owner',verification=true){
 const calls=[];
 const db={
  prepare(sql){
   assert.match(sql,/staff_access_grants/,'staff privilege requires the independently verified grant');
   return {bind(id){assert.equal(id,'fixture-user');return this},
    async first(){return role==='revoked'?null:{role}}};
  }
 };
 const auth={
  async fetch(request){
   calls.push(request);
   assert.equal(request.redirect,'manual','the in-production V091 service-binding transport must be preserved');
   assert.equal(request.url,ORIGIN+'/api/v1/member/auth/get-session');
   assert.equal(request.headers.get('cookie'),'session=fixture');
   const body=verification?{
    user:{id:'fixture-user',emailVerified:true},
    session:{id:'fixture-session',userId:'fixture-user',expiresAt:'2099-01-01T00:00:00.000Z'}
   }:{
    user:{id:'fixture-user',emailVerified:false},
    session:{id:'fixture-session',userId:'fixture-user',expiresAt:'2099-01-01T00:00:00.000Z'}
   };
   return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
  }
 };
 return {env:{APEX_AUTH:auth,MEMBER_DB:db},calls};
}
function req(path,headers={}){
 return new Request(ORIGIN+path,{headers:{cookie:'session=fixture',...headers}});
}
test('V002 preserves production manual redirect for staff-only HTML and JS',async()=>{
 const {env,calls}=staffEnv();
 for(const path of ['/staff/observatory/','/staff/observatory/app.js','/staff/observatory/styles.css']){
  const result=await worker.fetch(req(path),env);
  assert.equal(result.status,200,path);
  assert.equal(result.headers.get('cache-control'),'private, no-store');
 }
 assert.equal(calls.length,3,'authentication must be repeated for each protected resource');
});
test('V002 does not serve private UI when session verification fails or grant is revoked',async()=>{
 for(const [role,valid] of [['owner',false],['revoked',true]]){
  const {env}=staffEnv(role,valid);
  const result=await worker.fetch(req('/staff/observatory/app.js'),env);
  assert.equal(result.status,401);
  assert.doesNotMatch(await result.text(),/AURA_CATALOG/);
 }
 const {env}=staffEnv();
 const result=await worker.fetch(new Request(ORIGIN+'/staff/observatory/'),env);
 assert.equal(result.status,401,'a cookie is mandatory');
});
test('V002 reviewer remains denied owner-only member and recognition APIs',async()=>{
 const {env}=staffEnv('reviewer');
 for(const path of ['/staff/observatory/api/members?page=0','/staff/observatory/api/rewards','/staff/observatory/api/audit']){
  const r=await worker.fetch(req(path),env);
  assert.equal(r.status,403,path);
 }
 const post=await worker.fetch(new Request(ORIGIN+'/staff/observatory/api/aura',{
  method:'POST',headers:{cookie:'session=fixture',origin:ORIGIN,'content-type':'application/json','sec-fetch-site':'same-origin'},
  body:JSON.stringify({aura:'ember',memberId:'fixture-user',revision:0})
 }),env);
 assert.equal(post.status,403,'reviewer cannot set member aura');
});
