import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCommunicationsWorker} from '../communications/worker.mjs';
const worker=fs.readFileSync(new URL('../communications/worker.mjs',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../communications/migrations/0001_optional_mail_consent.sql',import.meta.url),'utf8');
const config=JSON.parse(fs.readFileSync(new URL('../communications/wrangler.review.jsonc',import.meta.url),'utf8'));
const make=(path='subscribe',method='POST',origin='https://anevum.com')=>new Request('https://anevum.com/api/v1/communications/'+path,{method,headers:{origin,'content-type':'application/json','cf-connecting-ip':'198.51.100.10'},body:method==='POST'?JSON.stringify({email:'test@example.org',consent:true,topics:{releases:true,weekly:false}}):undefined});
test('no production routes, credentials, or D1 bindings in review config',()=>{
 assert.equal(config.vars.COMMUNICATIONS_EMAIL_ENABLED,'false');
 assert.deepEqual(config.routes,[]);
 assert.deepEqual(config.d1_databases,[]);
 assert.equal(config.workers_dev,false);
 assert.equal(config.preview_urls,false);
});
test('disabled worker denies all email mutations before DB and provider access',async()=>{
 let called=false;const service=createCommunicationsWorker({send:async()=>{called=true}});
 for(const action of ['subscribe','confirm','unsubscribe','manage']){
  const response=await service.fetch(make(action),{});
  assert.equal(response.status,404);
 }
 assert.equal(called,false);
});
test('rejects wrong host, method and cross-origin before any email send',async()=>{
 const service=createCommunicationsWorker({send:async()=>{throw Error('Must not send')}});
 const env={COMMUNICATIONS_EMAIL_ENABLED:'true'};
 assert.equal((await service.fetch(make('subscribe','GET'),env)).status,405);
 assert.equal((await service.fetch(make('subscribe','POST','https://evil.example'),env)).status,403);
 assert.equal((await service.fetch(new Request('https://evil.example/api/v1/communications/subscribe',{method:'POST'}),env)).status,404);
 assert.equal((await service.fetch(make('broadcast'),env)).status,404);
});
test('isolated consent schema supports expiration, topic preferences, audit and abuse limits',()=>{
 for(const table of ['communication_manifest','communication_subscribers','communication_rate_windows','communication_consent_log'])assert.match(migration,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
 assert.match(migration,/manage_hash TEXT UNIQUE/);
 assert.match(migration,/confirm_hash TEXT UNIQUE/);
 assert.match(migration,/communication_confirmed_update/);
 assert.match(migration,/communication_unsubscribed_update/);
 assert.match(worker,/manage_expires_at>\?/);
 assert.match(worker,/COMMUNICATIONS_RATE_SECRET/);
 assert.match(worker,/COMMUNICATIONS_RESEND_API_KEY/);
 assert.doesNotMatch(worker,/MEMBER_DB|CANONICAL_RESEND_API_KEY/);
});
test('consent and preference UI remain explicitly disabled by default',()=>{
 const optin=fs.readFileSync(new URL('../web/src/components/EmailUpdatesOptIn.tsx',import.meta.url),'utf8');
 const preferences=fs.readFileSync(new URL('../web/src/pages/EmailUpdatePreferencesPage.tsx',import.meta.url),'utf8');
 assert.match(optin,/VITE_ANEVUM_EMAIL_UPDATES==='true'/);
 assert.match(optin,/consent:true/);
 assert.match(optin,/weekly/);
 assert.match(preferences,/setTopic/);
 assert.match(preferences,/topic==='releases'/);
 assert.match(preferences,/topic==='weekly'/);
});
