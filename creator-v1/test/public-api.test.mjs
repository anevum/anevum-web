import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import api, { safePublicUrl } from '../api/worker.mjs';
import runtime from '../site/runtime.mjs';
import { database, helper } from './db.mjs';
const dir=mkdtempSync(tmpdir()+'/anevum-v1-'),path=dir+'/fixture.db';
const init=spawnSync('python',[helper,path,'init'],{encoding:'utf8'});assert.equal(init.status,0,init.stderr);
const env={COMMUNITY_DB:database(path)};
test.after(()=>rmSync(dir,{recursive:true,force:true}));
const call=(path,method='GET',e=env)=>api.fetch(new Request('https://next.anevum.com'+path,{method}),e);
const body=async(path)=>{const r=await call(path);assert.equal(r.status,200);return r.json();};
test('catalogue excludes drafts, archived, suspended-owner, future and undated projects',async()=>{assert.deepEqual((await body('/api/v1/projects')).items.map(x=>x.id),['a','g','h','i']);});
test('category counts use exactly the public catalogue visibility',async()=>{assert.deepEqual((await body('/api/v1/categories')).categories,[{category:'games',count:1},{category:'tools',count:3}]);});
test('creator directory contains only approved publications by active creators',async()=>{
 const data=await body('/api/v1/creators');
 assert.deepEqual(data.items,[{handle:'fixture',displayName:'Fixture Creator',publishedProjects:4}]);
 assert.equal(data.count,1);
 assert.equal(data.nextCursor,null);
 for(const key of ['email','member_id','owner_member_id','is_staff','status','avatar_url'])assert.ok(!Object.hasOwn(data.items[0],key));
 assert.ok(!JSON.stringify(data).includes('member-private-1'));
 assert.ok(!JSON.stringify(data).includes('suspended'));
});
test('creator profiles publish only public facts, not member identities',async()=>{
 const res=await call('/api/v1/creators/FiXtUrE');
 assert.equal(res.status,200);
 assert.deepEqual((await res.json()).creator,{handle:'fixture',displayName:'Fixture Creator',publishedProjects:4});
 for(const name of ['suspended','unknown','system'])assert.equal((await call('/api/v1/creators/'+name)).status,404);
});
test('creator-filtered projects obey established visibility and cursor semantics',async()=>{
 assert.deepEqual((await body('/api/v1/projects?creator=fixture')).items.map(x=>x.id),['a','g','h','i']);
 assert.deepEqual((await body('/api/v1/projects?creator=FiXtUrE&category=games')).items.map(x=>x.id),['h']);
 assert.deepEqual((await body('/api/v1/projects?creator=suspended')).items,[]);
 assert.deepEqual((await body('/api/v1/projects?creator=fixture&limit=2&cursor=g')).items.map(x=>x.id),['h','i']);
});
test('creator search escapes wildcards and validates untrusted inputs',async()=>{
 assert.equal((await body('/api/v1/creators?q=Fixture')).count,1);
 assert.equal((await body('/api/v1/creators?q=%25')).count,0);
 assert.equal((await body('/api/v1/creators?q=_')).count,0);
 assert.equal((await body('/api/v1/creators?cursor=fixture')).count,0);
 for(const q of ['limit=0','limit=49','q=a&q=b','cursor=..','unexpected=x','q='+ 'x'.repeat(81)])
   assert.equal((await call('/api/v1/creators?'+q)).status,400,q);
 for(const q of ['creator=../../bad','creator=fixture&creator=fixture','creator=fixture+or+1=1'])
   assert.equal((await call('/api/v1/projects?'+q)).status,400,q);
 assert.equal((await call('/api/v1/creators/fixture?limit=3')).status,400);
});
test('totals count published creators, not private member registrations',async()=>{assert.deepEqual((await body('/api/v1/status')).counts,{publishedProjects:4,publishedCreators:1});});
test('unavailable features never claim to be enabled',async()=>{const f=(await body('/api/v1/status')).features;for(const x of ['accounts','publishing','voting','xp','community'])assert.equal(f[x],false);});
test('pagination returns no duplicates and uses an exclusive cursor',async()=>{const a=await body('/api/v1/projects?limit=2');assert.equal(a.nextCursor,'g');const b=await body('/api/v1/projects?limit=2&cursor=g');assert.deepEqual([...a.items,...b.items].map(x=>x.id),['a','g','h','i']);assert.equal(b.nextCursor,null);});
test('recent public project feed is chronological with exclusive stable published-at/id pagination',async()=>{
 const catalogue=(await body('/api/v1/projects')).items;
 const expected=[...catalogue].sort((a,b)=>
   (Date.parse(b.publishedAt||'')||0)-(Date.parse(a.publishedAt||'')||0)||b.id.localeCompare(a.id));
 const first=await body('/api/v1/projects?sort=new&limit=2');
 assert.equal(first.items.length,2);
 assert.ok(first.nextCursor);
 const second=await body('/api/v1/projects?sort=new&limit=2&cursor='+encodeURIComponent(first.nextCursor));
 assert.deepEqual([...first.items,...second.items].map(x=>x.id),expected.map(x=>x.id));
 assert.equal(new Set([...first.items,...second.items].map(x=>x.id)).size,catalogue.length);
 assert.equal(second.nextCursor,null);
 assert.deepEqual((await body('/api/v1/projects?sort=new&category=games')).items.map(x=>x.id),['h']);
 for(const q of ['sort=popular','sort=recent','sort=new&sort=new','sort=new&cursor=../../private'])
   assert.equal((await call('/api/v1/projects?'+q)).status,400,q);
});
test('category filter is applied in SQL',async()=>{assert.deepEqual((await body('/api/v1/projects?category=games')).items.map(x=>x.id),['h']);});
test('free-only discovery is SQL-backed and combines with category, search and cursor',async()=>{
 assert.deepEqual((await body('/api/v1/projects?free=1')).items.map(x=>x.id),['a','h','i']);
 assert.deepEqual((await body('/api/v1/projects?category=tools&free=1')).items.map(x=>x.id),['a','i']);
 assert.deepEqual((await body('/api/v1/projects?free=1&cursor=a')).items.map(x=>x.id),['h','i']);
 assert.deepEqual((await body('/api/v1/projects?free=1&q=%25')).items,[]);
 assert.deepEqual((await body('/api/v1/projects?limit=2&free=1')).items.map(x=>x.id),['a','h']);
 assert.equal((await body('/api/v1/projects?limit=2&free=1')).nextCursor,'h');
 assert.deepEqual((await body('/api/v1/projects')).items.map(x=>x.id),['a','g','h','i']);
 for(const q of ['free=0','free=true','free=','free=1&free=1','free=2']) assert.equal((await call('/api/v1/projects?'+q)).status,400,q);
 assert.equal((await call('/api/v1/categories?free=1')).status,400);
 assert.equal((await call('/api/v1/creators?free=1')).status,400);
});

