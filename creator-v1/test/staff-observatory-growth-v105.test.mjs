import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';
import worker, {readGrowthAggregates} from '../operations/anevum-iren-staff-observatory-v105.mjs';

const ORIGIN='https://anevum.com', root='/staff/observatory/growth';
const sourcePath=new URL('../operations/anevum-iren-staff-observatory-v105.mjs',import.meta.url);
const source=readFileSync(sourcePath,'utf8');
function asset(name){
 const m=source.match(new RegExp('const '+name+'=("(?:\\\\.|[^"\\\\])*");'));
 assert.ok(m,'Missing '+name);
 return JSON.parse(m[1]);
}
const COUNTS={members:31,verified:22,new7d:4,prior7d:2,new30d:11,creatorProfiles:6,
 publishedProjects:5,pendingProjects:2,projectSaves:8,projectVotes:13,
 projectComments:7,forumThreads:3,forumReplies:12,wallPosts:2};
function fixture(role='reviewer',opts={}){
 const queries=[];
 const db={prepare(sql){
  queries.push(sql);
  if(opts.fail&&sql.includes(' AS new7d'))throw Error('Synthetic D1 failure');
  return {bind(){return this},
   async first(){
    if(sql.includes('SELECT g.role FROM staff_access_grants'))return role==='none'?null:{role};
    if(sql.includes(' AS new7d'))return {...COUNTS,...opts.override};
    if(sql.includes(' AS members'))return {members:31,verified:22,new7d:4,sessionMembers:15,
      pendingProjects:2,pendingForum:0,projectReports:0,forumReports:0};
    throw Error('Unexpected SQL query');
   },
   async all(){return {results:sql.includes('LIMIT 30')?[{day:new Date().toISOString().slice(0,10),n:1}]:[]}}};
 }};
 const env={MEMBER_DB:db,APEX_AUTH:{async fetch(){
  return new Response(JSON.stringify({
   session:{id:'synthetic-session',userId:'synthetic-id',expiresAt:new Date(Date.now()+60000).toISOString()},
   user:{id:'synthetic-id',emailVerified:true}
  }),{headers:{'content-type':'application/json'}});
 }}};
 const request=(suffix='',method='GET',cookie=true)=>new Request(ORIGIN+root+suffix,{method,headers:cookie?{cookie:'staff=fixture'}:{}});
 return {db,env,queries,request};
}
test('V105 source and client parse and preserve V104 by import',()=>{
 const p=spawnSync(process.execPath,['--check',sourcePath.pathname],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);
 assert.doesNotThrow(()=>new Script(asset('CLIENT')));
 assert.match(source,/import previous from '.\/anevum-iren-staff-observatory-v104.mjs'/);
 assert.doesNotMatch(source,/INSERT INTO|UPDATE .*SET|DELETE FROM|DROP TABLE|member_xp_events/);
});
test('owner and reviewer get aggregates without identities or invented metrics',async()=>{
 for(const role of ['owner','reviewer']){
  const f=fixture(role),res=await worker.fetch(f.request('/api'),f.env);
  assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'private, no-store');
  const d=await res.json();
  assert.equal(d.role,role);assert.deepEqual(d.counts,COUNTS);
  assert.equal(d.source,'MEMBER_DB');assert.equal(d.timeZone,'UTC');
  assert.equal(d.days.length,1);assert.equal(d.coverage.length,5);
  assert.ok(d.coverage.every(x=>x.status==='unavailable'));
  assert.ok(!JSON.stringify(d).includes('synthetic-id'));
  assert.ok(f.queries.length>=5);
  assert.ok(f.queries.every(q=>/^\s*SELECT\b/i.test(q)));
 }
});
test('V105 page, CSS, JS, and API require verified staff and safe headers',async()=>{
 const f=fixture();
 for(const suffix of ['', '/app.js','/styles.css','/api']){
  const r=await worker.fetch(f.request(suffix,'GET',false),f.env);
  assert.equal(r.status,401,suffix);
  assert.equal(r.headers.get('cache-control'),'private, no-store');
 }
 const page=await worker.fetch(f.request(),f.env);
 assert.equal(page.status,200);
 assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.match(await page.text(),/id="coverageRows"/);
 assert.match(await (await worker.fetch(f.request('/styles.css'),f.env)).text(),/max-width:560px/);
 assert.match(await (await worker.fetch(f.request('/app.js'),f.env)).text(),/function missing\(message\)/);
});
test('V105 refuses unknown method, query and route',async()=>{
 const f=fixture();
 assert.equal((await worker.fetch(new Request(ORIGIN+root+'/api?debug=1',{headers:{cookie:'staff=fixture'}}),f.env)).status,400);
 assert.equal((await worker.fetch(f.request('/api','POST'),f.env)).status,405);
 assert.equal((await worker.fetch(f.request('/not-a-route'),f.env)).status,404);
});
test('missing database and invalid counts fail closed; no manufactured zeros',async()=>{
 const f=fixture('owner',{fail:true});
 assert.equal((await worker.fetch(f.request('/api'),f.env)).status,503);
 const invalid=fixture('reviewer',{override:{new7d:-9}});
 await assert.rejects(readGrowthAggregates(invalid.db,'reviewer'),/integrity/);
});
test('legacy reviewer permission to inspect private member directory stays blocked',async()=>{
 const f=fixture('reviewer');
 const req=new Request(ORIGIN+'/staff/observatory/api/members',{headers:{cookie:'staff=fixture'}});
 assert.equal((await worker.fetch(req,f.env)).status,403);
});
test('original Observatory navigation and member controls are preserved',async()=>{
 const f=fixture('owner');
 const req=new Request(ORIGIN+'/staff/observatory',{headers:{cookie:'staff=fixture'}});
 const res=await worker.fetch(req,f.env),page=await res.text();
 assert.equal(res.status,200);
 assert.equal(page.split('href="/staff/observatory/growth"').length-1,2);
 assert.match(page,/data-tab="members"/);assert.match(page,/data-tab="moderation"/);
 assert.match(page,/id="memberSearch"/);
});
test('rolling windows are distinct from UTC calendar chart and zero-baseline percent is not invented',()=>{
 assert.match(source,/julianday\('now','-7 days'\)/);
 assert.match(source,/julianday\('now','-14 days'\)/);
 assert.match(source,/julianday\('now','-30 days'\)/);
 assert.match(source,/julianday\(date\('now','-29 days'\)\)/);
 assert.match(asset('CLIENT'),/Prior week zero; percentage undefined/);
 assert.match(asset('CLIENT'),/Rolling 30×24-hour period/);
});
