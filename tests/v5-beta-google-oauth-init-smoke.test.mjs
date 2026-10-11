import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  BETA_ORIGIN,verifyGoogleAuthorizeUrl,runGoogleOAuthInitiationSmoke
} from "../scripts/v5-beta-google-oauth-init-smoke.mjs";

const googleUrl=(overrides={})=>{
  const u=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const args={
    client_id:"123456789012-abcdefghijklmnopq.apps.googleusercontent.com",
    redirect_uri:BETA_ORIGIN+"/api/auth/callback/google",
    response_type:"code",
    state:"a-unique-random-oauth-state-value",
    scope:"openid email profile",
    ...overrides
  };
  for(const [key,value] of Object.entries(args)){
    if(value===null)continue;
    u.searchParams.set(key,value);
  }
  return u.toString();
};
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("accept only the exact beta Google OAuth issuer, state, HTTPS callback and code flow",()=>{
  assert.equal(verifyGoogleAuthorizeUrl(googleUrl()),true);
  for(const url of [
    googleUrl({redirect_uri:"https://anevum.com/api/auth/callback/google"}),
    googleUrl({redirect_uri:"https://anevum-member-staging.devonakins.workers.dev/api/auth/callback/google"}),
    googleUrl({redirect_uri:"http://anevum-v5-beta.devonakins.workers.dev/api/auth/callback/google"}),
    googleUrl({redirect_uri:"https://anevum-v5-beta.devonakins.workers.dev/api/auth/callback/evil"}),
    googleUrl({response_type:"token"}),
    googleUrl({state:"short"}),
    googleUrl({client_id:"some-other-app"}),
    googleUrl({scope:"openid profile"})
  ])assert.throws(()=>verifyGoogleAuthorizeUrl(url));
  assert.throws(()=>verifyGoogleAuthorizeUrl("https://evil.example/o/oauth2/v2/auth?redirect_uri="+encodeURIComponent(BETA_ORIGIN+"/api/auth/callback/google")));
  assert.throws(()=>verifyGoogleAuthorizeUrl("https://accounts.google.com.evil.example/o/oauth2/v2/auth"));
  assert.throws(()=>verifyGoogleAuthorizeUrl("javascript:alert(1)"));
});

test("OAuth initiation requires same-beta POST, never follows Google or shares credentials",async()=>{
  const calls=[];
  const fetcher=async(path,options)=>{
    calls.push({path,options});
    return new Response(JSON.stringify({url:googleUrl()}),{
      status:200,headers:{"Content-Type":"application/json"}
    });
  };
  const result=await runGoogleOAuthInitiationSmoke(fetcher);
  assert.equal(result.initiated,true);
  assert.equal(result.accountCreated,false);
  assert.equal(result.authenticated,false);
  assert.equal(result.callbackOrigin,BETA_ORIGIN);
  assert.equal(calls.length,1);
  assert.equal(calls[0].path,BETA_ORIGIN+"/api/auth/sign-in/social");
  assert.equal(calls[0].options.method,"POST");
  assert.equal(calls[0].options.redirect,"manual");
  assert.equal(calls[0].options.headers.Origin,BETA_ORIGIN);
  assert.deepEqual(JSON.parse(calls[0].options.body),{provider:"google",callbackURL:"/me/beta"});
  assert.doesNotMatch(source("scripts/v5-beta-google-oauth-init-smoke.mjs"),/console\.log\(\s*(?:url|body|candidate|state|clientId|response)\s*\)/);
});

test("reject broken initiation without dumping private response body",async()=>{
  for(const response of [
    new Response(JSON.stringify({error:{code:"GOOGLE_NOT_CONFIGURED"}}),{status:400}),
    new Response(JSON.stringify({url:"https://evil.example/?code=abc"}),{status:200}),
    new Response("invalid-json",{status:200}),
    new Response(null,{status:503})
  ]){
    const error=await assert.rejects(runGoogleOAuthInitiationSmoke(async()=>response));
    assert.doesNotMatch(error?.message||"",/abc|GOOGLE_NOT_CONFIGURED|private-credential/i);
  }
});
