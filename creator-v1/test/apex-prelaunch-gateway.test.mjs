import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";
import {createApexPrelaunchGateway} from "../apex-prelaunch/gateway.mjs";
import {ACCESS_ISSUER,verifiedPreviewIdentity,resetPreviewKeyCacheForTests} from
  "../apex-prelaunch/preview-access.mjs";
import {canonicalRequestOrigin,canonicalCookiePrefix,isCanonicalOrigin,withoutForeignCookies}
  from "../canonical-auth/policy.mjs";
import {canonicalAuthOptions} from "../canonical-auth/auth.mjs";

const root="https://anevum.com";
const gate={ANEVUM_CANONICAL_APEX_ENABLED:"true",ANEVUM_PRELAUNCH_MODE:"gated",
  ANEVUM_LAUNCH_APPROVED:"false"};
const go=(path="/",method="GET",headers={})=>
  new Request(root+path,{method,headers});
const router=createApexPrelaunchGateway({
  identity:async()=>null,
  platform:async()=>{throw Error("Unauthenticated request reached platform");}
});
const res=(request,env=gate)=>router.fetch(request,env,{});
const h=(r,k)=>r.headers.get(k);

test("candidate Worker stays unrouted, isolated, owner-only and countdown-first",()=>{
  const cfg=JSON.parse(readFileSync(new URL("../wrangler.apex-prelaunch.jsonc",import.meta.url),"utf8"));
  assert.equal(cfg.name,"anevum-apex-prelaunch-gateway");
  assert.equal(cfg.main,"./apex-prelaunch/gateway.mjs");
  assert.deepEqual(cfg.routes,[]);
  assert.equal(cfg.workers_dev,false);
  assert.equal(cfg.preview_urls,false);
  assert.equal(cfg.assets.run_worker_first,true);
  assert.equal(cfg.assets.directory,"./dist/web");
  assert.equal(cfg.vars.ANEVUM_PRELAUNCH_MODE,"gated");
  assert.equal(cfg.vars.ANEVUM_LAUNCH_APPROVED,"false");
  assert.equal(cfg.vars.ANEVUM_CANONICAL_APEX_ENABLED,"true");
  assert.deepEqual(cfg.d1_databases.map(d=>[d.binding,d.database_id]),[
    ["COMMUNITY_DB","fa96e36d-6257-4883-bf15-074947e11a13"],
    ["MEMBER_DB","e1d29049-c83b-4534-8355-dc1fa36ba6d8"]
  ]);
  assert.equal(Object.keys(cfg.vars).some(k=>/SECRET|TOKEN|_EMAILS|_AUD/.test(k)),false);
  for(const provider of ["GOOGLE","APPLE","MICROSOFT","GITHUB"]){
    assert.equal(cfg.vars["CANONICAL_"+provider+"_ENABLED"],"false");
  }
});
test("unconfigured visitors only see preserved countdown, including deep links",async()=>{
  for(const path of ["/","/join","/member","/create","/studio","/unexpected/private"]){
    const r=await res(go(path));
    assert.equal(r.status,200,path);
    const html=await r.text();
    assert.match(html,/ANEVUM \/\/ THE TRANSMISSION/);
    assert.match(html,/January 1, 2027/);
    assert.equal(h(r,"cache-control"),"private, no-store");
    assert.match(h(r,"content-security-policy"),/script-src 'unsafe-inline'/);
  }
  const head=await res(go("/","HEAD"));
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
});
test("no REST, static file, or private preview entrance is anonymously reachable",async()=>{
  for(const path of [
    "/api/v1/member/health","/api/v1/member/auth/sign-in/social",
    "/api/v1/community/threads","/assets/index-deadbeef.js",
    "/assets/banner.webp","/manifest.webmanifest","/robots.txt.backup",
    "/cdn-cgi/preview","/anything.json","/somefile.zip"]){
    const r=await res(go(path));
    assert.equal(r.status,404,path);
    assert.doesNotMatch(await r.text(),/ANEVUM \/\/ THE TRANSMISSION/);
  }
  const robots=await res(go("/robots.txt"));
  assert.equal(robots.status,200);
  assert.equal(await robots.text(),"User-agent: *\nDisallow: /\n");
  const favicon=await res(go("/favicon.ico"));
  assert.equal(favicon.status,204);
});
test("unauthorized write methods are blocked even when they address a public page",async()=>{
  for(const path of ["/","/join","/api/v1/member/auth/sign-in/email-otp","/assets/index.js"]){
    const r=await res(go(path,"POST",{"origin":root,"content-type":"application/json"}));
    assert.equal(r.status,405,path);
    assert.equal(h(r,"allow"),"GET, HEAD");
  }
});
test("a leaked token is not a bypass without cryptographic identity approval",async()=>{
  const r=await res(go("/member","GET",{"cookie":"CF_Authorization=forged.token.signature"}));
  assert.equal(r.status,200);
  assert.match(await r.text(),/ANEVUM \/\/ THE TRANSMISSION/);
  const entry=await res(go("/__enter"));
  assert.equal(entry.status,403);
});
test("only explicitly verified Access identity receives private platform and APIs",async()=>{
  const calls=[];
  const gateWorker=createApexPrelaunchGateway({
    identity:async()=>({email:"test-owner@example.com"}),
    platform:async req=>{
      calls.push({path:new URL(req.url).pathname,method:req.method});
      return new Response("PRIVATE CONTENT",{status:201,headers:{
        "content-type":"text/html; charset=utf-8",
        "set-cookie":"__Secure-anevum_can_apex.session_token=test; Path=/; HttpOnly; Secure"
      }});
    }
  });
  for(const path of ["/","/member","/assets/index.js","/api/v1/member/health"]){
    const r=await gateWorker.fetch(go(path),gate,{});
    assert.equal(r.status,201);
    assert.equal(await r.text(),"PRIVATE CONTENT");
    assert.equal(h(r,"cache-control"),"private, no-store");
    assert.match(h(r,"set-cookie"),/anevum_can_apex/);
    assert.equal(h(r,"x-robots-tag"),"noindex, nofollow, noarchive");
  }
  const enter=await gateWorker.fetch(go("/__enter"),gate,{});
  assert.equal(enter.status,303);
  assert.equal(h(enter,"location"),"/");
  const write=await gateWorker.fetch(go("/api/v1/member/creator-profile","PATCH"),gate,{});
  assert.equal(write.status,201);
  assert.deepEqual(calls.at(-1),{path:"/api/v1/member/creator-profile",method:"PATCH"});
});
test("launch remains gated without BOTH explicit launch approval and permanent origin",async()=>{
  const spy=[];
  const candidate=createApexPrelaunchGateway({
    identity:async()=>null,
    platform:async()=>{spy.push("public");return new Response("LIVE");}
  });
  for(const env of [
    {...gate,ANEVUM_PRELAUNCH_MODE:"public"},
    {...gate,ANEVUM_PRELAUNCH_MODE:"gated",ANEVUM_LAUNCH_APPROVED:"true"},
    {...gate,ANEVUM_PRELAUNCH_MODE:"public",ANEVUM_LAUNCH_APPROVED:"true",
      ANEVUM_CANONICAL_APEX_ENABLED:"false"},
    {...gate,ANEVUM_PRELAUNCH_MODE:"unknown",ANEVUM_LAUNCH_APPROVED:"true"}
  ]){
    const r=await candidate.fetch(go("/member"),env,{});
    assert.equal(r.status,200);
    assert.match(await r.text(),/ANEVUM \/\/ THE TRANSMISSION/);
  }
  assert.deepEqual(spy,[]);
  const r=await candidate.fetch(go("/member"),{...gate,
    ANEVUM_PRELAUNCH_MODE:"public",ANEVUM_LAUNCH_APPROVED:"true"},{});
  assert.equal(await r.text(),"LIVE");
  assert.deepEqual(spy,["public"]);
});
test("incorrect host or protocol never accesses the platform",async()=>{
  const worker=createApexPrelaunchGateway({identity:async()=>({email:"ok"}),
    platform:async()=>{throw Error("Foreign origin reached platform");}});
  for(const url of ["https://a.anevum.com/member","http://anevum.com/member",
    "https://www.anevum.com/member"]){
    const r=await worker.fetch(new Request(url),gate,{});
    assert.equal(r.status,404,url);
  }
});
test("canonical session, callbacks and cookies explicitly follow the deployment host",()=>{
  const stageEnv={ANEVUM_CANONICAL_STAGE_ENABLED:"true",
    CANONICAL_SCHEMA_APPROVED:"true",CANONICAL_EMAIL_ENABLED:"true",
    CANONICAL_PUBLIC_SIGNUP_ENABLED:"true",
    CANONICAL_BETTER_AUTH_SECRET:"a".repeat(64),
    CANONICAL_RESEND_API_KEY:"b".repeat(64),
    CANONICAL_PROTECTED_EMAILS:"protected@example.com",
    MEMBER_DB:{prepare(){return {all:async()=>({results:[]})}},batch:async()=>[]}};
  const apex={...stageEnv,ANEVUM_CANONICAL_APEX_ENABLED:"true"};
  assert.equal(canonicalRequestOrigin(stageEnv),"https://a.anevum.com");
  assert.equal(canonicalRequestOrigin(apex),"https://anevum.com");
  assert.equal(canonicalCookiePrefix(stageEnv),"anevum_can_stage");
  assert.equal(canonicalCookiePrefix(apex),"anevum_can_apex");
  assert.equal(isCanonicalOrigin(new Request("https://a.anevum.com/member"),stageEnv),true);
  assert.equal(isCanonicalOrigin(new Request("https://a.anevum.com/member"),apex),false);
  assert.equal(isCanonicalOrigin(new Request("https://anevum.com/member"),apex),true);
  assert.equal(canonicalAuthOptions(stageEnv).baseURL,"https://a.anevum.com");
  assert.equal(canonicalAuthOptions(apex).baseURL,"https://anevum.com");
  assert.equal(canonicalAuthOptions(stageEnv).advanced.cookiePrefix,"anevum_can_stage");
  assert.equal(canonicalAuthOptions(apex).advanced.cookiePrefix,"anevum_can_apex");
  const cookies="__Secure-anevum_can_apex.session_token=apex; __Secure-anevum_can_stage.session_token=stage; CF_Authorization=jwt";
  const request=go("/member","GET",{cookie:cookies,Authorization:"Bearer old"});
  const filtered=withoutForeignCookies(request,apex);
  assert.equal(filtered.headers.get("cookie"),"__Secure-anevum_can_apex.session_token=apex");
  assert.equal(filtered.headers.get("authorization"),null);
  const stageFiltered=withoutForeignCookies(request,stageEnv);
  assert.equal(stageFiltered.headers.get("cookie"),"__Secure-anevum_can_stage.session_token=stage");
});

