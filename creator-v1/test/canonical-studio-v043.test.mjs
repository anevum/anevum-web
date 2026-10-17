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
  CANONICAL_FORUM_REVIEWER_IDS:'pilot-bob'};
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
  assert.equal((await s.call(ROOT+'/'+id+'/assets','GET','alice')).status,404);
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
  const files=(await j(await s.call(base))).assets;
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
 }finally{s.close();}
});