test('search treats percent as literal, not wildcard',async()=>{assert.deepEqual((await body('/api/v1/projects?q=%25')).items.map(x=>x.id),['g']);});
test('search treats underscore as literal, not wildcard',async()=>{assert.deepEqual((await body('/api/v1/projects?q=_')).items.map(x=>x.id),['h']);});
test('SQL injection string remains bound data',async()=>{assert.equal((await body('/api/v1/projects?q='+encodeURIComponent("' OR 1=1 --"))).count,0);});
test('public DTO omits private ids and admin flags',async()=>{const p=(await body('/api/v1/projects')).items[0];for(const k of ['owner_member_id','member_id','is_staff','status'])assert.ok(!Object.hasOwn(p,k));});
test('detail retains plain-text content and removes unsafe launch URL',async()=>{const p=(await body('/api/v1/projects/i')).item;assert.ok(p.description.includes('<script>'));assert.equal(p.demoUrl,null);});
test('every hidden detail produces 404',async()=>{for(const id of ['b','c','d','e','f','unknown'])assert.equal((await call('/api/v1/projects/'+id)).status,404);});
test('HEAD mirrors success status and has no body',async()=>{for(const p of ['/health','/api/v1/status','/api/v1/categories','/api/v1/projects','/api/v1/projects/a','/api/v1/creators','/api/v1/creators/fixture']){const r=await call(p,'HEAD');assert.equal(r.status,200);assert.equal(await r.text(),'');}});
test('missing and broken database are unavailable, not zero projects',async()=>{assert.equal((await call('/health','GET',{})).status,503);const bad={COMMUNITY_DB:{prepare(){throw new Error('secret internal password')}}};const r=await call('/api/v1/projects','GET',bad);assert.equal(r.status,503);assert.ok(!(await r.text()).includes('password'));});
test('failed D1 result status is rejected',async()=>{assert.equal((await call('/api/v1/projects','GET',{COMMUNITY_DB:{prepare(){return{bind(){return this},all:async()=>({success:false,results:[]})}}}})).status,503);});
test('invalid, unknown and repeated query values return 400',async()=>{for(const q of ['limit=0','limit=49','limit=1.5','limit=1e1','limit=NaN','category=bad','q=a&q=b','other=x','cursor=%3Cscript%3E','q='+ 'x'.repeat(101)])assert.equal((await call('/api/v1/projects?'+q)).status,400,q);});
test('writes have an Allow header and cannot reach D1',async()=>{const r=await call('/api/v1/projects','POST',{COMMUNITY_DB:{prepare(){assert.fail('write queried database')}}});assert.equal(r.status,405);assert.equal(r.headers.get('allow'),'GET, HEAD');});
test('legacy, unknown and malformed routes do not exist',async()=>{for(const p of ['/command/rhen','/studio','/api/auth/sign-in','/api/v1/projects/a/b','/api/v1/projects/%3Cscript%3E'])assert.equal((await call(p)).status,404);});
test('cross-origin credentials are not enabled by the API',async()=>{const r=await call('/api/v1/projects');assert.equal(r.headers.get('access-control-allow-origin'),null);assert.equal(r.headers.get('cache-control'),'no-store');});
test('only acceptable public HTTPS links are emitted',()=>{for(const x of ['javascript:alert(1)','http://example.com','https://a:b@example.com','https://127.1','https://10.0.0.1','https://[::1]','https://localhost','https://app.local','https://example.com:8443','https://example.com?token=secret'])assert.equal(safePublicUrl(x),null,x);assert.equal(safePublicUrl('https://github.com/anevum/anevum-web'),'https://github.com/anevum/anevum-web');});
test('frontend contains no sample profile or synthetic count data',async()=>{const r=await runtime.fetch(new Request('https://next.anevum.com'),env);const t=await r.text();assert.ok(t.includes('ANEVUM V1 / IN DEVELOPMENT'));for(const s of ['View demo profile','const p=[','Illustrative projects','stellarfox'])assert.ok(!t.includes(s),s);});
test('frontend uses external scripts and styles with restrictive CSP',async()=>{const r=await runtime.fetch(new Request('https://next.anevum.com'),env);const t=await r.text();assert.ok(t.includes('src="/client.mjs"'));assert.ok(t.includes('href="/styles.css"'));const csp=r.headers.get('content-security-policy');assert.ok(csp.includes("script-src 'self'"));assert.ok(!csp.includes('unsafe-inline'));});
test('runtime assets and HEAD behavior remain intact',async()=>{for(const p of ['/assets/hero.webp','/styles.css','/client.mjs','/robots.txt']){const r=await runtime.fetch(new Request('https://next.anevum.com'+p),env);assert.equal(r.status,200,p);assert.ok((await r.arrayBuffer()).byteLength>10);const h=await runtime.fetch(new Request('https://next.anevum.com'+p,{method:'HEAD'}),env);assert.equal(await h.text(),'');}});
test('runtime refuses unknown paths and writes',async()=>{assert.equal((await runtime.fetch(new Request('https://next.anevum.com/assets/unknown.webp'),env)).status,404);const r=await runtime.fetch(new Request('https://next.anevum.com/',{method:'POST'}),env);assert.equal(r.status,405);});
