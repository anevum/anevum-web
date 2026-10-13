import test from "node:test";
import assert from "node:assert/strict";
import {
  memberHealth,memberMe,memberLibrary,memberCreateProject,memberProject,
  memberSetSaved,memberVote,memberCreatorProfile,MemberApiError
} from "../web/src/lib/member-api.ts";

async function withFetch(stub,run){
  const old=globalThis.fetch;globalThis.fetch=stub;
  try{await run()}finally{globalThis.fetch=old}
}
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});

test("health probes omit credentials; authenticated member requests are strictly same-origin",async()=>{
  const calls=[];
  await withFetch(async(url,init)=>{calls.push({url,init});return response(url.endsWith("/health")?{status:"ok",signupEnabled:false}:{member:{id:"abc"}})},async()=>{
    await memberHealth(); await memberMe();
  });
  assert.equal(calls[0].url,"/api/v1/member/health");
  assert.equal(calls[0].init.credentials,"omit");
  assert.equal(calls[1].url,"/api/v1/member/me");
  assert.equal(calls[1].init.credentials,"same-origin");
  for(const c of calls){
    assert.equal(c.init.cache,"no-store");
    assert.equal(c.init.redirect,"error");
    assert.equal(c.init.mode,"same-origin");
  }
});
test("library uses server-owned identity and never passes member ids",async()=>{
  const calls=[];
  await withFetch(async(url,init)=>{calls.push({url,init});return response({items:[],count:0})},async()=>{await memberLibrary()});
  assert.equal(calls[0].url,"/api/v1/member/library");
  assert.equal(calls[0].init.method,"GET");
  assert.equal(calls[0].init.body,undefined);
});
test("draft creation, saves and ratings honor existing member Worker JSON methods",async()=>{
  const calls=[];
  await withFetch(async(url,init)=>{calls.push({url,init});return response({id:"c".repeat(32),status:"draft",revision:1})},async()=>{
    await memberCreateProject({slug:"hello-world",title:"Hello World",summary:"My first original project",description:"",category:"games",freeToUse:true,sourceUrl:null,demoUrl:"https://example.org/demo",license:null,aiDisclosure:"The art was drawn by hand.",humanContribution:"I coded the interface."});
    await memberSetSaved("a".repeat(32),true);
    await memberVote("a".repeat(32),5,0);
  });
  assert.deepEqual(calls.map(x=>x.init.method),["POST","POST","POST"]);
  assert.equal(calls[0].url,"/api/v1/member/projects");
  assert.equal(calls[1].url,"/api/v1/member/library/"+"a".repeat(32));
  assert.equal(calls[2].url,"/api/v1/member/community/projects/"+"a".repeat(32)+"/vote");
  assert.deepEqual(JSON.parse(calls[2].init.body),{score:5,revision:0});
  for(const c of calls)assert.equal(c.init.credentials,"same-origin");
});
test("member API rejects untrusted project ids locally before any fetch",async()=>{
  await withFetch(async()=>{throw Error("network must not be used")},async()=>{
    assert.throws(()=>memberProject("https://evil.example"),/Invalid project identifier/);
    assert.throws(()=>memberSetSaved("../other",true),/Invalid project identifier/);
    assert.throws(()=>memberVote("a".repeat(32),7,0),/Invalid rating/);
  });
});
test("401 is an explicit sign-in requirement and HTML redirects fail closed",async()=>{
  await withFetch(async()=>response({error:"Sign-in required"},401),async()=>{
    await assert.rejects(memberMe(),e=>e instanceof MemberApiError&&e.status===401);
  });
  await withFetch(async()=>new Response("<html>Login</html>",{status:200,headers:{"content-type":"text/html"}}),async()=>{
    await assert.rejects(memberMe(),e=>e instanceof MemberApiError&&e.status===503);
  });
});


test("optional public creator XP and achievements use existing same-origin route",async()=>{
  let seen=null;
  await withFetch(async(url,init)=>{
    seen={url,init};
    return response({
      creator:{handle:"sample_maker",displayName:"Sample Maker",bio:"",joinedAt:"2026-10-12"},
      progression:{xp:20,level:2,maxLevel:null,artifact:"Copper Key",artifactEarned:true,levelStartXp:20,nextLevelXp:80,progressWithinLevel:0},
      achievements:[],
      contributions:{ratings:1,publishedProjects:1,releases:0}
    });
  },async()=>{
    const result=await memberCreatorProfile("sample_maker");
    assert.equal(result.progression.level,2);
    assert.equal(result.contributions.publishedProjects,1);
  });
  assert.equal(seen.url,"/api/v1/member/creators/sample_maker");
  assert.equal(seen.init.method,"GET");
  assert.equal(seen.init.credentials,"same-origin");
  assert.equal(seen.init.cache,"no-store");
  await assert.rejects(Promise.resolve().then(()=>memberCreatorProfile("../private")),/Invalid public creator handle/);
});
