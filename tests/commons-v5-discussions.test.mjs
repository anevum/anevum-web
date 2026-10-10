import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {
  socialConfigured,socialSchemaReady,validatePost,validateReply,validateReport,
  commonsSocialEndpoint,exportMemberSocial
} from "../src/server/commons-social.mjs";

const origin="https://anevum-member-staging.devonakins.workers.dev";
const userA={id:"member-alpha",emailVerified:true};
const userB={id:"member-bravo",emailVerified:true};
const flag={
  MEMBER_PREVIEW_ORIGIN:origin,ANEVUM_MEMBER_PREVIEW_ENABLED:"true",
  ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"true"
};
const names=[
  "commons_v5_posts","commons_v5_replies","commons_v5_reports",
  "commons_v5_moderation_events"
];
const request=(path,method="GET",data)=>new Request(origin+path,{
  method,headers:method==="GET"?{}:{
    "Origin":origin,"Content-Type":"application/json"
  },body:data===undefined?undefined:JSON.stringify(data)
});
async function call(db,who,route,method="GET",data,override={}){
  const response=await commonsSocialEndpoint(
    request(route,method,data),{...flag,MEMBER_DB:db,...override},who,origin,
    route.split("?")[0]
  );
  return {status:response.status,body:await response.json()};
}
const post=()=>({
  topic:"research",title:"How should we test this?",
  body:"Here is a reproducible question and the relevant evidence."
});

function fakeDb(){
  const posts=new Map(),replies=new Map(),reports=new Map(),queries=[];
  let schemaNames=[...names];
  const sqlApi=(sql,args)=>{
    queries.push({sql,args});
    const result=values=>({results:values});
    if(sql.includes("sqlite_master")&&sql.includes("commons_v5_%"))
      return result(schemaNames.map(name=>({name})));
    if(sql.startsWith("SELECT id,author_user_id,topic,title,body,created_at,updated_at FROM commons_v5_posts")){
      let data=[...posts.values()].filter(p=>p.status==="PUBLISHED");
      if(sql.includes("AND topic=?"))data=data.filter(p=>p.topic===args[0]);
      return result(data.sort((a,b)=>b.created_at-a.created_at).slice(0,30));
    }
    if(sql.startsWith("SELECT id,post_id,author_user_id,body,created_at FROM commons_v5_replies")){
      const parent=posts.get(args[0]);
      return result(parent?.status==="PUBLISHED"?
        [...replies.values()].filter(x=>x.post_id===args[0]&&x.status==="PUBLISHED").slice(0,50):[]);
    }
    if(sql.startsWith("SELECT id,topic,title,body,status,created_at,updated_at FROM commons_v5_posts")){
      return result([...posts.values()].filter(p=>p.author_user_id===args[0]).map(({id,topic,title,body,status,created_at,updated_at})=>({id,topic,title,body,status,created_at,updated_at})));
    }
    if(sql.startsWith("SELECT id,post_id,body,status,created_at FROM commons_v5_replies")){
      return result([...replies.values()].filter(r=>r.author_user_id===args[0]).map(({id,post_id,body,status,created_at})=>({id,post_id,body,status,created_at})));
    }
    if(sql.startsWith("SELECT id,post_id,reason,status,created_at FROM commons_v5_reports")){
      return result([...reports.values()].filter(r=>r.reporter_user_id===args[0]).map(({id,post_id,reason,status,created_at})=>({id,post_id,reason,status,created_at})));
    }
    if(sql.startsWith("INSERT INTO commons_v5_posts")){
      const [id,author_user_id,topic,title,body,created_at,updated_at,limitOwner,since]=args;
      assert.equal(limitOwner,author_user_id);
      if([...posts.values()].filter(p=>p.author_user_id===author_user_id&&p.created_at>=since).length>=3)
        return {meta:{changes:0}};
      posts.set(id,{id,author_user_id,topic,title,body,created_at,updated_at,status:"PUBLISHED"});
      return {meta:{changes:1}};
    }
    if(sql.startsWith("UPDATE commons_v5_posts")){
      const [now,id,owner]=args,entry=posts.get(id);
      if(!entry||entry.author_user_id!==owner||entry.status!=="PUBLISHED")
        return {meta:{changes:0}};
      entry.status="REMOVED";entry.title="Removed post";
      entry.body="Removed by author request.";entry.updated_at=now;
      return {meta:{changes:1}};
    }
    if(sql.startsWith("INSERT INTO commons_v5_replies")){
      const [id,author_user_id,body,created_at,postId,limitOwner,since]=args;
      assert.equal(author_user_id,limitOwner);
      if(posts.get(postId)?.status!=="PUBLISHED" ||
         [...replies.values()].filter(x=>x.author_user_id===author_user_id&&x.created_at>=since).length>=12)
        return {meta:{changes:0}};
      replies.set(id,{id,author_user_id,post_id:postId,body,created_at,status:"PUBLISHED"});
      return {meta:{changes:1}};
    }
    if(sql.startsWith("INSERT OR IGNORE INTO commons_v5_reports")){
      const [id,reporter_user_id,reason,created_at,postId,notOwner]=args;
      assert.equal(reporter_user_id,notOwner);
      const parent=posts.get(postId);
      if(!parent||parent.status!=="PUBLISHED"||parent.author_user_id===reporter_user_id||
         [...reports.values()].some(x=>x.post_id===postId&&x.reporter_user_id===reporter_user_id))
        return {meta:{changes:0}};
      reports.set(id,{id,reporter_user_id,post_id:postId,reason,created_at,status:"PENDING"});
      return {meta:{changes:1}};
    }
    throw Error("Unexpected query in test: "+sql.slice(0,80));
  };
  const db={prepare(sql){
    return {
      all:async()=>sqlApi(sql,[]),
      bind(...args){return {
        all:async()=>sqlApi(sql,args),run:async()=>sqlApi(sql,args),first:async()=>sqlApi(sql,args)
      };}
    };
  }};
  return {db,posts,replies,reports,queries,setSchema(names){schemaNames=names;}};
}

