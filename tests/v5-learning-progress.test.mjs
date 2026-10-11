import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {
 learningConfigured,learningSchemaState,learningExpectedMemberMatches,
 validateLearningProgressPayload,boundedLearningJson,readLearningProgress,
 exportLearningProgress,deleteLearningProgress,spendLearningMutation,
 writeLearningProgress,learningProgressEndpoint
} from '../src/server/member-learning-progress.mjs';

const ORIGIN='https://anevum-member-staging.devonakins.workers.dev';
const PREFIX='/api/member/learning/progress';
const SLUG='market-orders-and-quotes';
const userA={id:'member-a',emailVerified:true},userB={id:'member-b',emailVerified:true};
const payload=(expectedRevision=0,completed=true)=>({lessonVersion:'1.0.0',expectedRevision,completed});
function database({migrate=true,ledger=true}={}) {
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON; CREATE TABLE user(id TEXT PRIMARY KEY);'+
   "INSERT INTO user VALUES('member-a'),('member-b'); CREATE TABLE d1_migrations(name TEXT PRIMARY KEY);");
 if(migrate)sql.exec(readFileSync(new URL('../migrations-learning/0009_member_learning_progress.sql',import.meta.url),'utf8'));
 if(ledger)sql.prepare('INSERT INTO d1_migrations VALUES(?)').run('0009_member_learning_progress.sql');
 const statements=[];
 const db={sql,statements,prepare(query){
   statements.push(query); const statement=sql.prepare(query); let values=[];
   return {bind(...args){values=args;return this;},async first(){return statement.get(...values)||null;},
     async all(){return {results:statement.all(...values)};},async run(){return statement.run(...values);}};
 },async batch(items){sql.exec('BEGIN');try {const results=[];for(const item of items)results.push(await item.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
 return db;
}
function environment(db,extra={}) {return {MEMBER_DB:db,ANEVUM_MEMBER_LEARNING_ENABLED:'true',
 ANEVUM_MEMBER_PREVIEW_ENABLED:'true',MEMBER_PREVIEW_ORIGIN:ORIGIN,...extra};}
function request(path=PREFIX,method='GET',value=undefined,memberId='member-a',extra={}) {
 return new Request(ORIGIN+path,{method,headers:{Origin:ORIGIN,'Content-Type':'application/json',
  ...(memberId===null?{}:{'X-ANEVUM-EXPECTED-MEMBER-ID':memberId}),...extra},
  ...(value===undefined?{}:{body:JSON.stringify(value)})});
}
async function call(db,req,user=userA,extra={}) {
 return learningProgressEndpoint(req,environment(db,extra),user,ORIGIN,new URL(req.url).pathname);
}
test('pilot is default closed and only the separately configured HTTPS preview matches',()=>{
 const env=environment({});
 assert.equal(learningConfigured({},ORIGIN),false);
 assert.equal(learningConfigured(env,ORIGIN),true);
 for(const origin of ['https://anevum.com','http://anevum.com','https://attacker.workers.dev'])
  assert.equal(learningConfigured(env,origin),false);
 for(const value of [ORIGIN+'/extra',ORIGIN+'?a=1',ORIGIN+'#hash',ORIGIN+':444','https://user:pass@anevum.workers.dev'])
  assert.equal(learningConfigured({...env,MEMBER_PREVIEW_ORIGIN:value},ORIGIN),false);
 assert.equal(learningConfigured({...env,ANEVUM_MEMBER_LEARNING_ENABLED:'false'},ORIGIN),false);
});
test('payload accepts only a published current lesson and typed bounded progress fields',()=>{
 assert.deepEqual(validateLearningProgressPayload(payload(),SLUG),payload());
 for(const value of [null,[],{}, {...payload(),memberId:'member-b'},{...payload(),lessonSlug:SLUG},
   {...payload(),completed:1},{...payload(),expectedRevision:-1},{...payload(),expectedRevision:1.5},
   {...payload(),expectedRevision:1000000},{...payload(),lessonVersion:'2.0.0'}])
  assert.throws(()=>validateLearningProgressPayload(value,SLUG));
 assert.throws(()=>validateLearningProgressPayload(payload(),'unpublished-lesson'));
});
test('new write client must supply matching stale-tab hint, never an owner selector',()=>{
 assert.equal(learningExpectedMemberMatches(request(),userA.id),true);
 assert.equal(learningExpectedMemberMatches(request(),userB.id),false);
 assert.equal(learningExpectedMemberMatches(request(PREFIX,'GET',undefined,null),userA.id),false);
 assert.equal(learningExpectedMemberMatches(request(PREFIX,'GET',undefined,null),userA.id,false),true);
 assert.equal(learningExpectedMemberMatches(request(),''),false);
});
test('stream parser bounds real UTF-8 bytes and chunk counts independent of declared length',async()=>{
 assert.deepEqual(await boundedLearningJson(request(PREFIX,'PUT',payload())),payload());
 await assert.rejects(boundedLearningJson(request(PREFIX,'PUT',{text:'x'.repeat(1024)})));
 await assert.rejects(boundedLearningJson(request(PREFIX,'PUT',payload(),'member-a',{'Content-Type':'text/plain'})));
 for(const chunks of [[new Uint8Array([0xff])],Array.from({length:20},()=>new Uint8Array())]){
  const stream=new ReadableStream({start(controller){for(const item of chunks)controller.enqueue(item);controller.close();}});
  const req=new Request(ORIGIN+PREFIX,{method:'PUT',body:stream,duplex:'half',headers:{'Content-Type':'application/json','Content-Length':'1'}});
  await assert.rejects(boundedLearningJson(req));
 }
});
test('schema distinguishes absent, partial, unregistered and unavailable storage',async()=>{
 const absent=database({migrate:false});assert.equal(await learningSchemaState(absent),'absent');
 assert.deepEqual(await exportLearningProgress(absent,userA.id),[]);
 const ready=database();assert.equal(await learningSchemaState(ready),'ready');
 const partial=database();partial.sql.exec('DROP TABLE member_learning_write_limits');
 await assert.rejects(learningSchemaState(partial));
 await assert.rejects(learningSchemaState(database({ledger:false})));
 await assert.rejects(exportLearningProgress({prepare(){throw Error('unavailable');}},userA.id));
});
test('real SQLite upserts create independent records and reject stale create/update revisions',async()=>{
 const db=database();
 const a=await writeLearningProgress(db,userA.id,SLUG,payload(),1000);
 assert.equal(a.completed,true);assert.equal(a.revision,1);
 assert.equal(await writeLearningProgress(db,userA.id,SLUG,payload(),1100),null);
 assert.deepEqual(await readLearningProgress(db,userB.id),[]);
 const b=await writeLearningProgress(db,userB.id,SLUG,payload(0,false),1200);
 assert.equal(b.revision,1);assert.equal(b.completed,false);
 const update=await writeLearningProgress(db,userA.id,SLUG,payload(1,false),1300);
 assert.equal(update.revision,2);assert.equal(update.completed,false);
 assert.equal(await writeLearningProgress(db,userA.id,SLUG,payload(1,true),1400),null);
 assert.equal((await readLearningProgress(db,userB.id))[0].revision,1);
 await assert.rejects(writeLearningProgress(db,'unknown-member',SLUG,payload()));
});
test('atomic fixed-window counter denies thirteenth write, clock rollback, and isolates members',async()=>{
 const db=database();
 for(let i=0;i<12;i++)assert.equal(await spendLearningMutation(db,userA.id,120000),true);
 assert.equal(await spendLearningMutation(db,userA.id,120000),false);
 assert.equal(await spendLearningMutation(db,userA.id,60000),false);
 assert.equal(await spendLearningMutation(db,userB.id,120000),true);
 assert.equal(await spendLearningMutation(db,userA.id,180000),true);
});
test('endpoint authorizes session, exact origin, method, query and lesson before storage writes',async()=>{
 const db=database();
 assert.equal((await call(db,request(PREFIX+'/unknown','PUT',payload()))).status,404);
 assert.equal((await call(db,request(PREFIX,'POST',payload()))).status,405);
 assert.equal((await call(db,request(PREFIX+'?memberId=member-b'))).status,400);
 assert.equal((await call(db,request(),null)).status,401);
 assert.equal((await call(db,request(),{...userA,emailVerified:false})).status,403);
 assert.equal((await call(db,request(),userA,{ANEVUM_MEMBER_LEARNING_ENABLED:'false'})).status,503);
 assert.equal((await call(db,request(PREFIX+'/'+SLUG,'PUT',payload(),'member-b'))).status,409);
 assert.equal((await call(db,request(PREFIX+'/'+SLUG,'PUT',payload(),null))).status,409);
 assert.equal((await call(db,request(PREFIX+'/'+SLUG,'PUT',payload(),'member-a',{Origin:'https://evil.test'}))).status,403);
 assert.equal((await call(db,request(PREFIX+'/'+SLUG,'PUT',{...payload(),memberId:userB.id}))).status,400);
 assert.deepEqual(await readLearningProgress(db,userA.id),[]);
});
test('successful persistence acknowledgements match scope, version and revision, with no-store reads',async()=>{
 const db=database();const path=PREFIX+'/'+SLUG;
 const saved=await call(db,request(path,'PUT',payload()));assert.equal(saved.status,200);
 const value=await saved.json();assert.equal(value.memberId,userA.id);assert.equal(value.progress.completed,true);
 assert.equal((await call(db,request(path,'PUT',payload()))).status,409);
 const a=await call(db,request());const body=await a.json();assert.equal(body.progress.length,1);
 for(const header of ['Cache-Control','CDN-Cache-Control','Cloudflare-CDN-Cache-Control'])assert.match(a.headers.get(header),/no-store/);
 assert.match(a.headers.get('X-Robots-Tag'),/noindex/);
 assert.equal((await (await call(db,request(PREFIX,'GET',undefined,'member-b'),userB)).json()).progress.length,0);
});
test('endpoint rate limit is enforced with Retry-After and a failed acknowledgement never claims saved',async()=>{
 const db=database();for(let i=0;i<12;i++)await spendLearningMutation(db,userA.id);
 const limited=await call(db,request(PREFIX+'/'+SLUG,'PUT',payload()));
 assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
 assert.deepEqual(await readLearningProgress(db,userA.id),[]);
});
test('export still includes records with feature disabled; scoped cleanup and FK cascade remove only owner',async()=>{
 const db=database();await writeLearningProgress(db,userA.id,SLUG,payload(),1000);
 await writeLearningProgress(db,userB.id,SLUG,payload(),1000);
 await spendLearningMutation(db,userA.id);await spendLearningMutation(db,userB.id);
 assert.equal((await exportLearningProgress(db,userA.id)).length,1);
 await deleteLearningProgress(db,userA.id);
 assert.deepEqual(await exportLearningProgress(db,userA.id),[]);
 assert.equal((await exportLearningProgress(db,userB.id)).length,1);
 db.sql.prepare('DELETE FROM user WHERE id=?').run(userB.id);
 assert.equal(db.sql.prepare('SELECT count(*) AS n FROM member_learning_progress').get().n,0);
 assert.equal(db.sql.prepare('SELECT count(*) AS n FROM member_learning_write_limits').get().n,0);
});
test('migration is additive and re-applicable without erasing an existing member record',async()=>{
 const db=database();await writeLearningProgress(db,userA.id,SLUG,payload(),1000);
 db.sql.exec(readFileSync(new URL('../migrations-learning/0009_member_learning_progress.sql',import.metaurl),'utf8'));
 assert.equal((await readLearningProgress(db,userA.id))[0].revision,1);
});
