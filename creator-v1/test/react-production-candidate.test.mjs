import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import worker from "../web/production-worker.mjs";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const fixture={ASSETS:{fetch:async req=>new Response("<html><body>ANEVUM shell</body></html>",{headers:{"content-type":"text/html"}})}};

test("prospective production React Worker is inert until a separate route promotion",()=>{
 const cfg=JSON.parse(read("wrangler.react-production-candidate.jsonc"));
 assert.equal(cfg.name,"anevum-creator-v1-react-candidate");
 assert.equal(cfg.main,"./web/production-worker.mjs");
 assert.equal(cfg.workers_dev,false);
 assert.equal(cfg.preview_urls,false);
 assert.equal(cfg.routes,undefined);
 assert.equal(cfg.route,undefined);
 assert.equal(cfg.assets.directory,"./dist/web");
 assert.equal(cfg.d1_databases[0].database_id,"6c7b5f0c-33db-4b6a-9569-0a6af5e07534");
 assert.ok(existsSync(new URL("../web/public/assets/cinematic/manifest.json",import.meta.url)));
});

test("cross-host requests, dangerous methods, member/staff/private routes fail closed",async()=>{
 for(const url of ["https://not-anevum.example/","https://next.anevum.com/creator/","http://anevum.com/","https://anevum.com:8443/"]){
   const res=await worker.fetch(new Request(url),fixture,{});
   assert.equal(res.status,404,url);
 }
 for(const path of ["/api/v1/member/health","/api/v1/member/me","/api/v1/member/projects","/api/v1/staff/queue","/api/private","/join","/studio","/rhen","/lab","/command","/private"]){
   const res=await worker.fetch(new Request("https://anevum.com"+path,{headers:{Authorization:"Bearer should-never-forward",Cookie:"session=no"}}),fixture,{});
   assert.equal(res.status,404,path);
   assert.equal(res.headers.get("set-cookie"),null,path);
 }
 for(const method of ["POST","PATCH","DELETE"]){
   const res=await worker.fetch(new Request("https://anevum.com/api/v1/projects",{method}),fixture,{});
   assert.equal(res.status,405,method);
 }
});

test("anonymous React SPA has strict HTML headers and no leaked source cookies",async()=>{
 let observed;
 const env={ASSETS:{fetch:async req=>{
   observed=req;
   return new Response("<html>ANEVUM</html>",{headers:{"content-type":"text/html","set-cookie":"wrong=secret"}});
 }}};
 const res=await worker.fetch(new Request("https://anevum.com/discover",{headers:{Cookie:"token=secret",Authorization:"Bearer secret",Accept:"text/html"}}),env,{});
 assert.equal(res.status,200);
 assert.equal(res.headers.get("set-cookie"),null);
 assert.match(res.headers.get("content-security-policy"),/frame-ancestors 'none'/);
 assert.equal(res.headers.get("cache-control"),"no-store");
 assert.equal(res.headers.get("x-content-type-options"),"nosniff");
 assert.equal(observed.headers.get("cookie"),null);
 assert.equal(observed.headers.get("authorization"),null);
 assert.equal(observed.headers.get("accept"),"text/html");
});

test("public catalogues are delegated read-only and do not expose legacy page HTML",()=>{
 const js=read("web/production-worker.mjs");
 assert.match(js,/import publicApi from "\.\.\/api\/worker\.mjs"/);
 assert.match(js,/PUBLIC_API/);
 assert.match(js,/new Request\(url.href,\{method:request.method,headers:\{Accept:"application\/json"\}\}\)/);
 assert.doesNotMatch(js,/member-api|memberSave|memberVote|\/staging-path-worker|fetch\(request,\s*env\)/);
 assert.doesNotMatch(js,/anevum\.com\/\*/);
});
