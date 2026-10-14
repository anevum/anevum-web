// ANEVUM Creator V1 — UNROUTED production-readiness candidate.
// Separate from both the current apex Worker and the isolated staging Worker.
// This file cannot deploy to anevum.com without a separate, audited release.
import publicApi from "../api/worker.mjs";

const SITE = "anevum.com";
const PUBLIC_API = /^\/api\/v1\/(?:status|categories|boards|community\/posts(?:\/[a-f0-9]{32})?|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?)$/i;
const PRIVATE_PREFIX = /^\/(?:api|studio|staff|command|rhen|lab|private)(?:\/|$)/i;
// /join is a static sign-in information page only. No /join/* account,
// registration, invitation, identity, or mutation endpoint is exposed.
const JOIN_PREFIX = /^\/join(?:\/|$)/i;
const HEADERS = {
  "x-content-type-options":"nosniff",
  "referrer-policy":"no-referrer",
  "cross-origin-opener-policy":"same-origin",
  "permissions-policy":"camera=(), microphone=(), geolocation=(), payment=()"
};
const reject=(status)=>new Response(status===405?"Method not allowed":"Not found",{
  status,headers:{...HEADERS,"cache-control":"no-store","content-type":"text/plain; charset=utf-8"}
});
function safeResponse(response,api=false){
  const headers=new Headers(response.headers);
  for(const [k,v] of Object.entries(HEADERS))headers.set(k,v);
  headers.delete("set-cookie");
  headers.set("x-frame-options","DENY");
  const html=headers.get("content-type")?.includes("text/html");
  if(html){
    headers.set("cache-control","no-store");
    headers.set("content-security-policy",
      "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
  }
  if(api)headers.set("cache-control","no-store");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    // Do not turn an unreviewed Worker into a general proxy or member service.
    if(url.protocol!=="https:"||url.hostname!==SITE||(url.port&&url.port!=="443"))return reject(404);
    if(!["GET","HEAD"].includes(request.method))return reject(405);
    const path=url.pathname;
    if(path==="/health"||PUBLIC_API.test(path)){
      // Caller cookies, Authorization and account headers MUST NOT cross the
      // trust boundary into the public, read-only catalogue handler.
      const clean=new Request(url.href,{method:request.method,headers:{Accept:"application/json"}});
      return safeResponse(await publicApi.fetch(clean,env,ctx),true);
    }
    // Only the inert /join SPA page can be read anonymously. All private
    // registration APIs, deeper join routes and staff/broker paths stay denied.
    if(PRIVATE_PREFIX.test(path) || (JOIN_PREFIX.test(path) && path !== "/join"))return reject(404);
    const clean=new Request(url.href,{method:request.method,headers:{Accept:request.headers.get("accept")||"*/*"}});
    return safeResponse(await env.ASSETS.fetch(clean));
  }
};
