/**
 * ANEVUM.WEB.BUILD.2026-10-19.005.CANONICAL-PACKAGE-NAMESPACE
 *
 * Pure route interceptor for the existing unified creation route owner.
 * It is NOT a replacement upload Worker, a second identity issuer or a
 * browser-to-workers.dev proxy. The original route owner must invoke this
 * before its old /upload /play code and preserve all unmatched requests.
 *
 * To activate, a separately reviewed deployment must provide the
 * PACKAGE_CONTROL Cloudflare service binding (exact V008 controller),
 * PACKAGE_CANONICAL_BRIDGE_ENABLED="true" and the independently tested
 * PACKAGE_IDENTITY_BRIDGE_VERIFIED="true" guard. Both guards default OFF.
 *
 * A separately opted-in GET /upload/v3/preflight checks the existing
 * controller's canonical session without activating this namespace. Only
 * PACKAGE_IDENTITY_PREFLIGHT_ENABLED="true" enables that read-only check;
 * it grants no upload, preview, gallery, review or publication capability.
 *
 * The entire executable publishing surface is nested beneath /upload/v3,
 * which is already owned by anevum.com/upload*; no new production routes
 * or overlapping /api/v1/* registrations are needed.
 */
export const PACKAGE_NAMESPACE="/upload/v3";
const ORIGIN="https://anevum.com";
const UUID="[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const PLAY=new RegExp("^/upload/v3/play/("+UUID+")/?$");
const API=/^\/upload\/v3\/api\/v1\/packages\/[a-z0-9/_-]{1,220}$/;
const ENDPOINTS=new Map([
  ["/upload/v3","/upload/v3"],
  ["/upload/v3/","/upload/v3"],
  ["/upload/v3/library","/packages"],
  ["/upload/v3/help","/help/packages"],
  ["/upload/v3/review","/staff/packages"]
]);
const SAFE_GET=new Set(["GET"]);
const SAFE_API=new Set(["GET","POST"]);
const PREFLIGHT=PACKAGE_NAMESPACE+"/preflight";
function unavailable(status=404){
  return new Response(status===503?"Creator Uplink is temporarily unavailable.":"Not found",{
    status,headers:{"cache-control":"no-store","content-type":"text/plain; charset=utf-8",
      "x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex"}
  });
}
/** Return null only for unrelated existing routes. For all namespace routes,
 * disabled/missing infrastructure is a real refusal, never a legacy fallback.
 */
