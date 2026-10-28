import {
  CANONICAL_ORIGIN,CANONICAL_PREFIX,CANONICAL_AUTH_PATH,
  AUTH_ALLOWLIST,canonicalConfigState,canonicalSchemaReady,
  isCanonicalOrigin,withoutForeignCookies,canonicalRequestOrigin
} from "./policy.mjs";
import {createCanonicalAuth} from "./auth.mjs";
import {canonicalCreatorSchemaReady,canonicalCreatorMember,canonicalPublicCreator,canonicalExportMember} from "./profile.mjs";
import {permitCanonicalUserCreationApproved} from "./policy.mjs";
import {canonicalCommunity} from "./community.mjs";
import {canonicalForums} from "./forums.mjs";
import {canonicalProgression,progressionReady} from './progression.mjs';
import {canonicalSpace} from "./space.mjs";
import {canonicalRecognition} from './recognition.mjs';
import {canonicalRecognitionCatalog} from './recognition-catalog.mjs';
import {matchRewardMedia,earnedRewardMedia,matchRewardInventory,earnedRewardInventory} from './reward-media.mjs';
import {boundedText} from "./request-body.mjs";
import {supporterMember,supporterWebhook} from "./supporter.mjs";
import {supporterRewardsRoute} from "./supporter-rewards.mjs";
import {canonicalAccountClosure} from "./account-closure.mjs";
import {publicSupporterTelemetry,PUBLIC_TELEMETRY_PATH} from "./public-supporter-telemetry.mjs";
import {canonicalProjectSave,canonicalProjectSaveReady} from "./project-saves.mjs";
import {canonicalStudio,canonicalStudioLarge,canonicalStudioReview,studioReadiness} from "./studio.mjs";
import {canonicalWorkbench} from "./workbench-alpha.mjs";

