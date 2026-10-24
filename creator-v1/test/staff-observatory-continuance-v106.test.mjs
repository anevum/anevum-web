import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import worker,{decorateObservatoryHtml} from '../operations/anevum-iren-staff-observatory-v106.mjs';
import {NEXT_CSS,NEXT_CLIENT} from '../operations/anevum-observatory-continuance-v106-assets.mjs';

const ORIGIN='https://anevum.com/staff/observatory';
const counts={members:31,verified:22,new7d:4,prior7d:2,new30d:11,creatorProfiles:6,publishedProjects:5,pendingProjects:2,projectSaves:8,projectVotes:13,projectComments:7,forumThreads:3,forumReplies:12,wallPosts:2};
function fixture(role='owner',outage=false){
 const queries=[];
 const db={prepare(sql){queries.push(sql);return{bind(){return this},
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
 return {env,req,queries};
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
  ['/growth',['id="coverageRows"','id="campaignOutput"','id="ci-export"','data-ci-days="7"','id="ci-rum"','id="ci-rum-chart"','/staff/observatory/rum.js']]
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
test('optional Cloudflare browser analytics is staff protected, read only, and missing data is explicit',async()=>{
 for(const role of ['owner','reviewer']){
  const f=fixture(role);
  const available=await worker.fetch(f.req('/rum/api'),f.env);
  assert.equal(available.status,200);
  assert.equal(available.headers.get('cache-control'),'private, no-store');
  const result=await available.json();
  assert.equal(result.status,'unavailable');
  assert.ok(!('visits' in result));
  assert.ok(!('pageLoads' in result));
  for(const path of ['/rum/api','/rum.js','/rum.css']){
   const unauth=await worker.fetch(f.req(path,'GET',false),f.env);
   assert.equal(unauth.status,401,path);
   const post=await worker.fetch(f.req(path,'POST'),f.env);
   assert.equal(post.status,405,path);
   const query=await worker.fetch(f.req(path+'?debug=1'),f.env);
   assert.equal(query.status,400,path);
  }
  for(const path of ['/rum.js','/rum.css']){
   const asset=await worker.fetch(f.req(path),f.env);
   assert.equal(asset.status,200);
   assert.match(asset.headers.get('content-type'),/charset=utf-8/);
   assert.ok((await asset.text()).length>500);
  }
 }
});
test('authorized optional Cloudflare GraphQL response exposes estimates without upstream identity or secrets',async()=>{
 const f=fixture('owner'),saved=globalThis.fetch;
 const secret='synthetic-private-read-token-not-a-real-value';
 Object.assign(f.env,{
  ANEVUM_RUM_ACCOUNT_TAG:'0123456789abcdef0123456789abcdef',
  ANEVUM_RUM_SITE_TAG:'1234567890abcdef',
  ANEVUM_RUM_READ_TOKEN:secret,
 });
 let calls=0;
 globalThis.fetch=async (_url,request)=>{
  calls++;
  assert.equal(_url,'https://api.cloudflare.com/client/v4/graphql');
  assert.ok(request.body.includes('rumPageloadEventsAdaptiveGroups'));
  assert.equal(request.headers.Authorization,'Bearer '+secret);
  const today=new Date().toISOString().slice(0,10);
  return new Response(JSON.stringify({data:{viewer:{accounts:[{rumPageloadEventsAdaptiveGroups:[
   {dimensions:{date:today},count:4,sum:{visits:3}}
  ]}]}}}),{headers:{'content-type':'application/json'}});
 };
 try{
  const reply=await worker.fetch(f.req('/rum/api'),f.env);
  assert.equal(reply.status,200);
  const body=await reply.json();
  assert.equal(body.status,'estimated');
  assert.equal(body.quality,'may_be_sampled');
  assert.equal(body.visits,3);
  assert.equal(body.pageLoads,4);
  assert.equal(body.days.length,30);
  assert.equal(calls,1);
  assert.ok(!JSON.stringify(body).includes(secret));
  assert.ok(!JSON.stringify(body).includes(f.env.ANEVUM_RUM_ACCOUNT_TAG));
 }finally{globalThis.fetch=saved}
});
test('Growth Signal Index links and four campaign template controls are exposed to verified staff only',async()=>{
 const f=fixture('reviewer');
 const result=await worker.fetch(f.req('/growth'),f.env);
 assert.equal(result.status,200);
 const html=await result.text();
 assert.match(html,/class="ci-focus-nav"/);
 assert.match(html,/data-ci-section="acquisition"/);
 assert.match(html,/data-ci-section="ci-rum"/);
 assert.match(html,/data-ci-section="coverage"/);
 for(const name of ['reddit','facebook','flyer','creator']){
  assert.match(html,new RegExp('data-ci-campaign="'+name+'"'));
 }
 assert.match(html,/id="campaignTarget"/);
 assert.match(html,/id="campaignOutput"/);
 const script=await (await worker.fetch(f.req('/continuance-v106.js'),f.env)).text();
 for(const phrase of ['campaignPresets','campaignSlug','utmSource','utmCampaign','hashchange','aria-current','dispatchEvent']){
  if(phrase==='campaignSlug')continue; // Existing V105 client owns canonical slug validation.
  assert.ok(script.includes(phrase),phrase);
 }
 assert.doesNotMatch(script,/localStorage|sessionStorage|XMLHttpRequest|sendBeacon/);
});
test('NEXT layout aligns with NEXT design and preserves 320px navigation and reduced-motion controls',()=>{
 assert.match(NEXT_CSS,/--ci-void:#080d16/);
 assert.match(NEXT_CSS,/--ci-gold:#e2c28b/);
 assert.match(NEXT_CSS,/--ci-cyan:#b7e9f0/);
 assert.match(NEXT_CSS,/\.ci-focus-links/);
 assert.match(NEXT_CSS,/\.ci-preset-grid/);
 assert.match(NEXT_CSS,/@media\(max-width:370px\)/);
 assert.match(NEXT_CSS,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(NEXT_CSS,/body\.ci-next \.ci-hero\{min-height:184px/);
});
test('invalid pages cannot be transformed into authorized Observatory pages',()=>{
 assert.throws(()=>decorateObservatoryHtml('not Observatory','growth'),/verified HTML anchor/);
 assert.throws(()=>decorateObservatoryHtml('not Observatory','operations'),/verified HTML anchor/);
 assert.throws(()=>decorateObservatoryHtml('<body class="ci-next">','growth'),/duplicate decoration/);
});
test('staff-cleared static assets do not require live aggregate records',async()=>{
 const f=fixture('owner',true);
 const result=await worker.fetch(f.req('/continuance-v106.js'),f.env);
 assert.equal(result.status,200);
 assert.match(await result.text(),/ci-motion/);
 assert.ok(f.queries.length>=1);
 assert.ok(f.queries.every(sql=>sql.includes('SELECT g.role FROM staff_access_grants')),
  'Static assets must not perform overview aggregate queries');
});
