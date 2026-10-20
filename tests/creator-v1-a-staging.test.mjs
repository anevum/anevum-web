import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import staging from "../creator-v1/web/a-staging-worker.mjs";

const config=JSON.parse(readFileSync(new URL("../creator-v1/wrangler.a-staging.jsonc",import.meta.url),"utf8"));
const hosted="https://a.anevum.com";
const fakeAssets={
  async fetch(request){
    const path=new URL(request.url).pathname;
    if(path==="/favicon.svg")return new Response("<svg/>",{
      headers:{"content-type":"image/svg+xml","set-cookie":"unsafe=1"}
    });
    return new Response('<!doctype html><div id="root"></div>',{
      headers:{"content-type":"text/html; charset=utf-8","set-cookie":"unsafe=1"}
    });
  }
};
const invoke=(path="/",options={})=>staging.fetch(new Request(hosted+path,options),{ASSETS:fakeAssets},{});

test("dedicated Worker serves only staging public assets and isolated D1",()=>{
  assert.equal(config.name,"anevum-creator-v1-a-staging");
  assert.equal(config.main,"./web/a-staging-worker.mjs");
  assert.equal(config.workers_dev,false);
  assert.equal(config.preview_urls,false);
  assert.equal(config.routes,undefined,"Route switch must be a separate reviewed Cloudflare API action");
  assert.equal(config.assets.directory,"./dist/web");
  assert.equal(config.assets.binding,"ASSETS");
  assert.equal(config.assets.not_found_handling,"single-page-application");
  assert.equal(config.assets.run_worker_first,true);
  assert.deepEqual(config.d1_databases.map(d=>({binding:d.binding,database_id:d.database_id})),[
    {binding:"COMMUNITY_DB",database_id:"fa96e36d-6257-4883-bf15-074947e11a13"}
  ]);
  assert.doesNotMatch(JSON.stringify(config),/anevum-construction-terminal|6c7b5f0c-33db-4b6a-9569-0a6af5e07534|RHEN|ALPACA|AUTH_PEPPER|RESEND_API_KEY/i);
});
test("real public SPA routes remain available on the staging host without cookies",async()=>{
  for(const path of ["/","/discover","/community","/boards","/creators","/projects/example"]){
    const response=await invoke(path,{headers:{cookie:"not_a_public_session=1"}});
    assert.equal(response.status,200,path);
    assert.match(await response.text(),/id="root"/);
    assert.equal(response.headers.get("set-cookie"),null);
    assert.match(response.headers.get("x-robots-tag")||"",/noindex/);
    assert.match(response.headers.get("content-security-policy")||"",/frame-ancestors 'none'/);
    assert.equal(response.headers.get("cache-control"),"private, no-store");
  }
});
test("member, staff and broker API endpoints are never forwarded",async()=>{
  for(const path of ["/api/v1/member/me","/api/v1/member/health","/api/v1/admin/users","/api/command/session","/api/v1/broker/connect","/api/v1/unknown"]){
    const response=await invoke(path);
    assert.equal(response.status,404,path);
    assert.equal(response.headers.get("set-cookie"),null);
  }
  const post=await invoke("/api/v1/projects",{method:"POST"});
  assert.equal(post.status,405);
});
test("only HTTPS a.anevum.com is a valid staging host",async()=>{
  for(const url of ["https://anevum.com/","https://next.anevum.com/","http://a.anevum.com/","https://a.anevum.com.evil.test/"]){
    const response=await staging.fetch(new Request(url),{ASSETS:fakeAssets},{});
    assert.equal(response.status,404,url);
  }
});
test("asset response and health never set session cookies",async()=>{
  const icon=await invoke("/favicon.svg");
  assert.equal(icon.headers.get("set-cookie"),null);
  assert.match(icon.headers.get("x-robots-tag")||"",/noindex/);
  const health=await invoke("/health");
  assert.equal(health.status,200);
  assert.equal((await health.json()).mode,"public-read-only");
  assert.equal(health.headers.get("cache-control"),"private, no-store");
  assert.equal(health.headers.get("set-cookie"),null);
  const head=await invoke("/discover",{method:"HEAD"});
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
});
