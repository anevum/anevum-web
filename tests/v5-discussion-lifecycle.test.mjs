import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {commonsSocialEndpoint,exportMemberSocial} from "../src/server/commons-social.mjs";
const origin="https://anevum-member-staging.devonakins.workers.dev",base="/api/member/commons/posts";
const a={id:"alpha",emailVerified:true},b={id:"beta",emailVerified:true};
const id=n=>"223e4567-e89b-12d3-a456-"+String(n).padStart(12,"0");
function fixture(){
  const sql=new DatabaseSync(":memory:");
  for(const file of ["migrations/0001_member_platform.sql","migrations-social/0006_commons_v5_discussions.sql","migrations-social/0007_commons_paging_indexes.sql"])sql.exec(readFileSync(new URL("../"+file,import.meta.url),"utf8"));
  for(const user of [a,b])sql.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)').run(user.id,user.id,user.id+"@example.test");
  const db={prepare(query){const statement=sql.prepare(query);const methods=args=>({all:async()=>({results:statement.all(...args)}),run:async()=>({meta:{changes:Number(statement.run(...args).changes)}})});return {...methods([]),bind:(...args)=>methods(args)};}};
  const call=async(route,method="GET",data,user=a,extra={})=>{
    const response=await commonsSocialEndpoint(new Request(origin+route,{method,headers:{"Content-Type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)}),{MEMBER_DB:db,MEMBER_PREVIEW_ORIGIN:origin,ANEVUM_MEMBER_PREVIEW_ENABLED:"true",ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"true",...extra},user,origin,route.split("?")[0]);
    assert.equal(response.headers.get("Cache-Control"),"private, no-store");return {status:response.status,payload:await response.json()};
  };
  const posts=(count=70)=>{for(let n=0;n<count;n++)sql.prepare("INSERT INTO commons_v5_posts VALUES(?,?,?,?,?,'PUBLISHED',?,?)").run(id(n),n%2?a.id:b.id,n%2?"research":"systems","Synthetic discussion "+n,"Detailed methodological question with independent evidence.",1000+Math.floor(n/3),1000+Math.floor(n/3));};
  const replies=(postId,count=120)=>{for(let n=0;n<count;n++)sql.prepare("INSERT INTO commons_v5_replies VALUES(?,?,?,?,'PUBLISHED',?)").run(id(n+1000),postId,n%2?b.id:a.id,"Synthetic reply "+n,2000+Math.floor(n/3));};
  return {sql,db,call,posts,replies};
}
test("real-schema keyset feed traverses same-second records exactly once",async()=>{
  const f=fixture();try{f.posts();let cursor=null,seen=[];
    do{const {status,payload}=await f.call(base+(cursor?"?cursor="+cursor:""));assert.equal(status,200);assert.equal(payload.viewerMemberId,a.id);assert.equal(payload.schemaVersion,"anevum.commons-discussions.v1");assert.ok(payload.posts.length<=30);assert.equal(payload.hasMore,payload.nextCursor!==null);seen.push(...payload.posts.map(row=>row.id));cursor=payload.nextCursor;}while(cursor);
    const feedPlan=f.sql.prepare("EXPLAIN QUERY PLAN SELECT id FROM commons_v5_posts WHERE status='PUBLISHED' ORDER BY created_at DESC,id DESC LIMIT 31").all().map(row=>row.detail).join(" ");
    const replyPlan=f.sql.prepare("EXPLAIN QUERY PLAN SELECT id FROM commons_v5_replies WHERE post_id=? AND status='PUBLISHED' ORDER BY created_at ASC,id ASC LIMIT 51").all(id(0)).map(row=>row.detail).join(" ");
    assert.match(feedPlan,/commons_v5_posts_published_page/);assert.match(replyPlan,/commons_v5_replies_paged/);assert.doesNotMatch(feedPlan+replyPlan,/TEMP B-TREE/);
    assert.equal(seen.length,70);assert.equal(new Set(seen).size,70);assert.deepEqual(seen,Array.from({length:70},(_,n)=>id(69-n)));
    const filtered=await f.call(base+"?topic=research");assert.equal(filtered.payload.posts.length,30);assert.ok(filtered.payload.posts.every(row=>row.topic==="research"));
    const rest=await f.call(base+"?topic=research&cursor="+filtered.payload.nextCursor);assert.equal(rest.payload.posts.length,5);assert.equal(rest.payload.nextCursor,null);
    assert.doesNotMatch(JSON.stringify(filtered.payload),/author_user_id|@example|broker|balance/);
  }finally{f.sql.close();}
});
test("insertions above the cursor and deletion of its anchor cannot repeat or skip surviving older rows",async()=>{
  const f=fixture();try{f.posts();const first=await f.call(base),anchor=first.payload.posts.at(-1).id;
    f.sql.prepare("DELETE FROM commons_v5_posts WHERE id IN (?,?)").run(anchor,id(35));f.sql.prepare("UPDATE commons_v5_posts SET status='HIDDEN' WHERE id=?").run(id(34));
    f.sql.prepare("INSERT INTO commons_v5_posts VALUES(?,?,'research',?,?,'PUBLISHED',9000,9000)").run(id(999),a.id,"Newly arrived discussion","This new discussion must remain above the previous browsing cursor.");
    let cursor=first.payload.nextCursor,seen=first.payload.posts.map(row=>row.id);
    while(cursor){const {payload}=await f.call(base+"?cursor="+cursor);seen.push(...payload.posts.map(row=>row.id));cursor=payload.nextCursor;}
    assert.equal(new Set(seen).size,68);assert.ok(!seen.includes(id(999))&&!seen.includes(id(35))&&!seen.includes(id(34)));assert.ok(seen.includes(id(0)));
  }finally{f.sql.close();}
});
test("reply paging walks all rows, distinguishes exact full pages and binds each cursor to its parent",async()=>{
  const f=fixture();try{f.posts(2);f.replies(id(0));let cursor=null,seen=[];
    do{const {payload,status}=await f.call(base+"/"+id(0)+"/replies"+(cursor?"?cursor="+cursor:""));assert.equal(status,200);assert.equal(payload.postId,id(0));assert.ok(payload.replies.length<=50);seen.push(...payload.replies.map(row=>row.id));cursor=payload.nextCursor;}while(cursor);
    assert.deepEqual(seen,Array.from({length:120},(_,n)=>id(n+1000)));
    const first=await f.call(base+"/"+id(0)+"/replies");assert.equal((await f.call(base+"/"+id(1)+"/replies?cursor="+first.payload.nextCursor)).status,400);
    f.sql.prepare("DELETE FROM commons_v5_replies WHERE id>=?").run(id(1050));const exact=await f.call(base+"/"+id(0)+"/replies");assert.equal(exact.payload.replies.length,50);assert.equal(exact.payload.hasMore,false);assert.equal(exact.payload.nextCursor,null);
    f.sql.prepare("UPDATE commons_v5_posts SET status='HIDDEN' WHERE id=?").run(id(0));assert.equal((await f.call(base+"/"+id(0)+"/replies")).payload.replies.length,0);
  }finally{f.sql.close();}
});
test("reply removal is author-scoped, parent-scoped, text-scrubbing and export-visible",async()=>{
  const f=fixture();try{f.posts(2);f.replies(id(0),2);const own=base+"/"+id(0)+"/replies/"+id(1001);
    assert.equal((await f.call(own,"DELETE",undefined,a)).status,404);
    assert.equal((await f.call(base+"/"+id(1)+"/replies/"+id(1001),"DELETE",undefined,b)).status,404);
    assert.equal((await f.call(own,"DELETE",{memberId:b.id},b)).status,400);
    assert.equal((await f.call(own+"?memberId=beta","DELETE",undefined,b)).status,400);
    assert.equal((await f.call(own,"POST",{},b)).status,405);
    const removed=await f.call(own,"DELETE",undefined,b);assert.equal(removed.status,200);assert.equal(removed.payload.replyId,id(1001));assert.equal(removed.payload.viewerMemberId,b.id);
    assert.equal((await f.call(own,"DELETE",undefined,b)).status,404);
    const stored=f.sql.prepare("SELECT body,status FROM commons_v5_replies WHERE id=?").get(id(1001));assert.deepEqual({...stored},{body:"Removed by author request.",status:"REMOVED"});
    const list=await f.call(base+"/"+id(0)+"/replies");assert.equal(list.payload.replies.length,1);
    const exported=await exportMemberSocial(f.db,b.id);assert.equal(exported.replies[0].status,"REMOVED");assert.equal(exported.replies[0].body,"Removed by author request.");
    f.sql.prepare('DELETE FROM "user" WHERE id=?').run(b.id);assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM commons_v5_replies WHERE author_user_id=?").get(b.id).n,0);assert.equal(f.sql.prepare("PRAGMA foreign_key_check").all().length,0);
  }finally{f.sql.close();}
});
test("malformed, crossed-kind, crossed-filter and duplicated cursor inputs never select authority",async()=>{
  const f=fixture();try{f.posts();const first=await f.call(base),cursor=first.payload.nextCursor;
    for(const query of ["?cursor=","?cursor=%3D","?cursor="+"a".repeat(351),"?cursor="+cursor+"&cursor="+cursor,"?topic=research&cursor="+cursor,"?memberId=alpha","?topic=research&topic=systems"]){assert.equal((await f.call(base+query)).status,400,query);}
    assert.equal((await f.call(base+"/"+id(0)+"/replies?cursor="+cursor)).status,400);
    assert.equal((await f.call(base+"?cursor="+cursor,"GET",undefined,null)).status,401);
    assert.equal((await f.call(base+"?cursor="+cursor,"GET",undefined,{...b,emailVerified:false})).status,403);
    assert.equal((await f.call(base,"GET",undefined,a,{ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false"})).status,503);
    const own=base+"/"+id(0)+"/replies/"+id(1000);assert.equal((await f.call(own,"DELETE",undefined,a,{ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false"})).status,503);
  }finally{f.sql.close();}
});
test("authenticated lifecycle acknowledgements use only server identity and preserve quota accounting after removal",async()=>{
  const f=fixture();try{const content={topic:"research",title:"Bounded research question",body:"A reproducible methodological question for discussion."};
    const created=await f.call(base,"POST",content,a);assert.equal(created.status,201);assert.equal(created.payload.viewerMemberId,a.id);const postId=created.payload.post.id;
    const replied=await f.call(base+"/"+postId+"/replies","POST",{body:"Independent evidence."},b);assert.equal(replied.payload.viewerMemberId,b.id);
    const report=await f.call(base+"/"+postId+"/report","POST",{reason:"privacy"},b);assert.equal(report.payload.postId,postId);assert.equal(report.payload.viewerMemberId,b.id);
    const removed=await f.call(base+"/"+postId,"DELETE",undefined,a);assert.equal(removed.payload.postId,postId);assert.equal(removed.payload.viewerMemberId,a.id);
    for(let n=0;n<2;n++){const p=await f.call(base,"POST",content,a);assert.equal(p.status,201);await f.call(base+"/"+p.payload.post.id,"DELETE",undefined,a);}
    assert.equal((await f.call(base,"POST",content,a)).status,429);
  }finally{f.sql.close();}
});
