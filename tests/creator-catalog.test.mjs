import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {catalogEndpoint,validateProject,sourceURL,liveURL,boundedJSON,catalogSchemaReady,importRepository} from '../src/server/creator-catalog.mjs';
const migration=readFileSync(new URL('../migrations-catalog/0001_creator_catalog.sql',import.meta.url),'utf8');
const alice={id:'member-alice',emailVerified:true},bob={id:'member-bob',emailVerified:true};
const project={creator:'Test maker',title:'Small timer',summary:'A small locally running focus timer.',description:'A synthetic test project, never published to production.',category:'TOOL',sourceUrl:'https://github.com/maker/timer',liveUrl:'https://timer.example.org/',license:'MIT',previewEnabled:true};
function fixture() {
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON; CREATE TABLE user(id TEXT PRIMARY KEY); CREATE TABLE existing_members(id INTEGER PRIMARY KEY,value TEXT); INSERT INTO existing_members VALUES(1,\'keep me\');');
  for(const user of [alice,bob]) sql.prepare('INSERT INTO user VALUES(?)').run(user.id);
  sql.exec(migration);
  const prepare=(query,args=[])=>({query,args,bind(...values){return prepare(query,values);},
    async all(){return {results:sql.prepare(query).all(...args)};},
    async first(){return sql.prepare(query).get(...args)||null;},
    async run(){const result=sql.prepare(query).run(...args);return {meta:{changes:Number(result.changes)}};}});
  const db={prepare,async batch(statements){sql.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
  const env={MEMBER_DB:db,ANEVUM_CATALOG_ENABLED:'true',ANEVUM_CATALOG_PUBLISH_ENABLED:'true'};
  async function call(path,method='GET',data,user=alice,extra={}) {
    const headers={};if(user)headers['X-ANEVUM-EXPECTED-MEMBER-ID']=user.id;
    if(data!==undefined)headers['Content-Type']='application/json';
    const response=await catalogEndpoint(new Request('https://anevum.com/api/catalog'+path,{method,headers,...(data!==undefined?{body:JSON.stringify(data)}:{})}),env,{user,...extra});
    return {status:response.status,body:await response.json(),headers:response.headers};
  }
  const create=async()=>{const r=await call('/mine','POST',project);assert.equal(r.status,201);return r.body.project;};
  async function publish(p){assert.equal((await call(`/mine/${p.id}/submit`,'POST',{expectedRevision:p.revision,rightsConfirmed:true})).status,200);assert.equal((await call(`/review/${p.id}`,'POST',{expectedRevision:p.revision+1,decision:'PUBLISHED',note:'Synthetic test review.'},bob,{reviewer:true})).status,200);}
  return {sql,db,env,call,create,publish};
}
test('additive schema is idempotent and preserves existing records',async()=>{const f=fixture();f.sql.exec(migration);assert.equal(f.sql.prepare('SELECT value FROM existing_members').get().value,'keep me');assert.equal(await catalogSchemaReady(f.db),true);assert.deepEqual(f.sql.prepare('PRAGMA foreign_key_check').all(),[]);});
test('URL normalization rejects credentials, active schemes, local endpoints and own origins',()=>{
  assert.equal(sourceURL('https://github.com/maker/timer.git'),'https://github.com/maker/timer');
  for(const url of ['javascript:alert(1)','http://github.com/a/b','https://github.com.evil.org/a/b','https://x:secret@github.com/a/b','https://github.com/a/b?token=x','https://github.com/a/b/tree/main','https://github.com/a/b#readme','https://github.com/a/b\\c'])assert.equal(sourceURL(url),false,url);
  for(const url of ['javascript:alert(1)','data:text/html,test','http://app.example.org','https://localhost','https://127.0.0.1','https://2130706433','https://[::1]','https://app.local','https://anevum.com','https://app.anevum.com','https://x:y@app.example.org','https://app.example.org?api_key=x','https://app.example.org/#secret'])assert.equal(liveURL(url),false,url);
  assert.equal(liveURL('https://timer.example.org'), 'https://timer.example.org/');
});
test('project validation rejects client ownership, public status and malformed shape',()=>{
  assert.ok(validateProject(project));
  for(const extra of [{owner_id:bob.id},{status:'PUBLISHED'},{revision:999},{userId:bob.id}])assert.equal(validateProject({...project,...extra}),null);
  assert.equal(validateProject({...project,sourceUrl:'',liveUrl:''}),null);
  assert.equal(validateProject({...project,sourceUrl:'',liveUrl:'',previewEnabled:false}),null);
  assert.equal(validateProject({...project,sourceUrl:'https://github.com/maker/timer',liveUrl:'',previewEnabled:true}),null);
  assert.equal(validateProject({...project,summary:'x'.repeat(301)}),null);
  assert.equal(validateProject({...project,expectedRevision:0},true),null);
});
test('body reader is byte bounded and rejects arrays and invalid JSON',async()=>{
  const request=body=>new Request('https://anevum.com',{method:'POST',headers:{'Content-Type':'application/json'},body});
  assert.equal(await boundedJSON(request('[]')),null);assert.equal(await boundedJSON(request('{')),null);
  assert.equal(await boundedJSON(request(JSON.stringify({text:'x'.repeat(200)})),100),null);
  assert.deepEqual(await boundedJSON(request('{"ok":true}')),{ok:true});
});
test('new drafts are private, owner-scoped and absent from public detail',async()=>{
  const f=fixture(),p=await f.create();assert.equal(p.status,'DRAFT');
  assert.deepEqual((await f.call('/projects','GET',undefined,null)).body.projects,[]);
  assert.equal((await f.call('/projects/'+p.id,'GET',undefined,null)).status,404);
  assert.equal((await f.call('/mine','GET',undefined,bob)).body.projects.length,0);
  assert.equal((await f.call('/mine/'+p.id,'PUT',{...project,expectedRevision:1},bob)).status,404);
  assert.equal((await f.call('/mine/'+p.id,'DELETE',{expectedRevision:1},bob)).status,404);
});
test('anonymous and unverified identities cannot access drafts',async()=>{const f=fixture();assert.equal((await f.call('/mine','GET',undefined,null)).status,401);assert.equal((await f.call('/mine','POST',project,{...alice,emailVerified:false})).status,401);});
test('stale account hints reject writes, and query IDs cannot select another member',async()=>{
  const f=fixture();const req=new Request('https://anevum.com/api/catalog/mine',{method:'POST',headers:{'Content-Type':'application/json','X-ANEVUM-EXPECTED-MEMBER-ID':bob.id},body:JSON.stringify(project)});
  assert.equal((await catalogEndpoint(req,f.env,{user:alice})).status,409);
  assert.equal((await f.call('/mine?owner_id=member-bob')).status,400);
});
test('submission requires rights confirmation and publishing requires independent reviewer',async()=>{
  const f=fixture(),p=await f.create();
  assert.equal((await f.call(`/mine/${p.id}/submit`,'POST',{expectedRevision:1,rightsConfirmed:false})).status,400);
  assert.equal((await f.call(`/mine/${p.id}/submit`,'POST',{expectedRevision:1,rightsConfirmed:true})).status,200);
  assert.equal((await f.call(`/review/${p.id}`,'POST',{expectedRevision:2,decision:'PUBLISHED',note:'Not authorized.'})).status,403);
  assert.equal((await f.call('/review')).status,403);
  assert.equal((await f.call(`/review/${p.id}`,'POST',{expectedRevision:2,decision:'PUBLISHED',note:'Synthetic review only.'},bob,{reviewer:true})).status,200);
  const r=await f.call('/projects/'+p.id,'GET',undefined,null);assert.equal(r.status,200);assert.equal(r.body.project.repositoryOwnership,'UNVERIFIED_LINK');
  for(const key of ['owner_id','ownerId','email','status','rights_confirmed'])assert.equal(key in r.body.project,false);
});
test('editing published content withdraws it and requires new review; stale edits fail',async()=>{
  const f=fixture(),p=await f.create();await f.publish(p);
  assert.equal((await f.call(`/mine/${p.id}`,'PUT',{...project,title:'Changed project',expectedRevision:1})).status,409);
  assert.equal((await f.call(`/mine/${p.id}`,'PUT',{...project,title:'Changed project',expectedRevision:3})).status,200);
  assert.equal((await f.call('/projects/'+p.id,'GET',undefined,null)).status,404);
  const own=(await f.call('/mine')).body.projects[0];assert.equal(own.status,'DRAFT');assert.equal(own.rightsConfirmed,false);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_project_events WHERE project_id=?').get(p.id).n,4);
});
test('failed optimistic mutations do not create audit entries',async()=>{
  const f=fixture(),p=await f.create();assert.equal((await f.call(`/mine/${p.id}`,'PUT',{...project,expectedRevision:99})).status,409);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_project_events').get().n,1);
});
test('library saves are idempotent, private, and disappear when publication is withdrawn',async()=>{
  const f=fixture(),p=await f.create();assert.equal((await f.call('/library/'+p.id,'PUT',{},bob)).status,404);await f.publish(p);
  for(let i=0;i<2;i++)assert.equal((await f.call('/library/'+p.id,'PUT',{},bob)).status,200);
  assert.equal((await f.call('/library','GET',undefined,bob)).body.projects.length,1);assert.equal((await f.call('/library')).body.projects.length,0);
  assert.equal((await f.call(`/mine/${p.id}/withdraw`,'POST',{expectedRevision:3})).status,200);
  assert.equal((await f.call('/library','GET',undefined,bob)).body.projects.length,0);
  assert.equal((await f.call('/library/'+p.id,'DELETE',{},bob)).status,200);
});
test('export is scoped and project deletion cascades saves and audit',async()=>{
  const f=fixture(),p=await f.create();await f.publish(p);await f.call('/library/'+p.id,'PUT',{},bob);
  assert.equal((await f.call('/export')).body.projects.length,1);assert.equal((await f.call('/export','GET',undefined,bob)).body.projects.length,0);
  assert.equal((await f.call('/export','GET',undefined,bob)).body.savedProjects.length,1);
  assert.equal((await f.call('/mine/'+p.id,'DELETE',{expectedRevision:3})).status,200);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_library').get().n,0);assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_project_events').get().n,0);
});
test('account deletion cascades catalog data without affecting other members',async()=>{
  const f=fixture(),p=await f.create();await f.publish(p);await f.call('/library/'+p.id,'PUT',{},bob);f.sql.prepare('DELETE FROM user WHERE id=?').run(alice.id);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_projects').get().n,0);assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_project_events').get().n,0);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_library').get().n,0);assert.equal(f.sql.prepare('SELECT id FROM user').get().id,bob.id);assert.deepEqual(f.sql.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('both rollout flags fail closed and public publish can be disabled independently',async()=>{
  const f=fixture(),p=await f.create();await f.publish(p);f.env.ANEVUM_CATALOG_PUBLISH_ENABLED='false';
  assert.equal((await f.call('/projects','GET',undefined,null)).body.projects.length,0);assert.equal((await f.call('/projects/'+p.id,'GET',undefined,null)).status,404);
  f.env.ANEVUM_CATALOG_ENABLED='false';assert.equal((await f.call('/mine')).status,503);assert.equal((await f.call('/status','GET',undefined,null)).body.available,false);
});
test('per-member minute limiter cannot be bypassed by invalid mutations',async()=>{
  const f=fixture();for(let i=0;i<20;i++)assert.equal((await f.call('/mine','POST',{})).status,400);
  const r=await f.call('/mine','POST',project);assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'60');assert.equal((await f.call('/mine','POST',project,bob)).status,201);
});
test('project quota is enforced atomically without growing the audit on rejection',async()=>{
  const f=fixture();for(let i=0;i<25;i++){f.sql.exec('DELETE FROM creator_mutation_limits');await f.create();}
  f.sql.exec('DELETE FROM creator_mutation_limits');assert.equal((await f.call('/mine','POST',project)).status,409);assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM creator_project_events').get().n,25);
});
test('search is bounded, escapes SQL wildcard literals, and rejects unexpected query fields',async()=>{
  const f=fixture(),p=await f.create();await f.publish(p);assert.equal((await f.call('/projects?q=timer','GET',undefined,null)).body.projects.length,1);
  assert.equal((await f.call('/projects?q=%25','GET',undefined,null)).body.projects.length,0);
  for(const q of ['?category=EVIL','?owner_id=member-alice','?offset=-1','?q=x&q=y','?offset=99999'])assert.equal((await f.call('/projects'+q,'GET',undefined,null)).status,400);
});
test('GitHub metadata import never forwards credentials or fetches an app URL',async()=>{
  let calls=0;
  const result=await importRepository(project.sourceUrl,async(url,options)=>{
    calls++;assert.equal(url,'https://api.github.com/repos/maker/timer');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,undefined);
    return Response.json({private:false,full_name:'maker/timer',name:'timer',description:'A public timer.',html_url:project.sourceUrl,homepage:project.liveUrl,license:{spdx_id:'MIT'}});
  });assert.equal(calls,1);assert.equal(result.ownership,'UNVERIFIED_LINK');assert.equal(result.liveUrl,project.liveUrl);
  assert.equal(await importRepository('https://evil.org/repo',()=>{throw Error('must not fetch');}),null);
});
test('GitHub private, redirected and malformed responses cannot create a trusted import',async()=>{
  for(const data of [{private:true},{private:false,full_name:'different/repo'},{private:false,full_name:'maker/timer',html_url:'javascript:alert(1)'}])assert.equal(await importRepository(project.sourceUrl,async()=>Response.json(data)),null);
  const f=fixture();const r=await f.call('/import','POST',{sourceUrl:project.sourceUrl},alice,{fetchImpl:async()=>new Response('',{status:429})});assert.equal(r.status,422);
});
