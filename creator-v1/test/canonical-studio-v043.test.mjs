// ANEVUM V043 offline canonical Creator Studio acceptance.
// Synthetic SQLite, fake private R2; NO actual accounts, payments or live Worker.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {canonicalStudioSchemaReady,canonicalStudioExport} from '../canonical-auth/studio.mjs';
const ORIGIN='https://a.anevum.com',ROOT='/api/v1/member/studio/projects';
const migration=readFileSync(new URL('../canonical-auth/migrations/0008_private_creator_studio.sql',import.meta.url),'utf8');
const alice={id:'pilot-alice',name:'Alice',email:'alice@fixture.invalid',emailVerified:true};
const bob={id:'pilot-bob',name:'Bob',email:'bob@fixture.invalid',emailVerified:true};
const draft={
 slug:'signal-001',title:'Signal 001',summary:'A real interactive test created for staging',
 description:'Receiver puzzle and transmission archive',category:'games',freeToUse:true,
 license:'MIT',sourceUrl:'https://github.com/anevum/anevum-web',demoUrl:null,
 aiDisclosure:'Some coding assistance was used',humanContribution:'Design and gameplay by Alice'
};
const j=async r=>r.json();
const methodHeaders=m=>(m==='GET'||m==='HEAD')?{}:{origin:ORIGIN,'sec-fetch-site':'same-origin'};
function setup({enabled=true,migrate=true,uploads=false}={}){
 const f=fixture();
 if(migrate)f.db.exec(migration);
 for(const person of [alice,bob]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(person.id,person.name,person.email);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(person.id,person.id==='pilot-alice'?'alice':'bob',person.name,100,100);
 }
 const objects=new Map();
 const store={
  async get(k){if(!objects.has(k))return null;const b=objects.get(k);return {size:b.byteLength,body:new Blob([b]).stream()};},
  async put(k,b){objects.set(k,new Uint8Array(b));},
  async delete(k){objects.delete(k);}
 };
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:enabled?'true':'false',
  CANONICAL_CREATOR_UPLOADS_ENABLED:uploads?'true':'false',CREATOR_ASSETS:uploads?store:undefined,
  CANONICAL_STUDIO_REVIEWER_IDS:'pilot-bob',
  CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS:uploads?'pilot-alice,pilot-bob':''};
 let sessions=0;
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  sessions++;
  const who=(headers.get('cookie')||'').includes('pilot-alice')?alice:
   (headers.get('cookie')||'').includes('pilot-bob')?bob:null;
  return who?{user:who,session:{id:'synthetic'}}:null;
 }}})});
 async function call(route=ROOT,method='GET',who='alice',payload,extra={}){
  const h=new Headers({'accept':'application/json',...methodHeaders(method),
    ...(who?{cookie:'__Secure-anevum_can_stage.session_token=pilot-'+who}:{}),
    ...(extra.headers||{})});
  let data=payload;
  if(payload!==undefined && !(payload instanceof Uint8Array) && !(payload instanceof ArrayBuffer)){
   data=JSON.stringify(payload);h.set('content-type','application/json');
  }
  if(payload instanceof Uint8Array||payload instanceof ArrayBuffer)h.set('content-type','application/octet-stream');
  const request=new Request(extra.url||ORIGIN+route,{
   method,headers:h,...(payload===undefined?{}:{body:data})
  });
  return worker.fetch(request,env);
 }
 return {f,env,worker,store,objects,call,get sessions(){return sessions},
   close(){f.db.close();}};
}
const projectRequest=()=>({clientRequestId:crypto.randomUUID(),draft});
test('schema and flags are isolated; default on production/staging configs stays OFF',async()=>{
 assert.match(migration,/member_studio_assets/);
 assert.match(migration,/REFERENCES "user"\(id\) ON DELETE RESTRICT/);
 assert.doesNotMatch(migration,/INSERT INTO member_studio_projects|CREATE TABLE projects|member_xp_events/);
 const f=setup({enabled:false});
 try{
  assert.equal(await canonicalStudioSchemaReady(f.env),true);
  const r=await f.call();
  assert.equal(r.status,404);
  assert.equal(f.sessions,0,'No authentication required for disabled service');
 }finally{f.close();}
 const absent=setup({migrate:false});
 try{assert.equal(await canonicalStudioSchemaReady(absent.env),false);
  assert.equal((await absent.call()).status,503);
 }finally{absent.close();}
 const config=JSON.parse(readFileSync(new URL('../wrangler.a-progression-v031.jsonc',import.meta.url),'utf8'));
 assert.equal(config.vars?.CANONICAL_CREATOR_STUDIO_ENABLED,undefined);
 assert.equal(config.vars?.CANONICAL_CREATOR_UPLOADS_ENABLED,undefined);
 assert.deepEqual(config.d1_databases.map(x=>x.binding),['COMMUNITY_DB','MEMBER_DB']);
});
test('canonical sessions, CSRF, origin and per-member isolation',async()=>{
 const s=setup();try{
  assert.equal((await s.call(ROOT,'GET',null)).status,401);
  const cross=await s.call(ROOT,'POST','alice',projectRequest(),{headers:{origin:'https://evil.invalid','sec-fetch-site':'cross-site'}});
  assert.equal(cross.status,403);
  assert.equal((await s.call(ROOT,'POST','alice',{...projectRequest(),userId:bob.id})).status,400);
  const creation=await s.call(ROOT,'POST','alice',projectRequest());
  assert.equal(creation.status,201,await creation.text().catch(()=>'')); // synthetic response consumed only if failed
  // Only Alice owns this project, never Bob or a legacy cookie.
  const records=await j(await s.call());
  const id=records.projects[0]?.id;assert.ok(id);
  assert.equal(records.projects.length,1);
  assert.equal((await j(await s.call(ROOT,'GET','bob'))).projects.length,0);
  assert.equal((await s.call(ROOT+'/'+id,'GET','bob')).status,404);
  assert.equal((await s.call(ROOT+'/'+id,'GET',null)).status,401);
  const inactiveAssets=await s.call(ROOT+'/'+id+'/assets','GET','alice');
  assert.equal(inactiveAssets.status,200);
  const inactiveData=await j(inactiveAssets);
  assert.deepEqual(inactiveData.assets,[]);
  assert.equal(inactiveData.uploadsReady,false);
  assert.equal(inactiveData.storageReady,false);
  assert.equal((await s.call(ROOT+'/'+id+'/assets','POST','alice',{
   name:'blocked.gif',sizeBytes:6,contentType:'image/gif'
  })).status,404);
 }finally{s.close();}
});
test('idempotent creation, revision-checked edits and no automatic publication',async()=>{
 const s=setup();try{
  const item=projectRequest();
  const first=await s.call(ROOT,'POST','alice',item);assert.equal(first.status,201);
  const p=(await j(first)).project;
  const replay=await j(await s.call(ROOT,'POST','alice',item));
  assert.equal(replay.replayed,true);assert.equal(replay.project.id,p.id);
  const b=await s.call(ROOT+'/'+p.id,'PATCH','alice',{revision:p.revision,draft:{...draft,title:'Signal 001 Revisited'}});
  assert.equal(b.status,200);
  const current=(await j(b)).project;
  assert.equal(current.revision,p.revision+1);
  assert.equal((await s.call(ROOT+'/'+p.id,'PATCH','alice',{revision:p.revision,draft})).status,409);
  const submit=await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:current.revision});
  assert.equal(submit.status,200);
  const record=(await j(submit)).project;
  assert.equal(record.status,'pending_review');
  assert.equal((await s.call(ROOT+'/'+p.id,'PATCH','alice',{revision:record.revision,draft})).status,409);
  assert.equal(record.submittedAt>0,true);
  assert.equal((await j(await s.call(ROOT,'GET','bob'))).projects.length,0);
  const exported=await canonicalStudioExport(s.env,alice.id);
  assert.equal(exported.projects.length,1);assert.equal(exported.assets.length,0);
  assert.equal(exported.projects[0].status,'pending_review');
 }finally{s.close();}
});
test('review queue is staff-only, independent and change-request-only',async()=>{
 const s=setup();try{
  const c=await j(await s.call(ROOT,'POST','alice',projectRequest()));
  await s.call(ROOT+'/'+c.project.id+'/submit','POST','alice',{revision:1});
  assert.equal((await s.call('/api/v1/member/studio/review','GET','alice')).status,403);
  const queue=await j(await s.call('/api/v1/member/studio/review','GET','bob'));
  assert.equal(queue.projects.length,1);
  assert.equal(queue.projects[0].handle,'alice');
  const r=await s.call('/api/v1/member/studio/review','POST','bob',{
   projectId:c.project.id,revision:2,action:'changes_requested',reason:'Add verifiable testing and clearer music credits.'
  });
  assert.equal(r.status,200);
  const confirmed=await j(await s.call(ROOT+'/'+c.project.id,'GET','alice'));
  assert.equal(confirmed.project.status,'changes_requested');
  assert.equal(confirmed.reviewHistory.length,1);
  assert.equal(confirmed.reviewHistory[0].action,'changes_requested');
  assert.match(confirmed.reviewHistory[0].reason,/music credits/);
  assert.equal((await s.call(ROOT+'/'+c.project.id,'GET','bob')).status,404,
   'Other members cannot read private review reasons');
  assert.equal((await s.call('/api/v1/member/studio/review','POST','bob',{
   projectId:c.project.id,revision:2,action:'rejected',reason:'This is now a stale review.'
  })).status,409);
  const audit=s.f.db.prepare('SELECT action,reason FROM member_studio_review_log').all();
  assert.equal(audit.length,1);
  assert.equal(audit[0].action,'changes_requested');
 }finally{s.close();}
});
test('private binary upload validates types, quotas, ownership and forced download',async()=>{
 const s=setup({uploads:true});try{
  const p=(await j(await s.call(ROOT,'POST','alice',projectRequest()))).project;
  const base=ROOT+'/'+p.id+'/assets';
  const bad=await s.call(base,'POST','alice',{name:'game.exe',sizeBytes:10,contentType:'application/octet-stream'});
  assert.equal(bad.status,422);
  const reserved=(await j(await s.call(base,'POST','alice',{name:'preview.gif',sizeBytes:6,contentType:'image/gif'}))).id;
  assert.match(reserved,/^[a-f0-9]{32}$/);
  assert.equal((await s.call(base+'/'+reserved,'PUT','bob',new TextEncoder().encode('GIF89a'))).status,404);
  assert.equal((await s.call(base+'/'+reserved,'PUT','alice',new TextEncoder().encode('ABCDEF'))).status,422);
  const uploaded=await s.call(base+'/'+reserved,'PUT','alice',new TextEncoder().encode('GIF89a'));
  assert.equal(uploaded.status,200);
  const report=await j(await s.call(base));
  const files=report.assets;
  assert.equal(report.memberUsedBytes,6);
  assert.equal(report.projectUsedBytes,6);
  assert.equal(report.globalUsedBytes,6);
  assert.equal(report.globalQuotaBytes,512*1048576);
  assert.equal(report.quotaBytes,100*1048576);
  assert.equal(files.length,1);assert.equal(files[0].status,'quarantined');
  assert.equal(files[0].sha256.length,64);
  const download=await s.call(base+'/'+reserved+'/file');
  assert.equal(download.status,200);
  assert.equal(download.headers.get('content-type'),'application/octet-stream');
  assert.match(download.headers.get('content-disposition'),/attachment/);
  assert.equal(await download.text(),'GIF89a');
  const exported=await canonicalStudioExport(s.env,alice.id);
  assert.equal(exported.assets.length,1);
  assert.equal('storage_key' in exported.assets[0],false);
  assert.equal((await s.call(base+'/'+reserved,'DELETE','bob')).status,404);
  // Submitting locks writes, never locks the owner's right to withdraw bytes.
  assert.equal((await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:1})).status,200);
  assert.equal((await s.call(base,'POST','alice',{name:'another.gif',sizeBytes:6,contentType:'image/gif'})).status,409);
  assert.equal((await s.call(base+'/'+reserved,'DELETE','alice')).status,200);
  assert.equal(s.objects.size,0);
  assert.equal((await j(await s.call(base))).assets.length,0);
  assert.equal((await s.call(ROOT+'/'+p.id,'DELETE','alice',{revision:2})).status,409,
   'A pending review must be withdrawn before deletion');
  const withdrawn=await s.call(ROOT+'/'+p.id+'/withdraw','POST','alice',{revision:2});
  assert.equal(withdrawn.status,200);
  assert.equal((await j(withdrawn)).project.status,'draft');
  assert.equal((await s.call(ROOT+'/'+p.id,'DELETE','alice',{revision:3})).status,200);
  assert.equal((await j(await s.call(ROOT,'GET','alice'))).projects.length,0);
 }finally{s.close();}
});


