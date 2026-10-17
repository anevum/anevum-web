import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {retireOldPublicHostname} from "../apex-prelaunch/a-retirement.mjs";
const old="https://a.anevum.com";
test("legacy retirement Worker is unrouted and has no D1 or secret bindings",()=>{
 const cfg=JSON.parse(readFileSync(new URL("../wrangler.a-retirement.jsonc",import.meta.url),"utf8"));
 assert.equal(cfg.name,"anevum-a-community-retirement");
 assert.deepEqual(cfg.routes,[]);
 assert.equal(cfg.workers_dev,false);
 assert.equal(cfg.preview_urls,false);
 assert.equal(cfg.d1_databases,undefined);
 assert.equal(cfg.vars,undefined);
 assert.equal(cfg.assets,undefined);
});
test("old public deep links redirect only within the permanent apex origin",()=>{
 for(const url of ["/","/join","/member","/studio","/creators?ref=old",
   "//evil.example/trick","/community?redirect=https%3A%2F%2Fevil.example"]){
  const response=retireOldPublicHostname(new Request(old+url));
  assert.equal(response.status,302,url);
  const redirected=new URL(response.headers.get("location"));
  assert.equal(redirected.origin,"https://anevum.com",url);
  assert.equal(response.headers.get("cache-control"),"private, no-store");
 }
});
test("old API, file and modification routes do not bypass prelaunch gate",async()=>{
 for(const path of ["/api","/api/v1/member/health","/api/v1/member/auth/sign-in/email-otp",
   "/assets/index.js","/assets/index.css","/manifest.webmanifest","/video.mp4","/cdn-cgi/access/certs"]){
  const response=retireOldPublicHostname(new Request(old+path));
  assert.equal(response.status,410,path);
  assert.equal(response.headers.get("location"),null);
 }
 for(const method of ["POST","PATCH","PUT","DELETE"]){
  const response=retireOldPublicHostname(new Request(old+"/api/v1/member/creator-profile",{method}));
  assert.equal(response.status,410,method);
  assert.equal(response.headers.get("location"),null);
 }
});
test("cannot send visitors to alternate hosts or accidentally route http",()=>{
 for(const url of ["http://a.anevum.com/","https://evil.example/join","https://anevum.com/","https://www.anevum.com/"]){
  const r=retireOldPublicHostname(new Request(url));
  assert.equal(r.status,404,url);
 }
});
test("robots disallows crawlers on retired host",async()=>{
 const r=retireOldPublicHostname(new Request(old+"/robots.txt"));
 assert.equal(r.status,200);
 assert.equal(await r.text(),"User-agent: *\nDisallow: /\n");
});
