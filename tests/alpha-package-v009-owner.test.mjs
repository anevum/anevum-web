import test from "node:test";
import assert from "node:assert/strict";
import {withPackageUplink} from "../site/alpha/v003/unified-creation-owner-v009.mjs";
import {interceptPackageNamespace} from "../site/alpha/v003/unified-creation-bridge-v009.mjs";

const A="https://anevum.com";
const UUID="77a60afb-8e3d-4f2f-86aa-e4cc2dfa3e20";
function fixture(){
 const legacy=[];
 const origin={async fetch(request,env,ctx){
   const text=await request.text().catch(()=>"");
   legacy.push({url:request.url,method:request.method,body:text,
     cookie:request.headers.get("cookie"),env,ctx});
   return new Response("ORIGINAL UNIFIED WORKER",{status:200,
     headers:{"x-existing-owner":"retained","content-type":"text/plain"}});
 }};
 const calls=[];
 const pkg=async(req,env)=>{
   calls.push({path:new URL(req.url).pathname,method:req.method,env});
   return new Response("PACKAGE SERVICE BOUND",{status:202});
 };
 return {legacy,calls,origin,owner:withPackageUplink(origin,pkg)};
}
test("wrapper accepts an existing Worker but refuses a missing or invalid handler",()=>{
 assert.throws(()=>withPackageUplink(null),/Existing unified/);
 assert.throws(()=>withPackageUplink({fetch:3}),/Existing unified/);
 assert.throws(()=>withPackageUplink({fetch:async()=>null},null),/must be callable/);
});
test("existing /upload /play and alpha POST bodies bypass the package adapter with original credentials",async()=>{
 const f=fixture(),ctx={waitUntil(){}},env={UPSTREAM:{name:"existing"},DB:{name:"original"}};
 const urls=["/upload","/upload/","/play/"+UUID,"/api/v1/alpha/mine",
   "/staff/projects","/api/v1/member/health","/discover"];
 for(const path of urls){
   const req=new Request(A+path,{
     method:"POST",headers:{cookie:"session=old-owned",origin:A,
       "content-type":"text/plain"},body:"preserve old bytes"
   });
   const response=await f.owner.fetch(req,env,ctx);
   assert.equal(response.status,200,path);
   assert.equal(response.headers.get("x-existing-owner"),"retained");
 }
 assert.equal(f.calls.length,0);
 assert.equal(f.legacy.length,urls.length);
 for(const call of f.legacy){
   assert.equal(call.body,"preserve old bytes");
   assert.equal(call.cookie,"session=old-owned");
   assert.equal(call.ctx,ctx);
   assert.equal(call.env,env);
 }
});
test("package namespace has no legacy fallback even if the package binding fails",async()=>{
 const oldCalls=[];
 const existing={async fetch(req){oldCalls.push(req.url);return new Response("LEGACY",{status:200});}};
 for(const bridge of [
   async()=>{throw Error("Package binding unavailable");},
   async()=>null
 ]){
   const handler=withPackageUplink(existing,bridge);
   const response=await handler.fetch(new Request(A+"/upload/v3/api/v1/packages/upload",{
     method:"POST",headers:{origin:A},body:"untrusted-body"
   }),{});
   assert.equal(response.status,503);
   assert.match(await response.text(),/unavailable/);
 }
 assert.equal(oldCalls.length,0,"No failed package requests may reach old uploader");
});
test("package bridge defaults OFF in wrapper even if other original route owner features exist",async()=>{
 let oldHits=0;
 const owner=withPackageUplink({async fetch(){oldHits++;return new Response("OLD",{status:200});}},
   interceptPackageNamespace);
 const env={PACKAGE_CANONICAL_BRIDGE_ENABLED:"false"};
 assert.equal((await owner.fetch(new Request(A+"/upload/v3"),env)).status,404);
 assert.equal((await owner.fetch(new Request(A+"/upload"),env)).status,200);
 assert.equal(oldHits,1);
});
test("old path behavior is not confused by forged cross-origin path or percent-encoded v009 controls",async()=>{
 const f=fixture();
 // The URL parser resolves an encoded dot-dot segment before routing.
 // It remains the old owner's responsibility; never turn it into an upload.
 assert.equal((await f.owner.fetch(new Request(A+"/upload/v3/%2e%2e/alpha"),{})).status,200);
 assert.equal((await f.owner.fetch(new Request("https://evil.invalid/upload/v3"),{})).status,200);
 assert.equal(f.legacy.length,2);
 assert.equal(f.calls.length,0);
});
