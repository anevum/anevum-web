import { SCRIPT, STYLE } from "./ui.mjs";

const ORIGIN = "https://anevum.com";
const SCRIPT_PATH = "/__anevum_profile_staff_access_v001.js";
const ROLE_PATH = "/api/v1/member/staff-access";
const APP_PATH = /^\/(?:$|member(?:\/|$)|account(?:\/|$)|discover(?:\/|$)|community(?:\/|$)|creators(?:\/|$)|join(?:\/|$)|studio(?:\/|$)|create(?:\/|$)|library(?:\/|$)|saved(?:\/|$)|start(?:\/|$)|guide(?:\/|$)|boards(?:\/|$)|status(?:\/|$)|levels(?:\/|$)|recognition(?:\/|$)|support(?:\/|$)|settings(?:\/|$))/;
const ROLES = new Set(["owner", "reviewer"]);
const PRIVATE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "private, no-store",
  "vary": "Cookie",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
  "access-control-allow-origin": ""
};
function reply(data,status=200) {
  const headers = {...PRIVATE_HEADERS};
  delete headers["access-control-allow-origin"];
  return Response.json(data,{status,headers});
}
function failure(status,message) { return reply({role:null,error:message},status); }

async function roleFor(request,env) {
  if (request.method !== "GET" && request.method !== "HEAD") return failure(405,"Method not allowed");
  const cookie = request.headers.get("cookie");
  if (!cookie || cookie.length>8192) return failure(401,"Verified member sign-in required");
  if (!env?.APEX_AUTH?.fetch || !env?.MEMBER_DB?.prepare) return failure(503,"Staff access check unavailable");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin","none"].includes(fetchSite)) return failure(403,"Cross-origin access refused");
  if (request.headers.get("origin") && request.headers.get("origin") !== ORIGIN) return failure(403,"Cross-origin access refused");
  try {
    const authRequest = new Request(ORIGIN + "/api/v1/member/auth/get-session",{
      method:"GET",headers:{cookie,accept:"application/json"},cache:"no-store",redirect:"error"
    });
    const response=await env.APEX_AUTH.fetch(authRequest);
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json"))
      return failure(401,"Verified member sign-in required");
    const data=await response.json();
    const session=data?.session,user=data?.user;
    if (!session || !user || typeof session.id!=="string" || !session.id ||
        typeof session.expiresAt!=="string" || !Number.isFinite(Date.parse(session.expiresAt)) ||
        Date.parse(session.expiresAt)<=Date.now() ||
        typeof user.id!=="string" || !user.id || user.id.length>128 ||
        session.userId!==user.id || user.emailVerified!==true)
      return failure(401,"Verified member sign-in required");

    // The database role grant decides access. Email is consulted for cosmetic founder labeling only.
    const grant=await env.MEMBER_DB.prepare(
      "SELECT g.role,u.email FROM staff_access_grants g JOIN \"user\" u ON u.id=g.member_id " +
      "WHERE g.member_id=? AND g.revoked_at IS NULL AND u.emailVerified=1 LIMIT 1"
    ).bind(user.id).first();
    const role=ROLES.has(grant?.role)?grant.role:null;
    const designation=role==="owner" && String(grant.email||"").toLowerCase()==="devon@anevum.com"
      ? "founder" : null;
    return reply({role,designation});
  } catch {
    return failure(503,"Staff access check unavailable");
  }
}

export default {
  async fetch(request,env) {
    let url;
    try { url=new URL(request.url); }
    catch { return new Response("Not found",{status:404}); }
    if (url.origin!==ORIGIN || url.protocol!=="https:" || url.username || url.password)
      return new Response("Not found",{status:404});

    if (url.pathname==="/__anevum_staff_access_binding_probe") {
      if (request.method!=="GET") return new Response("Method not allowed",{status:405});
      return Response.json({
        upstream:typeof env?.UPSTREAM?.fetch==="function",
        authentication:typeof env?.APEX_AUTH?.fetch==="function",
        database:typeof env?.MEMBER_DB?.prepare==="function"
      },{headers:{"cache-control":"no-store","x-robots-tag":"noindex"}});
    }
    if (url.pathname===ROLE_PATH) {
      if (url.search) return failure(400,"Unexpected query");
      const answer=await roleFor(request,env);
      if(request.method==="HEAD")return new Response(null,{status:answer.status,headers:answer.headers});
      return answer;
    }
    if (url.pathname===SCRIPT_PATH) {
      if (request.method!=="GET" && request.method!=="HEAD")
        return new Response("Method not allowed",{status:405});
      if (url.search) return new Response("Not found",{status:404});
      return new Response(request.method==="HEAD"?null:SCRIPT,{headers:{
        "content-type":"application/javascript; charset=utf-8",
        "cache-control":"public, max-age=300",
        "x-content-type-options":"nosniff",
        "x-robots-tag":"noindex"
      }});
    }
    if (!env?.UPSTREAM?.fetch) return new Response("Upstream unavailable",{status:503});
    const response=await env.UPSTREAM.fetch(request);

    // Preserve all other traffic, existing frame policy, project uploads and other Workers.
    if (request.method!=="GET" || !APP_PATH.test(url.pathname) ||
        response.status!==200 ||
        !response.headers.get("content-type")?.includes("text/html"))
      return response;

    const headers=new Headers(response.headers);
    for(const key of ["content-length","content-encoding","etag","last-modified"]) headers.delete(key);
    headers.set("x-anevum-staff-profile-link","v001");
    // Do not alter existing CSP; both injected assets are same-origin.
    const rewritten=new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    return new HTMLRewriter()
      .on("head",{element(element){
        element.append("<style data-anevum-staff-access>"+STYLE+"</style>",{html:true});
        element.append('<script defer src="'+SCRIPT_PATH+'"></script>',{html:true});
      }}).transform(rewritten);
  }
};