const cryptoApi=globalThis.crypto||webcrypto;
const enc=new TextEncoder();
const base64Url=value=>Buffer.from(value).toString("base64url");
let fixture=null;
async function signedFixture(){
  if(fixture)return fixture;
  const pair=await cryptoApi.subtle.generateKey({
    name:"RSASSA-PKCS1-v1_5",modulusLength:2048,
    publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"
  },true,["sign","verify"]);
  const jwk=await cryptoApi.subtle.exportKey("jwk",pair.publicKey);
  jwk.kid="anevum-test-key";
  fixture={pair,jwk};
  return fixture;
}
async function signedToken(changes={},headerChanges={}){
  const {pair}=await signedFixture();
  const now=Math.floor(Date.now()/1000);
  const header=base64Url(JSON.stringify({alg:"RS256",kid:"anevum-test-key",...headerChanges}));
  const payload=base64Url(JSON.stringify({
    iss:ACCESS_ISSUER,aud:"a".repeat(64),email:"approved@example.com",
    iat:now-30,exp:now+3600,sub:"owner",...changes
  }));
  const signature=await cryptoApi.subtle.sign("RSASSA-PKCS1-v1_5",pair.privateKey,
    enc.encode(header+"."+payload));
  return [header,payload,base64Url(new Uint8Array(signature))].join(".");
}
const accessEnv={
  ANEVUM_ACCESS_AUD:"a".repeat(64),
  ANEVUM_PREVIEW_ALLOWED_EMAILS:"approved@example.com,partner@example.com"
};
function jwksFetch(jwk){
  return async url=>{
    assert.equal(url,ACCESS_ISSUER+"/cdn-cgi/access/certs");
    return new Response(JSON.stringify({keys:[jwk]}),{
      headers:{"content-type":"application/json"}
    });
  };
}