export function packageBridgeRoute(url,method){
  if(url.origin!==ORIGIN||url.username||url.password||url.protocol!=="https:"||
      (url.port&&url.port!=="443"))return null;
  if(url.pathname!==PACKAGE_NAMESPACE&&!url.pathname.startsWith(PACKAGE_NAMESPACE+"/"))return null;
  if(url.pathname.includes("%")||url.pathname.includes("\\")||
      url.pathname.length>300||url.search.length>700)return {denied:404};
  if(url.pathname===PREFLIGHT)return method==="GET"&&!url.search?
    {preflight:true}:{denied:method==="GET"?404:405};
  const canonical=ENDPOINTS.get(url.pathname);
  if(canonical)return SAFE_GET.has(method)?{target:canonical}:{denied:405};
  const play=url.pathname.match(PLAY);
  if(play)return SAFE_GET.has(method)?{target:"/play/v3/"+play[1]}:{denied:405};
  if(API.test(url.pathname)){
    const target=url.pathname.slice(PACKAGE_NAMESPACE.length);
    return SAFE_API.has(method)?{target}:{denied:405};
  }
  return {denied:404};
}
function htmlCanonicalLinks(body){
  return body
    .replaceAll("/api/v1/packages/","/upload/v3/api/v1/packages/")
    .replaceAll("/play/v3/","/upload/v3/play/")
    .replaceAll('href="/help/packages"','href="/upload/v3/help"')
    .replaceAll('href="/packages"','href="/upload/v3/library"')
    .replaceAll('href="/staff/packages"','href="/upload/v3/review"');
}
function mapProject(p){
  if(!p||typeof p!=="object"||Array.isArray(p))return p;
  const result={...p};
  if(typeof p.cover_url==="string"&&
      /^\/api\/v1\/packages\/covers\/[0-9a-f-]{36}$/.test(p.cover_url))
    result.cover_url=PACKAGE_NAMESPACE+p.cover_url;
  if(typeof p.play_url==="string"&&
      /^\/play\/v3\/[0-9a-f-]{36}(?:\?preview=1)?$/.test(p.play_url))
    result.play_url=p.play_url.replace("/play/v3/",PACKAGE_NAMESPACE+"/play/");
  return result;
}
function mappedProjectData(data){
  if(!data||typeof data!=="object"||Array.isArray(data))return null;
  if(Array.isArray(data.projects))return {...data,projects:data.projects.map(mapProject)};
  if(typeof data.play_url==="string")return mapProject(data);
  return null;
}
function responseHeaders(headers){
  const h=new Headers(headers);
  for(const name of ["set-cookie","access-control-allow-origin","access-control-allow-credentials",
    "content-length","content-encoding","etag","last-modified","location","transfer-encoding"])
    h.delete(name);
  h.set("cache-control","private,no-store");
  h.set("vary","Cookie");
  h.set("x-content-type-options","nosniff");
  h.set("referrer-policy","no-referrer");
  h.set("x-robots-tag","noindex");
  h.set("x-anevum-package-namespace","canonical-v009");
  return h;
}
async function identityPreflight(request,env){
  if(env?.PACKAGE_IDENTITY_PREFLIGHT_ENABLED!=="true")return unavailable(404);
  const origin=request.headers.get("origin"),site=request.headers.get("sec-fetch-site");
  if((origin!==null&&origin!==ORIGIN)||(site!==null&&!["same-origin","none"].includes(site)))
    return unavailable(403);
  const cookie=request.headers.get("cookie");
  if(!cookie)return unavailable(401);
  if(typeof env?.PACKAGE_CONTROL?.fetch!=="function")return unavailable(503);
  // This existing endpoint performs only canonical AUTH session resolution and
  // PILOT_IDS / STAFF_IDS membership checks. Never forward caller identity,
  // Authorization, path/query overrides or executable-runtime credentials.
  const headers=new Headers({cookie,accept:"application/json"});
  if(request.headers.has("user-agent"))headers.set("user-agent",request.headers.get("user-agent"));
  let session;
  try{
    const reply=await env.PACKAGE_CONTROL.fetch(new Request(ORIGIN+"/api/v1/packages/me",{
      method:"GET",headers,redirect:"manual"
    }));
    if(!(reply instanceof Response)||reply.status!==200||
        !reply.headers.get("content-type")?.toLowerCase().includes("application/json"))
      return unavailable(503);
    const body=await reply.text();
    if(body.length>16384)return unavailable(503);
    session=JSON.parse(body);
  }catch{return unavailable(503);}
  if(!session||typeof session.authenticated!=="boolean"||
      typeof session.pilot!=="boolean"||typeof session.reviewer!=="boolean")
    return unavailable(503);
  if(!session.authenticated)return unavailable(401);
  if(!session.pilot&&!session.reviewer)return unavailable(403);
  // Return only the session's existing capabilities. This is evidence for a
  // future review, never a self-approval or a mutation of either release guard.
  const h=responseHeaders();
  h.set("content-type","application/json; charset=utf-8");
  return new Response(JSON.stringify({
    contract:"canonical-session-preflight-v001",readOnly:true,
    authenticated:true,pilot:session.pilot,reviewer:session.reviewer,
    bridgeEnabled:env.PACKAGE_CANONICAL_BRIDGE_ENABLED==="true",
    identityBridgeVerified:env.PACKAGE_IDENTITY_BRIDGE_VERIFIED==="true"
  }),{status:200,headers:h});
}
/** Service-bound proxy only. Caller provides the canonical request and
 * existing route owner env; this function never reads secrets or grants roles.
 */
