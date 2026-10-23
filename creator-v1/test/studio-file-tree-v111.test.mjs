import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
const ORIGIN='https://a.anevum.com',ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ROOT='/api/v1/member/studio/projects/'+ID+'/files';
const migration=n=>readFileSync(new URL('../canonical-auth/migrations/'+n,import.meta.url),'utf8');
const person={id:'w111-alice',name:'Alice',email:'alice@fixture.invalid',emailVerified:true};
function setup({enabled=true,migrated=true}={}){
 const f=fixture();f.db.exec(migration('0008_private_creator_studio.sql'));f.db.exec(migration('0009_private_review_snapshots.sql'));
 if(migrated)f.db.exec(migration('0014_private_studio_file_tree.sql'));
 f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)').run(person.id,person.name,person.email);
 f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)').run(person.id,'alice','Alice',100,100);
 f.db.prepare("INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,description,category,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
  .run(ID,person.id,'cccccccc-cccc-4ccc-8ccc-cccccccccccc','w111-project','W111 Project','Private test project for source files','','games',100,100);
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true',CANONICAL_STUDIO_FILE_TREE_V111:enabled?'true':'false'};
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  const cookie=headers.get('cookie')||'';return cookie.includes('w111-alice')?{user:person,session:{id:'synthetic'}}:null;
 }}})});
 async function call(path=ROOT,method='GET',body,who='alice',headers={}){
  const h=new Headers({'accept':'application/json',...(who?{cookie:'__Secure-anevum_can_stage.session_token=w111-'+who}:{}),
   ...(method!=='GET'?{origin:ORIGIN,'sec-fetch-site':'same-origin','content-type':'application/json'}:{}),...headers});
  return worker.fetch(new Request(ORIGIN+path,{method,headers:h,...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 }
 return{f,env,call,close:()=>f.db.close()};
}
const request=(name,kind='text',parentId=null)=>({clientRequestId:crypto.randomUUID(),name,kind,parentId});
const patch=(node,extra={})=>({revision:node.revision,name:node.name,parentId:node.parentId,content:node.content||'',deleted:false,...extra});
test('W111 is default-OFF and schema-gated before authentication',async()=>{
 const a=setup({enabled:false});try{assert.equal((await a.call()).status,404);}finally{a.close();}
 const b=setup({migrated:false});try{assert.equal((await b.call()).status,503);}finally{b.close();}
});
test('W111 folder/text creation, replay, rename, version and optimistic conflict',async()=>{
 const s=setup();try{
  assert.equal((await s.call(ROOT,'GET',undefined,null)).status,401);
  assert.equal((await s.call(ROOT,'POST',request('Folder'),'alice',{origin:'https://evil.invalid','sec-fetch-site':'cross-site'})).status,403);
  const folderRequest=request('Scenes','folder');
  const first=await s.call(ROOT,'POST',folderRequest);assert.equal(first.status,201,await first.clone().text());const folder=(await first.json()).node;
  const replay=await s.call(ROOT,'POST',folderRequest);assert.equal((await replay.json()).replayed,true);
  const created=await s.call(ROOT,'POST',request('intro.md','text',folder.id));assert.equal(created.status,201);
  const file=(await created.json()).node;
  assert.equal((await s.call(ROOT,'POST',request('INTRO.md','text',folder.id))).status,409);
  const saved=await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{content:'# First Signal\nHello.'}));assert.equal(saved.status,200,await saved.clone().text());
  const updated=(await saved.json()).node;assert.equal(updated.revision,2);
  assert.equal((await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{content:'Stale'}))).status,409);
  const versions=await(await s.call(ROOT+'/'+file.id+'/versions')).json();assert.deepEqual(versions.versions.map(v=>v.revision),[2,1]);
  assert.equal((await s.call(ROOT+'/'+folder.id,'PATCH',patch(folder,{deleted:true}))).status,409);
  assert.equal((await s.call(ROOT,'GET',undefined,'bob')).status,401);
  const listed=await(await s.call()).json();assert.equal(listed.nodes.length,2);
  assert.equal(listed.nodes.find(x=>x.id===file.id).content,'# First Signal\nHello.');
 }finally{s.close();}
});
test('W111 disallows cycles, path traversal and edits during review',async()=>{
 const s=setup();try{
  assert.equal((await s.call(ROOT,'POST',request('../escape'))).status,422);
  const a=(await(await s.call(ROOT,'POST',request('A','folder'))).json()).node;
  const b=(await(await s.call(ROOT,'POST',request('B','folder',a.id))).json()).node;
  assert.equal((await s.call(ROOT+'/'+a.id,'PATCH',patch(a,{parentId:b.id}))).status,409);
  s.f.db.prepare("UPDATE member_studio_projects SET status='pending_review' WHERE id=?").run(ID);
  assert.equal((await s.call(ROOT,'POST',request('New'))).status,409);
  assert.equal((await s.call(ROOT+'/'+b.id,'PATCH',patch(b,{name:'Changed'}))).status,409);
 }finally{s.close();}
});
