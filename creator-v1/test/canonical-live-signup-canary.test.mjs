import test from "node:test";
import assert from "node:assert/strict";
import {CANONICAL_LIVE_AUTH,assessLiveSignupSnapshot,probeCanonicalLiveSignup}
  from "../ops/canonical-live-signup-canary.mjs";

const health=()=>({
  service:"anevum-canonical-auth-staging",
  status:"ready",registration:"open",linkedCreatorAccounts:false
});
const methods=()=>({
  version:2,issuer:"anevum-better-auth-staging-v1",
  registration:"open",linking:"disabled",
  methods:{
    email:{available:true},google:{available:false},github:{available:false},
    apple:{available:false},microsoft:{available:false},passkey:{available:false}
  }
});
const asResponse=object=>new Response(JSON.stringify(object),{
  status:200,headers:{"content-type":"application/json; charset=utf-8"}
});

test("published open email-only registration is green with all social logins hidden",()=>{
  const result=assessLiveSignupSnapshot(health(),methods());
  assert.equal(result.ok,true);
  assert.deepEqual(result.failures,[]);
  assert.deepEqual(result.availableMethods,["email"]);
  assert.equal(CANONICAL_LIVE_AUTH.origin,"https://anevum.com","Canary must probe the active canonical site, not retired a.anevum.com");
  assert.equal(result.registration,"open");
  assert.deepEqual(CANONICAL_LIVE_AUTH.paths,[
    "/api/v1/member/health","/api/v1/member/auth-methods"]);
});

test("a targeted newly enabled social provider must have a matching linking state",()=>{
  const enabled=methods();
  enabled.methods.google.available=true;
  enabled.linking="explicit";
  assert.equal(assessLiveSignupSnapshot(health(),enabled,{expectedSocial:["google"]}).ok,true);
  assert.deepEqual(assessLiveSignupSnapshot(health(),enabled,{expectedSocial:["google"]}).availableMethods,["email","google"]);
  assert.ok(assessLiveSignupSnapshot(health(),enabled).failures.includes("PROVIDER_AVAILABILITY_MISMATCH:google"));
  enabled.linking="disabled";
  assert.ok(assessLiveSignupSnapshot(health(),enabled,{expectedSocial:["google"]}).failures.includes("ACCOUNT_LINKING_STATE_MISMATCH"));
});

test("closed, invitation-only or mismatched health states block a regression",()=>{
  for(const state of ["closed","invite-only"]){
    const h=health();h.registration=state;
    assert.ok(assessLiveSignupSnapshot(h,methods()).failures.includes("PUBLIC_REGISTRATION_NOT_OPEN"));
    const m=methods();m.registration=state;
    assert.ok(assessLiveSignupSnapshot(health(),m).failures.includes("PUBLIC_REGISTRATION_NOT_OPEN"));
  }
  const h=health();h.status="closed";
  assert.ok(assessLiveSignupSnapshot(h,methods()).failures.includes("HEALTH_NOT_READY"));
  h.status="ready";h.service="another-auth-service";
  assert.ok(assessLiveSignupSnapshot(h,methods()).failures.includes("HEALTH_NOT_READY"));
});

test("wrong issuer, missing email, unapproved passkeys and extra social methods all block",()=>{
  const wrongIssuer=methods();wrongIssuer.issuer="old-v5";
  assert.ok(assessLiveSignupSnapshot(health(),wrongIssuer).failures.includes("CANONICAL_ISSUER_MISMATCH"));
  const noEmail=methods();noEmail.methods.email.available=false;
  assert.ok(assessLiveSignupSnapshot(health(),noEmail).failures.includes("EMAIL_CODE_UNAVAILABLE"));
  const passkey=methods();passkey.methods.passkey.available=true;
  assert.ok(assessLiveSignupSnapshot(health(),passkey).failures.includes("PASSKEY_UNEXPECTEDLY_ENABLED"));
  const extra=methods();extra.methods.github.available=true;
  assert.ok(assessLiveSignupSnapshot(health(),extra).failures.includes("PROVIDER_AVAILABILITY_MISMATCH:github"));
  const absent=methods();delete absent.methods.apple;
  assert.ok(assessLiveSignupSnapshot(health(),absent).failures.includes("PROVIDER_AVAILABILITY_MISMATCH:apple"));
});

test("no unapproved provider name, duplicate or missing snapshot is accepted",()=>{
  for(const requested of [["passkey"],["google","google"],["external"],"google"]){
    assert.equal(assessLiveSignupSnapshot(health(),methods(),{expectedSocial:requested}).ok,false);
  }
  assert.deepEqual(assessLiveSignupSnapshot(null,{}).failures,["SNAPSHOT_INVALID"]);
  assert.equal(assessLiveSignupSnapshot(health(),{methods:null}).ok,false);
});

test("network canary reads only exact canonical host, no authorization, identity or writes",async()=>{
  const calls=[];
  const mockFetch=async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith("/health"))return asResponse(health());
    if(url.endsWith("/auth-methods"))return asResponse(methods());
    throw Error("Unexpected request");
  };
  const result=await probeCanonicalLiveSignup({fetchImpl:mockFetch});
  assert.equal(result.ok,true);
  assert.deepEqual(calls.map(x=>x.url),CANONICAL_LIVE_AUTH.paths.map(path=>CANONICAL_LIVE_AUTH.origin+path));
  for(const {options} of calls){
    assert.equal(options.method,"GET");
    assert.equal(options.redirect,"error");
    assert.equal(options.credentials,undefined);
    assert.equal(options.body,undefined);
    assert.equal(options.headers.authorization,undefined);
    assert.equal(options.headers.cookie,undefined);
  }
});

test("HTTP errors, HTML, redirects, bad JSON, oversized payloads or network failures fail closed",async()=>{
  const failed=[
    async()=>{throw Error("Network unavailable");},
    async()=>new Response("{}",{status:503,headers:{"content-type":"application/json"}}),
    async()=>new Response("<html>oops</html>",{status:200,headers:{"content-type":"text/html"}}),
    async()=>new Response("{broken",{status:200,headers:{"content-type":"application/json"}}),
    async()=>new Response(" ".repeat(8193),{status:200,headers:{"content-type":"application/json"}})
  ];
  for(const fetchImpl of failed){
    const result=await probeCanonicalLiveSignup({fetchImpl});
    assert.equal(result.ok,false);
    assert.deepEqual(result.failures,["LIVE_PROBE_FAILED"]);
  }
});
