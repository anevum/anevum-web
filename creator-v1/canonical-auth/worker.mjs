import {
  CANONICAL_ORIGIN,CANONICAL_PREFIX,CANONICAL_AUTH_PATH,
  AUTH_ALLOWLIST,canonicalConfigState,canonicalSchemaReady,
  isCanonicalOrigin,withoutForeignCookies
} from "./policy.mjs";
import {createCanonicalAuth} from "./auth.mjs";
import {canonicalCreatorSchemaReady,canonicalCreatorMember,canonicalPublicCreator,canonicalExportMember} from "./profile.mjs";
import {permitCanonicalUserCreation} from "./policy.mjs";
import {canonicalCommunity} from "./community.mjs";
import {canonicalProgression,progressionReady} from './progression.mjs';
import {canonicalSpace} from "./space.mjs";
import {boundedText} from "./request-body.mjs";
import {supporterMember,supporterWebhook} from "./supporter.mjs";
import {supporterRewardsRoute} from "./supporter-rewards.mjs";
import {canonicalAccountClosure} from "./account-closure.mjs";

const HEALTH=CANONICAL_PREFIX+"/health";
const METHODS=CANONICAL_PREFIX+"/auth-methods";
const READ_METHODS=new Set(["GET","HEAD"]);
const PROFILE=CANONICAL_PREFIX+"/creator-profile";
const EXPORT=CANONICAL_PREFIX+"/account-export";
const CLOSURE=CANONICAL_PREFIX+"/account-closure";
const OWN_SPACE=/^\/api\/v1\/member\/(?:space|wall(?:\/[a-f0-9-]{36})?|media\/(?:avatar|banner))$/;
const PUBLIC_SPACE=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})\/(?:space|wall|media\/(?:avatar|banner))$/;
const PUBLIC_MEMBER=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})$/;
const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}$/;
const SECURITY={
  "cache-control":"private, no-store",
  "x-content-type-options":"nosniff",
  "x-robots-tag":"noindex, nofollow, noarchive",
  "referrer-policy":"no-referrer",
  "x-frame-options":"DENY",
  "vary":"Origin"
};
const sameOriginMutation=request=>{
  const origin=request.headers.get("origin");
  const site=request.headers.get("sec-fetch-site");
  // The Origin header is mandatory and bound to the exact staging host.
  // Fetch Metadata is an additional signal, not a mandatory browser feature:
  // some WebKit/in-app browsers omit Sec-Fetch-Site on valid same-origin POSTs.
  // Reject any explicitly cross-site/same-site header even if Origin matches.
  return origin===CANONICAL_ORIGIN &&
    (site===null||site==="same-origin"||site==="none");
};
const safeJson=(request,value,status=200)=>{
  const headers={...SECURITY,"content-type":"application/json; charset=utf-8"};
  return new Response(request.method==="HEAD"?null:JSON.stringify(value),{status,headers});
};
const fail=(request,status)=>safeJson(request,{error:status===503?"Canonical identity unavailable":"Not found"},status);
function safeResponse(original){
  const headers=new Headers(original.headers);
  for(const [name,value] of Object.entries(SECURITY))headers.set(name,value);
  headers.delete("access-control-allow-origin");
  headers.delete("access-control-allow-credentials");
  return new Response(original.body,{status:original.status,statusText:original.statusText,headers});
}

async function boundedProviderBody(request){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type")||""))
    return null;
  const raw=await boundedText(request,512);
  if(raw===null)return null;
  try{
    const input=JSON.parse(raw);
    if(!input||typeof input!=="object"||Array.isArray(input))return null;
    // Explicit allowlist: never accept user-selected OAuth destination,
    // server identity, organization, trusted origin, scopes, or privileges.
    if(Object.keys(input).some(x=>!["provider","callbackURL"].includes(x)))return null;
    if(!["google","github","apple","microsoft"].includes(input.provider)||
      (input.callbackURL!==undefined&&input.callbackURL!=="/join"))return null;
    return JSON.stringify({provider:input.provider,callbackURL:"/join"});
  }catch{return null;}
}

async function boundedEmailBody(request,verification){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type")||""))return null;
  const raw=await boundedText(request,512);
  if(raw===null)return null;
  let data;
  try{data=JSON.parse(raw);}catch{return null;}
  if(!data||typeof data!=="object"||Array.isArray(data))return null;
  const expected=verification?["email","otp","name"]:["email","type"];
  if(Object.keys(data).some(key=>!expected.includes(key)))return null;
  if(typeof data.email!=="string"||data.email.length>254||!EMAIL.test(data.email)||data.email!==data.email.toLowerCase().trim())return null;
  if(verification){
    if(typeof data.otp!=="string"||!/^\d{8}$/.test(data.otp))return null;
    if(data.name!==undefined&&(typeof data.name!=="string"||data.name.length>80))return null;
    return JSON.stringify({email:data.email,otp:data.otp,name:"ANEVUM MEMBER"});
  }
  if(data.type!=="sign-in")return null;
  return JSON.stringify({email:data.email,type:"sign-in"});
}
/**
 * An independent, UNROUTED Better Auth candidate. The endpoint will remain
 * closed if config, schema, account issuer, route or host evidence is missing.
 * It intentionally does not serve Creator V1 /me, projects, XP, or moderation.
 */
