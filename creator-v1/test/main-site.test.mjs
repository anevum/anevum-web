import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import worker from "../web/main-worker.mjs";

test("portfolio lives under main origin with clean asset requests",async()=>{
  let seen;
  const env={ASSETS:{fetch:async req=>{seen=req;return new Response("portfolio",{headers:{"content-type":"text/html"}});}}};
  let r=await worker.fetch(new Request("https://anevum.com/portfolio"),env,{});
  assert.equal(r.status,308);assert.equal(r.headers.get("location"),"/portfolio/");
  r=await worker.fetch(new Request("https://anevum.com/portfolio/",{headers:{Cookie:"private=secret",Authorization:"Bearer secret"}}),env,{});
  assert.equal(r.status,200);assert.equal(new URL(seen.url).pathname,"/portfolio/index.html");
  assert.equal(seen.headers.get("cookie"),null);assert.equal(seen.headers.get("authorization"),null);
  assert.match(r.headers.get("content-security-policy"),/frame-ancestors 'none'/);
  r=await worker.fetch(new Request("https://anevum.com/portfolio/not-real.js"),env,{});assert.equal(r.status,404);
  const html=readFileSync(new URL("../web/public/portfolio/index.html",import.meta.url),"utf8");
  assert.match(html,/href="https:\/\/anevum.com\/portfolio\/"/);
  assert.match(html,/src="\/portfolio\/app.js"/);
  assert.doesNotMatch(html,/https:\/\/portfolio\.anevum\.com|(?:src|href)="\/assets/);
});

test("old creator UI links stay on the main site without open redirects",async()=>{
  const env={ASSETS:{fetch:async()=>new Response("ok")}};
  for(const [path,target] of [["/creator/","/"],["/creator/discover?q=art","/discover?q=art"],["/creator/account","/account"]]){
    const r=await worker.fetch(new Request("https://anevum.com"+path),env,{});
    assert.equal(r.status,308);assert.equal(r.headers.get("location"),target);
  }
  for(const path of ["/creator//evil.example","/creator/api/v1/member/me"]){
    const r=await worker.fetch(new Request("https://anevum.com"+path),env,{});assert.equal(r.status,404);
  }
});

test("consolidation does not enable members, lab, staff or broker data",async()=>{
  const env={ASSETS:{fetch:async()=>new Response("ok")}};
  for(const path of ["/api/v1/member/me","/api/v1/staff/queue","/lab","/rhen","/command","/studio"]){
    const r=await worker.fetch(new Request("https://anevum.com"+path),env,{});assert.equal(r.status,404,path);
  }
  assert.equal((await worker.fetch(new Request("https://anevum.com/portfolio/",{method:"POST"}),env,{})).status,405);
  assert.equal((await worker.fetch(new Request("https://wrong.example/portfolio/"),env,{})).status,404);
});

test("only public routes enter sitemap; asset builds omit source maps",async()=>{
  const r=await worker.fetch(new Request("https://anevum.com/sitemap.xml"),{},{});
  const xml=await r.text();assert.match(xml,/https:\/\/anevum.com\/portfolio\//);assert.doesNotMatch(xml,/\/lab|\/account|\/workspace/);
  const config=JSON.parse(readFileSync(new URL("../wrangler.main-site.jsonc",import.meta.url),"utf8"));
  assert.equal(config.routes,undefined);assert.equal(config.workers_dev,false);
  assert.equal(config.d1_databases[0].database_id,"6c7b5f0c-33db-4b6a-9569-0a6af5e07534");
});
