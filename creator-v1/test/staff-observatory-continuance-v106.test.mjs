import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import worker,{decorateObservatoryHtml} from '../operations/anevum-iren-staff-observatory-v106.mjs';
import {NEXT_CSS,NEXT_CLIENT} from '../operations/anevum-observatory-continuance-v106-assets.mjs';

const ORIGIN='https://anevum.com/staff/observatory';
const counts={members:31,verified:22,new7d:4,prior7d:2,new30d:11,creatorProfiles:6,publishedProjects:5,pendingProjects:2,projectSaves:8,projectVotes:13,projectComments:7,forumThreads:3,forumReplies:12,wallPosts:2};
function fixture(role='owner',outage=false){
 const db={prepare(sql){return{bind(){return this},
  async first(){
   if(sql.includes('SELECT g.role FROM staff_access_grants'))return role==='none'?null:{role};
   if(outage)throw Error('Unavailable');
   if(sql.includes(' AS new7d')&&!sql.includes('COUNT(DISTINCT userId)'))return {...counts};
   return {...counts,sessionMembers:12,threads:3,replies:12,recognitions:3,pendingForum:0,projectReports:0,forumReports:0};
  },
  async all(){return {results:sql.includes('LIMIT 30')?[{day:new Date().toISOString().slice(0,10),n:1}]:[]}}
 }}};
 const env={MEMBER_DB:db,APEX_AUTH:{async fetch(){return new Response(JSON.stringify({session:{id:'fixture-session',userId:'fixture-staff',expiresAt:new Date(Date.now()+60000).toISOString()},user:{id:'fixture-staff',emailVerified:true}}),{headers:{'content-type':'application/json'}})}}};
 const req=(route='',method='GET',cookie=true)=>new Request(ORIGIN+route,{method,headers:cookie?{cookie:'staff=fixture'}:{}});
 return {env,req};
}
test('V106 client parses, uses motion safeguards, and does not initiate analytics network traffic',()=>{
 assert.doesNotThrow(()=>new Script(NEXT_CLIENT));
 assert.match(NEXT_CSS,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(NEXT_CSS,/@media\(forced-colors:active\)/);
 assert.match(NEXT_CSS,/@media\(max-width:720px\)/);
 assert.doesNotMatch(NEXT_CLIENT,/fetch\s*\(|localStorage|sessionStorage|XMLHttpRequest/);
});
test('operations and growth pages render approved NEXT brand with intact staff controls',async()=>{
 const f=fixture();
 for(const [route,required] of [
  ['', ['id="memberRows"','id="priorityActions"','id="ci-hero-title"']],
  ['/growth',['id="coverageRows"','id="campaignOutput"','id="ci-export"','data-ci-days="7"']]
 ]){
  const res=await worker.fetch(f.req(route),f.env);
  assert.equal(res.status,200,route);
  assert.match(res.headers.get('content-security-policy'),/script-src 'self'/);
  const html=await res.text();
  for(const s of [...required,'class="ci-next"','id="ci-motion"','ci-orbital-mark','continuance-v106.css','continuance-v106.js'])assert.ok(html.includes(s),s);
  assert.equal(html.split('continuance-v106.css').length-1,1);
 }
});
test('owner and reviewer can read protected style and script only with verified session',async()=>{
 for(const role of ['owner','reviewer']){
  const f=fixture(role);
  for(const path of ['/continuance-v106.css','/continuance-v106.js']){
   const ok=await worker.fetch(f.req(path),f.env);
   assert.equal(ok.status,200);
   assert.equal(ok.headers.get('cache-control'),'private, no-store');
   assert.ok((await ok.text()).length>1000);
   assert.equal((await worker.fetch(f.req(path,'GET',false),f.env)).status,401);
   assert.equal((await worker.fetch(f.req(path,'POST'),f.env)).status,405);
   assert.equal((await worker.fetch(f.req(path+'?q=1'),f.env)).status,400);
  }
 }
});
test('existing read-only growth data and private reviewer permissions remain unchanged',async()=>{
 const f=fixture('reviewer');
 const g=await worker.fetch(f.req('/growth/api'),f.env);
 assert.equal(g.status,200);
 const data=await g.json();
 assert.deepEqual(data.counts,counts);
 assert.equal(data.role,'reviewer');
 assert.ok(data.coverage.every(x=>x.status==='unavailable'));
 assert.equal((await worker.fetch(f.req('/api/members'),f.env)).status,403);
});
test('invalid pages cannot be transformed into authorized Observatory pages',()=>{
 assert.throws(()=>decorateObservatoryHtml('not Observatory','growth'),/verified HTML anchor/);
 assert.throws(()=>decorateObservatoryHtml('not Observatory','operations'),/verified HTML anchor/);
 assert.throws(()=>decorateObservatoryHtml('<body class="ci-next">','growth'),/duplicate decoration/);
});
test('unavailable staff records do not expose themed JavaScript',async()=>{
 const f=fixture('owner',true);
 const bad=await worker.fetch(f.req('/continuance-v106.js'),f.env);
 assert.equal(bad.status,503);
 assert.ok((await bad.json()).error);
});
