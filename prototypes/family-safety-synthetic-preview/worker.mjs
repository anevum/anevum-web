import { jwtVerify, createRemoteJWKSet } from "jose";
/**
 * ANEVUM Family Field synthetic-only protected preview Worker.
 *
 * This does NOT import, expose, call or configure the private family-location
 * service. No DB, DO, member API, cookies, GPS, WebSocket or writable routes.
 * Authenticated Cloudflare Access is required for every asset. In its absence
 * the Worker fails closed. Wrangler must set assets.run_worker_first=true so
 * no static asset bypasses the Access gate. Cloudflare Static Assets
 * currently do not forward ctx.access from the internal router, so a verified
 * Access application JWT is also required/accepted (signature, iss, aud, exp,
 * and the exact owner email). Never trust cookie/header contents unsigned.
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
const REVIEW_OWNER="devon@anevum.com";
const ISSUER_RE=/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/;
const AUD_RE=/^[a-f0-9]{64}$/;
const jwksCache=new Map();

function keysFor(issuer){
  // Keep keys cached per Worker isolate; never cache positive authorization.
  const url=new URL(issuer+"/cdn-cgi/access/certs");
  let keys=jwksCache.get(url.href);
  if(!keys){
    keys=createRemoteJWKSet(url,{cooldownDuration:30_000,cacheMaxAge:300_000});
    jwksCache.set(url.href,keys);
  }
  return keys;
}

function tokenFromRequest(request){
  if(!request?.headers||typeof request.headers.get!=="function")return null;
  const header=request.headers.get("cf-access-jwt-assertion");
  if(header)return /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+){2}$/.test(header)&&
    header.length<=8192?header:null;
  // CF_Authorization is an Access-issued app JWT, not an authorization by
  // itself. It MUST undergo the same complete signature/claim validation.
  const cookie=request.headers.get("cookie")||"";
  if(cookie.length>16_384)return null;
  const match=cookie.match(/(?:^|;\s*)CF_Authorization=([A-Za-z0-9_.-]+)/);
  return match && match[1].length<=8192?match[1]:null;
}

/**
 * Trust a Cloudflare-authenticated runtime identity OR cryptographically
 * validate a signed Access JWT. The latter is needed when the Static Assets
 * internal router prevents ctx.access from reaching our Worker.
 *
 * keysFactory is an injectable verifier for isolated cryptographic tests;
 * the production Worker always uses the remote Cloudflare JWKS.
 */
export async function authorized(access,aud,request=null,issuer=null,keysFactory=keysFor){
  if(typeof aud!=="string"||!AUD_RE.test(aud))return false;
  if(access?.aud===aud && typeof access.getIdentity==="function"){
    try{
      const id=await access.getIdentity();
      if(id?.email?.trim().toLowerCase()===REVIEW_OWNER)return true;
    }catch{}
  }
  if(typeof issuer!=="string"||!ISSUER_RE.test(issuer))return false;
  const token=tokenFromRequest(request);
  if(!token)return false;
  try{
    const {payload}=await jwtVerify(token,keysFactory(issuer),{
      issuer,audience:aud,algorithms:["RS256"],clockTolerance:0
    });
    return payload.email?.trim().toLowerCase()===REVIEW_OWNER;
  }catch{
    // No JWT, invalid/expired JWT, bad issuer/audience, or key fetch failure.
    // Identical denial prevents leaking identity or verifier detail.
    return false;
  }
}

export default {
  async fetch(request,env,ctx){
    if(!await authorized(ctx?.access,env?.FS_SYNTH_REVIEW_AUD,request,env?.FS_SYNTH_TEAM_ISSUER))
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
