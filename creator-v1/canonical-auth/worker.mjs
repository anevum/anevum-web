import {
  CANONICAL_ORIGIN,CANONICAL_PREFIX,CANONICAL_AUTH_PATH,
  AUTH_ALLOWLIST,canonicalConfigState,canonicalSchemaReady,
  isCanonicalOrigin,withoutForeignCookies
} from "./policy.mjs";
import {createCanonicalAuth} from "./auth.mjs";

const HEALTH=CANONICAL_PREFIX+"/health";
const METHODS=CANONICAL_PREFIX+"/auth-methods";
const READ_METHODS=new Set(["GET","HEAD"]);
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
  return origin===CANONICAL_ORIGIN && (site==="same-origin"||site==="none");
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
  const length=Number(request.headers.get("content-length")||0);
  if(!Number.isFinite(length)||length>512)return null;
  const reader=request.body?.getReader();
  if(!reader)return null;
  const chunks=[];let total=0;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>512){await reader.cancel();return null;}
      chunks.push(value);
    }
  }catch{return null;}
  finally{reader.releaseLock();}
  const buffer=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
  try{
    const input=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buffer));
    if(!input||typeof input!=="object"||Array.isArray(input))return null;
    // Explicit allowlist: never accept user-selected OAuth destination,
    // server identity, organization, trusted origin, scopes, or privileges.
    if(Object.keys(input).some(x=>!["provider","callbackURL"].includes(x)))return null;
    if(input.provider!=="google"||
      (input.callbackURL!==undefined&&input.callbackURL!=="/join"))return null;
    return JSON.stringify({provider:"google",callbackURL:"/join"});
  }catch{return null;}
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
    if(path!==HEALTH && path!==METHODS &&
      !(path.startsWith(CANONICAL_AUTH_PATH+"/") &&
        (AUTH_ALLOWLIST[request.method]?.has(path)??false)))
      return fail(request,404);

    if((path===HEALTH||path===METHODS)&&!READ_METHODS.has(request.method))
      return safeJson(request,{error:"Read-only endpoint"},405);

    const configured=canonicalConfigState(env);
    // The flag is never sufficient: verify the actual isolated schema.
    const ready=configured.operational&&await canonicalSchemaReady(env);
    if(path===HEALTH)return safeJson(request,{
      service:"anevum-canonical-auth-staging",
      status:ready?"ready":"closed",
      registration:ready&&configured.invited?"invite-only":"closed",
      linkedCreatorAccounts:false
    });
    if(path===METHODS)return safeJson(request,{
      version:2,
      issuer:"anevum-better-auth-staging-v1",
      registration:ready&&configured.invited?"invite-only":"closed",
      methods:{google:{available:Boolean(ready)},email:{available:false},
        github:{available:false},passkey:{available:false},
        microsoft:{available:false},apple:{available:false}},
      linking:"disabled"
    });
    if(!ready)return fail(request,503);

    // No inherited V5/Creator legacy cookies and no Authorization.
    let clean=withoutForeignCookies(request);
    if(request.method==="POST"){
      if(!sameOriginMutation(request))return safeJson(request,{error:"Same-origin request required"},403);
      if(url.search)return safeJson(request,{error:"Invalid request"},400);
      if(path===CANONICAL_AUTH_PATH+"/sign-in/social"){
        const safeBody=await boundedProviderBody(clean);
        if(!safeBody)return safeJson(request,{error:"Invalid provider request"},400);
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
      const result=await auth.handler(clean);
      return safeResponse(result);
    }catch{
      // Do not expose auth state, D1 errors, provider credentials, or tokens.
      return fail(request,503);
    }
  }};
}
export default createCanonicalStageWorker();