export function createCanonicalStageWorker({authFactory=createCanonicalAuth}={}){
  return {async fetch(request,env){
    if(!isCanonicalOrigin(request))return fail(request,404);
    const url=new URL(request.url),path=url.pathname;
    const publicHandle=path.match(PUBLIC_MEMBER);
    const publicCommunity=/^\/api\/v1\/community\/(?:members|activity)$/.test(path);
    const ownSpace=OWN_SPACE.test(path),publicSpace=path.match(PUBLIC_SPACE);
    const ownProgression=/^\/api\/v1\/member\/(?:progression|notifications(?:\/ack)?|xp-test)$/.test(path);
    const ownSupporter=/^\/api\/v1\/member\/supporter(?:\/(?:checkout|portal|webhook|rewards))?$/.test(path);
    const supporterHook=path===CANONICAL_PREFIX+"/supporter/webhook";
    const ownProfile=path===PROFILE;
    const ownExport=path===EXPORT;
    const ownClosure=path===CLOSURE;
    if(path!==HEALTH && path!==METHODS && !publicHandle && !ownProfile && !ownExport && !ownClosure && !ownSpace && !publicSpace && !publicCommunity && !ownProgression && !ownSupporter &&
      !(path.startsWith(CANONICAL_AUTH_PATH+"/") &&
        (AUTH_ALLOWLIST[request.method]?.has(path)??false)))
      return fail(request,404);

    if((publicHandle||publicSpace) && !READ_METHODS.has(request.method))return fail(request,404);
    if(ownProfile && !["GET","POST","PATCH"].includes(request.method))return fail(request,404);
    if(ownExport && request.method!=="GET")return fail(request,404);
    if(ownClosure && !["GET","POST"].includes(request.method))return fail(request,405);
    if(ownSupporter && !((["/supporter","/supporter/rewards"].some(suffix=>path===CANONICAL_PREFIX+suffix)&&["GET","PATCH"].includes(request.method)) ||
      (["/supporter/checkout","/supporter/portal","/supporter/webhook"].some(suffix=>path===CANONICAL_PREFIX+suffix)&&request.method==="POST")))return fail(request,405);
    if((path===HEALTH||path===METHODS)&&!READ_METHODS.has(request.method))
      return safeJson(request,{error:"Read-only endpoint"},405);

    const configured=canonicalConfigState(env);
    // The flag is never sufficient: verify the actual isolated schema.
    const ready=configured.operational&&await canonicalSchemaReady(env);
    const profilesReady=ready&&await canonicalCreatorSchemaReady(env.MEMBER_DB);
    const stageReady=ready&&profilesReady;
    if(path===HEALTH)return safeJson(request,{
      service:"anevum-canonical-auth-staging",
      status:stageReady?"ready":"closed",
      registration:stageReady?(configured.open?"open":configured.invited?"invite-only":"closed"):"closed",
      linkedCreatorAccounts:false,
      // Keep the disabled service's original inert health contract unchanged.
      // V031 staging alone includes a schema-readiness signal, no private data.
      ...(env.CANONICAL_XP_TEST_ENABLED==='true'?{
        progressionReady:Boolean(stageReady&&await progressionReady(env.MEMBER_DB))
      }:{})
    });
    if(path===METHODS)return safeJson(request,{
      version:2,
      issuer:"anevum-better-auth-staging-v1",
      registration:stageReady?(configured.open?"open":configured.invited?"invite-only":"closed"):"closed",
      methods:{google:{available:Boolean(stageReady&&configured.google)},
        email:{available:Boolean(stageReady&&configured.email&&(configured.invited||configured.open))},
        github:{available:Boolean(stageReady&&configured.github)},passkey:{available:false},
        microsoft:{available:Boolean(stageReady&&configured.microsoft)},apple:{available:Boolean(stageReady&&configured.apple)}},
      linking:"disabled"
    });
    // Never accept new identities without their required profile schema.
    if(!stageReady)return fail(request,503);
    // Never forward callbacks for disabled OAuth providers.
    const callback=path.match(/^\/api\/v1\/member\/auth\/callback\/(google|github|apple|microsoft)$/);
    if(callback&&!configured[callback[1]])return fail(request,404);
    if(publicCommunity)return safeResponse(await canonicalCommunity(request,env));
    if(publicSpace){
      if(request.method!=="GET")return fail(request,405);
      return safeResponse(await canonicalSpace(request,env,null,publicSpace[1]));
    }
    if(publicHandle){
      const clean=new Request(request.url,{method:request.method,headers:{accept:"application/json"}});
      return safeResponse(await canonicalPublicCreator(clean,env,CANONICAL_ORIGIN,publicHandle[1]));
    }

    // Stripe does not send a browser Origin. This exact endpoint relies on
    // raw-body HMAC verification, test-mode lock and a durable event ledger.
    if(supporterHook)return safeResponse(await supporterWebhook(request,env));

    if(ownProfile && ["POST","PATCH"].includes(request.method) && !sameOriginMutation(request))
      return safeJson(request,{error:"Same-origin request required"},403);

    // No inherited V5/Creator legacy cookies and no Authorization.
    // Enforce same-origin CSRF boundary for both POST and PATCH profile edits.
    if(["POST","PATCH","PUT","DELETE"].includes(request.method)&&!sameOriginMutation(request))
      return safeJson(request,{error:"Same-origin request required"},403);
    let clean=withoutForeignCookies(request);
    if(request.method==="POST"){
      if(url.search)return safeJson(request,{error:"Invalid request"},400);
      if(path===CANONICAL_AUTH_PATH+"/email-otp/send-verification-otp"||
        path===CANONICAL_AUTH_PATH+"/sign-in/email-otp"){
        if(!configured.email||!(configured.invited||configured.open))return fail(request,503);
        const verifying=path.endsWith("/sign-in/email-otp");
        const safeBody=await boundedEmailBody(clean,verifying);
        if(!safeBody)return safeJson(request,{error:"Invalid email verification request"},400);
        const parsed=JSON.parse(safeBody);
        // Do not reveal which email addresses have been invited to a visitor.
        // A non-invited send returns the same generic response without sending mail;
        // verification fails with the same non-specific error as a wrong code.
        if(!permitCanonicalUserCreation(env,parsed.email))
          return verifying
            ? safeJson(request,{error:"Code unavailable"},400)
            : safeJson(request,{ok:true},200);
        const headers=new Headers(clean.headers);
        headers.set("content-type","application/json");
        clean=new Request(request.url,{method:"POST",headers,body:safeBody});
      }else if(path===CANONICAL_AUTH_PATH+"/sign-in/social"){
        if(![configured.google,configured.github,configured.apple,configured.microsoft].some(Boolean))return fail(request,503);
        const safeBody=await boundedProviderBody(clean);
        if(!safeBody)return safeJson(request,{error:"Invalid provider request"},400);
        if(!configured[JSON.parse(safeBody).provider])return fail(request,503);
        clean=new Request(request.url,{
          method:"POST",headers:{
            "content-type":"application/json",
            origin:CANONICAL_ORIGIN,
            "sec-fetch-site":"same-origin",
            "accept":"application/json",
            "cf-connecting-ip":request.headers.get("cf-connecting-ip")||""
          },
          body:safeBody,
          redirect:"manual"
        });
      }else if(path===CANONICAL_AUTH_PATH+"/sign-out"){
        if(request.headers.get("content-type") &&
          !/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type")))
          return safeJson(request,{error:"Invalid request"},400);
      }
    }
    if(request.method==="GET"&&url.search.length>4096)
      return safeJson(request,{error:"Invalid request"},400);

    try{
      const auth=authFactory(env);
      if(ownProfile||ownExport||ownClosure||ownSpace||ownProgression||ownSupporter){
        const session=await auth.api.getSession({headers:clean.headers});
        if(!session?.user)return safeJson(request,{error:"Sign-in required"},401);
        if(ownClosure)return safeResponse(await canonicalAccountClosure(clean,env,session.user,session.session));
        if(ownProgression)return safeResponse(await canonicalProgression(clean,env,session.user));
        if(ownSupporter)return safeResponse(path===CANONICAL_PREFIX+"/supporter/rewards"
          ?await supporterRewardsRoute(clean,env,session.user)
          :await supporterMember(clean,env,session.user));
        if(ownSpace)return safeResponse(await canonicalSpace(clean,env,session.user));
        return safeResponse(ownExport?
          await canonicalExportMember(clean,env,session.user,CANONICAL_ORIGIN):
          await canonicalCreatorMember(clean,env,session.user,CANONICAL_ORIGIN));
      }
      const result=await auth.handler(clean);
      return safeResponse(result);
    }catch{
      // Do not expose auth state, D1 errors, provider credentials, or tokens.
      return fail(request,503);
    }
  }};
}
export default createCanonicalStageWorker();