test('quarantined ZIP, not an outside URL, makes a game eligible for private review',async()=>{
 const s=setup({uploads:true});try{
  const privateDraft={...draft,slug:'private-game-zip',sourceUrl:null,demoUrl:null};
  const first=await s.call(ROOT,'POST','alice',{clientRequestId:crypto.randomUUID(),draft:privateDraft});
  assert.equal(first.status,201);
  const p=(await j(first)).project,assetRoot=ROOT+'/'+p.id+'/assets';
  // No public URL and no uploaded work must be rejected.
  assert.equal((await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:1})).status,422);
  // Uploading an image preview alone is not a playable game package.
  const gif=new TextEncoder().encode('GIF89a');
  const cover=(await j(await s.call(assetRoot,'POST','alice',{name:'cover.gif',sizeBytes:gif.length,contentType:'image/gif'}))).id;
  assert.equal((await s.call(assetRoot+'/'+cover,'PUT','alice',gif)).status,200);
  assert.equal((await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:1})).status,422);
  // ZIP file is accepted as quarantined attachment evidence only. This does
  // not inspect, install, approve or execute archive contents.
  const zip=new Uint8Array([0x50,0x4b,0x03,0x04,0x14,0x00,0,0]);
  const pkg=(await j(await s.call(assetRoot,'POST','alice',{name:'game-build.zip',sizeBytes:zip.length,contentType:'application/zip'}))).id;
  assert.equal((await s.call(assetRoot+'/'+pkg,'PUT','alice',zip)).status,200);
  const submitted=await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:1});
  assert.equal(submitted.status,200,JSON.stringify(await submitted.clone().json()));
  const saved=await j(submitted);
  assert.equal(saved.project.status,'pending_review');
  assert.equal(saved.project.demoUrl,null);
  assert.equal(saved.project.sourceUrl,null);
  assert.match(saved.note,/no publication/);
  // Access to the private file never becomes public after submission.
  assert.equal((await s.call(assetRoot+'/'+pkg+'/file','GET','bob')).status,404);
  assert.equal((await s.call(assetRoot+'/'+pkg+'/file','GET',null)).status,401);
  assert.equal((await s.call('/api/v1/member/studio/review','GET',null)).status,401);
  assert.equal((await s.call('/api/v1/member/studio/review','GET','alice')).status,403);
  // Forum moderators have NO Creator Studio reviewer privilege.
  s.env.CANONICAL_STUDIO_REVIEWER_IDS='';
  s.env.CANONICAL_FORUM_REVIEWER_IDS=bob.id;
  assert.equal((await s.call('/api/v1/member/studio/review','GET','bob')).status,403);
  s.env.CANONICAL_STUDIO_REVIEWER_IDS=bob.id;
  const queue=(await j(await s.call('/api/v1/member/studio/review','GET','bob'))).projects;
  assert.equal(queue.length,1);
  assert.equal(Number(queue[0].attachment_count),2);
  assert.equal(Number(queue[0].attachment_bytes),zip.length+gif.length);
  const manifestPath='/api/v1/member/studio/review/'+p.id+'/manifest';
  const manifestResponse=await s.call(manifestPath,'GET','bob');
  assert.equal(manifestResponse.status,200);
  const manifest=await j(manifestResponse);
  assert.equal(manifest.projectId,p.id);assert.equal(manifest.revision,2);
  assert.equal(manifest.assets.length,2);
  assert.ok(manifest.assets.some(x=>x.name==='game-build.zip'&&x.kind==='package'&&x.sha256.length===64));
  assert.ok(manifest.assets.every(x=>!Object.keys(x).some(key=>/storage|object|url|body|download/i.test(key))));
  assert.match(manifest.note,/NOT passed malware scanning/);
  assert.equal((await s.call(manifestPath,'GET','alice')).status,403);
  assert.equal((await s.call(manifestPath,'POST','bob',{})).status,405);
  assert.equal((await s.call(manifestPath+'/file','GET','bob')).status,404);
 }finally{s.close();}
});

