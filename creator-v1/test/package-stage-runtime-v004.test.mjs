import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import stage,{internalPath,rewriteStageText} from "../package-alpha-v004/staging-entry.mjs";
import runtime from "../package-alpha-v004/runtime.mjs";
import {mintPreview} from "../package-alpha-v004/tokens.mjs";

const id="123e4567-e89b-42d3-a456-426614174000";
const secret="staging-test-key-only-".repeat(5);
const origin="https://anevum.com";
const runner="https://anevum-package-alpha-v004-runtime.devonakins.workers.dev";

test("staging only maps namespaced creator paths, never existing live routes",()=>{
 assert.equal(internalPath("/creator-lab/v004"),"/upload/v3");
 assert.equal(internalPath("/creator-lab/v004/projects"),"/packages");
 assert.equal(internalPath("/creator-lab/v004/help"),"/help/packages");
 assert.equal(internalPath("/creator-lab/v004/staff"),"/staff/packages");
 assert.equal(internalPath("/creator-lab/v004/play/"+id),"/play/v3/"+id);
 assert.equal(internalPath("/api/v1/packages/v004/health"),"/api/v1/packages/health");
 for(const path of ["/upload","/upload/v3","/play/v3/"+id,"/api/v1/packages/upload",
   "/api/v1/packages/v004evil/upload","/creator-lab/v004evil","/creator-lab/v005"])
   assert.equal(internalPath(path),null,path);
});

test("staging rewrites only its own UI navigation and API endpoints",()=>{
 const rewritten=rewriteStageText('fetch("/api/v1/packages/upload"); location.href="/play/v3/'+id+
  '"; <a href="/upload/v3">Create</a><a href="/packages">Discovery</a>');
 assert.match(rewritten,/api\/v1\/packages\/v004\/upload/);
 assert.match(rewritten,new RegExp("/creator-lab/v004/play/"+id));
 assert.match(rewritten,/href="\/creator-lab\/v004"/);
 assert.match(rewritten,/href="\/creator-lab\/v004\/projects"/);
 assert.doesNotMatch(rewritten,/href="\/upload\/v3"/);
});

test("staging public page is isolated, sign-in gated, and root routes are unaffected",async()=>{
 const env={DB:null,MEDIA:null};
 const url=origin+"/creator-lab/v004";
 const r=await stage.fetch(new Request(url),env,{});
 assert.equal(r.status,200);
 assert.match(r.headers.get("cache-control"),/no-store/);
 const html=await r.text();
 assert.match(html,/BUILD LAB 004/);
 assert.match(html,/Member sign-in required/);
 assert.match(html,/href="\/creator-lab\/v004\/help"/);
 assert.doesNotMatch(html,/href="\/upload\/v3"/);
 for(const path of ["/upload","/play/v3/"+id,"/api/v1/packages/health"]){
  const unaffected=await stage.fetch(new Request(origin+path),env,{});
  assert.equal(unaffected.status,404,path);
 }
 const health=await stage.fetch(new Request(origin+"/api/v1/packages/v004/health"),env,{});
 assert.equal(health.status,200);
 assert.equal((await health.json()).version,"004");
 const unauth=await stage.fetch(new Request(origin+"/api/v1/packages/v004/preflight",{
  method:"POST",headers:{"origin":origin,"x-anevum-package":"v003","content-type":"application/json"},
  body:JSON.stringify({filename:"private.zip",size:100,sha256:"a".repeat(64)})
 }),env,{});
 assert.equal(unauth.status,401);
 const directWrite=await stage.fetch(new Request("https://anevum-package-alpha-v004-control.devonakins.workers.dev/api/v1/packages/v004/upload",{
  method:"POST",body:"not an upload",headers:{"origin":origin,"x-anevum-package":"v003"}
 }),env,{});
 assert.equal(directWrite.status,404);
});

test("isolated runtime requires HMAC proof and checks temporary expiry itself",async()=>{
 const markup="<!doctype html><html><body>Testing without publishing</body></html>";
 const bytes=new TextEncoder().encode(markup);
 const hash=createHash("sha256").update(bytes).digest("hex");
 let expired=false;
 const DB={prepare(sql){return {bind(){return this;},async first(){
  if(sql.includes("anevum_package_build_retention"))return expired?{release_id:id}:null;
  if(sql.includes("SELECT r.id, r.status"))return {id,release_status:"ready",project_status:"draft",live_release_id:null};
  if(sql.includes("SELECT object_key,mime,bytes,sha256"))return {object_key:"private/asset",mime:"text/html; charset=utf-8",bytes:bytes.length,sha256:hash};
  throw Error("Unexpected D1 query: "+sql);
 }};}};
 const MEDIA={async get(key){assert.equal(key,"private/asset");return {size:bytes.length,customMetadata:{sha256:hash},body:new Blob([bytes]).stream()};}};
 const env={DB,MEDIA,RUNTIME_HOST:"anevum-package-alpha-v004-runtime.devonakins.workers.dev",PACKAGE_PREVIEW_KEY:secret};
 const token=await mintPreview(secret,id);
 const privateUrl=runner+"/p/"+id+"/"+token+"/index.html";
 const play=await runtime.fetch(new Request(privateUrl),env);
 assert.equal(play.status,200);
 assert.match(play.headers.get("content-security-policy"),/sandbox allow-scripts/);
 assert.match(await play.text(),/Testing without publishing/);
 const publicUrl=runner+"/r/"+id+"/index.html";
 assert.equal((await runtime.fetch(new Request(publicUrl),env)).status,404);
 const forged=privateUrl.replace(token,token.slice(0,-1)+(token.endsWith("a")?"b":"a"));
 assert.equal((await runtime.fetch(new Request(forged),env)).status,404);
 expired=true;
 assert.equal((await runtime.fetch(new Request(privateUrl),env)).status,404);
 const health=await runtime.fetch(new Request(runner+"/__anevum_runtime_health_v004"),env);
 assert.equal(health.status,200);
 assert.equal((await health.json()).version,"004");
});
