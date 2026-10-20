import test from "node:test";
import assert from "node:assert/strict";
import oldWorker from "../site/alpha/v003/unified-creation-v002-pinned-snapshot.mjs";
import v009 from "../site/alpha/v003/unified-creation-candidate-v009.mjs";

const ORIGIN="https://anevum.com";
const ID="5764a892-0526-47b6-953b-4cf6a9053c0f";
const originalHTML='<!doctype html><html lang="en"><head><meta charset="utf-8"></head>'+
  '<body><header><strong>ANEVUM /</strong><a href="/alpha">Alpha releases</a></header>'+
  '<main><h1>Manage projects</h1><div class="notice">Original alpha works</div>'+
  '<div class="player">Safe original player</div></main></body></html>';
function env({published=false}={}){
 const log=[];
 const instance={
  DB:{prepare(sql){return{bind(...args){return{async first(){
    log.push({query:sql,args});
    return published?{status:"published"}:{status:"draft"};
  }}}}}},
  UPSTREAM:{async fetch(req){
   log.push({requestUrl:req.url,method:req.method,body:req.method==="GET"?null:await req.text()});
   return new Response(req.method==="GET"?originalHTML:"Created legacy project",
     {status:req.method==="GET"?200:201,headers:{"content-type":req.method==="GET"?
      "text/html; charset=utf-8":"text/plain; charset=utf-8",
      "x-existing-upstream":"v002","cache-control":"private,no-store"}});
  }}
 };
 return {instance,log};
}
const cases=[
  ["GET","/upload"],
  ["GET","/upload/"],
  ["POST","/upload"],
  ["GET","/play/"+ID],
  ["GET","/alpha"],
  ["GET","/api/v1/alpha/mine"],
  ["GET","/discover"],
  ["POST","/api/v1/alpha/projects/"+ID+"/submit"]
];
async function output(worker,method,path,{published=false}={}){
 const e=env({published});
 const req=new Request(ORIGIN+path,{
   method,headers:{"cookie":"session=synthetic-legacy","origin":ORIGIN,
    "content-type":"text/plain"},
   body:method==="POST"?"original payload bytes":undefined
 });
 const response=await worker.fetch(req,e.instance);
 return {status:response.status,body:await response.text(),
   location:response.headers.get("location"),
   marker:response.headers.get("x-anevum-creation-route"),
   upstream:response.headers.get("x-existing-upstream"),log:e.log};
}
test("V009 integrated candidate preserves real deployed V002 upload/player/alpha responses byte-for-byte while OFF",async()=>{
 for(const [method,path] of cases){
   const expected=await output(oldWorker,method,path);
   const actual=await output(v009,method,path);
   assert.deepEqual(actual,expected,"Preserve "+method+" "+path);
 }
});
test("V009 integrated candidate preserves published original play redirects and private player logic",async()=>{
 const publishedOld=await output(oldWorker,"GET","/play/"+ID,{published:true});
 const publishedV009=await output(v009,"GET","/play/"+ID,{published:true});
 assert.deepEqual(publishedV009,publishedOld);
 assert.equal(publishedV009.status,302);
 assert.equal(publishedV009.location,ORIGIN+"/projects/alpha_"+ID.replaceAll("-",""));
 assert.equal(publishedV009.marker,"native-v001");
 const privateOld=await output(oldWorker,"GET","/play/"+ID,{published:false});
 const privateNew=await output(v009,"GET","/play/"+ID,{published:false});
 assert.equal(privateNew.status,privateOld.status);
 assert.match(privateNew.body,/SAFE PREVIEW/);
});
test("integrated candidate reserves /upload/v3 but never silently falls into the live V002 legacy uploader",async()=>{
 const stage=env();
 const response=await v009.fetch(new Request(ORIGIN+"/upload/v3"),stage.instance);
 assert.equal(response.status,404);
 assert.notEqual(response.headers.get("x-existing-upstream"),"v002");
 assert.equal(stage.log.length,0);
});
test("new namespace fails as 503 with the bridge selected but no verified owner/auth service",async()=>{
 const stage=env();
 stage.instance.PACKAGE_CANONICAL_BRIDGE_ENABLED="true";
 const response=await v009.fetch(new Request(ORIGIN+"/upload/v3"),stage.instance);
 assert.equal(response.status,503);
 assert.equal(stage.log.length,0);
});