test('owner submissions cannot appear in their own review queue',async()=>{
 const s=setup({uploads:true});try{
  const ownerDraft={...draft,slug:'staff-demo-project',title:'Private staff demo project'};
  const r=await s.call(ROOT,'POST','bob',{clientRequestId:crypto.randomUUID(),draft:ownerDraft});
  assert.equal(r.status,201);
  const p=(await j(r)).project;
  assert.equal((await s.call(ROOT+'/'+p.id+'/submit','POST','bob',{revision:1})).status,200);
  const q=await j(await s.call('/api/v1/member/studio/review','GET','bob'));
  assert.equal(q.projects.length,0);
  assert.equal((await s.call('/api/v1/member/studio/review/'+p.id+'/manifest','GET','bob')).status,404);
  assert.equal((await s.call('/api/v1/member/studio/review','POST','bob',{
   projectId:p.id,action:'changes_requested',revision:2,reason:'Cannot review a project I submitted'
  })).status,403);
 }finally{s.close();}
});

test('bounded cleanup of abandoned reservations and expired upload leases',async()=>{
 const {cleanupCanonicalStudioAssets}=await import('../canonical-auth/studio-assets.mjs');
 const s=setup({uploads:true});try{
  const p=(await j(await s.call(ROOT,'POST','alice',projectRequest()))).project;
  const route=ROOT+'/'+p.id+'/assets';
  const reserved=(await j(await s.call(route,'POST','alice',{name:'abandoned.gif',sizeBytes:6,contentType:'image/gif'}))).id;
  const expired=(await j(await s.call(route,'POST','alice',{name:'aborted.zip',sizeBytes:8,contentType:'application/zip'}))).id;
  const time=Math.floor(Date.now()/1000);
  s.f.db.prepare('UPDATE member_studio_assets SET created_at=? WHERE id=?').run(time-90000,reserved);
  const orphan=s.f.db.prepare('SELECT storage_key FROM member_studio_assets WHERE id=?').get(expired).storage_key;
  s.f.db.prepare("UPDATE member_studio_assets SET status='uploading',lease_until=? WHERE id=?").run(time-100,expired);
  await s.store.put(orphan,new Uint8Array([80,75,3,4,20,0,0,0]));
  const report=await cleanupCanonicalStudioAssets(s.env,time);
  assert.equal(report.cleaned,2);
  assert.equal(s.objects.size,0);
  assert.equal(s.f.db.prepare('SELECT COUNT(*) AS n FROM member_studio_assets').get().n,0);
  assert.equal((await cleanupCanonicalStudioAssets({...s.env,CANONICAL_CREATOR_UPLOADS_ENABLED:'false'},time)).cleaned,0);
 }finally{s.close();}
});


