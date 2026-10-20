import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import authoring,{verifyStaffAssertion} from '../worker.mjs';
import publicApi from '../../api/worker.mjs';
const base=fileURLToPath(new URL('./sqlite-bridge.py',import.meta.url));
const path=mkdtempSync(tmpdir()+'/anevum-authoring-')+'/fixture.db';
const schema=`CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,handle TEXT UNIQUE NOT NULL,display_name TEXT NOT NULL,bio TEXT DEFAULT '',is_staff INTEGER DEFAULT 0,status TEXT DEFAULT 'active');
CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT NOT NULL REFERENCES creator_profiles(member_id),slug TEXT NOT NULL,title TEXT NOT NULL,summary TEXT NOT NULL,description TEXT,category TEXT,status TEXT,free_to_use INTEGER,license_name TEXT,source_url TEXT,demo_url TEXT,ai_disclosure TEXT,human_contribution TEXT,published_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(owner_member_id,slug));`;
const migration=readFileSync(fileURLToPath(new URL('../migrations/0002_staff_authoring.sql',import.meta.url)),'utf8');
function cli(value){const r=spawnSync('python',[base,path],{input:JSON.stringify(value),encoding:'utf8'});if(r.status)throw Error('SQLite error: '+r.stdout+' '+r.stderr);return JSON.parse(r.stdout)}
cli({mode:'init',schema,migration});
const db={prepare(sql){let params=[];const stmt={sql,params,bind(...vals){return{sql,params:vals,all:stmt.all,run:stmt.run}},async all(){return cli({mode:'all',sql,params:this.params||params})}};return stmt},async batch(statements){return cli({mode:'batch',statements:statements.map(q=>({sql:q.sql,params:q.params}))})}};
const env={COMMUNITY_DB:db,STUDIO_ACCESS_ISSUER:'https://fixture.cloudflareaccess.com',STUDIO_ACCESS_AUDIENCE:'owner-only-audience',STUDIO_ALLOWED_EMAILS:'owner@example.com'};
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='owner-fixture';
const b64=x=>Buffer.from(x instanceof Uint8Array?x:typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
async function jwt(overrides={}){
  const now=Math.floor(Date.now()/1000);
  const parts=[b64({alg:'RS256',kid:'owner-fixture'}),b64({iss:env.STUDIO_ACCESS_ISSUER,aud:[env.STUDIO_ACCESS_AUDIENCE],email:'owner@example.com',iat:now-10,exp:now+600,...overrides})];
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(parts.join('.')));
  return parts.concat(b64(new Uint8Array(signature))).join('.');
}
let signed=await jwt();
const oldFetch=globalThis.fetch;
globalThis.fetch=async url=>String(url).endsWith('/cdn-cgi/access/certs')?Response.json({keys:[jwk]}):Promise.reject(Error('Unintended outgoing network request'));
test.after(()=>{globalThis.fetch=oldFetch;rmSync(path.slice(0,path.lastIndexOf('/')),{recursive:true,force:true})});
const valid={title:'ANEVUM Workspace',slug:'anevum-workspace',summary:'Independent community software for creators.',category:'tools',description:'Working project with public source and clear disclosure.',demoUrl:'https://anevum.com',sourceUrl:'https://github.com/anevum/anevum-web',license:'MIT',freeToUse:true,aiDisclosure:'AI assisted with parts of development.',humanContribution:'Reviewed, tested and operated by people.'};
function request(url,method='GET',body=null,token=signed,origin='https://studio.next.anevum.com'){
  return new Request('https://studio.next.anevum.com'+url,{method,headers:{'cf-access-jwt-assertion':token,origin,'content-type':'application/json','sec-fetch-site':'same-origin'},body:body===null?undefined:JSON.stringify(body)})
}
async function call(url,method='GET',body=null,token=signed,origin='https://studio.next.anevum.com'){return authoring.fetch(request(url,method,body,token,origin),env)}
test('signed staff assertion accepted, wrong claims and signature denied',async()=>{
  assert.equal((await verifyStaffAssertion(signed,env)).email,'owner@example.com');
  for(const o of [{aud:['another']},{email:'stranger@example.com'},{exp:1000},{iss:'https://wrong.cloudflareaccess.com'}]){const bad=await jwt(o);await assert.rejects(()=>verifyStaffAssertion(bad,env));}
  const tampered=signed.split('.');tampered[2]=b64(new Uint8Array(256));await assert.rejects(()=>verifyStaffAssertion(tampered.join('.'),env));
});
test('all studio pages and APIs reject unauthenticated access',async()=>{
  for(const p of ['/','/studio.js','/api/projects','/health'])assert.equal((await call(p,'GET',null,'no-token')).status,401,p);
  assert.equal((await authoring.fetch(new Request('https://evil.example/api/projects'),env)).status,404);
});
test('verified studio serves actual HTML and no mock user data',async()=>{
  const r=await call('/');assert.equal(r.status,200);assert.ok((await r.text()).includes('STAGING ONLY'));
  assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);
});
test('cross-site write, oversized body, and invalid project fail closed',async()=>{
  assert.equal((await call('/api/projects','POST',valid,signed,'https://evil.example')).status,403);
  assert.equal((await call('/api/projects','POST',{...valid,sourceUrl:'http://localhost:3000'})).status,400);
  assert.equal((await call('/api/projects','POST',{...valid,summary:'too short'})).status,400);
  assert.equal((await call('/api/projects','POST',{...valid,slug:'admin/evil'})).status,400);
  assert.equal((await call('/api/projects','PUT',valid)).status,405);
});
let created;
test('verified owner creates real draft and it remains invisible publicly',async()=>{
  const r=await call('/api/projects','POST',valid);
  assert.equal(r.status,201,await r.clone().text());created=(await r.json()).id;
  assert.match(created,/^[a-f0-9]{32}$/);
  const list=await (await call('/api/projects')).json();assert.equal(list.projects.length,1);assert.equal(list.projects[0].status,'draft');
  const publicData=await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env)).json();assert.equal(publicData.items.length,0);
});
test('editable drafts enforce staff identity, state and record edits',async()=>{
  const r=await call('/api/projects/'+created,'PATCH',{...valid,title:'ANEVUM Workspace Updated'});assert.equal(r.status,200,await r.clone().text());
  const list=await (await call('/api/projects')).json();assert.equal(list.projects[0].title,'ANEVUM Workspace Updated');
  assert.equal((await call('/api/projects/'+created,'PATCH',{...valid,sourceUrl:'http://unsafe.test'})).status,400);
});
test('owner moves draft into review and cannot publish arbitrary drafts',async()=>{
  const first=await call('/api/projects/'+created+'/publish','POST',{reason:'Verified source and reproducibility'});assert.equal(first.status,409);
  const r=await call('/api/projects/'+created+'/submit','POST',{});assert.equal(r.status,200,await r.clone().text());
  assert.equal((await call('/api/projects/'+created+'/submit','POST',{})).status,409);
  assert.equal((await call('/api/projects/'+created,'PATCH',valid)).status,409);
});
test('publish needs editorial reason and changes real published catalogue',async()=>{
  assert.equal((await call('/api/projects/'+created+'/publish','POST',{reason:'short'})).status,400);
  const r=await call('/api/projects/'+created+'/publish','POST',{reason:'Verified product, source and permissions for public listing.'});assert.equal(r.status,200,await r.clone().text());
  const published=await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env)).json();
  assert.equal(published.items.length,1);assert.equal(published.items[0].title,'ANEVUM Workspace Updated');
  assert.equal((await call('/api/projects/'+created+'/publish','POST',{reason:'Try again duplicate'})).status,409);
});
test('archive removes public listing and leaves event audit',async()=>{
  const r=await call('/api/projects/'+created+'/archive','POST',{reason:'Demo retired for redesign and archived.'});assert.equal(r.status,200,await r.clone().text());
  const published=await (await publicApi.fetch(new Request('https://anevum.com/api/v1/projects'),env)).json();assert.equal(published.items.length,0);
  const events=cli({mode:'all',sql:'SELECT action,from_status,to_status FROM project_workflow_events ORDER BY rowid'}).results;
  assert.deepEqual(events.map(x=>x.action),['create','edit','submit','publish','archive']);
});