// Synthetic, disposable SQLite only. No real accounts or live access changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalWorkbench,WORKBENCH_ROOT as ROOT,PILOT_CAP} from '../canonical-auth/workbench-alpha.mjs';
import {decode,encode,starter,visible,remove,block,SCHEMA,LIMITS} from '../workbench-alpha/document.mjs';
const read=n=>readFileSync(new URL('../canonical-auth/migrations/'+n,import.meta.url),'utf8');
const ORIGIN='https://a.anevum.com';
const PEOPLE=[{id:'owner',handle:'founder'},{id:'alice',handle:'alice'},{id:'bob',handle:'bob'},{id:'reviewer',handle:'reviewer'}];
function setup({flag=true,migrate=true}={}){
 const f=fixture();
 for(const n of ['0008_private_creator_studio.sql','0009_private_review_snapshots.sql'])f.db.exec(read(n));
 f.db.exec('CREATE TABLE staff_access_grants(member_id TEXT PRIMARY KEY,role TEXT,revoked_at INTEGER)');
 if(migrate)f.db.exec(read('0013_workbench_alpha_access.sql'));
 for(const person of PEOPLE){f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)').run(person.id,person.id,person.id+'@fixture.invalid');
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)').run(person.id,person.handle,person.id,1,1);}
 f.db.prepare("INSERT INTO staff_access_grants VALUES('owner','owner',NULL),('reviewer','reviewer',NULL)").run();
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true',CANONICAL_WORKBENCH_ALPHA_ENABLED:flag?'true':'false',CANONICAL_WORKBENCH_SCHEMA_APPROVED:'true'};
 const now=1900000000;
 const call=async(route='/status',{who='alice',method='GET',body,headers={},time=now,origin=ORIGIN}={})=>{
  const req=new Request(origin+ROOT+route,{method,headers:{accept:'application/json',...(method==='GET'?{}:{origin,'sec-fetch-site':'same-origin','content-type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  return canonicalWorkbench(req,env,who?{id:who,emailVerified:true}:null,time);
 };
 const grant=async(memberId='alice',expectedRevision=0,action='grant',days=30,options={})=>call('/access',{who:'owner',method:'POST',body:{memberId,expectedRevision,action,days,reason:'Invited for a bounded private pilot.'},...options});
 return {...f,env,now,call,grant,close:()=>f.db.close()};
}
const makeDraft=(doc=starter())=>({slug:'signal-'+crypto.randomUUID().slice(0,8),title:'First Signal',summary:'A private branching story to test the Workbench.',description:encode(doc),category:'games',freeToUse:true,license:'',sourceUrl:null,demoUrl:null,aiDisclosure:'',humanContribution:''});
async function create(s){const draft=makeDraft(),clientRequestId=crypto.randomUUID();const r=await s.call('/projects',{method:'POST',body:{draft,clientRequestId}});assert.equal(r.status,201,JSON.stringify(await r.clone().json()));return {draft,clientRequestId,...await r.json()};}

test('default closed; incomplete schema and absent session fail closed',async()=>{
 const s=setup({flag:false});try{assert.equal((await s.call()).status,404);s.env.CANONICAL_WORKBENCH_ALPHA_ENABLED='true';assert.equal((await s.call('/status',{who:null})).status,401);delete s.env.CANONICAL_WORKBENCH_SCHEMA_APPROVED;assert.equal((await s.call()).status,503);}finally{s.close()}
 const m=setup({migrate:false});try{assert.equal((await m.call()).status,503);}finally{m.close()}
});
test('owner authority comes from actual staff grant, never email, XP or reviewer role',async()=>{
 const s=setup();try{assert.equal((await (await s.call('/status',{who:'owner'})).json()).canManage,true);
  assert.equal((await (await s.call('/status',{who:'reviewer'})).json()).allowed,false);
  assert.equal((await s.call('/access',{who:'reviewer'})).status,403);
  s.db.prepare("UPDATE staff_access_grants SET revoked_at=1 WHERE member_id='owner'").run();
  assert.equal((await s.call('/access',{who:'owner'})).status,403);assert.equal((await s.grant()).status,403);
 }finally{s.close()}
});
test('grant is target-bound, expires, revokes and retains an atomic access audit',async()=>{
 const s=setup();try{
  assert.equal((await (await s.call()).json()).allowed,false);assert.equal((await s.call('/projects')).status,403);
  assert.equal((await s.grant()).status,200);assert.equal((await (await s.call()).json()).allowed,true);
  assert.equal((await (await s.call('/status',{who:'bob'})).json()).allowed,false);
  assert.equal((await s.grant('alice',0)).status,409);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_workbench_access_log').get().n,1);
  assert.equal((await (await s.call('/status',{time:s.now+30*86400})).json()).allowed,false);
  assert.equal((await s.grant('alice',1,'revoke')).status,200);
  assert.equal((await s.call('/projects')).status,403);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_workbench_access_log').get().n,2);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM staff_access_grants').get().n,2,'Invitation did not grant a staff role');
 }finally{s.close()}
});
test('foreign origins, unsupported verbs and forged identity fields are refused',async()=>{
 const s=setup();try{
  assert.equal((await s.grant('alice',0,'grant',30,{headers:{origin:'https://evil.invalid'}})).status,403);
  assert.equal((await s.grant('alice',0,'grant',30,{headers:{'sec-fetch-site':'same-site'}})).status,403);
  assert.equal((await s.call('/status',{origin:'https://evil.invalid'})).status,404);
  assert.equal((await s.call('/access',{who:'owner',method:'DELETE'})).status,405);
  assert.equal((await s.call('/access',{who:'owner',method:'POST',body:{memberId:'alice',expectedRevision:0,action:'grant',days:30,reason:'Private pilot participant.',role:'owner'}})).status,422);
  assert.equal((await s.grant('missing')).status,409);
  assert.equal((await s.grant('alice',0,'grant',90)).status,422,'Invitation beyond 30 days is denied');
  assert.equal((await s.grant('owner')).status,422);
 }finally{s.close()}
});
test('owner resolves exact canonical handles without exposing emails',async()=>{
 const s=setup();try{
  const r=await s.call('/member?handle=alice',{who:'owner'});assert.equal(r.status,200);const text=await r.text();assert.doesNotMatch(text,/@fixture|email/);assert.equal(JSON.parse(text).member.memberId,'alice');
  assert.equal((await s.call('/member?handle=alice')).status,403);
  assert.equal((await s.call('/member?handle=alice&handle=bob',{who:'owner'})).status,422);
  assert.equal((await s.call('/member?handle=ali',{who:'owner'})).status,404);
 }finally{s.close()}
});
test('bounded invitations and change rate cannot create unbounded open access',async()=>{
 const s=setup();try{
  for(let i=0;i<PILOT_CAP+1;i++){const id='person'+i;s.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)').run(id,id,id+'@fixture.invalid');const r=await s.grant(id);assert.equal(r.status,i<PILOT_CAP?200:409);}
  assert.equal((await s.grant('person0',1,'revoke')).status,200);
  assert.equal((await s.grant('person10')).status,200);
 }finally{s.close()}
});
test('private projects use the existing Studio identity and survive save/reload',async()=>{
 const s=setup();try{await s.grant();const c=await create(s);const id=c.project.id;
  const r=await s.call('/projects/'+id);assert.equal(r.status,200);assert.equal((await r.json()).project.description,c.draft.description);
  assert.equal(s.db.prepare('SELECT user_id FROM member_studio_projects WHERE id=?').get(id).user_id,'alice');
  const again=await s.call('/projects',{method:'POST',body:{draft:c.draft,clientRequestId:c.clientRequestId}});assert.equal((await again.json()).replayed,true);
  const doc=decode(c.draft.description);doc.blocks[1].text='A changed signal.';
  const next={...c.draft,description:encode(doc)};
  const saved=await s.call('/projects/'+id,{method:'PATCH',body:{revision:c.project.revision,draft:next}});assert.equal(saved.status,200,await saved.clone().text());
  assert.equal((await (await s.call('/projects/'+id)).json()).project.description,next.description);
  const stale=await s.call('/projects/'+id,{method:'PATCH',body:{revision:c.project.revision,draft:c.draft}});assert.equal(stale.status,409);
  assert.equal((await (await s.call('/projects/'+id)).json()).project.description,next.description);
 }finally{s.close()}
});
test('another invited account cannot read or overwrite a private project',async()=>{
 const s=setup();try{await s.grant();await s.grant('bob');const c=await create(s);const id=c.project.id;
  assert.equal((await s.call('/projects/'+id,{who:'bob'})).status,404);
  assert.equal((await s.call('/projects/'+id,{who:'bob',method:'PATCH',body:{revision:1,draft:c.draft}})).status,404);
  assert.equal((await (await s.call('/projects',{who:'bob'})).json()).projects.length,0);
  assert.equal((await s.call('/projects/'+id,{who:'owner'})).status,404,'Owner pilot management is not automatic draft ownership');
 }finally{s.close()}
});
test('revoking access denies new writes but does not delete existing creative work',async()=>{
 const s=setup();try{await s.grant();const c=await create(s);await s.grant('alice',1,'revoke');
  assert.equal((await s.call('/projects/'+c.project.id,{method:'PATCH',body:{revision:1,draft:c.draft}})).status,403);
  assert.equal(s.db.prepare('SELECT description FROM member_studio_projects WHERE id=?').get(c.project.id).description,c.draft.description);
 }finally{s.close()}
});
test('no executable import, model invocation, publish or moderation route exists',async()=>{
 const s=setup();try{await s.grant();for(const p of ['/publish','/review','/ai','/shell','/projects/'+crypto.randomUUID()+'/submit'])assert.equal((await s.call(p,{method:'POST',body:{}})).status,404);
  const d={...makeDraft(),description:'<script>fetch("/private")</script>'};
  assert.equal((await s.call('/projects',{method:'POST',body:{draft:d,clientRequestId:crypto.randomUUID()}})).status,422);
 }finally{s.close()}
});
test('V054 wire compatibility, text-only semantics, limits and scene navigation',()=>{
 const doc=starter(),raw=encode(doc);assert.ok(raw.startsWith('ANEVUM_BLOCKS_V1\n'));assert.deepEqual(decode(raw),doc);
 const first=visible(doc,null);assert.equal(first[0].type,'scene');const choice=first.find(b=>b.type==='choice');assert.equal(visible(doc,choice.target)[0].id,choice.target);
 assert.equal(remove(doc,choice.target).blocks.find(b=>b.id===choice.id).target,null);
 const literal={schema:SCHEMA,blocks:[block('paragraph','<script>alert(1)</script>')]};assert.equal(decode(encode(literal)).blocks[0].text,'<script>alert(1)</script>');
 assert.equal(decode(raw+' '),null);assert.equal(decode('ANEVUM_BLOCKS_V1\n{}'),null);
 assert.throws(()=>encode({...doc,blocks:Array(LIMITS.blocks+1).fill(doc.blocks[0])}));
 assert.throws(()=>encode({...doc,blocks:[{...doc.blocks[0],target:'https://evil.invalid'}]}));
 assert.throws(()=>encode({...doc,blocks:[{...doc.blocks[0],text:'x'.repeat(2501)}]}));
 assert.throws(()=>encode({schema:SCHEMA,blocks:Array.from({length:5},()=>block('paragraph','x'.repeat(2000)))}));
});
test('audit failure rolls back the grant instead of granting unaudited access',async()=>{
 const s=setup();try{
  s.db.exec("CREATE TRIGGER deny_audit BEFORE INSERT ON member_workbench_access_log BEGIN SELECT RAISE(ABORT,'fixture audit outage'); END;");
  assert.equal((await s.grant()).status,503);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM member_workbench_access').get().n,0);
 }finally{s.close()}
});
test('canonical Worker wiring retains session resolution and independent feature gate',()=>{
 const source=readFileSync(new URL('../canonical-auth/worker.mjs',import.meta.url),'utf8');
 assert.match(source,/ownWorkbench&&env\?\.CANONICAL_WORKBENCH_ALPHA_ENABLED!=="true"/);
 assert.match(source,/canonicalWorkbench\(clean,env,session.user\)/);
 assert.match(source,/sameOriginMutation\(request,env\)/);
 assert.doesNotMatch(source,/WORKBENCH_ALPHA_ENABLED\s*:\s*['"]true/);
});