test('pausing NEW uploads preserves private file listing, downloads and safe erasure',async()=>{
 const s=setup({uploads:true});try{
  const p=(await j(await s.call(ROOT,'POST','alice',projectRequest()))).project;
  const base=ROOT+'/'+p.id+'/assets';
  const gif=new TextEncoder().encode('GIF89a');
  const id=(await j(await s.call(base,'POST','alice',{name:'private.gif',sizeBytes:gif.length,contentType:'image/gif'}))).id;
  assert.equal((await s.call(base+'/'+id,'PUT','alice',gif)).status,200);
  s.env.CANONICAL_CREATOR_UPLOADS_ENABLED='false';
  const listed=await s.call(base,'GET','alice');assert.equal(listed.status,200);
  const result=await j(listed);assert.equal(result.assets.length,1);
  assert.equal(result.storageReady,true);assert.equal(result.uploadsReady,false);
  assert.equal((await s.call(base,'POST','alice',{name:'other.gif',sizeBytes:6,contentType:'image/gif'})).status,404);
  assert.equal((await s.call(base+'/'+id+'/file','GET','alice')).status,200);
  // Metadata remains available if the backing R2 binding is temporarily absent.
  s.env.CREATOR_ASSETS=undefined;
  const disconnected=await j(await s.call(base,'GET','alice'));
  assert.equal(disconnected.storageReady,false);assert.equal(disconnected.assets.length,1);
  assert.equal((await s.call(base+'/'+id+'/file','GET','alice')).status,503);
  assert.equal((await s.call(base+'/'+id,'DELETE','alice')).status,503);
  s.env.CREATOR_ASSETS=s.store;
  assert.equal((await s.call(base+'/'+id,'DELETE','alice')).status,200);
  assert.equal(s.objects.size,0);
 }finally{s.close();}
});

