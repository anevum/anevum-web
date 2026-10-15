// ANEVUM V006: dedicated PUBLIC design staging at a.anevum.com.
// Only the staging public D1 is bound. All member/admin/broker APIs fail closed.
// Independent from the January 1 apex construction Worker and next.anevum.com auth.
import publicApi from "../api/worker.mjs";

const SITE = "a.anevum.com";
const PUBLISHED = /^\/api\/v1\/(?:status|categories|boards|community\/posts(?:\/[a-f0-9]{32})?|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?)$/i;
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
