/**
 * ANEVUM permanent-domain prelaunch gateway.
 *
 * The January 1 countdown stays visible to the public. Access JWT is
 * independently verified against the exact preview Access app audience,
 * then explicit allowlisted owner email. A raw CF_Authorization cookie or
 * spoofed header alone NEVER authorizes a visitor.
 *
 * Cloudflare Static Assets MUST run this Worker first for every request.
 * No worker route/secret/D1 deployments are performed by this source module.
 */
import {COUNTDOWN_HTML} from "./countdown.mjs";
import {verifiedPreviewIdentity} from "./preview-access.mjs";
import {apexPlatformFetch} from "./platform.mjs";

const ORIGIN="https://anevum.com";
const HTML_CSP="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const HEADERS={
  "cache-control":"private, no-store",
  "x-robots-tag":"noindex, nofollow, noarchive",
  "x-content-type-options":"nosniff",
  "referrer-policy":"no-referrer",
  "x-frame-options":"DENY",
  "vary":"Cookie",
  "permissions-policy":"camera=(), microphone=(), geolocation=()"
};
function textResponse(body,status=200,extra={}){
  return new Response(body,{status,headers:{...HEADERS,
    "content-type":"text/plain; charset=utf-8",...extra}});
}
function countdown(request){
  return new Response(request.method==="HEAD"?null:COUNTDOWN_HTML,{
    status:200,headers:{...HEADERS,"content-type":"text/html; charset=utf-8",
      "content-security-policy":HTML_CSP}});
}
function blockGuest(request){
  const url=new URL(request.url);
  if(!["GET","HEAD"].includes(request.method))
    return textResponse("Method Not Allowed",405,{allow:"GET, HEAD"});
  if(url.pathname==="/robots.txt")
    return textResponse(request.method==="HEAD"?null:"User-agent: *\nDisallow: /\n",200);
  if(url.pathname==="/favicon.ico")return new Response(null,{status:204,headers:HEADERS});
  // Any REST endpoint or bundled asset must be denied, never disguised as
  // an HTML countdown with HTTP 200. Prevent direct deep-link/API bypasses.
  if(url.pathname.startsWith("/api/") || url.pathname==="/api" ||
    url.pathname.startsWith("/assets/") || url.pathname==="/assets" ||
    url.pathname.startsWith("/_") || url.pathname.startsWith("/cdn-cgi/") ||
    /\.(?:js|mjs|css|json|wasm|map|webp|png|jpe?g|svg|gif|ico|woff2?|ttf|otf|mp4|pdf|zip)$/i.test(url.pathname))
    return textResponse(request.method==="HEAD"?null:"Not found",404);
  return countdown(request);
}
function securePlatform(response,mode){
  const headers=new Headers(response.headers);
  headers.set("cache-control","private, no-store");
  headers.set("vary","Cookie");
  headers.set("x-content-type-options","nosniff");
  headers.set("referrer-policy","no-referrer");
  headers.set("x-frame-options","DENY");
  if(mode!=="public")headers.set("x-robots-tag","noindex, nofollow, noarchive");
  else headers.delete("x-robots-tag");
  // Platform CSP and member cookies must not be discarded/replaced here.
  return new Response(response.body,{status:response.status,
    statusText:response.statusText,headers});
}

export function createApexPrelaunchGateway({
  identity=verifiedPreviewIdentity,
  platform=apexPlatformFetch
}={}){
  return {
    async fetch(request,env,ctx){
      let url;
      try{url=new URL(request.url);}catch{return textResponse("Not found",404);}
      if(url.origin!==ORIGIN || url.username || url.password ||
        url.protocol!=="https:")return textResponse("Not found",404);
      const mode=env?.ANEVUM_PRELAUNCH_MODE;
      const originReady=env?.ANEVUM_CANONICAL_APEX_ENABLED==="true";
      // Public launch is deliberately two-step and *never* an implicit
      // fallback from a missing gate, token, binding or environment flag.
      const released=originReady && mode==="public" &&
        env?.ANEVUM_LAUNCH_APPROVED==="true";
      const gated=originReady && mode==="gated";
      if(released){
        const output=await platform(request,env,ctx);
        return securePlatform(output,"public");
      }
      if(!gated)return blockGuest(request);
      let identityResult=null;
      try{identityResult=await identity(request,env);}catch{identityResult=null;}
      if(!identityResult){
        if(url.pathname==="/__enter"||url.pathname==="/__enter/")
          return textResponse("Private preview requires Cloudflare Access.",403);
        return blockGuest(request);
      }
      if(url.pathname==="/__enter"||url.pathname==="/__enter/")
        return new Response(null,{status:303,headers:{...HEADERS,location:"/"}});
      if(url.pathname==="/robots.txt")return textResponse("User-agent: *\nDisallow: /\n",200);
      const result=await platform(request,env,ctx);
      return securePlatform(result,"gated");
    }
  };
}
export default createApexPrelaunchGateway();
