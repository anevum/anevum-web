/**
 * ANEVUM Family Field synthetic-only protected preview Worker.
 *
 * This does NOT import, expose, call or configure the private family-location
 * service. No DB, DO, member API, cookies, GPS, WebSocket or writable routes.
 * Authenticated Cloudflare Access is required for every asset. In its absence
 * the Worker fails closed. Wrangler must set assets.run_worker_first=true so
 * no static asset bypasses the Access gate.
 */
const FILES=new Set([
  "/","/index.html","/styles.css","/app.mjs","/synthetic-engine.mjs",
  "/vendor/maplibre-gl.mjs","/vendor/maplibre-gl-worker.mjs","/vendor/maplibre-gl.css","/synthetic-scene.mjs"
]);
const CTYPE={
  "/":"text/html; charset=utf-8",
  "/index.html":"text/html; charset=utf-8",
  "/styles.css":"text/css; charset=utf-8",
  "/app.mjs":"application/javascript; charset=utf-8",
  "/synthetic-engine.mjs":"application/javascript; charset=utf-8",
  "/vendor/maplibre-gl.mjs":"application/javascript; charset=utf-8",
  "/vendor/maplibre-gl-worker.mjs":"application/javascript; charset=utf-8",
  "/vendor/maplibre-gl.css":"text/css; charset=utf-8",
  "/synthetic-scene.mjs":"application/javascript; charset=utf-8"
};
const CSP=[
  "default-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://tiles.openfreemap.org https://s3.amazonaws.com",
  "connect-src 'self' https://tiles.openfreemap.org https://s3.amazonaws.com",
  "worker-src 'self' blob:",
  "child-src blob:"
].join("; ");
const HEADERS={
  "Cache-Control":"private, no-store, max-age=0",
  "Pragma":"no-cache",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "X-Robots-Tag":"noindex, nofollow, noarchive",
  "Referrer-Policy":"no-referrer",
  "Permissions-Policy":"geolocation=(),camera=(),microphone=(),payment=(),usb=()",
  "Content-Security-Policy":CSP,
  "Cross-Origin-Resource-Policy":"same-origin",
  "Vary":"Cookie"
};
function answer(message,status,method="GET",type="text/plain; charset=utf-8"){
  return new Response(method==="HEAD"?null:message,{status,headers:{...HEADERS,"Content-Type":type}});
}
export async function authorized(access,aud){
  if(typeof aud!=="string"||aud.length<12 || !access ||
    typeof access.getIdentity!=="function" || access.aud!==aud)return false;
  try{
    const id=await access.getIdentity();
    return !!id && typeof id.email==="string" && id.email.includes("@") &&
      id.email.length<320;
  }catch{return false;}
}
export default {
  async fetch(request,env,ctx){
    if(!await authorized(ctx?.access,env?.FS_SYNTH_REVIEW_AUD))
      return answer("Preview is restricted to approved reviewers.",403,request.method);
    let url;
    try{url=new URL(request.url);}catch{return answer("Not found",404,request.method);}
    if(!["GET","HEAD"].includes(request.method))
      return answer("Read-only review",405,request.method);
    if(url.hash || (url.search && !(url.pathname==="/vendor/maplibre-gl-worker.mjs" && url.search==="?v=6.14.0")))
      return answer("Not found",404,request.method);
    if(url.pathname==="/__review")
      return answer(JSON.stringify({
        status:"SYNTHETIC_REVIEW",familyAccounts:false,
        gps:false,geolocationPermission:false,privateDatabase:false,
        durableObjects:false,history:false,source:"fictional-only",
        memberApi:false,sharingBackend:false
      }),200,request.method,"application/json; charset=utf-8");
    if(!FILES.has(url.pathname))return answer("Not found",404,request.method);
    if(!env?.ASSETS || typeof env.ASSETS.fetch!=="function")
      return answer("Preview assets are unavailable",503,request.method);
    try{
      const response=await env.ASSETS.fetch(request);
      const headers=new Headers(response.headers);
      for(const [key,value] of Object.entries(HEADERS))headers.set(key,value);
      headers.set("Content-Type",CTYPE[url.pathname]);
      return new Response(request.method==="HEAD"?null:response.body,{
        status:response.status,headers
      });
    }catch{
      return answer("Preview assets are unavailable",503,request.method);
    }
  }
};
