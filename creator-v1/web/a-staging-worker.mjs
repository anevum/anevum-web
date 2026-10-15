// ANEVUM V006: dedicated PUBLIC design staging at a.anevum.com.
// Only the staging public D1 is bound. All member/admin/broker APIs fail closed.
// Independent from the January 1 apex construction Worker and next.anevum.com auth.
import publicApi from "../api/worker.mjs";
import {memberEndpoint} from "../../../src/server/member.mjs";
import {canonicalBetaConfigured,canonicalPublicCreator} from "../../../src/server/canonical-creator-profile.mjs";

const SITE = "a.anevum.com";
const PUBLISHED = /^\/api\/v1\/(?:status|categories|boards|community\/posts(?:\/[a-f0-9]{32})?|community\/showcases|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?)$/i;
const SECURITY = {
  "x-content-type-options":"nosniff",
  "x-robots-tag":"noindex, nofollow, noarchive",
  "referrer-policy":"no-referrer",
  "x-frame-options":"DENY",
  "permissions-policy":"camera=(), microphone=(), geolocation=(), payment=()"
};
const textResponse=(status,message,method)=>new Response(method==="HEAD"?null:message,{
  status,headers:{...SECURITY,"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}
});
// Canonical Better Auth responses MUST preserve HttpOnly/secure session cookies.
// Never use the anonymous projection's cookie-stripping helper for auth.
function protectCanonicalMember(response,method){
  const headers=new Headers(response.headers);
  for(const [name,value] of Object.entries(SECURITY))headers.set(name,value);
  headers.set("cache-control","private, no-store");
  headers.set("strict-transport-security","max-age=31536000; includeSubDomains");
  headers.set("vary","Origin");
  return new Response(method==="HEAD"?null:response.body,{
    status:response.status,statusText:response.statusText,headers
  });
}
function protect(response,method,forceNoStore=false){
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(SECURITY))headers.set(key,value);
  const html=headers.get("content-type")?.toLowerCase().includes("text/html");
  if(forceNoStore||html)headers.set("cache-control","private, no-store");
  if(html)headers.set("content-security-policy",
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; "+
    "img-src 'self' data:; connect-src 'self'; font-src 'self'; "+
    "base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
  headers.delete("set-cookie");
  return new Response(method==="HEAD"?null:response.body,{
    status:response.status,statusText:response.statusText,headers
  });
}
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.protocol!=="https:"||url.hostname!==SITE)return textResponse(404,"Not found",request.method);
    const canonicalBeta=canonicalBetaConfigured(env,url.origin);
    const canonicalAuthPath=url.pathname==="/api/auth"||url.pathname.startsWith("/api/auth/");
    const canonicalMemberPath=["/api/member/availability","/api/member/session",
      "/api/member/creator-profile"].includes(url.pathname);
    const publicMember=url.pathname.match(/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})$/);
    if(canonicalAuthPath||canonicalMemberPath){
      // No cross-service token bridge: exact same origin, isolated Better Auth
      // MEMBER_DB and explicit operator-enabled staging only. NO staff/Command,
      // RHEN, or legacy member endpoints can pass this narrow allowlist.
      if(!canonicalBeta)return textResponse(404,"Not found",request.method);
      if(canonicalMemberPath&&
        !["GET","HEAD",...(url.pathname==="/api/member/creator-profile"?["POST","PATCH"]:[])].includes(request.method))
        return textResponse(405,"Method not allowed",request.method);
      if(canonicalMemberPath&&request.method==="HEAD")
        return textResponse(405,"Method not allowed",request.method);
      const result=await memberEndpoint(request,env,url.pathname);
      return protectCanonicalMember(result,request.method);
    }
    if(publicMember){
      if(!canonicalBeta)return textResponse(404,"Not found",request.method);
      if(!["GET","HEAD"].includes(request.method))return textResponse(405,"Method not allowed",request.method);
      // No visitor cookies or authorization headers reach public DTOs.
      const clean=new Request(url.href,{method:request.method,headers:{Accept:"application/json"}});
      return protect(await canonicalPublicCreator(clean,env,url.origin,publicMember[1]),request.method,true);
    }
    if(request.method!=="GET"&&request.method!=="HEAD")return textResponse(405,"Staging public view is read-only",request.method);
    if(url.pathname==="/health")return protect(new Response(JSON.stringify({
      service:"anevum-creator-v1-a-staging",status:"ok",mode:"public-read-only"
    }),{headers:{"content-type":"application/json; charset=utf-8"}}),request.method,true);
    if(url.pathname.startsWith("/api/")){
      if(!PUBLISHED.test(url.pathname))return textResponse(404,"Not found",request.method);
      // Never forward member Authorization or cookies into anonymous public reads.
      const clean=new Request(url.href,{method:request.method,headers:{Accept:"application/json"}});
      return protect(await publicApi.fetch(clean,env,ctx),request.method,true);
    }
    const headers=new Headers();
    for(const name of ["accept","range","if-none-match","if-modified-since"]){
      const value=request.headers.get(name);
      if(value)headers.set(name,value);
    }
    const clean=new Request(url.href,{method:request.method,headers});
    return protect(await env.ASSETS.fetch(clean),request.method);
  }
};
