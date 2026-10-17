/**
 * ANEVUM canonical registration canary (READ ONLY).
 *
 * Checks the canonical anevum.com member endpoints without credentials,
 * account creation, cookies, inbox access, or any D1 writes.
 *
 * Usage:
 *   node creator-v1/ops/canonical-live-signup-canary.mjs
 *   ANEVUM_EXPECTED_SOCIAL=google,github node creator-v1/ops/canonical-live-signup-canary.mjs
 *
 * This is an availability/configuration assertion, NOT a substitute for
 * email inbox verification, OAuth consent/callback, or member E2E checks.
 */
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const CANONICAL_LIVE_AUTH = Object.freeze({
  origin: "https://anevum.com",
  service: "anevum-canonical-auth-staging",
  issuer: "anevum-better-auth-staging-v1",
  social: ["google", "github", "microsoft", "apple"],
  paths: Object.freeze(["/api/v1/member/health", "/api/v1/member/auth-methods"])
});

const isRecord = value => Boolean(value) && typeof value==="object" && !Array.isArray(value);
const messages = Object.freeze({
  input: "SNAPSHOT_INVALID",
  health: "HEALTH_NOT_READY",
  registration: "PUBLIC_REGISTRATION_NOT_OPEN",
  issuer: "CANONICAL_ISSUER_MISMATCH",
  email: "EMAIL_CODE_UNAVAILABLE",
  provider: "PROVIDER_AVAILABILITY_MISMATCH",
  linking: "ACCOUNT_LINKING_STATE_MISMATCH",
  passkey: "PASSKEY_UNEXPECTEDLY_ENABLED",
  config: "EXPECTED_PROVIDER_CONFIGURATION_INVALID"
});

export function assessLiveSignupSnapshot(health,methods,{expectedSocial=[]}={}){
  const failures=[];
  if(!Array.isArray(expectedSocial)||expectedSocial.some(p=>!CANONICAL_LIVE_AUTH.social.includes(p))||
    new Set(expectedSocial).size!==expectedSocial.length)failures.push(messages.config);
  if(!isRecord(health)||!isRecord(methods)||!isRecord(methods.methods)){
    failures.push(messages.input);
    return {ok:false,failures,expectedSocial,registration:null,availableMethods:[]};
  }
  if(health.service!==CANONICAL_LIVE_AUTH.service || health.status!=="ready")failures.push(messages.health);
  if(health.registration!=="open" || methods.registration!=="open")failures.push(messages.registration);
  if(methods.issuer!==CANONICAL_LIVE_AUTH.issuer || methods.version!==2)failures.push(messages.issuer);
  if(!isRecord(methods.methods.email)||methods.methods.email.available!==true)failures.push(messages.email);
  if(!isRecord(methods.methods.passkey)||methods.methods.passkey.available!==false)failures.push(messages.passkey);
  for(const provider of CANONICAL_LIVE_AUTH.social){
    if(!isRecord(methods.methods[provider])||
      methods.methods[provider].available!==expectedSocial.includes(provider)){
      failures.push(messages.provider+":"+provider);
    }
  }
  const expectedLinking=expectedSocial.length>0?"explicit":"disabled";
  if(methods.linking!==expectedLinking)failures.push(messages.linking);
  return {
    ok:failures.length===0,
    failures,expectedSocial,
    registration:methods.registration,
    availableMethods:["email",...CANONICAL_LIVE_AUTH.social.filter(p=>methods.methods[p]?.available===true)]
  };
}

async function fetchJson(path,fetchImpl){
  const url=CANONICAL_LIVE_AUTH.origin+path;
  const response=await fetchImpl(url,{
    method:"GET",redirect:"error",cache:"no-store",
    headers:{accept:"application/json","cache-control":"no-store"},
    signal:AbortSignal.timeout(10000)
  });
  if(!response||response.status!==200||
    !response.headers?.get("content-type")?.toLowerCase().includes("application/json"))
    throw new Error("INVALID_CANONICAL_RESPONSE");
  const body=await response.text();
  if(body.length>8192)throw new Error("CANONICAL_RESPONSE_TOO_LARGE");
  let parsed;
  try{parsed=JSON.parse(body);}catch{throw new Error("INVALID_CANONICAL_JSON");}
  if(!isRecord(parsed))throw new Error("INVALID_CANONICAL_JSON");
  return parsed;
}

export async function probeCanonicalLiveSignup({fetchImpl=fetch,expectedSocial=[]}={}){
  try{
    const [health,methods]=await Promise.all(
      CANONICAL_LIVE_AUTH.paths.map(path=>fetchJson(path,fetchImpl)));
    return assessLiveSignupSnapshot(health,methods,{expectedSocial});
  }catch{
    return {ok:false,failures:["LIVE_PROBE_FAILED"],expectedSocial,registration:null,availableMethods:[]};
  }
}

function configuredSocial(){
  const raw=process.env.ANEVUM_EXPECTED_SOCIAL||"";
  return raw===""?[]:raw.split(",").map(p=>p.trim());
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await probeCanonicalLiveSignup({expectedSocial:configuredSocial()});
  process.stdout.write(JSON.stringify({version:"anevum.canonical.live-signup-canary.v1",...result})+"\n");
  if(!result.ok)process.exitCode=1;
}