test("social pilot is default disabled, staging-only and origin-pinned",()=>{
  const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const prod=JSON.parse(read("wrangler.jsonc"));
  const stage=JSON.parse(read("wrangler.member-staging.jsonc"));
  assert.equal(prod.vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
  assert.equal(stage.vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
  assert.equal(socialConfigured(flag,origin),true);
  assert.equal(socialConfigured(flag,"https://anevum.com"),false);
  assert.equal(socialConfigured({...flag,ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false"},origin),false);
  assert.equal(socialConfigured({...flag,ANEVUM_MEMBER_PREVIEW_ENABLED:"false"},origin),false);
  assert.equal(socialConfigured({...flag,MEMBER_PREVIEW_ORIGIN:"https://untrusted.example"},origin),false);
  assert.equal(socialConfigured({...flag,MEMBER_PREVIEW_ORIGIN:"http://anevum-member-staging.devonakins.workers.dev"},origin),false);
});

test("schema requires every tenant, report and moderation table",async()=>{
  const store=fakeDb();
  assert.equal(await socialSchemaReady(store.db),true);
  store.setSchema(names.slice(0,-1));
  assert.equal(await socialSchemaReady(store.db),false);
  assert.equal(await socialSchemaReady({}),false);
});

test("untrusted author/owner/role fields and oversized content fail closed",()=>{
  assert.deepEqual(validatePost(post()),post());
  for(const value of [
    {...post(),author_user_id:"member-bravo"}, {...post(),role:"admin"},
    {...post(),title:"too"}, {...post(),body:"short"},
    {...post(),topic:"brokerage"}, {...post(),body:"x".repeat(3001)}
  ])assert.throws(()=>validatePost(value));
  assert.deepEqual(validateReply({body:"Meaningful reply"}),{body:"Meaningful reply"});
  for(const value of [{body:"a"},{body:"hello",author_user_id:"another"}])
    assert.throws(()=>validateReply(value));
  assert.deepEqual(validateReport({reason:"privacy"}),{reason:"privacy"});
  for(const reason of ["trading","administrator",null])
    assert.throws(()=>validateReport({reason}));
});

test("an unverified signed-in member cannot read, post or report",async()=>{
  const store=fakeDb();
  const unverified={id:"unverified-account",emailVerified:false};
  const list=await call(store.db,unverified,"/api/member/commons/posts");
  const write=await call(store.db,unverified,"/api/member/commons/posts","POST",post());
  const report=await call(store.db,unverified,
    "/api/member/commons/posts/123e4567-e89b-12d3-a456-426614174000/report",
    "POST",{reason:"privacy"});
  assert.equal(list.status,403);
  assert.equal(write.status,403);
  assert.equal(report.status,403);
  assert.equal(store.posts.size,0);
});

test("unconfigured endpoint and missing moderator schema cannot publish",async()=>{
  const store=fakeDb();
  let result=await call(store.db,userA,"/api/member/commons/posts","POST",post(),
    {ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false"});
  assert.equal(result.status,503);
  assert.equal(store.posts.size,0);
  store.setSchema(names.slice(0,-1));
  result=await call(store.db,userA,"/api/member/commons/posts","POST",post());
  assert.equal(result.status,503);
  assert.equal(store.posts.size,0);
  result=await call(store.db,null,"/api/member/commons/posts","GET");
  assert.equal(result.status,401);
});

test("posts belong to server-authenticated member; another member cannot delete",async()=>{
  const store=fakeDb();
  const first=await call(store.db,userA,"/api/member/commons/posts","POST",post());
  assert.equal(first.status,201);
  assert.equal(first.body.created,true);
  const id=first.body.post.id;
  assert.equal(store.posts.get(id).author_user_id,userA.id);
  assert.equal("author_user_id" in first.body.post,false);
  const owned=await call(store.db,userA,"/api/member/commons/posts");
  const other=await call(store.db,userB,"/api/member/commons/posts");
  assert.equal(owned.body.posts[0].ownedByMe,true);
  assert.equal(other.body.posts[0].ownedByMe,false);
  assert.equal(other.body.posts[0].authorLabel,"Commons member");
  assert.equal("author_user_id" in other.body.posts[0],false);
  assert.equal((await call(store.db,userB,"/api/member/commons/posts/"+id,"DELETE")).status,404);
  assert.equal(store.posts.get(id).status,"PUBLISHED");
  assert.equal((await call(store.db,userA,"/api/member/commons/posts/"+id,"DELETE")).status,200);
  assert.equal(store.posts.get(id).status,"REMOVED");
  assert.equal((await call(store.db,userB,"/api/member/commons/posts")).body.posts.length,0);
});

test("quota and filtering operate on server-owned data with no fake counts",async()=>{
  const store=fakeDb();
  for(let i=0;i<3;i++){
    const value={...post(),topic:i===2?"engineering":"research",title:"Research question "+i};
    assert.equal((await call(store.db,userA,"/api/member/commons/posts","POST",value)).status,201);
  }
  assert.equal((await call(store.db,userA,"/api/member/commons/posts","POST",post())).status,429);
  assert.equal(store.posts.size,3);
  assert.equal((await call(store.db,userB,"/api/member/commons/posts?topic=engineering")).body.posts.length,1);
  assert.equal((await call(store.db,userB,"/api/member/commons/posts?topic=research")).body.posts.length,2);
  for(const suffix of ["?topic=payments","?topic=research&topic=systems","?member_id=member-alpha"])
    assert.equal((await call(store.db,userA,"/api/member/commons/posts"+suffix)).status,400);
});

test("replies require a published post and are scoped to their authenticated author",async()=>{
  const store=fakeDb();
  const p=await call(store.db,userA,"/api/member/commons/posts","POST",post());
  const id=p.body.post.id;
  assert.equal((await call(store.db,userB,"/api/member/commons/posts/"+id+"/replies","POST",
    {body:"Evidence matters."})).status,201);
  const list=await call(store.db,userA,"/api/member/commons/posts/"+id+"/replies");
  assert.equal(list.body.replies.length,1);
  assert.equal(list.body.replies[0].ownedByMe,false);
  assert.equal("author_user_id" in list.body.replies[0],false);
  await call(store.db,userA,"/api/member/commons/posts/"+id,"DELETE");
  assert.equal((await call(store.db,userB,"/api/member/commons/posts/"+id+"/replies","POST",
    {body:"Should be blocked"})).status,409);
  assert.equal((await call(store.db,userB,"/api/member/commons/posts/"+id+"/replies")).body.replies.length,0);
});

test("reports cannot target own, removed or duplicate posts",async()=>{
  const store=fakeDb();
  const p=await call(store.db,userA,"/api/member/commons/posts","POST",post());
  const id=p.body.post.id,route="/api/member/commons/posts/"+id+"/report";
  assert.equal((await call(store.db,userA,route,"POST",{reason:"spam"})).status,409);
  assert.equal((await call(store.db,userB,route,"POST",{reason:"privacy"})).status,201);
  assert.equal((await call(store.db,userB,route,"POST",{reason:"privacy"})).status,409);
  assert.equal(store.reports.size,1);
  await call(store.db,userA,"/api/member/commons/posts/"+id,"DELETE");
  assert.equal((await call(store.db,userB,route,"POST",{reason:"harassment"})).status,409);
});

test("social account export contains owned contributions and reports only",async()=>{
  const store=fakeDb();
  const first=await call(store.db,userA,"/api/member/commons/posts","POST",post());
  const postId=first.body.post.id;
  await call(store.db,userB,"/api/member/commons/posts/"+postId+"/replies","POST",
    {body:"A separate member's reply"});
  await call(store.db,userB,"/api/member/commons/posts/"+postId+"/report","POST",
    {reason:"privacy"});
  const a=await exportMemberSocial(store.db,userA.id);
  const b=await exportMemberSocial(store.db,userB.id);
  assert.equal(a.posts.length,1);
  assert.equal(a.replies.length,0);
  assert.equal(a.reports.length,0);
  assert.equal(b.posts.length,0);
  assert.equal(b.replies.length,1);
  assert.equal(b.reports.length,1);
  assert.equal("author_user_id" in a.posts[0],false); // exports omit unnecessary identity fields
});

test("Commons social migration is isolated and never auto-applied with F0 or OAuth",()=>{
  const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const main=readdirSync(new URL("../migrations/",import.meta.url)).filter(f=>f.endsWith(".sql"));
  const review=readdirSync(new URL("../migrations-review/",import.meta.url)).filter(f=>f.endsWith(".sql"));
  const social=readdirSync(new URL("../migrations-social/",import.meta.url)).filter(f=>f.endsWith(".sql"));
  assert.deepEqual(main.sort(),["0001_member_platform.sql","0002_member_rhen_drafts.sql",
    "0003_member_billing.sql","0004_member_rhen_workspaces.sql"]);
  assert.deepEqual(review,["0005_member_alpaca_review.sql"]);
  assert.deepEqual(social,["0006_commons_v5_discussions.sql"]);
  assert.equal(existsSync(new URL("../migrations/0006_commons_v5_discussions.sql",import.meta.url)),false);
  const sql=src("migrations-social/0006_commons_v5_discussions.sql");
  assert.match(sql,/ON DELETE CASCADE/);
  assert.match(sql,/UNIQUE\(post_id,reporter_user_id\)/);
  assert.match(sql,/CHECK\(status IN \('PUBLISHED','HIDDEN','REMOVED'\)\)/);
  assert.doesNotMatch(src(".github/workflows/member-preview-d1-migrate.yml"),/migrations-social/);
  assert.doesNotMatch(src(".github/workflows/member-alpaca-review-d1-migrate.yml"),/migrations-social/);
});

test("social endpoints are behind Better Auth and same-origin checks",()=>{
  const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const member=src("src/server/member.mjs");
  const auth=member.indexOf('const user = session?.user');
  const originCheck=member.indexOf('!safeMutation(request, verifiedOrigin)');
  const social=member.indexOf('if (pathname.startsWith("/api/member/commons/"))');
  assert.ok(auth>0&&originCheck>auth&&social>originCheck);
  assert.match(member,/commonsContributions: socialContributions/);
  assert.match(src("src/commons/CommonsPostsBeta.tsx"),/key=\{session.user.id\}/);
  assert.doesNotMatch(src("src/commons/CommonsPostsBeta.tsx"),/dangerouslySetInnerHTML/);
  assert.doesNotMatch(src("src/server/commons-social.mjs"),/\/v2\/orders|brokerOrder|brokerToken|Stripe|subscription/);
});
