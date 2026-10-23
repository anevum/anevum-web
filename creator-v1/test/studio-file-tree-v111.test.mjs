import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
const ORIGIN='https://a.anevum.com',ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ROOT='/api/v1/member/studio/projects/'+ID+'/files';
const migration=n=>readFileSync(new URL('../canonical-auth/migrations/'+n,import.meta.url),'utf8');
const person={id:'w111-alice',name:'Alice',email:'alice@fixture.invalid',emailVerified:true};
const other={id:'w111-bob',name:'Bob',email:'bob@fixture.invalid',emailVerified:true};
function setup({enabled=true,migrated=true}={}){
 const f=fixture();f.db.exec(migration('0008_private_creator_studio.sql'));f.db.exec(migration('0009_private_review_snapshots.sql'));
 if(migrated)f.db.exec(migration('0014_private_studio_file_tree.sql'));
 for(const member of [person,other]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)').run(member.id,member.name,member.email);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)').run(member.id,member.name.toLowerCase(),member.name,100,100);
 }
 f.db.prepare("INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,description,category,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
  .run(ID,person.id,'cccccccc-cccc-4ccc-8ccc-cccccccccccc','w111-project','W111 Project','Private test project for source files','','games',100,100);
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true',CANONICAL_STUDIO_FILE_TREE_V111:enabled?'true':'false'};
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  const cookie=headers.get('cookie')||'';
  const found=cookie.includes('w111-alice')?person:cookie.includes('w111-bob')?other:null;
  return found?{user:found,session:{id:'synthetic'}}:null;
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
test('W111 browser client uses the same canonical UUID shape as actual Studio project IDs',()=>{
 const client=readFileSync(new URL('../web/src/lib/studio-files-v111.ts',import.meta.url),'utf8');
 const raw=client.match(/const UUID=\/(.+)\/;/)?.[1];
 assert.ok(raw,'Typed source client must declare an ID validator');
 const pattern=new RegExp(raw);
 for(const id of [ID,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','cccccccc-cccc-4ccc-8ccc-ccccccccccc1']){
  assert.equal(pattern.test(id),true,'V4 private project and source IDs must be accepted: '+id);
 }
 assert.equal(pattern.test('record:'+ID),false,'UI tab identifiers are not filesystem IDs');
 assert.equal(pattern.test('aaa'),false);
});
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
  assert.equal((await s.call(ROOT,'POST',{...folderRequest,name:'Different'})).status,409,'Creation idempotency must not silently accept changed request data');
  const created=await s.call(ROOT,'POST',request('intro.md','text',folder.id));assert.equal(created.status,201);
  const file=(await created.json()).node;
  assert.equal((await s.call(ROOT,'POST',request('INTRO.md','text',folder.id))).status,409);
  const saved=await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{content:'# First Signal\nHello.'}));assert.equal(saved.status,200,await saved.clone().text());
  const updated=(await saved.json()).node;assert.equal(updated.revision,2);
  assert.equal((await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{content:'Stale'}))).status,409);
  const versions=await(await s.call(ROOT+'/'+file.id+'/versions')).json();assert.deepEqual(versions.versions.map(v=>v.revision),[2,1]);
  assert.equal((await s.call(ROOT+'/'+folder.id,'PATCH',patch(folder,{deleted:true}))).status,409);
  assert.equal((await s.call(ROOT,'GET',undefined,'bob')).status,404,'Other verified member cannot list private files');
  assert.equal((await s.call(ROOT+'/'+file.id,'GET',undefined,'bob')).status,404);
  assert.equal((await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{content:'Unauthorized'}),'bob')).status,404);
  const listed=await(await s.call()).json();assert.equal(listed.nodes.length,2);
  assert.equal('content' in listed.nodes.find(x=>x.id===file.id),false,'Private file bodies must not appear in a folder listing');
  const individual=await(await s.call(ROOT+'/'+file.id)).json();
  assert.equal(individual.node.content,'# First Signal\nHello.','File GET returns selected authorized source');
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

