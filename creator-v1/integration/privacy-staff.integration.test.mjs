import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {staffPrivacyRequests} from '../authoring/privacy-queue.mjs';
import studio from '../authoring/worker.mjs';
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(`CREATE TABLE member_accounts(id TEXT PRIMARY KEY,email TEXT);CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,handle TEXT);CREATE TABLE member_deletion_requests(id TEXT PRIMARY KEY,member_id TEXT,state TEXT,requested_at INTEGER,updated_at INTEGER);`);
sqlite.prepare('INSERT INTO member_accounts(id,email) VALUES (?,?)').run('one','first@fixture.test');sqlite.prepare('INSERT INTO member_accounts(id,email) VALUES (?,?)').run('two','second@fixture.test');sqlite.prepare('INSERT INTO creator_profiles(member_id,handle) VALUES (?,?)').run('one','one_creator');
for(const [id,member,state,time] of [['rq1','one','requested',100],['rq2','two','cancelled',101],['rq3','two','processing',102]])sqlite.prepare('INSERT INTO member_deletion_requests VALUES (?,?,?,?,?)').run(id,member,state,time,time);
function prepare(sql,params=[]){return{bind(...x){return prepare(sql,x)},async all(){return{success:true,results:sqlite.prepare(sql).all(...params)}}}}
const db={prepare:sql=>prepare(sql)};
const call=(path,method='GET')=>staffPrivacyRequests(new Request('https://studio.next.anevum.com'+path,{method}),db);
test('staff privacy queue returns pending and processing requests in order',async()=>{const r=await call('/api/privacy-requests');assert.equal(r.status,200);const data=await r.json();assert.deepEqual(data.requests.map(x=>x.id),['rq1','rq3']);assert.equal(data.requests[0].handle,'one_creator');assert.equal(data.requests[0].email,'first@fixture.test')});
test('cancelled requests are not in the staff queue',async()=>{const d=await (await call('/api/privacy-requests')).json();assert.ok(!JSON.stringify(d).includes('rq2'))});
test('there is no staff deletion or silent fulfillment endpoint',async()=>{for(const p of ['/api/privacy-requests/rq1/erase','/api/privacy-requests/rq1/complete'])assert.equal((await call(p,'POST')).status,404);assert.equal((await call('/api/privacy-requests','DELETE')).status,404)});
test('queue never exposes session credentials or member internal IDs',async()=>{const text=await (await call('/api/privacy-requests')).text();assert.ok(!text.includes('member_id'));assert.ok(!text.includes('token_hash'));assert.ok(!text.includes('AUTH_PEPPER'))});
test('staff Worker denies unauthenticated queue access despite queue module readiness',async()=>{const r=await studio.fetch(new Request('https://studio.next.anevum.com/api/privacy-requests'),{COMMUNITY_DB:db});assert.equal(r.status,401)});