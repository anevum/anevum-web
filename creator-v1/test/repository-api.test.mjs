import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import api from '../api/worker.mjs';
let sequence = 0;
function fixture(sourceOverride) {
  const sql = new DatabaseSync(':memory:');
  sql.exec(`CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,handle TEXT,display_name TEXT,status TEXT);
    CREATE TABLE projects(id TEXT PRIMARY KEY,slug TEXT,title TEXT,summary TEXT,category TEXT,source_url TEXT,demo_url TEXT,free_to_use INTEGER,license_name TEXT,published_at TEXT,owner_member_id TEXT,status TEXT,description TEXT,ai_disclosure TEXT,human_contribution TEXT);
    INSERT INTO creator_profiles VALUES('active','maker','Maker','active'),('suspended','hidden','Hidden','suspended');`);
  const source = sourceOverride ?? 'https://github.com/maker/project-' + (++sequence);
  const insert = sql.prepare("INSERT INTO projects VALUES(?,?,?,'A real test fixture','tools',?,'https://app.example.org',1,'MIT',?,?,?,'Description','AI used','Reviewed by human')");
  for (const [id,owner,status,at] of [['public','active','published','2020-01-01'],['draft','active','draft','2020-01-01'],['suspended','suspended','published','2020-01-01'],['future','active','published','2999-01-01'],['undated','active','published',null],['archived','active','archived','2020-01-01']]) insert.run(id,id,id,source,at,owner,status);
  let dbReads = 0;
  const env = { COMMUNITY_DB: { prepare(query) {
    dbReads++; const stmt = sql.prepare(query);let args=[];
    return { bind(...values) {args=values;return this;}, async all() {return {success:true,results:stmt.all(...args)};} };
  } } };
  const call=(id='public',method='GET',query='')=>api.fetch(new Request('https://anevum.com/api/v1/projects/'+id+'/repository'+query,{method,headers:{Authorization:'Bearer visitor-secret',Cookie:'private=visitor'}}),env);
  const payload=(extra={})=>({private:false,full_name:new URL(source).pathname.slice(1).replace(/\.git$/,''),html_url:source.replace(/\.git$/,''),description:'A public repository.',language:'JavaScript',license:{spdx_id:'MIT'},archived:false,...extra});
  return {sql,source,env,call,payload,reads:()=>dbReads};
}
function remote(t,handler) { return t.mock.method(globalThis,'fetch',handler); }
test('repository route reads only public GitHub metadata and forwards no visitor secrets',async t=>{
  const f=fixture();t.after(()=>f.sql.close());
  const fetch=remote(t,async(url,opts)=>{
    assert.equal(url,'https://api.github.com/repos'+new URL(f.source).pathname);
    assert.equal(opts.redirect,'error');assert.equal(opts.credentials,'omit');assert.ok(opts.signal);
    for(const key of ['Authorization','Cookie','authorization','cookie'])assert.equal(opts.headers[key],undefined);
    return Response.json(f.payload({owner:{email:'not-for-output'},default_branch:'main',stargazers_count:99}));
  });
  const r=await f.call();assert.equal(r.status,200);const {repository}=await r.json();
  assert.equal(repository.ownershipVerified,false);assert.equal(repository.sourceUrl,f.source);assert.equal(repository.license,'MIT');
  for(const key of ['owner','email','default_branch','stargazers_count','accessToken'])assert.equal(key in repository,false);
  assert.equal(fetch.mock.callCount(),1);assert.equal(r.headers.get('cache-control'),'no-store');
});
test('hidden, future, suspended, archived and missing projects never contact GitHub',async t=>{
  const f=fixture();t.after(()=>f.sql.close());const fetch=remote(t,()=>assert.fail('must not fetch'));
  for(const id of ['draft','suspended','future','undated','archived','missing'])assert.equal((await f.call(id)).status,404,id);
  assert.equal(fetch.mock.callCount(),0);
});
test('caller cannot substitute a URL or request a repo by query parameter',async t=>{
  const f=fixture();t.after(()=>f.sql.close());const fetch=remote(t,()=>assert.fail('must not fetch'));
  assert.equal((await f.call('public','GET','?url=https://evil.org')).status,400);
  assert.equal((await f.call('public','GET','?q=x')).status,400);assert.equal(fetch.mock.callCount(),0);assert.equal(f.reads(),0);
});
test('invalid repository links fail without outbound calls',async t=>{
  remote(t,()=>assert.fail('must not fetch'));
  for(const source of ['https://github.com.evil.org/a/b','http://github.com/a/b','https://x:secret@github.com/a/b','https://github.com/a/b?token=secret','https://github.com/a/b#README','https://github.com/a/b/tree/main','https://127.1/x','https://anevum.com/app','javascript:alert(1)','https://github.com/a/b\\c']){
    const f=fixture(source);try {assert.equal((await f.call()).status,422,source);}finally{f.sql.close();}
  }
});
test('git suffix and trailing slash are normalized before one public repo request',async t=>{
  const f=fixture('https://github.com/maker/suffix-test.git/');t.after(()=>f.sql.close());
  remote(t,async(url)=>{assert.equal(url,'https://api.github.com/repos/maker/suffix-test');return Response.json(f.payload({full_name:'maker/suffix-test',html_url:'https://github.com/maker/suffix-test'}));});
  assert.equal((await f.call()).status,200);
});
test('private or mismatching responses do not create a trusted repository record',async t=>{
  let p;remote(t,async()=>Response.json(p));
  for(const extra of [{private:true},{full_name:'other/repo'},{html_url:'https://evil.org/a/b'},{html_url:null},{private:undefined}]){
    const f=fixture();p=f.payload(extra);try{const r=await f.call();assert.equal(r.status,503);assert.ok(!(await r.text()).includes('other/repo'));}finally{f.sql.close();}
  }
});
test('upstream errors and thrown secrets are not exposed',async t=>{
  const f=fixture();t.after(()=>f.sql.close());let mode=0;
  remote(t,async()=>{if(mode++===0)return new Response('secret upstream body',{status:429});throw Error('upstream access_token=private');});
  for(let i=0;i<2;i++){const current=i===0?f:fixture();try{const r=await current.call();assert.equal(r.status,503);assert.equal(r.headers.get('retry-after'),'60');assert.doesNotMatch(await r.text(),/private|access_token|upstream body/);}finally{if(current!==f)current.sql.close();}}
});
test('non-JSON, malformed JSON and oversized metadata are rejected',async t=>{
  let response;remote(t,async()=>response);
  for(const r of [new Response('<html>login</html>',{headers:{'Content-Type':'text/html'}}),new Response('{',{headers:{'Content-Type':'application/json'}}),Response.json({description:'x'.repeat(33000)})]){
    response=r;const f=fixture();try{assert.equal((await f.call()).status,503);}finally{f.sql.close();}
  }
});
test('successful cache hits recheck project visibility on every request',async t=>{
  const f=fixture();t.after(()=>f.sql.close());const fetch=remote(t,async()=>Response.json(f.payload()));
  assert.equal((await f.call()).status,200);assert.equal((await f.call()).status,200);assert.equal(fetch.mock.callCount(),1);assert.equal(f.reads(),2);
  f.sql.prepare("UPDATE projects SET status='draft' WHERE id='public'").run();assert.equal((await f.call()).status,404);assert.equal(fetch.mock.callCount(),1);assert.equal(f.reads(),3);
});
test('metadata is bounded plain data and missing license is not declared open source',async t=>{
  const f=fixture();t.after(()=>f.sql.close());remote(t,async()=>Response.json(f.payload({description:'<script>alert(1)</script>\n'+'x'.repeat(600),language:{unsafe:true},license:{spdx_id:'NOASSERTION'},archived:true})));
  const {repository}=await (await f.call()).json();assert.equal(repository.description.length,500);assert.ok(repository.description.startsWith('<script>'));
  assert.equal(repository.language,null);assert.equal(repository.license,null);assert.equal(repository.archived,true);assert.equal(repository.ownershipVerified,false);
});
test('HEAD returns no body and mutations remain disabled before database or network',async t=>{
  const f=fixture();t.after(()=>f.sql.close());const fetch=remote(t,async()=>Response.json(f.payload()));
  const r=await f.call('public','HEAD');assert.equal(r.status,200);assert.equal(await r.text(),'');const count=f.reads();
  for(const method of ['POST','PUT','DELETE']){const r=await f.call('public',method);assert.equal(r.status,405);assert.equal(r.headers.get('allow'),'GET, HEAD');}
  assert.equal(f.reads(),count);assert.equal(fetch.mock.callCount(),1);
});
test('existing catalogue remains read-only and its counts and details are unchanged',async t=>{
  const f=fixture();t.after(()=>f.sql.close());remote(t,()=>assert.fail('status/list must not fetch metadata'));
  const result=await api.fetch(new Request('https://anevum.com/api/v1/status'),f.env);const data=await result.json();
  assert.deepEqual(data.counts,{publishedProjects:1,publishedCreators:1});assert.equal(data.features.repositoryMetadata,true);
  for(const key of ['accounts','publishing','voting','xp','community'])assert.equal(data.features[key],false);
  const list=await (await api.fetch(new Request('https://anevum.com/api/v1/projects'),f.env)).json();assert.deepEqual(list.items.map(x=>x.id),['public']);
  const detail=await (await api.fetch(new Request('https://anevum.com/api/v1/projects/public'),f.env)).json();assert.equal(detail.item.description,'Description');
});
test('existing zero-dependency builder can flatten the modified API',()=>{
  const context=readFileSync(new URL('../shared/community-post-context.mjs',import.meta.url),'utf8').replace(/^export /gm,'');
  const showcase=readFileSync(new URL('../shared/public-showcase.mjs',import.meta.url),'utf8').replace(/^export /gm,'');
  const source=readFileSync(new URL('../api/worker.mjs',import.meta.url),'utf8');
  // Both approved self-contained public modules are flattened by the builder.
  assert.deepEqual(source.match(/^import .*$/gm),[
    "import {communityContextEnabled,communityPostFrom,communityContextFields,communityProjectDto} from '../shared/community-post-context.mjs';",
    "import {readPublicShowcases} from '../shared/public-showcase.mjs';"
  ]);
  assert.doesNotMatch(showcase,/^import /m);
  const text=context+'\n'+showcase+'\n'+source.replace(/^import .*;\n/gm,'').replace('export function safePublicUrl','function safePublicUrl').replace('export default {','const api = {');
  assert.doesNotMatch(text,/^import /m);assert.doesNotMatch(text,/^export /m);
  assert.equal(new Function(text+'; return typeof api.fetch;')(),'function');
});

test('upstream failures use a short bounded cooldown instead of repeated external calls',async t=>{
  const f=fixture();t.after(()=>f.sql.close());const fetch=remote(t,async()=>new Response('',{status:429}));
  assert.equal((await f.call()).status,503);assert.equal((await f.call()).status,503);
  assert.equal(fetch.mock.callCount(),1);assert.equal(f.reads(),2);
});