test('W111 sibling rename collision is explicit, and parallel revision saves never overwrite',async()=>{
 const s=setup();try{
  const one=(await(await s.call(ROOT,'POST',request('intro.md'))).json()).node;
  const two=(await(await s.call(ROOT,'POST',request('other.md'))).json()).node;
  assert.equal((await s.call(ROOT+'/'+two.id,'PATCH',patch(two,{name:one.name}))).status,409);
  const results=await Promise.all([
   s.call(ROOT+'/'+one.id,'PATCH',patch(one,{content:'First writer'})),
   s.call(ROOT+'/'+one.id,'PATCH',patch(one,{content:'Second writer'}))
  ]);
  assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);
  const after=(await(await s.call(ROOT+'/'+one.id)).json()).node;
  assert.equal(after.revision,2);
  assert.ok(['First writer','Second writer'].includes(after.content));
 }finally{s.close();}
});
test('W111 aggregate source quota fails closed without corrupting previous content',async()=>{
 const s=setup();try{
  for(let i=0;i<17;i++){
   const created=await s.call(ROOT,'POST',request('file-'+i+'.md'));
   assert.equal(created.status,201,'File created '+i);
   const node=(await created.json()).node;
   const saved=await s.call(ROOT+'/'+node.id,'PATCH',patch(node,{content:'X'.repeat(32768)}));
   assert.equal(saved.status,i===16?413:200,'Aggregate quota enforced at file '+i);
   if(i===16){
    const current=(await(await s.call(ROOT+'/'+node.id)).json()).node;
    assert.equal(current.content,'','Failed save leaves original file untouched');
   }
  }
 }finally{s.close();}
});

