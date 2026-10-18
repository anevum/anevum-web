import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateKeyPair, SignJWT} from "jose";
import {
  createSyntheticWorld,positionAlongPath,freshness,
  DEFAULT_CENTER, FICTIONAL_PLACES, FICTIONAL_ROUTE,
  RUN_LENGTH_SECONDS, SHARE_LENGTH_SECONDS
} from "./public/synthetic-engine.mjs";
import worker,{authorized} from "./worker.mjs";

const source = path=>readFileSync(new URL(path,import.meta.url),"utf8");
const site=source("./public/index.html");
const app=source("./public/app.mjs");
const engine=source("./public/synthetic-engine.mjs");
const css=source("./public/styles.css");
const scene=source("./public/synthetic-scene.mjs");
const workerSource=source("./worker.mjs");
const AUD="a".repeat(64);
const ISSUER="https://wispy-tooth-095a.cloudflareaccess.com";
const origin="https://anevum-family-field-synthetic-review-20261018.devonakins.workers.dev";
const access=(email="devon@anevum.com")=>({
  aud:AUD,getIdentity:async()=>({email})
});
const fixture=({
  method="GET",path="/",reviewAccess=access(),envAud=AUD,
  envIssuer=ISSUER, requestHeaders={},
  assets=async request=>new Response("fixture for "+new URL(typeof request==="string"?request:(request.url||request.href)).pathname,{status:200})
}={})=>{
  return worker.fetch(new Request(origin+path,{method,headers:requestHeaders}),{
    FS_SYNTH_REVIEW_AUD:envAud,FS_SYNTH_TEAM_ISSUER:envIssuer,ASSETS:{fetch:assets}
  },{access:reviewAccess});
};

test("all paths and objects are explicitly fictional and initial simulation is off",()=>{
  const w=createSyntheticWorld();
  const s=w.getSnapshot();
  assert.equal(s.started,false);
  assert.equal(s.running,false);
  assert.equal(s.devices.length,2);
  assert.ok(s.devices.every(d=>d.fictitious===true && d.coordinates===null));
  assert.deepEqual(DEFAULT_CENTER,[-81.2873,28.2483]);
  assert.equal(FICTIONAL_PLACES.length,2);
  assert.ok(FICTIONAL_ROUTE.length>2);
  assert.match(site,/SYNTHETIC REVIEW · NO LIVE DATA/);
  assert.match(site,/FICTIONAL ROUTES · NOT SAFETY-VERIFIED/);
  assert.match(site,/No personal tracking/);
});

test("animated paths interpolate without observing or mutating anyone's GPS",()=>{
  const points=[[-1,1],[1,3],[5,3]];
  assert.deepEqual(positionAlongPath(points,0),[-1,1]);
  assert.deepEqual(positionAlongPath(points,.25),[0,2]);
  assert.deepEqual(positionAlongPath(points,.5),[1,3]);
  assert.deepEqual(positionAlongPath(points,1),[5,3]);
  assert.equal(positionAlongPath(points,Number.NaN),null);
  assert.equal(positionAlongPath([[-1,1]],.5),null);
  const w=createSyntheticWorld();
  const active=w.start();
  assert.equal(active.running,true);
  assert.ok(active.devices.every(d=>d.state==="recent"&&d.sharing===true&&d.coordinates!==null));
  assert.equal(SHARE_LENGTH_SECONDS,140);
  const progressed=w.step(15);
  assert.equal(progressed.elapsedSeconds,15);
  assert.notDeepEqual(progressed.devices[0].coordinates,active.devices[0].coordinates);
});

test("signal loss ages to stale then unavailable, without inventing danger",()=>{
  const w=createSyntheticWorld();w.start();w.signalB(false);
  w.step(20);w.step(11);
  assert.equal(w.getSnapshot().devices[1].state,"stale");
  assert.equal(w.getSnapshot().devices[0].state,"recent");
  for(let i=0;i<5;i++)w.step(20);
  assert.equal(w.getSnapshot().devices[1].state,"unavailable");
  assert.equal(w.getSnapshot().devices[1].coordinates,null);
  assert.equal(freshness(30),"recent");
  assert.equal(freshness(31),"stale");
  assert.equal(freshness(120),"unavailable");
  assert.equal(freshness(-1),"unavailable");
  assert.equal(freshness(Number.NaN),"unavailable");
});

test("fictional time-bound sharing expires and revoked markers never reappear until restart",()=>{
  const w=createSyntheticWorld();w.start();w.step(18);
  assert.equal(w.revoke("a").devices[0].coordinates,null);
  assert.equal(w.getSnapshot().devices[1].state,"recent");
  for(let i=0;i<8;i++)w.step(20);
  const s=w.getSnapshot();
  assert.equal(s.elapsedSeconds>=SHARE_LENGTH_SECONDS,true);
  assert.ok(s.devices.every(d=>d.state==="unavailable"&&d.coordinates===null));
  assert.equal(w.start().devices[0].state,"recent");
  w.reset();
  assert.ok(w.getSnapshot().devices.every(d=>d.coordinates===null&&!d.sharing));
});