test('expired private upload leases still clean up after new uploads are paused',async()=>{
 const {cleanupCanonicalStudioAssets}=await import('../canonical-auth/studio-assets.mjs');
 const s=setup({uploads:true});try{
  const p=(await j(await s.call(ROOT,'POST','alice',projectRequest()))).project;
  const base=ROOT+'/'+p.id+'/assets',now=Math.floor(Date.now()/1000);
  const id=(await j(await s.call(base,'POST','alice',{name:'paused.zip',sizeBytes:8,contentType:'application/zip'}))).id;
  s.f.db.prepare("UPDATE member_studio_assets SET status='uploading',lease_until=? WHERE id=?").run(now-1,id);
  const key=s.f.db.prepare('SELECT storage_key FROM member_studio_assets WHERE id=?').get(id).storage_key;
  await s.store.put(key,new Uint8Array([80,75,3,4,20,0,0,0]));
  s.env.CANONICAL_CREATOR_UPLOADS_ENABLED='false';
  assert.equal((await cleanupCanonicalStudioAssets(s.env,now)).cleaned,1);
  assert.equal(s.objects.size,0);
 }finally{s.close();}
});


test('closed canonical member allowlist gates binary upload without blocking private drafts',async()=>{
 const s=setup({uploads:true});try{
  s.env.CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS='pilot-alice';
  const a=await j(await s.call(ROOT,'GET','alice'));
  const b=await j(await s.call(ROOT,'GET','bob'));
  assert.equal(a.uploadsReady,true);
  assert.equal(b.uploadsReady,false);
  const bobProject=(await j(await s.call(ROOT,'POST','bob',
    {clientRequestId:crypto.randomUUID(),draft:{...draft,slug:'member-bob-project'}}))).project;
  const route=ROOT+'/'+bobProject.id+'/assets';
  const assetList=await j(await s.call(route,'GET','bob'));
  assert.equal(assetList.uploadsReady,false);
  assert.equal(assetList.storageReady,true);
  const denied=await s.call(route,'POST','bob',{
    name:'blocked.gif',sizeBytes:6,contentType:'image/gif'
  });
  assert.equal(denied.status,404);
  // Removing the allowlist instantly halts new private uploads for everyone,
  // while existing member drafts remain private and editable.
  s.env.CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS='';
  assert.equal((await j(await s.call(ROOT,'GET','alice'))).uploadsReady,false);
  assert.equal((await s.call(ROOT,'POST','alice',
    {clientRequestId:crypto.randomUUID(),draft:{...draft,slug:'second-private-work'}})).status,201);
 }finally{s.close();}
});