test('W111 Trash is private metadata-only and a deleted file can be restored at an exact revision',async()=>{
 const s=setup();
 try{
  const created=await s.call(ROOT,'POST',request('draft.md'));
  assert.equal(created.status,201);
  const original=(await created.json()).node;
  const saved=await s.call(ROOT+'/'+original.id,'PATCH',patch(original,{content:'Private, preserved text'}));
  assert.equal(saved.status,200);
  const source=(await saved.json()).node;
  assert.equal((await s.call(ROOT+'/'+source.id,'PATCH',patch(source,{deleted:true,content:'Unapproved overwrite'}))).status,422);
  const removed=await s.call(ROOT+'/'+source.id,'PATCH',patch(source,{deleted:true}));
  assert.equal(removed.status,200,await removed.clone().text());
  const tombstone=(await removed.json()).node;
  assert.equal(tombstone.deletedAt!==null,true);
  assert.equal(tombstone.revision,source.revision+1);
  const active=(await(await s.call()).json()).nodes;
  assert.equal(active.find(n=>n.id===source.id),undefined);
  const trash=await s.call(ROOT+'/trash');
  assert.equal(trash.status,200);
  const deletedList=(await trash.json()).nodes;
  assert.equal(deletedList.length,1);
  assert.equal('content' in deletedList[0],false,'Trash never lists full deleted source bodies');
  assert.equal(deletedList[0].revision,tombstone.revision);
  assert.equal((await s.call(ROOT+'/trash','GET',undefined,'bob')).status,404);
  assert.equal((await s.call(ROOT+'/'+source.id+'/restore','POST',{revision:tombstone.revision},'bob')).status,404);
  assert.equal((await s.call(ROOT+'/'+source.id,'PATCH',patch(tombstone,{deleted:false}))).status,409,'Cannot rewrite tombstoned files');
  assert.equal((await s.call(ROOT+'/'+source.id+'/restore','POST',{revision:source.revision})).status,409);
  assert.equal((await s.call(ROOT+'/'+source.id+'/restore','POST',{revision:-1})).status,422);
  assert.equal((await s.call(ROOT+'/'+source.id+'/restore','GET')).status,405);
  const restored=await s.call(ROOT+'/'+source.id+'/restore','POST',{revision:tombstone.revision});
  assert.equal(restored.status,200,await restored.clone().text());
  const result=(await restored.json()).node;
  assert.equal(result.deletedAt,null);
  assert.equal(result.revision,tombstone.revision+1);
  assert.equal(result.content,'Private, preserved text');
  const versions=(await(await s.call(ROOT+'/'+source.id+'/versions')).json()).versions;
  assert.deepEqual(versions.map(v=>v.revision),[4,3,2,1]);
  assert.equal((await s.call(ROOT+'/'+source.id+'/restore','POST',{revision:tombstone.revision})).status,409,'A replay cannot change restored content');
  assert.equal((await(await s.call(ROOT+'/trash')).json()).nodes.length,0);
  assert.equal((await(await s.call()).json()).nodes.length,1);
 }finally{s.close();}
});
test('W111 folder restore order and active sibling name collisions fail closed',async()=>{
 const s=setup();
 try{
  const folder=(await(await s.call(ROOT,'POST',request('Scenes','folder'))).json()).node;
  const child=(await(await s.call(ROOT,'POST',request('intro.md','text',folder.id))).json()).node;
  const childDeleted=(await(await s.call(ROOT+'/'+child.id,'PATCH',patch(child,{deleted:true}))).json()).node;
  const folderDeleted=(await(await s.call(ROOT+'/'+folder.id,'PATCH',patch(folder,{deleted:true}))).json()).node;
  assert.equal((await s.call(ROOT+'/'+child.id+'/restore','POST',{revision:childDeleted.revision})).status,409,'Parent must be active to restore child');
  const parentRestored=await s.call(ROOT+'/'+folder.id+'/restore','POST',{revision:folderDeleted.revision});
  assert.equal(parentRestored.status,200,await parentRestored.clone().text());
  const existing=(await(await s.call(ROOT,'POST',request('intro.md','text',folder.id))).json()).node;
  assert.ok(existing.id!==child.id);
  assert.equal((await s.call(ROOT+'/'+child.id+'/restore','POST',{revision:childDeleted.revision})).status,409,'Name collision must not overwrite active file');
  assert.equal((await s.call(ROOT+'/'+existing.id,'PATCH',patch(existing,{deleted:true}))).status,200);
  const restoredChild=await s.call(ROOT+'/'+child.id+'/restore','POST',{revision:childDeleted.revision});
  assert.equal(restoredChild.status,200,await restoredChild.clone().text());
  assert.equal((await restoredChild.json()).node.parentId,folder.id);
 }finally{s.close();}
});
test('W111 Trash deletion and restoration cannot bypass review locks or member ownership',async()=>{
 const s=setup();
 try{
  const file=(await(await s.call(ROOT,'POST',request('protected.md'))).json()).node;
  s.f.db.prepare("UPDATE member_studio_projects SET status='pending_review' WHERE id=?").run(ID);
  assert.equal((await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{deleted:true}))).status,409);
  s.f.db.prepare("UPDATE member_studio_projects SET status='draft' WHERE id=?").run(ID);
  const deleted=(await(await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{deleted:true}))).json()).node;
  s.f.db.prepare("UPDATE member_studio_projects SET status='pending_review' WHERE id=?").run(ID);
  assert.equal((await s.call(ROOT+'/'+file.id+'/restore','POST',{revision:deleted.revision})).status,409);
  assert.equal((await s.call(ROOT+'/'+file.id+'/restore','POST',{revision:deleted.revision},'bob')).status,404);
  const verified=await s.call(ROOT+'/'+file.id,'GET');
  assert.equal((await verified.json()).node.deletedAt!==null,true);
 }finally{s.close();}
});
test('W111 restoring deleted files respects active storage and count quotas',async()=>{
 const s=setup();
 try{
  const first=(await(await s.call(ROOT,'POST',request('to-restore.md'))).json()).node;
  const withBody=(await(await s.call(ROOT+'/'+first.id,'PATCH',patch(first,{content:'A'.repeat(32768)}))).json()).node;
  const deleted=(await(await s.call(ROOT+'/'+first.id,'PATCH',patch(withBody,{deleted:true}))).json()).node;
  for(let i=0;i<16;i++){
   const file=(await(await s.call(ROOT,'POST',request('active-'+i+'.md'))).json()).node;
   assert.equal((await s.call(ROOT+'/'+file.id,'PATCH',patch(file,{content:'B'.repeat(32768)}))).status,200);
  }
  assert.equal((await s.call(ROOT+'/'+first.id+'/restore','POST',{revision:deleted.revision})).status,413,'Restoring cannot exceed aggregate active source quota');
  assert.equal((await(await s.call(ROOT+'/trash')).json()).nodes.length,1);
 }finally{s.close();}
});
