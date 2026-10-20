import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import api from '../site/alpha/v003/api.mjs';
import runtime from '../site/alpha/v003/runtime.mjs';
import {interceptPackageNamespace} from '../site/alpha/v003/unified-creation-bridge-v009.mjs';
const ORIGIN='https://anevum.com';
const N='/api/v1/packages/native/';
const OTHER='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function setup(protectedMode=true){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(readFileSync(new URL('../site/alpha/v003/schema.sql',import.meta.url),'utf8'));
 if(protectedMode)sqlite.exec(readFileSync(new URL('../site/alpha/v003/migrations/0004_resource_protection.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){const statement=(args=[])=>({bind(...values){return statement(values);},first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>({meta:{changes:sqlite.prepare(sql).run(...args).changes}})});return statement();},async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}},close(){sqlite.close();}};
 const files=new Map();
 const MEDIA={async put(key,bytes,options={}){files.set(key,{bytes:new Uint8Array(bytes),size:bytes.byteLength,customMetadata:options.customMetadata||{}});},async head(key){return files.get(key)||null;},async get(key){const value=files.get(key);return value?{size:value.size,customMetadata:value.customMetadata,body:new Blob([value.bytes]).stream()}:null;},async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])files.delete(k);},async list({prefix,limit=100}){return {objects:[...files.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(key=>({key}))};}};
 const env={DB,MEDIA,RUNTIME_HOST:'anevum-package-alpha-v003-runtime.devonakins.workers.dev',PACKAGE_NATIVE_STUDIO_ENABLED:'true',PACKAGE_PUBLIC_PUBLISH_ENABLED:'true',PACKAGE_RESOURCE_PROTECTION_ENABLED:protectedMode?'true':'false',PILOT_IDS:'owner-id',STAFF_IDS:'owner-id,reviewer-id',PACKAGE_PREVIEW_KEY:'a'.repeat(48),AUTH:{async fetch(req){
  const actor=/session=(owner|reviewer|other)/.exec(req.headers.get('cookie')||'')?.[1];
  const id=actor?actor+'-id':null,path=new URL(req.url).pathname;
  if(path==='/api/v1/member/creator-profile')return id?Response.json({memberId:id,profile:{handle:actor==='owner'?'testcreator':'testreviewer',createdAt:1760000000,packageProof:'a'.repeat(64)}}):Response.json({error:'sign in'},{status:401});
  return Response.json(id?{user:{id,emailVerified:true},session:{id:'synthetic'}}:null);
 }}};
 return {env,sqlite,files};
}
function req(path,{method='GET',actor='owner',body=null}={}){
 const headers={accept:'application/json',origin:ORIGIN,'x-anevum-package':'v003'};
 if(actor)headers.cookie='session='+actor;
 if(body&&!(body instanceof FormData))headers['content-type']='application/json';
 return new Request(ORIGIN+path,{method,headers,...body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}});
}
const call=(env,path,options)=>api.fetch(req(path,options),env,{});
function form(projectId='',revision='v1'){
 const f=new FormData();f.set('file',new File(['<!doctype html><html><body><button>'+revision+'</button></body></html>'],'test.html',{type:'text/html'}));
 f.set('title','SYNTHETIC NATIVE TEST');f.set('summary','A synthetic, disposable native integration fixture.');f.set('category','app');f.set('rights_ack','yes');if(projectId)f.set('project_id',projectId);return f;
}
async function upload(env,id='',revision='v1',extra={}){const f=form(id,revision);for(const[k,v]of Object.entries(extra))f.set(k,v);const r=await call(env,'/api/v1/packages/upload',{method:'POST',body:f});assert.equal(r.status,201,await r.clone().text());return r.json();}
async function action(env,id,action,release,actor='owner',reason='A specific synthetic moderation reason.'){
 const endpoint=['publish','reject'].includes(action)?'review':['suspend','restore'].includes(action)?'moderate':action;
 return call(env,'/api/v1/packages/projects/'+id+'/'+endpoint,{method:'POST',actor,body:{action,reason,expected_release_id:release}});
}
async function published(env){const b=await upload(env);assert.equal((await action(env,b.id,'submit',b.release_id)).status,200);assert.equal((await action(env,b.id,'publish',b.release_id,'reviewer')).status,200);return b;}

