import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorker} from '../src/worker.mjs';
import {openDatabase,keys,issuer,audience,emails,envFor,temporaryDB} from './fixtures.mjs';

const signing=await keys(), originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{if(String(url)===issuer+'/cdn-cgi/access/certs')return Response.json({keys:[signing.pub]});throw Error('Unexpected external request');};
const worker=createWorker({'/':{content:'<!doctype html><title>CristyBreathe</title>',type:'text/html'}});
async function call(env,path,method='GET',value,token,headers={}) {
  const request=new Request('https://workspace.example'+path,{method,headers:{'cf-access-jwt-assertion':token||await signing.token(),'origin':'https://workspace.example','x-cristybreathe':'1','content-type':'application/json',...headers},body:value===undefined?undefined:JSON.stringify(value)});
  const response=await worker.fetch(request,env);
  return {status:response.status,headers:response.headers,data:await response.json()};
}
test('verified JWT identity denies missing, forged, wrong issuer/audience, expired and disallowed users',async()=>{
  const env=envFor(openDatabase());
  const missing=await worker.fetch(new Request('https://workspace.example/'),env);assert.equal(missing.status,401);
  for(const token of [
    'fake.jwt.signature',await signing.token('stranger@example.com'),await signing.token(emails[0],{exp:0}),
    await signing.token(emails[0],{iss:'https://other.cloudflareaccess.com'}),await signing.token(emails[0],{aud:['other']}),
    await signing.token(emails[0],{nbf:Date.now()/1000+500}),await signing.token(emails[0],{}, {alg:'none'}),
    (await signing.token()).slice(0,-10)+'AAAAAAAAAA'
  ]) assert.equal((await call(env,'/api/session','GET',undefined,token)).status,401);
  assert.equal((await call(env,'/api/session')).data.email,emails[0]);
});
test('persistent CRUD, new connection/session, search, pin, review, draft and delete',async()=>{
  const file=temporaryDB();let DB=openDatabase(file),env=envFor(DB);
  const create=await call(env,'/api/entries','POST',{kind:'note',title:'Evening garden',body:'Remember the sage',collection:'Home',tags:['garden'],is_draft:1});
  assert.equal(create.status,201);let entry=create.data.entry;assert.equal(entry.is_draft,1);
  DB.db.close();DB=openDatabase(file,false);env=envFor(DB);
  assert.equal((await call(env,'/api/entries/'+entry.id)).data.entry.body,'Remember the sage');
  const update=await call(env,'/api/entries/'+entry.id,'PATCH',{revision:entry.revision,body:'Remember the lavender',pinned:1,priority:1,is_draft:0,deferred_until:'2026-11-01'});
  assert.equal(update.status,200);entry=update.data.entry;assert.equal(entry.revision,2);
  assert.equal((await call(env,'/api/entries?q=lavender')).data.entries.length,1);
  assert.equal((await call(env,'/api/entries?q=unrelated')).data.entries.length,0);
  assert.equal((await call(env,'/api/entries/'+entry.id,'PATCH',{revision:1,body:'stale overwrite'})).status,409);
  assert.equal((await call(env,'/api/entries/'+entry.id,'DELETE',undefined,undefined,{'if-match':'1'})).status,409);
  assert.equal((await call(env,'/api/entries/'+entry.id,'DELETE',undefined,undefined,{'if-match':String(entry.revision)})).data.deleted,true);
  assert.equal((await call(env,'/api/entries/'+entry.id)).status,404);DB.db.close();
});
test('cross-account list, read, patch, delete, preferences and export are isolated',async()=>{
  const env=envFor(openDatabase()),second=await signing.token(emails[1]);
  const item=(await call(env,'/api/entries','POST',{title:'Synthetic private note',body:'private-test'})).data.entry;
  assert.equal((await call(env,'/api/entries','GET',undefined,second)).data.entries.length,0);
  for(const method of ['GET','PATCH','DELETE'])assert.equal((await call(env,'/api/entries/'+item.id,method,method==='PATCH'?{title:'Attack',revision:1}:undefined,second,{'if-match':'1'})).status,404);
  assert.equal((await call(env,'/api/export','GET',undefined,second)).data.entries.length,0);
  await call(env,'/api/preferences','PUT',{theme:'autumn'});
  assert.equal((await call(env,'/api/session','GET',undefined,second)).data.preferences.theme,'sage');
  assert.equal((await call(env,'/api/entries/'+item.id)).data.entry.title,'Synthetic private note');
});
test('validation, CSRF, SQL wildcard escaping and idempotent creation',async()=>{
  const env=envFor(openDatabase()),id=crypto.randomUUID();
  const record={id,title:'100% complete',body:"<script>alert('x')</script>"};
  assert.equal((await call(env,'/api/entries','POST',record)).status,201);
  assert.equal((await call(env,'/api/entries','POST',record)).status,200);
  assert.equal((await call(env,'/api/entries','POST',{...record,body:'Different retry snapshot'})).status,409);
  assert.equal((await call(env,'/api/entries')).data.entries.length,1);
  assert.equal((await call(env,'/api/entries?q=%25')).data.entries.length,1);
  assert.equal((await call(env,"/api/entries?q='+OR+1=1--")).data.entries.length,0);
  for(const invalid of [{owner:emails[1],title:'bad'},{body:'x'.repeat(20001)},{pinned:2},{due_date:'2026-02-31'},{tags:[10]}])assert.equal((await call(env,'/api/entries','POST',invalid)).status,400);
  assert.equal((await call(env,'/api/entries','POST',{title:'CSRF'},undefined,{origin:'https://evil.example'})).status,403);
  assert.equal((await call(env,'/api/entries','POST',{title:'CSRF'},undefined,{'x-cristybreathe':''})).status,403);
  assert.equal((await call(env,'/api/entries/'+id,'PATCH',{revision:1,owner:emails[1]})).status,400);
});
test('export and transactional additive restore preserve contents without importing ownership',async()=>{
  const env=envFor(openDatabase());
  await call(env,'/api/entries','POST',{title:'Backup test',body:'Synthetic snapshot',tags:['restore'],kind:'journal'});
  const backup=(await call(env,'/api/export')).data;
  assert.equal(backup.entries.length,1);assert.equal('owner' in backup.entries[0],false);
  const second=await signing.token(emails[1]);
  const restored=await call(env,'/api/import','POST',backup,second);assert.equal(restored.data.restored,1);
  const rows=(await call(env,'/api/export','GET',undefined,second)).data.entries;
  assert.equal(rows[0].body,backup.entries[0].body);assert.notEqual(rows[0].id,backup.entries[0].id);assert.deepEqual(rows[0].tags,['restore']);
  assert.equal(rows[0].created_at,backup.entries[0].created_at);assert.equal(rows[0].updated_at,backup.entries[0].updated_at);
  const corrupt={...backup,entries:[backup.entries[0],{title:'bad',owner:emails[0]}]};
  assert.equal((await call(env,'/api/import','POST',corrupt,second)).status,400);
  assert.equal((await call(env,'/api/entries','GET',undefined,second)).data.entries.length,1);
});
test.after(()=>{globalThis.fetch=originalFetch;});
