import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../web/a-canonical-stage.review.mjs';
import {canonicalSpace} from '../canonical-auth/space.mjs';
import {fixture} from './helpers/canonical-fixture.mjs';
const origin='https://a.anevum.com';
const get=path=>new Request(origin+path);
function seed(db,id,handle,visibility='public',verified=1,at=100){
 db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,0,0)').run(id,handle,id+'@fixture.invalid',verified);
 db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at,headline,world_theme,focus_json) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,handle,'Member '+handle,'PRIVATE BIO SHOULD NOT APPEAR IN DIRECTORY',visibility,at,at,'Building small worlds','nocturne','["writing","games"]');
 db.prepare('INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at) VALUES(?,?,?,?,?)').run(id.padStart(36,'0'),id,'A saved update from '+handle,at,at);
}
test('public member discovery and wall activity include only verified opt-in profiles and safe fields',async()=>{
 const {db,env}=fixture();try{
  seed(db,'a','alpha_world');seed(db,'b','beta_world','private');seed(db,'c','gamma_world','public',0);
  const directory=await worker.fetch(get('/api/v1/community/members'),env);assert.equal(directory.status,200);assert.match(directory.headers.get('cache-control'),/no-store/);
  const data=await directory.json();assert.deepEqual(data.items.map(p=>p.handle),['alpha_world']);assert.equal(data.items[0].avatar,false);
  for(const field of ['email','userId','user_id','bio','visibility','revision','stats','xp','level'])assert.equal(data.items[0][field],undefined,field);
  assert.ok(!JSON.stringify(data).includes('PRIVATE BIO'));
  const feed=await (await worker.fetch(get('/api/v1/community/activity'),env)).json();assert.equal(feed.items.length,1);assert.match(feed.items[0].excerpt,/alpha_world/);
  db.prepare("UPDATE member_creator_profiles SET visibility='private' WHERE user_id='a'").run();
  for(const path of ['members','activity'])assert.equal((await (await worker.fetch(get('/api/v1/community/'+path),env)).json()).items.length,0);
  assert.equal((await worker.fetch(new Request(origin+'/api/v1/community/members',{method:'POST',headers:{origin}}),env)).status,405);
  assert.equal((await worker.fetch(get('/api/v1/community/members?memberId=b'),env)).status,400);
 }finally{db.close()}
});
test('directory uses literal search, interest filters and bounded stable pagination',async()=>{
 const {db,env}=fixture();try{
  for(let i=0;i<15;i++)seed(db,String(i+1),`member_${String(i).padStart(2,'0')}`,'public',1,100+i);
  const first=await (await worker.fetch(get('/api/v1/community/members'),env)).json();assert.equal(first.items.length,12);assert.ok(first.nextCursor);
  const second=await (await worker.fetch(get('/api/v1/community/members?after='+encodeURIComponent(first.nextCursor)),env)).json();assert.equal(second.items.length,3);assert.equal(second.nextCursor,null);assert.equal(new Set([...first.items,...second.items].map(p=>p.handle)).size,15);
  const search=await (await worker.fetch(get('/api/v1/community/members?q=%40member_03&focus=writing'),env)).json();assert.deepEqual(search.items.map(p=>p.handle),['member_03']);
  assert.equal((await (await worker.fetch(get('/api/v1/community/members?q=%25'),env)).json()).items.length,0);
  assert.equal((await (await worker.fetch(get('/api/v1/community/members?focus=music'),env)).json()).items.length,0);
  for(const query of ['after=invalid','q=a&q=b','focus=staff','q='+('a'.repeat(73))])assert.equal((await worker.fetch(get('/api/v1/community/members?'+query),env)).status,400);
  const head=await worker.fetch(new Request(origin+'/api/v1/community/members',{method:'HEAD'}),env);assert.equal(head.status,200);assert.equal(await head.text(),'');
 }finally{db.close()}
});

test('community composer rejects a stale visibility choice without saving an entry',async()=>{
 const {db,env}=fixture();try{
  seed(db,'a','alpha_world','public');
  const post=body=>canonicalSpace(new Request(origin+'/api/v1/member/wall',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env,{id:'a',emailVerified:true});
  assert.equal((await post({body:'Private draft',expectedVisibility:'private'})).status,409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_wall_posts').get().n,1);
  assert.equal((await post({body:'Public update',expectedVisibility:'public'})).status,201);
  assert.equal((await post({body:'Invalid',expectedVisibility:'everyone'})).status,400);
  db.prepare("UPDATE member_creator_profiles SET visibility='private' WHERE user_id='a'").run();
  assert.equal((await post({body:'Stale public update',expectedVisibility:'public'})).status,409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_wall_posts').get().n,2);
 }finally{db.close()}
});