// Reuse the Better Auth engine only while the same database binding and
// exact authentication configuration are present in this Worker isolate.
// The engine is not a session cache. Every request still resolves cookies,
// revoked sessions, rate limits, and member authorization from D1.
const AUTH_ENGINE_CONFIG=Object.freeze([
 "ANEVUM_CANONICAL_APEX_ENABLED","ANEVUM_CANONICAL_STAGE_ENABLED",
 "CANONICAL_SCHEMA_APPROVED","CANONICAL_PUBLIC_SIGNUP_ENABLED",
 "CANONICAL_INVITED_SIGNUP_ENABLED","CANONICAL_EMAIL_ENABLED",
 "CANONICAL_GOOGLE_ENABLED","CANONICAL_GITHUB_ENABLED",
 "CANONICAL_APPLE_ENABLED","CANONICAL_MICROSOFT_ENABLED",
 "CANONICAL_GOOGLE_CLIENT_ID","CANONICAL_GOOGLE_CLIENT_SECRET",
 "CANONICAL_GITHUB_CLIENT_ID","CANONICAL_GITHUB_CLIENT_SECRET",
 "CANONICAL_APPLE_CLIENT_ID","CANONICAL_APPLE_CLIENT_SECRET",
 "CANONICAL_MICROSOFT_CLIENT_ID","CANONICAL_MICROSOFT_CLIENT_SECRET",
 "CANONICAL_BETTER_AUTH_SECRET","CANONICAL_RESEND_API_KEY",
 "CANONICAL_PROTECTED_EMAILS","CANONICAL_INVITE_EMAILS"
]);
export function createCanonicalAuthResolver(factory=createCanonicalAuth){
 const engines=new WeakMap();
 return function authFor(env){
  const db=env?.MEMBER_DB;
  if(!db||typeof db!=="object")return factory(env);
  const config=AUTH_ENGINE_CONFIG.map(key=>env[key]);
  const prior=engines.get(db);
  if(prior&&prior.config.every((value,i)=>value===config[i]))return prior.engine;
  const engine=factory(env);
  engines.set(db,{engine,config});
  return engine;
 };
}

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
const sameOriginMutation=(request,env)=>{
  const origin=request.headers.get("origin");
  const site=request.headers.get("sec-fetch-site");
  // The Origin header is mandatory and bound to the exact staging host.
  // Fetch Metadata is an additional signal, not a mandatory browser feature:
  // some WebKit/in-app browsers omit Sec-Fetch-Site on valid same-origin POSTs.
  // Reject any explicitly cross-site/same-site header even if Origin matches.
  return origin===canonicalRequestOrigin(env) &&
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

async function boundedProviderBody(request,callbackURL="/member",errorCallbackURL="/join"){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type")||""))
    return null;
  const raw=await boundedText(request,512);
  if(raw===null)return null;
  try{
    const input=JSON.parse(raw);
    if(!input||typeof input!=="object"||Array.isArray(input))return null;
    // Explicit allowlist: never accept user-selected OAuth destination,
    // server identity, organization, trusted origin, scopes, or privileges.
    if(Object.keys(input).some(x=>!["provider","callbackURL","errorCallbackURL"].includes(x)))return null;
    if(!["google","github","apple","microsoft"].includes(input.provider)||
      (input.callbackURL!==undefined&&input.callbackURL!==callbackURL)||
      (input.errorCallbackURL!==undefined&&input.errorCallbackURL!==errorCallbackURL))return null;
    return JSON.stringify({provider:input.provider,callbackURL,errorCallbackURL});
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
  const authFor=createCanonicalAuthResolver(authFactory);
  return {async fetch(request,env){
    if(!isCanonicalOrigin(request,env))return fail(request,404);
    const url=new URL(request.url),path=url.pathname;
    const rewardMedia=matchRewardMedia(path);
    const rewardInventory=matchRewardInventory(path);
    const ownRewardMedia=rewardMedia?.handle===null;
    const publicRewardMedia=typeof rewardMedia?.handle==='string';
    const ownRewardInventory=rewardInventory?.handle===null;
    const publicRewardInventory=typeof rewardInventory?.handle==='string';
    const publicHandle=path.match(PUBLIC_MEMBER);
    const publicCommunity=/^\/api\/v1\/community\/(?:members|activity)$/.test(path);
    const forumRoute=/^\/api\/v1\/community\/(?:threads(?:\/[a-f0-9-]{36}(?:\/(?:replies|reaction))?|\/?)?|reports)$/.test(path)||(/^\/api\/v1\/member\/forum-submissions(?:\/[a-f0-9-]{36})?$/.test(path)||path==="/api/v1/member/forum-review");
    const publicMetrics=path===PUBLIC_TELEMETRY_PATH;
    const publicRecognitionCatalog=path==='/api/v1/public/recognition/catalog';
    const ownSpace=OWN_SPACE.test(path),publicSpace=path.match(PUBLIC_SPACE);
     const ownRecognition=path===CANONICAL_PREFIX+'/recognition';
     if(ownRecognition&&env.CANONICAL_RECOGNITION_ENABLED!=='true')return fail(request,404);
    const ownProgression=/^\/api\/v1\/member\/(?:progression|notifications(?:\/ack)?)$/.test(path);
    const ownSupporter=/^\/api\/v1\/member\/supporter(?:\/(?:checkout|portal|webhook|rewards))?$/.test(path);
    const supporterHook=path===CANONICAL_PREFIX+"/supporter/webhook";
    const ownProfile=path===PROFILE;
    const ownExport=path===EXPORT;
    const ownClosure=path===CLOSURE;
    const ownProjectSave=path===CANONICAL_PREFIX+"/project-saves" ||
      /^\/api\/v1\/member\/project-saves\/[a-f0-9]{32}$/.test(path);
    const ownWorkbench=/^\/api\/v1\/member\/workbench\/(?:status|access|member|projects(?:\/[0-9a-f-]{36})?)$/.test(path);
    if(ownWorkbench&&env?.CANONICAL_WORKBENCH_ALPHA_ENABLED!=="true")return fail(request,404);
    const ownStudioReview=path===CANONICAL_PREFIX+"/studio/review"||
      /^\/api\/v1\/member\/studio\/review\/[0-9a-f-]{36}\/manifest$/.test(path);
    const ownStudio=/^\/api\/v1\/member\/studio\/projects(?:\/[0-9a-f-]{36}(?:\/(?:submit|withdraw|submissions|assets(?:\/[a-f0-9]{32}(?:\/file)?)?))?)?$/.test(path);
    const ownStudioLarge=/^\/api\/v1\/member\/studio\/projects\/[0-9a-f-]{36}\/assets-large(?:\/[a-f0-9]{32}(?:\/(?:file|start|complete|parts(?:\/[1-9][0-9]{0,2})?))?)?$/.test(path);
    if((ownStudio||ownStudioLarge||ownStudioReview)&&env?.CANONICAL_CREATOR_STUDIO_ENABLED!=="true")return fail(request,404);
    // This is a proposed, source-only pilot. Do not expose even a GET
    // endpoint without a deliberate rollout flag and an approved D1 schema.
    if(ownProjectSave&&env?.CANONICAL_PROJECT_SAVES_ENABLED!=="true")return fail(request,404);
    if(path!==HEALTH && path!==METHODS && !ownRewardMedia && !publicRewardMedia && !ownRewardInventory && !publicRewardInventory && !publicRecognitionCatalog && !publicHandle && !ownProfile && !ownExport && !ownClosure && !ownSpace && !publicSpace && !ownRecognition && !publicCommunity && !forumRoute && !publicMetrics && !ownProgression && !ownSupporter && !ownProjectSave && !ownStudio && !ownStudioLarge && !ownStudioReview && !ownWorkbench &&
      !(path.startsWith(CANONICAL_AUTH_PATH+"/") &&
        (AUTH_ALLOWLIST[request.method]?.has(path)??false)))
      return fail(request,404);

    if((publicHandle||publicSpace||rewardMedia||rewardInventory) && !READ_METHODS.has(request.method))return fail(request,404);
    if(publicMetrics&&request.method!=="GET")return fail(request,405);
    if(publicRecognitionCatalog&&!READ_METHODS.has(request.method))return fail(request,405);
    if(ownProfile && !["GET","POST","PATCH"].includes(request.method))return fail(request,404);
    if(ownExport && request.method!=="GET")return fail(request,404);
     if(ownRecognition&&!['GET','PATCH'].includes(request.method))return fail(request,405);
    if(ownProjectSave && !["GET","PUT","DELETE"].includes(request.method))return fail(request,405);
    if(ownWorkbench && !["GET","POST","PATCH"].includes(request.method))return fail(request,405);
    if(ownStudioReview && !["GET","POST"].includes(request.method))return fail(request,405);
    if(ownStudio && !["GET","HEAD","POST","PATCH","PUT","DELETE"].includes(request.method))return fail(request,405);
    if(ownStudioLarge && !["GET","HEAD","POST","PUT","DELETE"].includes(request.method))return fail(request,405);
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
    // Never mistake temporary database/auth failure for an intentional
    // enrollment closure. Client status never authorizes member creation.
    const enrollmentIntended=env?.CANONICAL_PUBLIC_SIGNUP_ENABLED==="true"||
      env?.CANONICAL_INVITED_SIGNUP_ENABLED==="true";
    const availability=stageReady?"ready":enrollmentIntended?"unavailable":"closed";
    if((rewardMedia||rewardInventory)&&!stageReady)return fail(request,503);
    if(path===HEALTH)return safeJson(request,{
      service:"anevum-canonical-auth-staging",
      status:stageReady?"ready":"closed",
      ...(env?.ANEVUM_CANONICAL_STAGE_ENABLED==="true"?{availability}:{}),
      registration:stageReady?(configured.open?"open":configured.invited?"invite-only":"closed"):"closed",
      linkedCreatorAccounts:false,
      ...(env.CANONICAL_CREATOR_STUDIO_ENABLED==="true"?await studioReadiness(env):{}),
      ...(env.CANONICAL_PROJECT_SAVES_ENABLED==="true"?{
        projectSavesReady:Boolean(stageReady&&await canonicalProjectSaveReady(env))
      }:{}),
      // Keep the disabled service's original inert health contract unchanged.
      // V031 staging alone includes a schema-readiness signal, no private data.
      ...(env.CANONICAL_XP_TEST_ENABLED==='true'?{
        progressionReady:Boolean(stageReady&&await progressionReady(env.MEMBER_DB))
      }:{})
    });
    if(path===METHODS)return safeJson(request,{
      version:2,
      issuer:"anevum-better-auth-staging-v1",
      availability,
      registration:stageReady?(configured.open?"open":configured.invited?"invite-only":"closed"):"closed",
      methods:{google:{available:Boolean(stageReady&&configured.google)},
        email:{available:Boolean(stageReady&&configured.email&&(configured.invited||configured.open))},
        github:{available:Boolean(stageReady&&configured.github)},passkey:{available:false},
        microsoft:{available:Boolean(stageReady&&configured.microsoft)},apple:{available:Boolean(stageReady&&configured.apple)}},
      linking:stageReady&&[configured.google,configured.github,configured.apple,configured.microsoft].some(Boolean)?"explicit":"disabled"
    });
    // Never accept new identities without their required profile schema.
    if(!stageReady)return fail(request,503);
    // Never forward callbacks for disabled OAuth providers.
    const callback=path.match(/^\/api\/v1\/member\/auth\/callback\/(google|github|apple|microsoft)$/);
    if(callback&&!configured[callback[1]])return fail(request,404);
    if(publicRewardMedia)return safeResponse(await earnedRewardMedia(request,env,null,rewardMedia));
    if(publicRewardInventory)return safeResponse(await earnedRewardInventory(request,env,null,rewardInventory));
    if(publicMetrics)return safeResponse(await publicSupporterTelemetry(request,env));
    if(publicRecognitionCatalog)return safeResponse(await canonicalRecognitionCatalog(request,env));
    if(publicCommunity)return safeResponse(await canonicalCommunity(request,env));
    if(forumRoute){
      const publicForumRead=request.method==="GET" && !path.includes("/forum-submissions") && !path.endsWith("/forum-review") && !path.endsWith("/reaction");
      if(!publicForumRead&&!["GET","POST","DELETE"].includes(request.method))return fail(request,405);
      if(!publicForumRead&&["POST","PATCH","PUT","DELETE"].includes(request.method)&&!sameOriginMutation(request,env))return safeJson(request,{error:"Same-origin request required"},403);
      if(publicForumRead)return safeResponse(await canonicalForums(request,env));
      try{
        const auth=authFor(env);
        const clean=withoutForeignCookies(request,env);
        const session=await auth.api.getSession({headers:clean.headers});
        return safeResponse(await canonicalForums(clean,env,session?.user));
      }catch{return fail(request,503)}
    }
    if(publicSpace){
      if(request.method!=="GET")return fail(request,405);
      return safeResponse(await canonicalSpace(request,env,null,publicSpace[1]));
    }
    if(publicHandle){
      const clean=new Request(request.url,{method:request.method,headers:{accept:"application/json"}});
      return safeResponse(await canonicalPublicCreator(clean,env,canonicalRequestOrigin(env),publicHandle[1]));
    }

    // Stripe does not send a browser Origin. This exact endpoint relies on
    // raw-body HMAC verification, test-mode lock and a durable event ledger.
    if(supporterHook)return safeResponse(await supporterWebhook(request,env));

    if(ownProfile && ["POST","PATCH"].includes(request.method) && !sameOriginMutation(request,env))
      return safeJson(request,{error:"Same-origin request required"},403);

    // No inherited V5/Creator legacy cookies and no Authorization.
    // Enforce same-origin CSRF boundary for both POST and PATCH profile edits.
    // Apple returns from appleid.apple.com via a cross-site HTML form POST.
    // The exact enabled callback is the only exception to our same-origin mutation rule;
    // the signed OAuth state is still checked by Better Auth.
    const isAppleFormPost=request.method==="POST" && path===CANONICAL_AUTH_PATH+"/callback/apple" &&
      configured.apple && /^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get("content-type")||"") &&
      (!request.headers.get("origin") || request.headers.get("origin")==="https://appleid.apple.com");
    if(["POST","PATCH","PUT","DELETE"].includes(request.method)&&!sameOriginMutation(request,env)&&!isAppleFormPost)
      return safeJson(request,{error:"Same-origin request required"},403);
    let clean=withoutForeignCookies(request,env);
    if(request.method==="POST"){
      if(url.search)return safeJson(request,{error:"Invalid request"},400);
      if(isAppleFormPost){
        const body=await boundedText(clean,16384);
        if(body===null)return safeJson(request,{error:"Invalid callback"},400);
        const form=new URLSearchParams(body);
        if(!form.get("state")||(!form.get("code")&&!form.get("error")))
          return safeJson(request,{error:"Invalid callback"},400);
        clean=new Request(request.url,{method:"POST",headers:clean.headers,body,redirect:"manual"});
      }else if(path===CANONICAL_AUTH_PATH+"/email-otp/send-verification-otp"||
        path===CANONICAL_AUTH_PATH+"/sign-in/email-otp"){
        if(!configured.email||!(configured.invited||configured.open))return fail(request,503);
        const verifying=path.endsWith("/sign-in/email-otp");
        const safeBody=await boundedEmailBody(clean,verifying);
        if(!safeBody)return safeJson(request,{error:"Invalid email verification request"},400);
        const parsed=JSON.parse(safeBody);
        // Do not reveal which email addresses have been invited to a visitor.
        // A non-invited send returns the same generic response without sending mail;
        // verification fails with the same non-specific error as a wrong code.
        if(!await permitCanonicalUserCreationApproved(env,parsed.email))
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
            origin:canonicalRequestOrigin(env),
            "sec-fetch-site":"same-origin",
            "accept":"application/json",
            "cf-connecting-ip":request.headers.get("cf-connecting-ip")||""
          },
          body:safeBody,
          redirect:"manual"
        });
      }else if(path===CANONICAL_AUTH_PATH+"/link-social"){
        if(![configured.google,configured.github,configured.apple,configured.microsoft].some(Boolean))return fail(request,503);
        const safeBody=await boundedProviderBody(clean,"/member","/member");
        if(!safeBody)return safeJson(request,{error:"Invalid account-linking request"},400);
        if(!configured[JSON.parse(safeBody).provider])return fail(request,503);
        const headers=new Headers(clean.headers);
        headers.set("content-type","application/json");
        clean=new Request(request.url,{method:"POST",headers,body:safeBody,redirect:"manual"});
      }else if(path===CANONICAL_AUTH_PATH+"/sign-out"){
        if(request.headers.get("content-type") &&
          !/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type")))
          return safeJson(request,{error:"Invalid request"},400);
      }
    }
    if(request.method==="GET"&&url.search.length>4096)
      return safeJson(request,{error:"Invalid request"},400);

    try{
      const auth=authFor(env);
      if(path===CANONICAL_AUTH_PATH+"/link-social"){
        const session=await auth.api.getSession({headers:clean.headers});
        if(!session?.user?.id||session.user.emailVerified!==true)
          return safeJson(request,{error:"Verified sign-in required"},401);
      }
      if(ownRewardMedia||ownRewardInventory||ownProfile||ownExport||ownClosure||ownSpace||ownRecognition||ownProgression||ownSupporter||ownProjectSave||ownStudio||ownStudioLarge||ownStudioReview||ownWorkbench){
        const session=await auth.api.getSession({headers:clean.headers});
        if(!session?.user)return safeJson(request,{error:"Sign-in required"},401);
        if(ownRewardMedia)return safeResponse(await earnedRewardMedia(clean,env,session.user,rewardMedia));
        if(ownRewardInventory)return safeResponse(await earnedRewardInventory(clean,env,session.user,rewardInventory));
        if(ownClosure)return safeResponse(await canonicalAccountClosure(clean,env,session.user,session.session));
        if(ownWorkbench)return safeResponse(await canonicalWorkbench(clean,env,session.user));
        if(ownStudioReview)return safeResponse(await canonicalStudioReview(clean,env,session.user));
        if(ownStudio)return safeResponse(await canonicalStudio(clean,env,session.user));
        if(ownStudioLarge)return safeResponse(await canonicalStudioLarge(clean,env,session.user));
        if(ownProjectSave)return safeResponse(await canonicalProjectSave(clean,env,session.user));
        if(ownProgression)return safeResponse(await canonicalProgression(clean,env,session.user));
        if(ownSupporter)return safeResponse(path===CANONICAL_PREFIX+"/supporter/rewards"
          ?await supporterRewardsRoute(clean,env,session.user)
          :await supporterMember(clean,env,session.user));
        if(ownSpace)return safeResponse(await canonicalSpace(clean,env,session.user));
         if(ownRecognition)return safeResponse(await canonicalRecognition(clean,env,session.user));
        return safeResponse(ownExport?
          await canonicalExportMember(clean,env,session.user,canonicalRequestOrigin(env)):
          await canonicalCreatorMember(clean,env,session.user,canonicalRequestOrigin(env)));
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
