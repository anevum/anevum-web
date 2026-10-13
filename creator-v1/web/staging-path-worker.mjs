// Isolated path-mounted Creator V1 React preview on next.anevum.com/creator/*.
// Public API is read-only against STAGING D1. Authentication remains with the
// existing distinct same-origin Member Worker at /api/v1/member/*.
import publicApi from "../api/worker.mjs";

const SITE = "next.anevum.com";
const PREFIX = "/creator";
const PUBLISHED = /^\/api\/v1\/(?:status|categories|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?)$/i;
const SAFE_HEADERS = {
  "x-content-type-options":"nosniff",
  "x-robots-tag":"noindex, nofollow",
  "referrer-policy":"no-referrer"
};
const reject=(status,content="Not found")=>
  new Response(content,{status,headers:{...SAFE_HEADERS,"cache-control":"no-store","content-type":"text/plain; charset=utf-8"}});
function withSafety(res,alwaysNoStore=false){
  const headers=new Headers(res.headers);
  for(const [name,value] of Object.entries(SAFE_HEADERS))headers.set(name,value);
  const html=headers.get("content-type")?.includes("text/html");
  if(alwaysNoStore || html)headers.set("cache-control","private, no-store");
  if(html){
    headers.set("content-security-policy","default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
    headers.set("x-frame-options","DENY");
  }
  return new Response(res.body,{status:res.status,statusText:res.statusText,headers});
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    // This worker must never be reused as an apex or cross-host Worker.
    if(url.protocol!=="https:"||url.hostname!==SITE)return reject(404);
    if(url.pathname===PREFIX)return Response.redirect(url.origin+PREFIX+"/",308);
    if(!url.pathname.startsWith(PREFIX+"/"))return reject(404);
    if(!["GET","HEAD"].includes(request.method))return reject(405,"Read-only staging preview");

    const relative=url.pathname.slice(PREFIX.length);
    if(relative.startsWith("/api/")){
      if(!PUBLISHED.test(relative))return reject(404);
      const forwarded=new URL(request.url);
      forwarded.pathname=relative;
      // Do not forward the host-scoped member session cookie or Authorization.
      // Public catalogue reads must stay explicitly anonymous.
      const clean=new Request(forwarded.href,{method:request.method,headers:{Accept:"application/json"}});
      const response=await publicApi.fetch(clean,env,ctx);
      return withSafety(response,true);
    }
    // The Cloudflare ASSETS binding points only to dist/react-staging.
    // Static files and SPA fallbacks are served from this isolated Worker;
    // no subrequest is made to the old staging Worker.
    const target=new URL(request.url);
    target.pathname=relative||"/";
    const clean=new Request(target.href,{method:request.method,headers:{Accept:request.headers.get("accept")||"*/*"}});
    const response=await env.ASSETS.fetch(clean);
    return withSafety(response);
  }
};
