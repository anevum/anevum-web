import test from "node:test";
import assert from "node:assert/strict";
import {interceptPackageNamespace,packageBridgeRoute,PACKAGE_NAMESPACE} from "../site/alpha/v003/unified-creation-bridge-v009.mjs";
import packageController from "../site/alpha/v003/api.mjs";

const ORIGIN="https://anevum.com";
const UUID="77a60afb-8e3d-4f2f-86aa-e4cc2dfa3e20";
const response=(body,type="text/html",status=200,headers={})=>
 new Response(body,{status,headers:{"content-type":type,...headers}});
function makeEnv(reply=response("<!doctype html><html><body>READY</body></html>")) {
 const calls=[];
 return {
   calls,
   env:{
     PACKAGE_CANONICAL_BRIDGE_ENABLED:"true",
     PACKAGE_IDENTITY_BRIDGE_VERIFIED:"true",
     PACKAGE_CONTROL:{
       async fetch(req){
         calls.push({url:req.url,method:req.method,headers:new Headers(req.headers),
           body:req.method==="POST"?await req.text():null});
         return typeof reply==="function"?reply(req):reply;
       }
     }
   }
 };
}
const get=(url,headers={})=>new Request(ORIGIN+url,{headers,redirect:"manual"});
const post=(url,payload="{}",headers={})=>
 new Request(ORIGIN+url,{method:"POST",headers:{
   origin:ORIGIN,"content-type":"application/json",
   "x-anevum-package":"v003",...headers},body:payload,redirect:"manual"});