test('native presentation is default-OFF; unknown routes and mutation methods fail closed',async()=>{
 const {env}=setup();try{
  delete env.PACKAGE_NATIVE_STUDIO_ENABLED;assert.equal((await call(env,N+'session')).status,404);
  env.PACKAGE_NATIVE_STUDIO_ENABLED='true';assert.equal((await call(env,N+'unknown')).status,404);
  assert.equal((await call(env,N+'session',{method:'POST',body:{}})).status,405);
  assert.equal((await call(env,N+'session?owner_id=owner-id')).status,400);
 }finally{env.DB.close();}
});
test('native session resolves canonical IDs, not claimed headers, and cannot grant uploader access',async()=>{
 const {env}=setup();try{
  assert.equal((await call(env,N+'session',{actor:null})).status,401);
  const owner=await (await call(env,N+'session')).json();assert.equal(owner.memberId,'owner-id');assert.equal(owner.canUpload,true);
  const reviewer=await (await call(env,N+'session',{actor:'reviewer'})).json();assert.equal(reviewer.canReview,true);assert.equal(reviewer.canUpload,false);
  assert.equal((await call(env,N+'mine',{actor:'reviewer'})).status,403);
  const other=req(N+'review',{actor:'other'});other.headers.set('x-anevum-staff-id','reviewer-id');assert.equal((await api.fetch(other,env,{})).status,403);
 }finally{env.DB.close();}
});
test('saved library, native private playtest, independent review and public view use one existing lifecycle',async()=>{
 const {env}=setup();try{
  const b=await upload(env);
  let library=await (await call(env,N+'mine')).json();assert.equal(library.projects.length,1);assert.equal(library.projects[0].draftReleaseId,b.release_id);assert.equal(library.projects[0].retention,'test');
  const preview=await (await call(env,N+'projects/'+b.id+'?preview=1')).json();assert.equal(preview.preview,true);assert.equal(preview.canEdit,true);assert.equal(preview.canReview,false);assert.equal(preview.memberId,'owner-id');assert.match(preview.runtimeUrl,new RegExp('/p/'+b.release_id+'/[a-f0-9]{64}/index.html$'));
  assert.equal((await runtime.fetch(new Request(preview.runtimeUrl),env)).status,200);
  assert.equal((await call(env,N+'projects/'+b.id,{actor:null})).status,404);
  assert.equal((await action(env,b.id,'save',b.release_id)).status,200);
  assert.equal((await action(env,b.id,'submit',b.release_id)).status,200);
  assert.equal((await action(env,b.id,'publish',b.release_id)).status,403,'owner cannot self-approve');
  const review=await (await call(env,N+'projects/'+b.id+'?preview=1',{actor:'reviewer'})).json();assert.equal(review.canReview,true);assert.equal(review.memberId,'reviewer-id');
  assert.equal((await action(env,b.id,'publish',b.release_id,'reviewer')).status,200);
  const live=await (await call(env,N+'projects/'+b.id,{actor:null})).json();assert.equal(live.preview,false);assert.equal(live.release.id,b.release_id);assert.equal(live.release.archiveSha256,null);assert.equal(live.memberId,null);assert.equal(live.project.draftReleaseId,undefined);
  assert.equal((await runtime.fetch(new Request(live.runtimeUrl),env)).status,200);
 }finally{env.DB.close();}
});
test('another member and a guest cannot read private builds or inventories; removing staff access takes effect',async()=>{
 const {env}=setup();try{
  const b=await upload(env);
  for(const actor of ['other',null]){assert.equal((await call(env,N+'projects/'+b.id+'?preview=1',{actor})).status,404);assert.ok([401,403].includes((await call(env,N+'mine',{actor})).status));}
  assert.equal((await call(env,N+'projects/'+b.id+'?preview=1',{actor:'reviewer'})).status,200);
  env.STAFF_IDS='owner-id';assert.equal((await call(env,N+'projects/'+b.id+'?preview=1',{actor:'reviewer'})).status,404);assert.equal((await call(env,N+'review',{actor:'reviewer'})).status,403);
 }finally{env.DB.close();}
});
test('every draft decision is bound to the requested release; stale submit/save/discard/publish are rejected',async()=>{
 const {env}=setup();try{
  const b=await upload(env);
  for(const a of ['save','submit','discard'])assert.equal((await action(env,b.id,a,OTHER)).status,409,a);
  assert.equal((await action(env,b.id,'submit',b.release_id)).status,200);
  assert.equal((await action(env,b.id,'publish',OTHER,'reviewer')).status,409);
  assert.equal((await action(env,b.id,'reject',OTHER,'reviewer')).status,409);
  const stored=await env.DB.prepare('SELECT status FROM anevum_package_releases WHERE id=?').bind(b.release_id).first();assert.equal(stored.status,'pending_review');
 }finally{env.DB.close();}
});
test('replacement rejects stale release and preserves the approved release throughout review',async()=>{
 const {env}=setup();try{
  const live=await published(env),draft=await upload(env,live.id,'v2');
  const replacement=form(live.id,'v3');replacement.set('replace_draft','1');replacement.set('expected_release_id',OTHER);
  assert.equal((await call(env,'/api/v1/packages/upload',{method:'POST',body:replacement})).status,409);
  assert.equal((await action(env,live.id,'submit',draft.release_id)).status,200);
  const guest=await (await call(env,N+'projects/'+live.id,{actor:null})).json();assert.equal(guest.release.id,live.release_id);assert.equal(guest.project.draftReleaseId,undefined);
  assert.equal((await call(env,N+'projects/'+live.id+'?preview=1',{actor:'other'})).status,404);
 }finally{env.DB.close();}
});
test('suspension and restoration require the exact approved release; suspension hides native playback',async()=>{
 const {env}=setup();try{
  const live=await published(env);
  assert.equal((await action(env,live.id,'suspend',OTHER,'reviewer')).status,409);
  assert.equal((await action(env,live.id,'suspend',live.release_id,'reviewer')).status,200);
  assert.equal((await call(env,N+'projects/'+live.id,{actor:null})).status,404);
  assert.equal((await action(env,live.id,'restore',OTHER,'reviewer')).status,409);
  assert.equal((await action(env,live.id,'restore',live.release_id,'reviewer')).status,200);
  assert.equal((await call(env,N+'projects/'+live.id,{actor:null})).status,200);
 }finally{env.DB.close();}
});
test('expired private tests cannot mint native preview credentials; missing media cannot become playable',async()=>{
 const {env,files}=setup();try{
  const b=await upload(env);
  await env.DB.prepare('UPDATE anevum_package_build_retention SET expires_at=1 WHERE release_id=?').bind(b.release_id).run();
  assert.equal((await call(env,N+'projects/'+b.id+'?preview=1')).status,410);
  await env.DB.prepare('UPDATE anevum_package_build_retention SET expires_at=? WHERE release_id=?').bind(Math.floor(Date.now()/1000)+3600,b.release_id).run();
  files.clear();assert.equal((await call(env,N+'projects/'+b.id+'?preview=1')).status,503);
 }finally{env.DB.close();}
});
test('native DTOs never expose source archive keys, owner IDs, creator proofs or credentials',async()=>{
 const {env}=setup();try{
  const b=await published(env);await upload(env,b.id,'v2');
  for(const path of [N+'mine',N+'review',N+'projects/'+b.id]){
   const reply=await call(env,path),body=await reply.text();assert.equal(reply.status,200);
   assert.doesNotMatch(body,/source_key|object_key|owner_id|creator_proof|packageProof|session_token|PACKAGE_PREVIEW_KEY/);
   assert.equal(reply.headers.get('cache-control'),'private, no-store');assert.equal(reply.headers.get('vary'),'Cookie');
  }
 }finally{env.DB.close();}
});
test('existing namespace remains canonical; native UI redirects never change API or unrelated routes',async()=>{
 let called=0;const env={PACKAGE_CANONICAL_BRIDGE_ENABLED:'true',PACKAGE_IDENTITY_BRIDGE_VERIFIED:'true',PACKAGE_NATIVE_STUDIO_ENABLED:'true',PACKAGE_CONTROL:{async fetch(){called++;return Response.json({ok:true});}}};
 const root=await interceptPackageNamespace(new Request(ORIGIN+'/upload/v3'),env);assert.equal(root.status,302);assert.equal(root.headers.get('location'),'/studio/packages/new');
 const review=await interceptPackageNamespace(new Request(ORIGIN+'/upload/v3/review'),env);assert.equal(review.headers.get('location'),'/studio/packages/review');
 const p=await interceptPackageNamespace(new Request(ORIGIN+'/upload/v3/play/'+OTHER+'?preview=1'),env);assert.equal(p.headers.get('location'),'/projects/package/'+OTHER+'?preview=1');
 assert.equal(called,0);
 const apiResponse=await interceptPackageNamespace(new Request(ORIGIN+'/upload/v3/api/v1/packages/native/session'),env);assert.equal(apiResponse.status,200);assert.equal(called,1);
 assert.equal(await interceptPackageNamespace(new Request(ORIGIN+'/studio/packages'),env),null);
 delete env.PACKAGE_NATIVE_STUDIO_ENABLED;const old=await interceptPackageNamespace(new Request(ORIGIN+'/upload/v3/review'),env);assert.equal(old.status,200);assert.equal(called,2);
});