test('private pilot vault enforces shared 512 MiB cap, then frees space on deletion',async()=>{
 const s=setup({uploads:true});
 try{
  const first=(await j(await s.call(ROOT,'POST','alice',projectRequest()))).project;
  const recipient=(await j(await s.call(ROOT,'POST','bob',{
   clientRequestId:crypto.randomUUID(),draft:{...draft,slug:'bob-vault',title:'Bob vault'}
  }))).project;
  const now=Math.floor(Date.now()/1000);
  const existing=[{uid:bob.id,project:recipient.id}];
  const addUser=s.f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,?,?)');
  const addProject=s.f.db.prepare(
   'INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,category,created_at,updated_at) '+
   'VALUES(?,?,?,?,?,?,?,?,?)'
  );
  for(let i=0;i<5;i++){
   const uid='vault-fixture-'+i,pid=crypto.randomUUID();
   addUser.run(uid,'Vault tester '+i,'vault-'+i+'@fixture.invalid',now,now);
   addProject.run(pid,uid,crypto.randomUUID(),'vault-test-'+i,'Vault test '+i,
    'An isolated staging quota test record', 'games',now,now);
   existing.push({uid,project:pid});
  }
  const addAsset=s.f.db.prepare('INSERT INTO member_studio_assets('+
   'id,project_id,user_id,filename,extension,kind,content_type,size_bytes,status,storage_key,created_at,updated_at) '+
   'VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
  let remaining=512*1048576;
  for(let i=0;i<26;i++){
   const group=existing[Math.floor(i/5)],bytes=Math.min(20*1048576,remaining);
   addAsset.run(i.toString(16).padStart(32,'0'),group.project,group.uid,
    'part-'+i+'.zip','zip','package','application/zip',bytes,'reserved',
    'private-quarantine/quota-fixture/'+i,now,now);
   remaining-=bytes;
  }
  assert.equal(remaining,0);
  const path=ROOT+'/'+first.id+'/assets';
  const before=await j(await s.call(path));
  assert.equal(before.globalUsedBytes,512*1048576);
  assert.equal(before.globalQuotaBytes,512*1048576);
  assert.equal(before.memberUsedBytes,0);
  assert.equal((await s.call(path,'POST','alice',{name:'private.gif',sizeBytes:6,contentType:'image/gif'})).status,409);
  assert.equal((await j(await s.call(path))).assets.length,0);
  // Bob can remove a private reservation even when the shared vault is full.
  assert.equal((await s.call(ROOT+'/'+recipient.id+'/assets/'+('0'.repeat(32)),'DELETE','bob')).status,200);
  const newlyAvailable=await s.call(path,'POST','alice',{name:'private.gif',sizeBytes:6,contentType:'image/gif'});
  assert.equal(newlyAvailable.status,201);
  const after=await j(await s.call(path));
  assert.equal(after.memberUsedBytes,6);
  assert.ok(after.globalUsedBytes<after.globalQuotaBytes);
 }finally{s.close();}
});