test("namespace is explicit, never captures the old HTML uploader or the old alpha/play API",()=>{
 assert.equal(PACKAGE_NAMESPACE,"/upload/v3");
 for(const path of ["/","/upload","/upload/","/upload-old","/upload/v2","/play/"+UUID,
   "/play/v3/"+UUID,"/api/v1/packages/me","/api/v1/alpha/upload","/staff","/discover",
   "/studio","/member"]){
   assert.equal(packageBridgeRoute(new URL(ORIGIN+path),"GET"),null,path);
 }
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3"),"GET"),{target:"/upload/v3"});
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3/"),"GET"),{target:"/upload/v3"});
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3/library"),"GET"),{target:"/packages"});
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3/help"),"GET"),{target:"/help/packages"});
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3/review"),"GET"),{target:"/staff/packages"});
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3/play/"+UUID+"?preview=1"),"GET"),{target:"/play/v3/"+UUID});
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3/api/v1/packages/me"),"GET"),{target:"/api/v1/packages/me"});
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+"/upload/v3/api/v1/packages/upload"),"POST"),{target:"/api/v1/packages/upload"});
});
test("unknown subpaths, cross-origin URL, unsafe chars and unauthorized methods never proxy",async()=>{
 const {env,calls}=makeEnv();
 for(const path of ["/upload/v3/random","/upload/v3/api/v1/member/space",
   "/upload/v3/api/v1/packages/../../staff","/upload/v3/%73taff",
   "/upload/v3/play/not-a-uuid","/upload/v3/player/"+UUID,
   "/upload/v3/api/v1/packages/deny?data="+"x".repeat(701)]){
   const r=await interceptPackageNamespace(get(path),env);
   assert.equal(r?.status,404,path);
 }
 for(const path of ["/upload/v3","/upload/v3/help","/upload/v3/play/"+UUID]){
   const r=await interceptPackageNamespace(post(path));
   // API-under-test receives no service and must refuse even without env.
   assert.ok(r&&[404,405].includes(r.status));
 }
 assert.equal(packageBridgeRoute(new URL("https://other.invalid/upload/v3"),"GET"),null);
 assert.equal(calls.length,0);
});
test("disabled bridge fails closed inside owned namespace and does not substitute legacy upload",async()=>{
 const {env,calls}=makeEnv();
 env.PACKAGE_CANONICAL_BRIDGE_ENABLED="false";
 let r=await interceptPackageNamespace(get("/upload/v3"),env);
 assert.equal(r?.status,404);
 env.PACKAGE_CANONICAL_BRIDGE_ENABLED="true";
 env.PACKAGE_IDENTITY_BRIDGE_VERIFIED="false";
 r=await interceptPackageNamespace(get("/upload/v3"),env);
 assert.equal(r?.status,503);
 env.PACKAGE_IDENTITY_BRIDGE_VERIFIED="true";
 delete env.PACKAGE_CONTROL;
 r=await interceptPackageNamespace(get("/upload/v3"),env);
 assert.equal(r?.status,503);
 assert.equal(await interceptPackageNamespace(get("/upload"),env),null);
 assert.equal(calls.length,0);
});
test("same-origin session goes only through named Cloudflare service binding; synthetic identity headers are dropped",async()=>{
 const {env,calls}=makeEnv(response('{"id":"owner"}',"application/json"));
 const r=await interceptPackageNamespace(get("/upload/v3/api/v1/packages/me",{
   cookie:"session=synthetic-owner",
   authorization:"Bearer forged",
   "x-anevum-member-id":"forged","x-anevum-owner-id":"forged",
   "x-anevum-staff-id":"forged","x-anevum-verified-user":"forged",
   "x-anevum-identity":"forged"}),env);
 assert.equal(r?.status,200);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,ORIGIN+"/api/v1/packages/me");
 assert.equal(calls[0].headers.get("cookie"),"session=synthetic-owner");
 for(const key of ["authorization","x-anevum-member-id","x-anevum-owner-id",
    "x-anevum-staff-id","x-anevum-verified-user","x-anevum-identity"])
   assert.equal(calls[0].headers.has(key),false,key);
 assert.equal(r.headers.get("cache-control"),"private,no-store");
 assert.equal(r.headers.get("x-anevum-package-namespace"),"canonical-v009");
});
test("POST rejects missing/wrong origin and explicitly cross-site fetch metadata",async()=>{
 const {env,calls}=makeEnv(response(JSON.stringify({id:UUID,release_id:UUID,status:"ready",play_url:"/play/v3/"+UUID+"?preview=1"}),"application/json",201));
 for(const opts of [{origin:"https://evil.invalid"},{origin:ORIGIN,"sec-fetch-site":"cross-site"},
   {origin:ORIGIN,"sec-fetch-site":"same-site"}]){
   const r=await interceptPackageNamespace(post("/upload/v3/api/v1/packages/upload","{}",opts),env);
   assert.equal(r?.status,403);
 }
 let r=await interceptPackageNamespace(new Request(ORIGIN+"/upload/v3/api/v1/packages/upload",{
   method:"POST",headers:{"content-type":"application/json"},body:"{}"}),env);
 assert.equal(r?.status,403);
 r=await interceptPackageNamespace(post("/upload/v3/api/v1/packages/upload",'{"draft":"synthetic"}',{"sec-fetch-site":"same-origin"}),env);
 assert.equal(r?.status,201);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,ORIGIN+"/api/v1/packages/upload");
 assert.equal(calls[0].body,'{"draft":"synthetic"}');
 assert.equal(calls[0].headers.get("origin"),ORIGIN);
 assert.equal(calls[0].headers.get("x-anevum-package"),"v003");
});
test("creator UI HTML internal links and inline controller APIs stay under the existing upload route",async()=>{
 const html='<html><body><a href="/help/packages">Guide</a><a href="/packages">Library</a>'+
 '<a href="/staff/packages">Review</a><a href="/upload/v3?update='+UUID+'">Edit</a>'+
 '<script>fetch("/api/v1/packages/upload");location.assign("/play/v3/'+UUID+'?preview=1")</script>'+
 '<img src="/api/v1/packages/covers/'+UUID+'"></body></html>';
 const {env}=makeEnv(response(html,"text/html",200,{
   "content-security-policy":"default-src 'none'; frame-src https://run.example",
   "set-cookie":"other-issuer=malicious; Path=/","access-control-allow-origin":"*",
   etag:"unverified","content-length":String(html.length)
 }));
 const output=await interceptPackageNamespace(get("/upload/v3"),env);
 assert.equal(output?.status,200);
 const body=await output.text();
 assert.match(body,/href="\/upload\/v3\/help"/);
 assert.match(body,/href="\/upload\/v3\/library"/);
 assert.match(body,/href="\/upload\/v3\/review"/);
 assert.match(body,/fetch\("\/upload\/v3\/api\/v1\/packages\/upload"\)/);
 assert.match(body,/location\.assign\("\/upload\/v3\/play\//);
 assert.match(body,/src="\/upload\/v3\/api\/v1\/packages\/covers\//);
 assert.match(body,/href="\/upload\/v3\?update=/);
 assert.equal(output.headers.get("set-cookie"),null);
 assert.equal(output.headers.get("access-control-allow-origin"),null);
 assert.equal(output.headers.get("etag"),null);
 assert.equal(output.headers.get("content-length"),null);
 assert.match(output.headers.get("content-security-policy"),/frame-src https:\/\/run\.example/);
});
test("release image and public catalogue JSON cover URLs stay inside the namespace",async()=>{
 const payload={projects:[{id:UUID,title:"Fixture",cover_url:"/api/v1/packages/covers/"+UUID},
   {id:"second",cover_url:null}]};
 const {env,calls}=makeEnv(response(JSON.stringify(payload),"application/json"));
 let output=await interceptPackageNamespace(get("/upload/v3/api/v1/packages/projects"),env);
 assert.equal(output?.status,200);
 const body=await output.json();
 assert.equal(body.projects[0].cover_url,"/upload/v3/api/v1/packages/covers/"+UUID);
 assert.equal(body.projects[1].cover_url,null);
 assert.equal(calls[0].url,ORIGIN+"/api/v1/packages/projects");
});
test("backend redirects, unreachable service and malformed public payload fail closed",async()=>{
 for(const reply of [
   response(null,"text/plain",302,{location:"https://untrusted.invalid"}),
   async()=>{throw Error("synthetic backend outage")},
   response("[]","application/json")
 ]){
   const {env}=makeEnv(reply);
   const out=await interceptPackageNamespace(get("/upload/v3/api/v1/packages/projects"),env);
   assert.equal(out?.status,503);
 }
});

function actualControllerFixture(){
 const authCalls=[],stageHits=[];
 const stageEnv={
   DB:{prepare(sql){
     const stmt={bind(){return stmt;},async first(){
       if(sql.includes("sqlite_master"))return {n:7};
       return null;
     },async all(){return {results:[]}},async run(){return {meta:{changes:0}}}};
     return stmt;
   }},
   MEDIA:{async put(){throw Error("No R2 writes in route acceptance");},
     async head(){return null},async get(){return null}},
   RUNTIME_HOST:"isolated.example.invalid",
   PILOT_IDS:"creator-member",
   STAFF_IDS:"reviewer-member",
   PACKAGE_PUBLIC_PUBLISH_ENABLED:"false",
   AUTH:{async fetch(req){
     authCalls.push({url:req.url,cookie:req.headers.get("cookie")});
     const token=req.headers.get("cookie")||"";
     const id=token==="session=creator"?"creator-member":
       token==="session=reviewer"?"reviewer-member":null;
     if(new URL(req.url).pathname==="/api/v1/member/creator-profile")
       return id?Response.json({memberId:id,profile:{handle:id==="creator-member"?"cosmiccreator":"trustedreviewer",createdAt:1760000000,visibility:"public"}}):
         Response.json({error:"Sign-in required"},{status:401});
     return Response.json({user:id?{id,emailVerified:true}:null,
       session:id?{id:"verified-session"}:null});
   }}
 };
 const service={
   async fetch(req){
     stageHits.push({url:req.url,method:req.method});
     return packageController.fetch(req,stageEnv);
   }
 };
 return {authCalls,stageHits,stageEnv,env:{PACKAGE_CANONICAL_BRIDGE_ENABLED:"true",
   PACKAGE_IDENTITY_BRIDGE_VERIFIED:"true",PACKAGE_CONTROL:service}};
}
test("real package controller through V009 bridge preserves owner session and gives private editable uploader",async()=>{
 const {authCalls,stageHits,env}=actualControllerFixture();
 const guest=await interceptPackageNamespace(get("/upload/v3"),env);
 assert.equal(guest.status,200);
 const guestHTML=await guest.text();
 assert.match(guestHTML,/Sign in to upload/);
 assert.doesNotMatch(guestHTML,/id="publish-form"/);
 assert.equal(authCalls.length,0);
 const owner=await interceptPackageNamespace(get("/upload/v3",{cookie:"session=creator"}),env);
 assert.equal(owner.status,200);
 const html=await owner.text();
 assert.match(html,/id="publish-form"/);
 assert.match(html,/\/upload\/v3\/api\/v1\/packages\/upload/);
 assert.match(html,/\/upload\/v3\/help/);
 assert.match(html,/\/upload\/v3\/play\//);
 assert.equal(authCalls[0].url,ORIGIN+"/api/v1/member/auth/get-session");
 assert.equal(authCalls[0].cookie,"session=creator");
 assert.equal(stageHits[stageHits.length-1].url,ORIGIN+"/upload/v3");
 assert.equal(owner.headers.get("set-cookie"),null);
});
test("real package controller bridged review queue requires reviewer session and exposes no owner privilege",async()=>{
 const {env,authCalls}=actualControllerFixture();
 const denied=await interceptPackageNamespace(get("/upload/v3/review",{cookie:"session=creator"}),env);
 assert.equal(denied.status,404);
 const staff=await interceptPackageNamespace(get("/upload/v3/review",{cookie:"session=reviewer"}),env);
 assert.equal(staff.status,200);
 const html=await staff.text();
 assert.match(html,/Review the <em>experience/);
 assert.equal(authCalls.at(-1).cookie,"session=reviewer");
});
test("real controller rejects forged member headers through service bridge without cookie",async()=>{
 const {env,authCalls}=actualControllerFixture();
 const request=post("/upload/v3/api/v1/packages/upload","{}",{
  "x-anevum-member-id":"creator-member",
  "x-anevum-verified-user":"true"
 });
 const response=await interceptPackageNamespace(request,env);
 assert.equal(response.status,401);
 const result=await response.json();
 assert.match(result.error,/verified ANEVUM session/);
 assert.equal(authCalls.length,0,"No owner can be invented from a client header");
});
test("real controller bridged health truthfully reports disabled publication and ready schema",async()=>{
 const {env}=actualControllerFixture();
 const response=await interceptPackageNamespace(get("/upload/v3/api/v1/packages/health"),env);
 assert.equal(response.status,200);
 const j=await response.json();
 assert.equal(j.schemaReady,true);
 assert.equal(j.uploadReady,true);
 assert.equal(j.publicPublishingEnabled,false);
 assert.equal(j.runtimeLiveVerified,false);
});


test("V010 creator gallery, private owner library and new uploads rewrite only validated internal URLs",async()=>{
 const id=UUID,cover="/api/v1/packages/covers/"+id,play="/play/v3/"+id;
 const list={handle:"cosmiccreator",projects:[{id,title:"Cosmic Racer",cover_url:cover,play_url:play},
   {id:"second",cover_url:null,play_url:null}]};
 const route="/upload/v3/api/v1/packages/creators/cosmiccreator/projects";
 for(const path of [route,"/upload/v3/api/v1/packages/mine"]){
   const {env}=makeEnv(response(JSON.stringify(list),"application/json"));
   const r=await interceptPackageNamespace(get(path),env);
   assert.equal(r.status,200);
   const data=await r.json();
   assert.equal(data.projects[0].cover_url,"/upload/v3"+cover);
   assert.equal(data.projects[0].play_url,"/upload/v3"+play);
   assert.equal(data.projects[1].cover_url,null);
   assert.equal(data.projects[1].play_url,null);
 }
 const {env}=makeEnv(response(JSON.stringify({id,release_id:id,status:"ready",play_url:play+"?preview=1"}),
   "application/json",201));
 const uploaded=await interceptPackageNamespace(post("/upload/v3/api/v1/packages/upload",
   JSON.stringify({title:"Cosmic Racer"})),env);
 assert.equal(uploaded.status,201);
 assert.equal((await uploaded.json()).play_url,"/upload/v3"+play+"?preview=1");
});
test("V010 bridge never rewrites untrusted external game URLs into an executable same-origin path",async()=>{
 const data={handle:"cosmiccreator",projects:[
   {id:UUID,cover_url:"https://evil.invalid/image.png",play_url:"https://evil.invalid/game"},
   {id:"second",cover_url:"//evil.invalid/cover.png",play_url:"/login"},
   {id:"third",cover_url:"/api/v1/packages/covers/not-a-uuid",play_url:"/play/v3/not-a-uuid"}
 ]};
 const {env}=makeEnv(response(JSON.stringify(data),"application/json"));
 const result=await interceptPackageNamespace(get("/upload/v3/api/v1/packages/creators/cosmiccreator/projects"),env);
 assert.equal(result.status,200);
 assert.deepEqual((await result.json()).projects,data.projects);
});

const PREFLIGHT="/upload/v3/preflight";
function preflightFixture(){
 const f=actualControllerFixture();
 f.env.PACKAGE_IDENTITY_PREFLIGHT_ENABLED="true";
 f.env.PACKAGE_CANONICAL_BRIDGE_ENABLED="false";
 f.env.PACKAGE_IDENTITY_BRIDGE_VERIFIED="false";
 f.stageEnv.PACKAGE_CREATOR_GALLERY_ENABLED="false";
 f.stageEnv.PACKAGE_RESOURCE_PROTECTION_ENABLED="false";
 f.dataAccess=[];
 for(const name of ["DB","MEDIA"]){
   f.stageEnv[name]=new Proxy({}, {get(_,key){
     f.dataAccess.push(name+"."+String(key));
     throw Error("Read-only identity preflight must not access package data");
   }});
 }
 return f;
}
test("identity preflight is exact GET-only, has its own default-OFF opt-in and cannot use query overrides",async()=>{
 assert.deepEqual(packageBridgeRoute(new URL(ORIGIN+PREFLIGHT),"GET"),{preflight:true});
 const {env,calls}=makeEnv();
 for(const value of [undefined,false,true,"false","TRUE","true "]){
   env.PACKAGE_IDENTITY_PREFLIGHT_ENABLED=value;
   const out=await interceptPackageNamespace(get(PREFLIGHT,{cookie:"session=creator"}),env);
   assert.equal(out.status,404,String(value));
 }
 env.PACKAGE_IDENTITY_PREFLIGHT_ENABLED="true";
 for(const method of ["POST","PUT","PATCH","DELETE","HEAD","OPTIONS"]){
   const out=await interceptPackageNamespace(new Request(ORIGIN+PREFLIGHT,{method}),env);
   assert.equal(out.status,405,method);
 }
 for(const path of [PREFLIGHT+"/",PREFLIGHT+"?member=creator-member",
   PREFLIGHT+"?target=/api/v1/packages/upload","/upload/v3/%70reflight"]){
   assert.equal((await interceptPackageNamespace(get(path,{cookie:"session=creator"}),env)).status,404,path);
 }
 assert.equal(calls.length,0);
});
test("preflight uses existing controller canonical AUTH for pilot and reviewer without package DB/R2 access",async()=>{
 const f=preflightFixture();
 for(const [cookie,pilot,reviewer] of [["session=creator",true,false],["session=reviewer",false,true]]){
   const out=await interceptPackageNamespace(get(PREFLIGHT,{cookie,"sec-fetch-site":"same-origin"}),f.env);
   assert.equal(out.status,200);
   assert.deepEqual(await out.json(),{
     contract:"canonical-session-preflight-v001",readOnly:true,authenticated:true,pilot,reviewer,
     bridgeEnabled:false,identityBridgeVerified:false
   });
   assert.equal(out.headers.get("cache-control"),"private,no-store");
   assert.equal(out.headers.get("vary"),"Cookie");
   assert.equal(out.headers.get("set-cookie"),null);
   assert.equal(out.headers.get("access-control-allow-origin"),null);
   assert.deepEqual(f.authCalls.at(-1),{url:ORIGIN+"/api/v1/member/auth/get-session",cookie});
   assert.deepEqual(f.stageHits.at(-1),{url:ORIGIN+"/api/v1/packages/me",method:"GET"});
 }
 assert.equal(f.authCalls.length,2,"No creator-profile or other identity requests");
 assert.deepEqual(f.dataAccess,[],"No package read, mutation, preview token or R2 access");
 assert.equal(f.env.PACKAGE_CANONICAL_BRIDGE_ENABLED,"false");
 assert.equal(f.env.PACKAGE_IDENTITY_BRIDGE_VERIFIED,"false");
 for(const flag of ["PACKAGE_PUBLIC_PUBLISH_ENABLED","PACKAGE_CREATOR_GALLERY_ENABLED","PACKAGE_RESOURCE_PROTECTION_ENABLED"])
   assert.equal(f.stageEnv[flag],"false");
});
test("preflight refuses anonymous, revoked, unverified and non-pilot/non-reviewer canonical sessions",async()=>{
 const f=preflightFixture();
 assert.equal((await interceptPackageNamespace(get(PREFLIGHT),f.env)).status,401);
 assert.equal(f.stageHits.length,0);
 assert.equal((await interceptPackageNamespace(get(PREFLIGHT,{cookie:"session=revoked"}),f.env)).status,401);
 for(const [session,status] of [
   [{user:{id:"creator-member",emailVerified:false},session:{id:"current"}},401],
   [{user:{id:"creator-member",emailVerified:true},session:null},401],
   [{user:{id:"ordinary-member",emailVerified:true},session:{id:"current"}},403]
 ]){
   f.stageEnv.AUTH={async fetch(){return Response.json(session);}};
   assert.equal((await interceptPackageNamespace(get(PREFLIGHT,{cookie:"session=real-shaped"}),f.env)).status,status);
 }
 assert.deepEqual(f.dataAccess,[]);
});
test("preflight rejects foreign browser context before resolving a cookie and drops all caller authority headers",async()=>{
 const {env,calls}=makeEnv(response(JSON.stringify({authenticated:true,pilot:true,reviewer:false,
   memberId:"must-not-leak",session:"must-not-leak"}),"application/json",200,{
   "set-cookie":"unrelated=secret","access-control-allow-origin":"*","location":"https://evil.invalid"
 }));
 env.PACKAGE_IDENTITY_PREFLIGHT_ENABLED="true";
 for(const headers of [{origin:"https://evil.invalid"},{origin:"null"},
   {"sec-fetch-site":"cross-site"},{"sec-fetch-site":"same-site"}]){
   const out=await interceptPackageNamespace(get(PREFLIGHT,{cookie:"session=creator",...headers}),env);
   assert.equal(out.status,403);
 }
 for(const origin of ["https://evil.invalid","http://anevum.com","https://anevum.com:8443"])
   assert.equal(await interceptPackageNamespace(new Request(origin+PREFLIGHT,{headers:{cookie:"session=creator"}}),env),null);
 assert.equal(calls.length,0);
 const out=await interceptPackageNamespace(get(PREFLIGHT,{cookie:"session=creator",origin:ORIGIN,
   "sec-fetch-site":"same-origin","user-agent":"Preflight acceptance",
   authorization:"Bearer forged","x-anevum-member-id":"forged","x-anevum-owner-id":"forged",
   "x-anevum-staff-id":"forged","x-anevum-verified-user":"true","x-anevum-identity":"forged"}),env);
 assert.equal(out.status,200);
 assert.equal(calls.length,1);
 assert.deepEqual([...calls[0].headers.keys()].sort(),["accept","cookie","user-agent"]);
 assert.equal(calls[0].url,ORIGIN+"/api/v1/packages/me");
 assert.equal(calls[0].method,"GET");
 assert.equal(calls[0].body,null);
 const body=await out.text();
 assert.doesNotMatch(body,/creator-member|session=creator|must-not-leak|forged/);
 for(const key of ["set-cookie","access-control-allow-origin","access-control-allow-credentials","location"])
   assert.equal(out.headers.get(key),null,key);
});
test("preflight refuses unavailable, redirected or malformed controller identity results",async()=>{
 const replies=[
   response(null,"text/plain",302,{location:ORIGIN+"/join"}),
   response("blocked","text/plain",401),response("unavailable","application/json",503),
   response("{}","text/html"),response("invalid json","application/json"),
   response("[]","application/json"),response("null","application/json"),
   response(JSON.stringify({authenticated:"true",pilot:true,reviewer:false}),"application/json"),
   response(JSON.stringify({authenticated:true,pilot:"true",reviewer:false}),"application/json"),
   response(JSON.stringify({authenticated:true,pilot:true}),"application/json"),
   response(" ".repeat(16385)+JSON.stringify({authenticated:true,pilot:true,reviewer:false}),"application/json"),
   async()=>{throw Error("Service unavailable");},async()=>null
 ];
 for(const reply of replies){
   const {env}=makeEnv(reply);env.PACKAGE_IDENTITY_PREFLIGHT_ENABLED="true";
   assert.equal((await interceptPackageNamespace(get(PREFLIGHT,{cookie:"session=creator"}),env)).status,503);
 }
 const f=preflightFixture();delete f.env.PACKAGE_CONTROL;
 assert.equal((await interceptPackageNamespace(get(PREFLIGHT,{cookie:"session=creator"}),f.env)).status,503);
});
test("read-only preflight opt-in does not open UI, private preview, gallery or any mutation path",async()=>{
 const paths=[
   ["GET","/upload/v3"],["GET","/upload/v3/library"],["GET","/upload/v3/review"],
   ["GET","/upload/v3/play/"+UUID+"?preview=1"],
   ["GET","/upload/v3/api/v1/packages/me"],["GET","/upload/v3/api/v1/packages/mine"],
   ["GET","/upload/v3/api/v1/packages/creators/cosmiccreator/projects"],
   ["POST","/upload/v3/api/v1/packages/upload"],
   ...["submit","review","delete","discard","moderate","save"].map(action=>
     ["POST","/upload/v3/api/v1/packages/projects/"+UUID+"/"+action]),
   ["POST","/upload/v3/api/v1/packages/maintenance/reclaim"]
 ];
 const f=preflightFixture();
 for(const bridgeEnabled of ["false","true"]){
   f.env.PACKAGE_CANONICAL_BRIDGE_ENABLED=bridgeEnabled;
   for(const [method,path] of paths){
     const req=method==="POST"?post(path,"{}",{cookie:"session=creator"}):get(path,{cookie:"session=creator"});
     const out=await interceptPackageNamespace(req,f.env);
     assert.equal(out.status,bridgeEnabled==="false"?404:503,method+" "+path);
   }
 }
 assert.equal(f.stageHits.length,0,"Only the exact preflight endpoint may contact the controller");
 assert.equal(f.authCalls.length,0);
 assert.deepEqual(f.dataAccess,[]);
 assert.equal(f.env.PACKAGE_IDENTITY_BRIDGE_VERIFIED,"false");
});
