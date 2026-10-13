import test from "node:test";
import assert from "node:assert/strict";
import stage from "../web/staging-path-worker.mjs";
import { readFileSync } from "node:fs";
const config=JSON.parse(readFileSync(new URL("../wrangler.react-staging-path.jsonc",import.meta.url),"utf8"));
const req=(p,method="GET",host="next.anevum.com")=>new Request("https://"+host+p,{method});
function env(){
  const requests=[];
  return {
    requests,
    ASSETS:{fetch:async request=>{requests.push(new URL(request.url).pathname);return new Response("<!doctype html><div id='root'></div>",{headers:{"content-type":"text/html"}});}}
  };
}

test("staging Worker is isolated to next.anevum.com/creator/ only",async()=>{
  const a=env();
  assert.equal((await stage.fetch(req("/creator/"),a,{})).status,200);
  assert.deepEqual(a.requests,["/"]);
  assert.equal((await stage.fetch(req("/creator/projects/project-a?from=/discover"),a,{})).status,200);
  assert.deepEqual(a.requests,["/","/projects/project-a"]);
  assert.equal((await stage.fetch(req("/creator/","GET","anevum.com"),a,{})).status,404);
  assert.equal((await stage.fetch(req("/","GET"),a,{})).status,404);
  assert.equal((await stage.fetch(req("/api/v1/member/me"),a,{})).status,404);
});

test("Vite assets are served through a safe prefix rewrite",async()=>{
  const a=env();
  const res=await stage.fetch(req("/creator/assets/app-abc123.js"),a,{});
  assert.equal(res.status,200);
  assert.deepEqual(a.requests,["/assets/app-abc123.js"]);
  assert.equal(res.headers.get("x-robots-tag"),"noindex, nofollow");
  assert.match(res.headers.get("cache-control")||"",/no-store/);
});

test("private member API cannot be served through public staging Worker",async()=>{
  const a=env();
  for(const path of ["/creator/api/v1/member/me","/creator/api/v1/member/health","/creator/api/v1/studio","/creator/api/v1/creator/drafts"])
    assert.equal((await stage.fetch(req(path),a,{})).status,404,path);
  assert.deepEqual(a.requests,[]);
});

test("staging frontend Worker cannot write or host a second auth service",async()=>{
  const a=env();
  assert.equal((await stage.fetch(req("/creator/api/v1/projects","POST"),a,{})).status,405);
  assert.equal((await stage.fetch(req("/creator/account","PATCH"),a,{})).status,405);
  assert.deepEqual(a.requests,[]);
});

test("public API delegation returns JSON even for unsupported project routes",async()=>{
  const a=env();
  const response=await stage.fetch(req("/creator/api/v1/projects/../../member/me"),a,{});
  assert.equal(response.status,404);
  assert.deepEqual(a.requests,[]);
});

test("route config only binds staging database and narrow prefix",()=>{
  assert.equal(config.name,"anevum-creator-v1-react-staging");
  assert.deepEqual(config.routes,[{pattern:"next.anevum.com/creator/*",zone_name:"anevum.com"}]);
  assert.deepEqual(config.d1_databases.map(x=>x.database_id),["fa96e36d-6257-4883-bf15-074947e11a13"]);
  assert.equal(config.assets.directory,"./dist/react-staging");
  assert.equal(config.assets.run_worker_first,true);
  assert.equal(config.workers_dev,false);
  assert.equal(config.preview_urls,false);
  assert.doesNotMatch(JSON.stringify(config),/anevum\.com\/\*|production\/creator-v1|RHEN|Alpaca/i);
});


test("host-scoped member session and authorization are never forwarded to preview assets",async()=>{
 const headers=[];
 const sample={
   ASSETS:{fetch:async request=>{
     headers.push({cookie:request.headers.get("cookie"),authorization:request.headers.get("authorization"),accept:request.headers.get("accept")});
     return new Response("<!doctype html>",{headers:{"content-type":"text/html"}});
   }}
 };
 const request=new Request("https://next.anevum.com/creator/account",{
   headers:{Cookie:"__Host-anevum_stage_sid=mock-fixture","Authorization":"Bearer fake-review-token",Accept:"text/html"}
 });
 const response=await stage.fetch(request,sample,{});
 assert.equal(response.status,200);
 assert.deepEqual(headers,[{cookie:null,authorization:null,accept:"text/html"}]);
 assert.match(response.headers.get("content-security-policy")||"",/frame-ancestors 'none'/);
 assert.equal(response.headers.get("x-frame-options"),"DENY");
 assert.match(response.headers.get("cache-control")||"",/no-store/);
});