test('private MP4/WebM film submissions use quarantine only, never public playback',async()=>{
 const s=setup({uploads:true});try{
  const film={...draft,category:'video',slug:'first-film',title:'First Experimental Film',
   demoUrl:null,sourceUrl:null};
  const p=(await j(await s.call(ROOT,'POST','alice',{
   clientRequestId:crypto.randomUUID(),draft:film
  }))).project;
  assert.equal((await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:1})).status,422);
  const files=ROOT+'/'+p.id+'/assets';
  const mp4=new Uint8Array([0,0,0,12,102,116,121,112,105,115,111,109]);
  const id=(await j(await s.call(files,'POST','alice',{
   name:'film.mp4',sizeBytes:mp4.length,contentType:'video/mp4'
  }))).id;
  assert.equal((await s.call(files+'/'+id,'PUT','alice',new TextEncoder().encode('INVALIDFILE!'))).status,422);
  const uploaded=await s.call(files+'/'+id,'PUT','alice',mp4);
  assert.equal(uploaded.status,200);
  assert.equal((await j(await s.call(files))).assets[0].kind,'video');
  const submitted=await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:1});
  assert.equal(submitted.status,200);
  assert.equal((await j(submitted)).project.status,'pending_review');
  assert.equal((await s.call(files+'/'+id+'/file','GET','bob')).status,404);
  assert.equal((await s.call(files+'/'+id+'/file','GET',null)).status,401);
  const review=await j(await s.call('/api/v1/member/studio/review/'+p.id+'/manifest','GET','bob'));
  assert.equal(review.assets[0].contentType,'video/mp4');
  assert.equal(review.assets[0].kind,'video');
  assert.equal('body' in review.assets[0],false);
  const original=await s.call(files+'/'+id+'/file','GET','alice');
  assert.equal(original.headers.get('content-type'),'application/octet-stream');
  assert.match(original.headers.get('content-disposition'),/attachment/);
  assert.deepEqual(new Uint8Array(await original.arrayBuffer()),mp4);
  // Independent EBML/WebM signature case on an editable private draft.
  const other={...draft,slug:'webm-test',category:'video',demoUrl:null,sourceUrl:null};
  const q=(await j(await s.call(ROOT,'POST','alice',{
   clientRequestId:crypto.randomUUID(),draft:other
  }))).project;
  const root=ROOT+'/'+q.id+'/assets';
  const ebml=new Uint8Array([0x1a,0x45,0xdf,0xa3,0x81,0x00,0x00,0x00]);
  const webmid=(await j(await s.call(root,'POST','alice',{
   name:'render.webm',sizeBytes:ebml.length,contentType:'video/webm'
  }))).id;
  assert.equal((await s.call(root+'/'+webmid,'PUT','alice',ebml)).status,200);
  assert.equal((await s.call(ROOT+'/'+q.id+'/submit','POST','alice',{revision:1})).status,200);
 }finally{s.close();}
});