export async function interceptPackageNamespace(request,env){
  const url=new URL(request.url),route=packageBridgeRoute(url,request.method);
  if(route===null)return null;
  if(route.denied)return unavailable(route.denied===405?405:404);
  if(route.preflight)return identityPreflight(request,env);
  if(env?.PACKAGE_CANONICAL_BRIDGE_ENABLED!=="true")return unavailable(404);
  if(env?.PACKAGE_IDENTITY_BRIDGE_VERIFIED!=="true"||typeof env?.PACKAGE_CONTROL?.fetch!=="function")
    return unavailable(503);
  // Native UI uses the same deployed namespace API, never a new route owner.
  // The explicit flag is OFF until the matching React build and backend pass.
  if(request.method==="GET"&&env.PACKAGE_NATIVE_STUDIO_ENABLED==="true"&&!route.target.startsWith("/api/")){
    let destination=null;
    if(route.target==="/upload/v3"){
      const update=url.searchParams.get("update");
      destination=update&&new RegExp("^"+UUID+"$").test(update)?"/studio/packages/"+update:"/studio/packages/new";
    }else if(route.target==="/packages")destination="/studio/packages";
    else if(route.target==="/staff/packages")destination="/studio/packages/review";
    else if(route.target.startsWith("/play/v3/"))destination="/projects/package/"+route.target.slice("/play/v3/".length)+(url.searchParams.get("preview")==="1"?"?preview=1":"");
    if(destination){const headers=responseHeaders();headers.set("location",destination);return new Response(null,{status:302,headers});}
  }
  if(request.method==="POST"){
    const origin=request.headers.get("origin"),site=request.headers.get("sec-fetch-site");
    if(origin!==ORIGIN||(site!==null&&!["same-origin","none"].includes(site)))
      return unavailable(403);
  }
  // Keep canonical cookies only inside a Cloudflare service binding.
  // The separately hosted execution runtime NEVER receives them.
  const forward=new URL(ORIGIN+route.target+url.search);
  const headers=new Headers(request.headers);
  for(const key of ["authorization","x-anevum-member-id","x-anevum-owner-id",
    "x-anevum-staff-id","x-anevum-verified-user","x-anevum-identity"])headers.delete(key);
  let reply;
  try{
    const backend=new Request(forward,{method:request.method,headers,
      body:request.method==="POST"?request.body:undefined,duplex:request.method==="POST"?"half":undefined,
      redirect:"manual"});
    reply=await env.PACKAGE_CONTROL.fetch(backend);
  }catch{return unavailable(503);}
  if(!(reply instanceof Response))return unavailable(503);
  // No redirects out of the canonical namespace (or to stage workers.dev).
  if(reply.status>=300&&reply.status<400)return unavailable(503);
  const h=responseHeaders(reply.headers);
  const type=(reply.headers.get("content-type")||"").toLowerCase();
  if(request.method==="GET"&&reply.status===200&&type.includes("text/html")){
    const raw=await reply.text();
    if(raw.length>2*1048576)return unavailable(503);
    const content=htmlCanonicalLinks(raw);
    h.set("content-type","text/html; charset=utf-8");
    return new Response(content,{status:reply.status,headers:h});
  }
  // Rewrite only vetted package-generated relative media/player links. This
  // includes owner library, public creator gallery and successful new uploads.
  const projectData=route.target==="/api/v1/packages/projects"||
    route.target==="/api/v1/packages/mine"||
    /^\/api\/v1\/packages\/creators\/[a-z][a-z0-9_]{2,29}\/projects$/.test(route.target)||
    (request.method==="POST"&&route.target==="/api/v1/packages/upload");
  if(projectData&&reply.status>=200&&reply.status<300&&type.includes("application/json")){
    try{
      const raw=await reply.text();
      if(raw.length>256*1024)return unavailable(503);
      const data=mappedProjectData(JSON.parse(raw));
      if(!data)return unavailable(503);
      h.set("content-type","application/json; charset=utf-8");
      return new Response(JSON.stringify(data),{status:reply.status,headers:h});
    }catch{return unavailable(503);}
  }
  return new Response(reply.body,{status:reply.status,statusText:reply.statusText,headers:h});
}
