import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import api from '../api/worker.mjs';
import {communityPostRoutes} from '../auth/community-posts.mjs';
import {communityPostModeration} from '../authoring/community-post-moderation.mjs';
import {communityReplyModeration} from '../authoring/community-reply-moderation.mjs';
import staging from '../web/staging-path-worker.mjs';
import main from '../web/main-worker.mjs';

const fixed=n=>n.toString(16).padStart(32,'0');
const now=Math.floor(Date.now()/1000)-120;
const message={title:'Feedback for this real release',body:'Can we reproduce the keyboard navigation issue and discuss a fix?',topic:'games'};
function fixture(context=true){
 const sql=new DatabaseSync(':memory:');
 sql.exec("PRAGMA foreign_keys=ON; CREATE TABLE schema_migrations(version TEXT PRIMARY KEY); CREATE TABLE member_accounts(id TEXT PRIMARY KEY,status TEXT); CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY REFERENCES member_accounts(id),handle TEXT UNIQUE,display_name TEXT,status TEXT); CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT REFERENCES creator_profiles(member_id),title TEXT,category TEXT,status TEXT,published_at TEXT)");
 for(const [id,status] of [['one','active'],['two','active'],['three','active'],['blocked','suspended']]){
   sql.prepare('INSERT INTO member_accounts VALUES(?,?)').run(id,status);
   sql.prepare("INSERT INTO creator_profiles VALUES(?,?,?,'active')").run(id,'maker_'+id,'Maker '+id);
 }
 for(const [id,status,who,date] of [['public','published','one',"2026-10-01"],['private','draft','one',"2026-10-01"],['future','published','one',"2999-10-01"],['no-date','published','one',null],['hidden-maker','published','three',"2026-10-01"]])
   sql.prepare('INSERT INTO projects VALUES(?,?,?,?,?,?)').run(id,who,'Project '+id,'games',status,date);
 sql.prepare("UPDATE creator_profiles SET status='suspended' WHERE member_id='three'").run();
 sql.exec(readFileSync(new URL('../auth/migrations/0007_community_post_stream.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../auth/migrations/0008_community_reply_reviews.sql',import.meta.url),'utf8'));
 if(context)sql.exec(readFileSync(new URL('../auth/migrations/0013_community_post_projects.sql',import.meta.url),'utf8'));
 const stmt=(query,args=[])=>({query,args,bind(...values){return stmt(query,values)},async all(){return {success:true,results:sql.prepare(query).all(...args).map(x=>({...x}))}},async run(){const r=sql.prepare(query).run(...args);return {success:true,meta:{changes:Number(r.changes)}}}});
 const db={prepare:query=>stmt(query),async batch(statements){sql.exec('BEGIN IMMEDIATE');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const publicCall=(path='',method='GET')=>api.fetch(new Request('https://next.anevum.com/api/v1/community/posts'+path,{method}),{COMMUNITY_DB:db});
 const member=(path='',who='two',method='POST',data=message)=>communityPostRoutes(new Request('https://next.anevum.com/api/v1/member/community/posts'+path,{method,headers:{'content-type':'application/json'},body:method==='POST'?JSON.stringify(data):undefined}),db,{id:who,handle:'maker_'+who},async()=>true,now);
 const staff=(id,action='publish',revision=1)=>communityPostModeration(new Request('https://studio.next.anevum.com/api/community-posts/'+id+'/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reason:'Reviewed the project context and original text for publication.',revision})}),db,'staff@example.com');
 const submit=async(projectId=null,who='two')=>{const response=await member('',who,'POST',{...message,...(projectId?{projectId}:{})});assert.equal(response.status,201,await response.clone().text());return (await response.json()).id;};
 return {sql,db,publicCall,member,staff,submit};
}
test('old staging schema preserves general posts and refuses project associations',async()=>{
 const f=fixture(false);try{
   const id=await f.submit();assert.equal((await f.staff(id)).status,200);
   assert.equal((await f.publicCall()).status,200);
   assert.equal((await f.member('','two','POST',{...message,projectId:'public'})).status,503);
   assert.equal((await f.publicCall('?project=public')).status,503);
   assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM community_posts').get().n,1);
 }finally{f.sql.close();}
});
test('project association is private, exact, atomic and limited to currently public work',async()=>{
 const f=fixture();try{
   for(const id of ['private','future','no-date','hidden-maker','missing'])assert.equal((await f.member('','two','POST',{...message,projectId:id})).status,404,id);
   for(const projectId of ['',42,'x/y',"public' OR 1=1--"])assert.equal((await f.member('','two','POST',{...message,projectId})).status,400);
   const id=await f.submit('public');
   assert.equal(f.sql.prepare('SELECT status FROM community_posts WHERE id=?').get(id).status,'pending_review');
   assert.equal(f.sql.prepare('SELECT project_id FROM community_post_projects WHERE post_id=?').get(id).project_id,'public');
   assert.deepEqual((await (await f.publicCall('?project=public')).json()).items,[]);
   const own=await (await f.member('/mine','two','GET')).json();assert.equal(own.items[0].projectId,'public');
   assert.deepEqual((await (await f.member('/mine','one','GET')).json()).items,[]);
 }finally{f.sql.close();}
});
test('approved discussions connect author and exact project with whitelisted public metadata',async()=>{
 const f=fixture();try{
   const linked=await f.submit('public'),general=await f.submit(null,'one');
   await f.staff(linked);await f.staff(general);
   const project=await (await f.publicCall('?project=public&sort=new')).json();
   assert.deepEqual(project.items.map(x=>x.id),[linked]);
   assert.deepEqual(project.items[0].project,{id:'public',title:'Project public',category:'games',creatorHandle:'maker_one',creatorName:'Maker one'});
   assert.equal(project.items[0].authorHandle,'maker_two');
   assert.doesNotMatch(JSON.stringify(project),/staff@example|author_member_id|linkedProjectId|contextAvailable/);
   assert.deepEqual((await (await f.publicCall('?creator=MAKER_TWO')).json()).items.map(x=>x.id),[linked]);
   assert.deepEqual((await (await f.publicCall('?creator=maker_one&project=public')).json()).items,[]);
   assert.deepEqual((await (await f.publicCall('?project=private')).json()).items,[]);
   assert.deepEqual((await (await f.publicCall('?project=missing')).json()).items,[]);
   assert.deepEqual((await (await f.publicCall('/'+linked)).json()).post.project,project.items[0].project);
 }finally{f.sql.close();}
});
test('withdrawal, creator suspension and deletion suppress every public and reaction path',async()=>{
 const f=fixture();try{
   const id=await f.submit('public');await f.staff(id);
   f.sql.exec("UPDATE creator_profiles SET status='active' WHERE member_id='three'");
   for(const action of ["UPDATE projects SET status='draft' WHERE id='public'","UPDATE creator_profiles SET status='suspended' WHERE member_id='one'","UPDATE projects SET published_at='2999-01-01' WHERE id='public'"]){
     f.sql.exec(action);
     assert.deepEqual((await (await f.publicCall()).json()).items,[]);
     assert.equal((await f.publicCall('/'+id)).status,404);
     assert.equal((await f.member('/'+id+'/react','three','GET')).status,404);
     assert.equal((await f.member('/'+id+'/react','three','POST',{score:1,revision:0})).status,404);
     assert.equal((await f.member('/'+id+'/replies','three','POST',{body:'Useful independent feedback for the project.'})).status,404);
     assert.equal((await f.member('/'+id+'/replies/mine','three','GET')).status,404);
     f.sql.exec("UPDATE projects SET status='published',published_at='2026-10-01' WHERE id='public'; UPDATE creator_profiles SET status='active' WHERE member_id='one'");
   }
   f.sql.exec("UPDATE projects SET title='Current title' WHERE id='public'");
   assert.equal((await (await f.publicCall('/'+id)).json()).post.project.title,'Current title');
   f.sql.exec("DELETE FROM projects WHERE id='public'");
   assert.deepEqual((await (await f.publicCall()).json()).items,[]);
   assert.equal((await f.publicCall('/'+id)).status,404);
   assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM community_post_projects').get().n,1);
 }finally{f.sql.close();}
});
test('staff cannot publish stale project context and failed linking rolls back the pending post',async()=>{
 const f=fixture();try{
   const id=await f.submit('public');f.sql.exec("UPDATE projects SET status='draft' WHERE id='public'");
   assert.equal((await f.staff(id)).status,409);
   assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM community_post_review_events').get().n,0);
   const queue=await communityPostModeration(new Request('https://studio.next.anevum.com/api/community-posts'),f.db,'staff@example.com');
   assert.equal((await queue.json()).items[0].contextAvailable,false);
   assert.equal((await f.staff(id,'reject')).status,200);
   f.sql.exec("UPDATE projects SET status='published' WHERE id='public'; CREATE TRIGGER fail_context BEFORE INSERT ON community_post_projects BEGIN SELECT RAISE(ABORT,'context write failed'); END");
   assert.equal((await f.member('','two','POST',{...message,projectId:'public'})).status,503);
   assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM community_posts').get().n,1);
 }finally{f.sql.close();}
});
test('counts and hot order exclude future replies, hidden authors, suspended voters and self-votes',async()=>{
 const f=fixture();try{
   const id=await f.submit(),other=await f.submit(null,'one');await f.staff(id);await f.staff(other);
   f.sql.prepare("UPDATE creator_profiles SET status='active' WHERE member_id='three'").run();
   for(const [n,who,status,date] of [[1,'one','published','2026-10-01'],[2,'blocked','published','2026-10-01'],[3,'one','published','2999-01-01'],[4,'one','hidden','2026-10-01']])
     f.sql.prepare('INSERT INTO community_post_replies(id,post_id,author_member_id,body,status,created_at,published_at) VALUES(?,?,?,?,?,?,?)').run(fixed(n),id,who,'Synthetic test reply only.',status,now,date);
   for(const who of ['one','blocked','two'])f.sql.prepare('INSERT INTO community_post_votes VALUES(?,?,1,1,?,?)').run(who,id,now,now);
   const detail=await (await f.publicCall('/'+id)).json();
   assert.equal(detail.post.score,1);assert.equal(detail.post.replyCount,1);assert.equal(detail.replies.length,1);
   const feed=await (await f.publicCall('?sort=hot')).json();assert.equal(feed.items[0].id,id);assert.equal(feed.items[0].replyCount,1);
 }finally{f.sql.close();}
});
test('filtered readers remain bounded, strict, read-only and fail closed',async()=>{
 const f=fixture();try{
   for(const query of ['project=','project=x/y','creator=bad!','creator=','project=public&project=public','creator=maker_one&creator=maker_one','sort=hot&unreviewed=1','limit=25'])assert.equal((await f.publicCall('?'+query)).status,400,query);
   assert.equal((await f.publicCall('?project=public','POST')).status,405);
   const head=await f.publicCall('?project=public','HEAD');assert.equal(head.status,200);assert.equal(await head.text(),'');
   f.sql.exec('DROP TABLE community_post_projects; CREATE TABLE community_post_projects(incorrect TEXT)');
   const bad=await f.publicCall();assert.equal(bad.status,503);assert.doesNotMatch(await bad.text(),/incorrect|SQL|sqlite/i);
 }finally{f.sql.close();}
});
test('missing context table after migration cannot turn linked posts into general public posts',async()=>{
 const f=fixture();try{
   const id=await f.submit('public');await f.staff(id);
   f.sql.exec('DROP TABLE community_post_projects');
   assert.equal((await f.publicCall()).status,503);
   assert.equal((await f.publicCall('/'+id)).status,503);
   assert.equal((await f.member('/'+id+'/react','one','GET')).status,503);
 }finally{f.sql.close();}
});
test('concurrent reply workflow cannot publish a reply after its linked project is withdrawn',async()=>{
 const f=fixture();try{
   const id=await f.submit('public');await f.staff(id);
   const pending=await f.member('/'+id+'/replies','one','POST',{body:'Independent project feedback that requires moderation.'});
   assert.equal(pending.status,201);const replyId=(await pending.json()).id;
   f.sql.exec("UPDATE projects SET status='draft' WHERE id='public'");
   const review=await communityReplyModeration(new Request('https://studio.next.anevum.com/api/community-post-replies/'+replyId+'/publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reason:'Reviewed genuine project feedback for safe public participation.',revision:1})}),f.db,'staff@example.com');
   assert.equal(review.status,409);
   assert.equal(f.sql.prepare('SELECT status FROM community_post_replies WHERE id=?').get(replyId).status,'pending_review');
   assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM community_reply_review_events').get().n,0);
 }finally{f.sql.close();}
});
test('public gateways admit only the read-only boards and approved post routes',async()=>{
 const f=fixture();try{
   const id=await f.submit('public');await f.staff(id);
   for(const [worker,origin,prefix] of [[staging,'https://next.anevum.com','/creator'],[main,'https://anevum.com','']]){
     let assets=0;
     const env={COMMUNITY_DB:f.db,ASSETS:{fetch(){assets++;throw Error('API must not fall through to HTML')}}};
     const response=await worker.fetch(new Request(origin+prefix+'/api/v1/community/posts?project=public'),env,{});
     assert.equal(response.status,200);assert.equal((await response.json()).items[0].id,id);
     assert.equal((await worker.fetch(new Request(origin+prefix+'/api/v1/community/posts/'+id),env,{})).status,200);
     assert.equal((await worker.fetch(new Request(origin+prefix+'/api/v1/boards'),{},{})).status,503);
     for(const path of ['/api/v1/community/posts/pending','/api/v1/member/community/posts','/api/v1/community/review'])
       assert.equal((await worker.fetch(new Request(origin+prefix+path),env,{})).status,404,path);
     assert.equal((await worker.fetch(new Request(origin+prefix+'/api/v1/community/posts',{method:'POST'}),env,{})).status,405);
     assert.equal(assets,0);
   }
 }finally{f.sql.close();}
});