test("a properly signed Cloudflare Access JWT with correct audience and allowlisted email unlocks preview",async()=>{
  resetPreviewKeyCacheForTests();
  const {jwk}=await signedFixture();
  const cookie="CF_Authorization="+await signedToken();
  const id=await verifiedPreviewIdentity(go("/member","GET",{cookie}),accessEnv,{
    fetchImpl:jwksFetch(jwk)
  });
  assert.deepEqual(id,{email:"approved@example.com",sub:"owner"});
});
test("JWT signature, claims, expiry, email, cookie and audience are independently fail-closed",async()=>{
  const {jwk}=await signedFixture();
  const original=await signedToken();
  const now=Math.floor(Date.now()/1000);
  const cases=[
    {name:"no-token",token:""},
    {name:"bad-signature",token:original.slice(0,-10)+"abcdefghij"},
    {name:"wrong-aud",token:await signedToken({aud:"b".repeat(64)})},
    {name:"expired",token:await signedToken({exp:now-1})},
    {name:"not-before",token:await signedToken({nbf:now+600})},
    {name:"future-issued",token:await signedToken({iat:now+600})},
    {name:"wrong-issuer",token:await signedToken({iss:"https://evil.example"})},
    {name:"unallowed-email",token:await signedToken({email:"unallowed@example.com"})},
    {name:"wrong-alg",token:await signedToken({}, {alg:"none"})}
  ];
  for(const c of cases){
    resetPreviewKeyCacheForTests();
    const request=go("/member","GET",{cookie:c.token?"CF_Authorization="+c.token:"none=x"});
    const actual=await verifiedPreviewIdentity(request,accessEnv,{fetchImpl:jwksFetch(jwk)});
    assert.equal(actual,null,c.name);
  }
  const cookie="CF_Authorization="+original+"; CF_Authorization="+original;
  assert.equal(await verifiedPreviewIdentity(go("/member","GET",{cookie}),accessEnv,{
    fetchImpl:jwksFetch(jwk)
  }),null);
  assert.equal(await verifiedPreviewIdentity(go("/member","GET",{
    cookie:"CF_Authorization="+original
  }),{...accessEnv,ANEVUM_ACCESS_AUD:"c".repeat(64)},{fetchImpl:jwksFetch(jwk)}),null);
  assert.equal(await verifiedPreviewIdentity(go("/member","GET",{
    cookie:"CF_Authorization="+original
  }),{...accessEnv,ANEVUM_PREVIEW_ALLOWED_EMAILS:""},{fetchImpl:jwksFetch(jwk)}),null);
});
test("Access JWKS retrieval failures never authorize preview access",async()=>{
  const token=await signedToken();
  resetPreviewKeyCacheForTests();
  const actual=await verifiedPreviewIdentity(go("/member","GET",{
    cookie:"CF_Authorization="+token
  }),accessEnv,{fetchImpl:async()=>new Response("<html>fake jwks</html>",{
    headers:{"content-type":"text/html"}})});
  assert.equal(actual,null);
});
