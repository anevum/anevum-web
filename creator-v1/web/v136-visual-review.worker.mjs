/**
 * V136 read-only interactive visual review. Deliberately NOT ANEVUM production.
 * - Source: exact commit injected into this isolated review deployment; never a frozen source.
 * - No D1/R2/auth/secrets/payments/write endpoints/session forwarding.
 * - Public catalogue GETs are anonymous, explicitly allowlisted first-party reads.
 * - The site's original React/Monaco routes and first-party WebGL assets are
 *   real compiled files, not a Figma/prototype imitation.
 */
const HOST="anevum-v136-visual-review-001.devonakins.workers.dev";
const PREFIX="/creator";
// Wrangler build-time define, not a runtime secret or privileged binding.
const SOURCE=typeof __ANEVUM_REVIEW_SOURCE_SHA__==='string'?__ANEVUM_REVIEW_SOURCE_SHA__:'unbuilt-local-source';
const ALLOWED_PUBLIC=/^\/api\/v1\/(?:status|categories|boards|community\/(?:posts(?:\/[a-f0-9]{32})?|showcases)|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?)$/i;
const HTML_CSP="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; font-src 'self' data:; worker-src 'self' blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; frame-src 'none'";
const SAFE_HEADERS={
  "x-content-type-options":"nosniff",
  "referrer-policy":"no-referrer",
  "x-robots-tag":"noindex, nofollow, noarchive, nosnippet",
  "cross-origin-opener-policy":"same-origin",
  "permissions-policy":"camera=(), microphone=(), geolocation=(), payment=()"
};
const error=(code,message,extra={})=>new Response(message,{status:code,headers:{
  ...SAFE_HEADERS,"cache-control":"no-store","content-type":"text/plain; charset=utf-8",...extra
}});
const BANNER='<div id="anevum-preview-band" role="status" aria-label="ANEVUM development review">V136 INTERACTIVE PREVIEW <span aria-hidden="true">/</span> NON-PRODUCTION <a href="https://anevum.com/" rel="noopener noreferrer">Live site</a><small>Account, publication &amp; payment actions disabled</small></div>';
const BANNER_CSS='<style id="anevum-preview-style">:root{--av-review-offset:39px}body{padding-top:39px!important}.p136-header{top:39px!important}#anevum-preview-band{position:fixed;z-index:2147483647;top:0;left:0;right:0;min-height:39px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;padding:7px 15px;background:#17111d;color:#efe6da;border-bottom:1px solid #d2a57f;font:700 11px/1.25 system-ui,sans-serif;letter-spacing:.1em;text-align:center}#anevum-preview-band a{color:#efe6da;text-underline-offset:3px}#anevum-preview-band small{font-size:10px;color:#c8bdba;font-weight:500;letter-spacing:0}@media(max-width:560px){:root{--av-review-offset:63px}body{padding-top:63px!important}.p136-header{top:63px!important}#anevum-preview-band{gap:6px 11px;min-height:63px;font-size:9px;letter-spacing:.06em}#anevum-preview-band small{flex-basis:100%}}@media(prefers-reduced-motion:reduce){#anevum-preview-band{transition:none;animation:none}}</style>';
function safeResponse(res,{html=false,nocache=false,bodyOverride}={}){
  const headers=new Headers(res.headers);
  for(const [key,value] of Object.entries(SAFE_HEADERS))headers.set(key,value);
  headers.delete("set-cookie");headers.delete("access-control-allow-origin");
  headers.delete("content-length");headers.delete("content-encoding");
  if(html){
    headers.set("content-security-policy",HTML_CSP);
    headers.set("cache-control","private, no-store");
    headers.set("x-frame-options","DENY");
    headers.set("content-type","text/html; charset=utf-8");
  }else if(nocache)headers.set("cache-control","private, no-store");
  return new Response(bodyOverride===undefined?res.body:bodyOverride,{status:res.status,statusText:res.statusText,headers});
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.hostname!==HOST||url.protocol!=="https:")return error(404,"Review host not found");
  if(request.headers.has("upgrade"))return error(403,"No preview WebSockets");
  if(request.method!=="GET"&&request.method!=="HEAD")
    return error(405,"Visual preview is read-only",{"allow":"GET, HEAD"});
  if(url.pathname==="/"||url.pathname===PREFIX)
    return Response.redirect(url.origin+PREFIX+"/",307);
  if(url.pathname==="/__review/health")
    return new Response(request.method==="HEAD"?null:JSON.stringify({
      application:"ANEVUM V136",sourceSha:SOURCE,kind:"non-production-interactive-preview",
      access:"public-link",content:"compiled-real-frontend",accounts:false,
      publishing:false,payments:false,privateData:false
    }),{headers:{...SAFE_HEADERS,"cache-control":"no-store","content-type":"application/json; charset=utf-8"}});
  // A small set of original GLB and texture manifests use absolute /assets URLs.
  // Route them to static preview files, never to a live application API.
  const sharedAsset=/^\/assets\/(?:institute|cinematic|cinematic-v136|community-portals|levels|default-thumbnails)\//.test(url.pathname);
  if(!url.pathname.startsWith(PREFIX+"/")&&!sharedAsset)return error(404,"Review route unavailable");
  const relative=sharedAsset?url.pathname:url.pathname.slice(PREFIX.length);
  if(relative.includes("..")||relative.includes("\\")||relative.includes("%"))
    return error(400,"Invalid asset path");
  if(relative.startsWith("/api/")){
    if(relative.startsWith("/api/v1/member/")||relative.startsWith("/api/v1/auth/"))
      return error(403,"Sign-in is unavailable in this visual review");
    if(!ALLOWED_PUBLIC.test(relative))return error(404,"API not available in visual review");
    const upstream=new URL("https://anevum.com"+relative);
    upstream.search=url.search;
    // Only a public, anonymous, cross-account read of a previously approved
    // directory. Never forward cookies, Authorization, origin or private headers.
    try{
      const res=await fetch(upstream.href,{
        method:request.method,redirect:"manual",credentials:"omit",
        headers:{"Accept":"application/json"},signal:AbortSignal.timeout(12000)
      });
      if(res.status!==200||!res.headers.get("content-type")?.includes("application/json"))
        return error(503,"Approved public catalogue currently unavailable");
      const body=request.method==="HEAD"?null:await res.text();
      if(body&&body.length>1024*1024)return error(503,"Catalogue response exceeded preview limit");
      return new Response(body,{status:200,headers:{...SAFE_HEADERS,"cache-control":"private, no-store",
        "content-type":"application/json; charset=utf-8",
        "x-anevum-review-data":"anonymous-approved-public-catalogue"}});
    }catch{return error(503,"Approved public catalogue currently unavailable")}
  }
  const target=new URL(url);
  target.pathname=relative||"/";
  const assetHeaders=new Headers({'accept':request.headers.get('accept')||'*/*'});
  // Native iOS/console video seeking requires byte ranges, never cookies/auth.
  for(const key of ['range','if-range'])if(request.headers.has(key))assetHeaders.set(key,request.headers.get(key));
  const clean=new Request(target.href,{method:request.method,headers:assetHeaders});
  const asset=await env.ASSETS.fetch(clean);
  if(asset.status!==200)return safeResponse(asset,{nocache:true});
  const html=asset.headers.get("content-type")?.includes("text/html");
  if(!html)return safeResponse(asset);
  if(request.method==="HEAD")return safeResponse(asset,{html:true,bodyOverride:null});
  let page=await asset.text();
  if(!page.includes('id="root"'))return error(500,"Unexpected frontend artifact");
  page=page.replace("</head>",BANNER_CSS+"</head>").replace("<body>","<body>"+BANNER);
  return safeResponse(asset,{html:true,bodyOverride:page});
 }
};
