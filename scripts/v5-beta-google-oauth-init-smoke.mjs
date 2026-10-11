// Non-authenticating Google OAuth initiation acceptance for the isolated V5 beta.
// Never log a response body, query string, client ID, state value, cookie or token.
// It starts an ephemeral Better Auth OAuth transaction but never calls Google,
// follows the redirect, registers a user or accesses private member data.
import assert from "node:assert/strict";

export const BETA_ORIGIN="https://anevum-v5-beta.devonakins.workers.dev";
const LOGIN_PATH="/api/auth/sign-in/social";
const CALLBACK_PATH="/api/auth/callback/google";

export function verifyGoogleAuthorizeUrl(candidate, origin=BETA_ORIGIN){
  if(typeof candidate!=="string"||candidate.length>8192)throw new Error("Invalid Google OAuth initiation URL.");
  let u;
  try{u=new URL(candidate);}catch{throw new Error("Invalid Google OAuth initiation URL.");}
  assert.equal(u.protocol,"https:","Google OAuth must use HTTPS.");
  assert.equal(u.hostname,"accounts.google.com","Google OAuth issuer mismatch.");
  assert.ok(["/o/oauth2/v2/auth","/o/oauth2/auth"].includes(u.pathname),"Google OAuth authorization path mismatch.");
  assert.equal(u.username,"");
  assert.equal(u.password,"");
  assert.equal(u.port,"");
  assert.equal(u.hash,"");
  assert.equal(u.searchParams.get("response_type"),"code");
  assert.equal(u.searchParams.get("redirect_uri"),origin+CALLBACK_PATH);
  const id=u.searchParams.get("client_id");
  assert.ok(typeof id==="string"&&id.endsWith(".apps.googleusercontent.com")&&id.length>35,
    "Google OAuth client ID is not a Google web client.");
  const state=u.searchParams.get("state");
  assert.ok(typeof state==="string"&&state.length>=16,"OAuth state was not provided.");
  const scope=new Set((u.searchParams.get("scope")||"").split(/\s+/));
  assert.ok([...scope].some(s=>s==="email"||s.endsWith("/auth/userinfo.email")),
    "Google OAuth email permission missing.");
  assert.ok(u.searchParams.get("code_challenge") || u.searchParams.get("state"),
    "Google OAuth authorization protection missing.");
  return true;
}
export async function runGoogleOAuthInitiationSmoke(fetcher=fetch,origin=BETA_ORIGIN){
  let response;
  try{
    response=await fetcher(origin+LOGIN_PATH,{
      method:"POST",
      redirect:"manual",
      cache:"no-store",
      headers:{
        "Origin":origin,
        "Content-Type":"application/json",
        "Accept":"application/json"
      },
      body:JSON.stringify({provider:"google",callbackURL:"/me/beta"}),
      signal:AbortSignal.timeout(15000)
    });
  }catch{
    throw new Error("Beta Google OAuth initialization request could not complete.");
  }
  assert.ok([200,201,302,303].includes(response.status),
    "Beta OAuth initialization HTTP status: "+response.status);
  let url;
  if([302,303].includes(response.status)){
    url=response.headers.get("location");
  }else{
    let body;
    try{body=await response.json();}catch{
      throw new Error("Beta OAuth initialization did not return a JSON response.");
    }
    url=body?.url;
    assert.ok(body?.error===undefined,"Beta OAuth initialization returned an error.");
  }
  verifyGoogleAuthorizeUrl(url,origin);
  return Object.freeze({
    initiated:true,
    issuer:"accounts.google.com",
    callbackOrigin:origin,
    callbackPath:CALLBACK_PATH,
    authenticated:false,
    accountCreated:false
  });
}
if(process.argv[1]?.endsWith("/v5-beta-google-oauth-init-smoke.mjs")){
  runGoogleOAuthInitiationSmoke().then(()=>{
    console.log("V5 BETA GOOGLE INIT PASS: HTTPS Google issuer, same-beta callback, scoped OAuth, state present.");
    console.log("V5 BETA GOOGLE INIT SCOPE: no Google login, no new member, no broker access.");
  }).catch(error=>{
    console.error("V5 BETA GOOGLE INIT BLOCKED: "+(error instanceof Error?error.message:"unknown failure"));
    process.exitCode=1;
  });
}
