import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import worker from "../web/creator-v009-review-worker.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const conf=JSON.parse(read("wrangler.creator-v009-review.jsonc"));
const origin="https://anevum-v009-visual-review-20261014.devonakins.workers.dev";
const assets={ASSETS:{fetch:async()=>new Response("<!doctype html><html><head></head><body><div id=\"root\"></div></body></html>",{
 headers:{"content-type":"text/html;charset=utf-8","set-cookie":"unsafe=1","location":"https://attacker.invalid"}
})}};

test("V009 preview has no production route or private binding",()=>{
 assert.equal(conf.main,"./web/creator-v009-review-worker.mjs");
 assert.equal(conf.assets.binding,"ASSETS");
 assert.equal(conf.workers_dev,true);
 assert.equal(conf.preview_urls,false);
 for(const k of ["routes","route","d1_databases","r2_buckets","kv_namespaces","vars","unsafe","services","durable_objects","send_email"]){
   assert.equal(Object.hasOwn(conf,k),false,k);
 }
 assert.doesNotMatch(read("web/creator-v009-review-worker.mjs"),/CLOUDFLARE_API_TOKEN|RESEND_API_KEY|alpaca[_-]?key|better[_-]?auth[_-]?secret/i);
});

test("V009 preview refuses foreign hosts, private APIs and writes",async()=>{
 for(const url of ["https://anevum.com/","https://a.anevum.com/","http://"+new URL(origin).host+"/","https://attacker.invalid/"]){
   const r=await worker.fetch(new Request(url),assets);assert.equal(r.status,404,url);
 }
 for(const path of ["/api/v1/member/me","/api/v1/member/creators/showcase","/api/v1/staff/queue",
 "/api/v1/private","/api/member/creator-profile","/api/v1/auth/session","/.well-known/secret","/__internal"]){
   const r=await worker.fetch(new Request(origin+path),assets);assert.equal(r.status,404,path);
 }
 for(const method of ["POST","PUT","PATCH","DELETE"]){
   const r=await worker.fetch(new Request(origin+"/api/v1/status",{method}),assets);
   assert.equal(r.status,405,method);
 }
});

test("V009 preview strips response cookies and visibly labels HTML review",async()=>{
 let request;
 const env={ASSETS:{fetch:async r=>{request=r;return assets.ASSETS.fetch(r);}}};
 const r=await worker.fetch(new Request(origin+"/community",{headers:{Cookie:"user=secret",Authorization:"Bearer forged",Accept:"text/html"}}),env);
 assert.equal(r.status,200);
 assert.equal(r.headers.get("set-cookie"),null);
 assert.equal(r.headers.get("location"),null);
 assert.match(r.headers.get("x-robots-tag"),/noindex/);
 assert.match(r.headers.get("content-security-policy"),/frame-ancestors 'none'/);
 assert.equal(request.headers.get("cookie"),null);
 assert.equal(request.headers.get("authorization"),null);
 assert.match(await r.text(),/V009 DESIGN REVIEW · READ ONLY/);
});

test("V009 preview proxies only anonymous public catalogue on staging",async()=>{
 const original=globalThis.fetch;let observed=null;
 try{
   globalThis.fetch=async(url,options)=>{observed={url,options};return new Response(JSON.stringify({counts:{publishedProjects:0,publishedCreators:0}}),{headers:{"content-type":"application/json","set-cookie":"unsafe=1"}});};
   const r=await worker.fetch(new Request(origin+"/api/v1/status",{headers:{Cookie:"secret=1",Authorization:"Bearer bad"}}),assets);
   assert.equal(r.status,200);
   assert.equal(observed.url,"https://a.anevum.com/api/v1/status");
   assert.deepEqual(observed.options.headers,{accept:"application/json"});
   assert.equal(r.headers.get("set-cookie"),null);
   assert.equal(r.headers.get("cache-control"),"private, no-store");
 }finally{globalThis.fetch=original;}
});