test("pausing and hiding the page cannot silently advance synthetic simulated positions",()=>{
  const w=createSyntheticWorld();w.start();
  w.pause();
  assert.equal(w.step(15).elapsedSeconds,0);
  w.resume();
  assert.equal(w.step(12).elapsedSeconds,12);
  w.step(Number.NaN);
  assert.equal(w.getSnapshot().elapsedSeconds,12);
  w.step(200);
  assert.equal(w.getSnapshot().elapsedSeconds,32);
  assert.equal(RUN_LENGTH_SECONDS,180);
  assert.match(app,/document\.addEventListener\("visibilitychange"/);
  assert.match(app,/world\.pause\(\);stopTick\(\)/);
});

test("browser assets cannot request GPS, use personal data or post to family backend",()=>{
  for(const [name,text] of [["index",site],["app",app],["engine",engine],["scene",scene],["styles",css]]){
    assert.doesNotMatch(text,/\bnavigator\.geolocation\b|\bwatchPosition\s*\(|\bgetCurrentPosition\s*\(/i,name);
    assert.doesNotMatch(text,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bnavigator\.sendBeacon\b/i,name);
    assert.doesNotMatch(text,/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/i,name);
    assert.doesNotMatch(text,/api\/family\/v1|api\/v1\/member|FS_PRIVATE_DB|FS_PRESENCE/i,name);
  }
  assert.doesNotMatch(site,/<form\b/i);
  assert.match(site,/referrer" content="no-referrer/);
  assert.match(site,/robots" content="noindex,nofollow,noarchive/);
  assert.match(app,/style:SYNTHETIC_STYLE/);
  assert.match(scene,/createIllustrativeNeighborhood/);
  assert.doesNotMatch(scene,/navigator\.geolocation|fetch\s*\(/);
});

test("Cloudflare Access identity and exact audience are always required for every asset",async()=>{
  assert.equal(await authorized(null,AUD),false);
  assert.equal(await authorized(access(),"wrong-audience"),false);
  assert.equal(await authorized({aud:AUD,getIdentity:async()=>({email:""})},AUD),false);
  assert.equal(await authorized({aud:AUD,getIdentity:async()=>{throw Error("login expired")}},AUD),false);
  assert.equal(await authorized(access(),AUD),true);
  assert.equal(await authorized(access("unknown@example.test"),AUD),false);
  assert.equal(await authorized({...access(),aud:"wrong-audience"},AUD),false);
  for(const path of ["/","/index.html","/app.mjs","/styles.css","/synthetic-scene.mjs","/__review"]){
    for(const options of [{reviewAccess:null},{envAud:""},{reviewAccess:{...access(),aud:"different"}}]){
      let called=false;
      const res=await fixture({path,...options,assets:async()=>{called=true;return new Response("secret")}});
      assert.equal(res.status,403);
      assert.equal(called,false);
      assert.match(res.headers.get("Permissions-Policy"),/geolocation=\(\)/);
      assert.match(res.headers.get("X-Robots-Tag"),/noindex/);
    }
  }
});

test("signed Access JWT allows exact owner from forwarded header or cookie when ctx.access is missing",async()=>{
  const {publicKey,privateKey}=await generateKeyPair("RS256");
  const sign=async({email="devon@anevum.com",aud=AUD,iss=ISSUER,expires="5m"}={})=>
    new SignJWT({email}).setProtectedHeader({alg:"RS256",kid:"test-key"})
      .setIssuedAt().setIssuer(iss).setAudience(aud).setExpirationTime(expires)
      .sign(privateKey);
  const make=(jwt,mode="cookie")=>new Request(origin,{
    headers:mode==="cookie"?{cookie:"CF_Authorization="+jwt}:
      {"cf-access-jwt-assertion":jwt}
  });
  const verify=(request,issuer=ISSUER,aud=AUD)=>authorized(
    null,aud,request,issuer,()=>publicKey
  );
  const valid=await sign();
  assert.equal(await verify(make(valid)),true);
  assert.equal(await verify(make(valid,"header")),true);
  assert.equal(await verify(make(await sign({email:"other@example.test"}))),false);
  assert.equal(await verify(make(await sign({aud:"b".repeat(64)}))),false);
  assert.equal(await verify(make(await sign({iss:"https://another-team.cloudflareaccess.com"}))),false);
  assert.equal(await verify(make(await sign({expires:"-30s"}))),false);
  assert.equal(await verify(make(valid),"https://attacker.example"),false);
  assert.equal(await verify(make(valid),ISSUER,"unconfigured-aud"),false);
  assert.equal(await verify(make("not-a-jwt")),false);
  assert.equal(await verify(new Request(origin)),false);
  assert.equal(await verify(make(valid+"corrupted")),false);
  assert.equal(await authorized(null,AUD,make(valid),ISSUER,()=>{throw Error("offline keys");}),false);
  // Access context does not convey arbitrary email permission by itself.
  assert.equal(await authorized(access("guest@example.test"),AUD),false);
  // Header takes precedence over cookie. A malformed header does not fall
  // back to another source; this blocks ambiguous multiple token sources.
  const conflict=new Request(origin,{
    headers:{"cf-access-jwt-assertion":"not-a-jwt",cookie:"CF_Authorization="+valid}
  });
  assert.equal(await verify(conflict),false);
});

test("authorized preview serves only approved read-only static assets with restrictive headers",async()=>{
  for(const path of ["/","/index.html","/styles.css","/app.mjs","/synthetic-engine.mjs","/synthetic-scene.mjs","/vendor/maplibre-gl-worker.mjs?v=6.14.0"]){
    const res=await fixture({path});
    assert.equal(res.status,200,path);
    assert.match(res.headers.get("Cache-Control"),/no-store/);
    assert.match(res.headers.get("Content-Security-Policy"),/default-src 'none'/);
    assert.match(res.headers.get("Content-Type"),/text\/html|text\/css|application\/javascript/);
    assert.equal(res.headers.get("X-Frame-Options"),"DENY");
    assert.match(await res.text(),/fixture for/);
  }
  const review=await fixture({path:"/__review"});
  assert.equal(review.status,200);
  const info=await review.json();
  assert.equal(info.status,"SYNTHETIC_REVIEW");
  assert.equal(info.gps,false);
  assert.equal(info.privateDatabase,false);
  assert.equal(info.sharingBackend,false);
  assert.equal(info.familyAccounts,false);
  assert.equal(info.history,false);
  assert.equal(info.memberApi,false);
  assert.equal(info.durableObjects,false);
  const head=await fixture({method:"HEAD",path:"/index.html"});
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
});

test("authenticated owner lands on canonical homepage after Cloudflare Access callback",async()=>{
  const visited=[];
  const assets=async input=>{
    const assetUrl=new URL(typeof input==="string"?input:(input.url||input.href));
    visited.push(assetUrl.pathname+assetUrl.search);
    if(assetUrl.pathname==="/index.html")
      return new Response(site,{status:200,headers:{"Content-Type":"text/html"}});
    return new Response("File not found",{status:404});
  };
  for(const path of ["/","/index.html"]) {
    const response=await fixture({path,assets});
    assert.equal(response.status,200,path);
    assert.match(response.headers.get("Content-Type"),/text\/html/);
    assert.match(await response.text(),/ANEVUM \/\/ Family Field/);
    assert.equal(visited.at(-1),"/index.html");
  }
  // Access may redirect with a query string appended to the original page.
  for(const path of [
    "/?CF_Authorization=placeholder",
    "/?return_url=%2F",
    "/index.html?browser-callback=1"
  ]){
    const response=await fixture({path,assets});
    assert.equal(response.status,302,path);
    assert.equal(response.headers.get("Location"),origin+"/");
    assert.match(response.headers.get("Cache-Control"),/no-store/);
  }
  const navigate=await fixture({
    path:"/review-return?from=access",
    requestHeaders:{Accept:"text/html"},assets
  });
  assert.equal(navigate.status,302);
  assert.equal(navigate.headers.get("Location"),origin+"/");
  // Root canonicalization must never send a private callback value onward.
  assert.equal(visited.some(x=>x.includes("?")),false);
  const notFound=await fixture({path:"/random-script.mjs",assets});
  assert.equal(notFound.status,404);
  const missing=await fixture({path:"/styles.css",assets});
  assert.equal(missing.status,503); // missing a required public asset is a server failure, not a real 404 page
});

test("no POST, GPS API, accidental static leak, route bypass, or query-based discovery",async()=>{
  for(const {method,path,expected} of [
    {method:"POST",path:"/",expected:405},
    {method:"PUT",path:"/index.html",expected:405},
    {method:"DELETE",path:"/v1/circles/family-1",expected:405},
    {method:"GET",path:"/api/v1/member/me",expected:404},
    {method:"GET",path:"/v1/circles/family-1/presence/alice",expected:404},
    {method:"GET",path:"/private",expected:404},
    {method:"GET",path:"/index.html?debug=true",expected:302},
    {method:"GET",path:"/vendor/maplibre-gl-worker.mjs?other=1",expected:404},
    {method:"GET",path:"/worker.mjs",expected:404},
    {method:"GET",path:"/.env",expected:404}
  ]){
    const res=await fixture({method,path});
    assert.equal(res.status,expected,method+" "+path);
  }
  assert.doesNotMatch(workerSource,/console\.log\s*\(|FS_ENABLE_REAL_GPS|fs_private_circles/);
  assert.match(workerSource,/geolocation=\(\)/);
  assert.match(workerSource,/run_worker_first/); // documentary comment or worker contract
});
