/**
 * ANEVUM.IREN.PATCH.2026-10-19.001.STAFF-SESSION-ROUTING
 * Verified staff entry only, on exact /staff and /staff/ routes.
 * Existing staff APIs, reviewer routes, Observatory auth and member D1 untouched.
 */
const SITE="https://anevum.com";
const AUTH=SITE+"/api/v1/member/auth/get-session";
const COOKIE_PATTERN=/(?:^|;\s*)(?:__Secure-|__Host-)?anevum_can_apex\.session_token=/i;
const HEAD={
 "cache-control":"private, no-store",
 "x-robots-tag":"noindex, nofollow, noarchive",
 "referrer-policy":"no-referrer",
 "x-frame-options":"DENY",
 "x-content-type-options":"nosniff",
 "vary":"Cookie",
 "x-anevum-staff-entry":"v003"
};
const CSP="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
function html(status,title,detail,canSignIn=true){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const actions=(canSignIn?'<a class="primary" href="/join">Sign in to ANEVUM →</a>':"")+'<a href="/staff/observatory">Open Observatory ↗</a><a href="/staff?view=command">Command operations ↗</a><a href="/staff/projects">Project reviews ↗</a><a href="/staff/access-check">Check session status ↗</a>';
 const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#08121e"><title>IREN — Staff Access · ANEVUM</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{min-height:100dvh;display:flex;flex-direction:column;margin:0;background:radial-gradient(ellipse at 50% 40%,#1d3447,#070e1b 65%);color:#edf2f8;font:14px/1.6 system-ui,-apple-system,sans-serif}a{color:#f1e4c8;text-decoration:none}.bar{padding:18px clamp(15px,4vw,42px);border-bottom:1px solid #a28f743c;display:flex;align-items:center;justify-content:space-between;gap:10px}.brand{font:500 18px Georgia,serif;letter-spacing:.13em}.bar a{font-size:12px}.center{flex:1;display:grid;place-items:center;padding:22px}.box{padding:clamp(23px,5vw,44px);max-width:610px;width:100%;border:1px solid #60718a6b;border-radius:16px;background:linear-gradient(145deg,#122638e8,#0b1727ed);box-shadow:0 25px 60px #0007}.eyebrow{color:#ddc297;font:600 10px ui-monospace,monospace;letter-spacing:.18em}.orb{font:44px Georgia,serif;color:#e6ca9c;margin:14px 0}.box h1{font:400 clamp(26px,4vw,37px) Georgia,serif;margin:0 0 16px}.box p{color:#aebfd2;margin:0}.links{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 0}.links a{border:1px solid #947b55;border-radius:8px;padding:10px 14px;font-size:12px}.links .primary{background:#665037;color:#fff0d2}.links a:hover{background:#2a3b4e}.links a:focus-visible{outline:2px solid #edcd91;outline-offset:2px}.note{font:11px/1.6 ui-monospace,monospace;color:#8fa3b8;border-top:1px solid #ffffff1f;padding-top:15px;margin-top:25px}footer{padding:12px 20px;border-top:1px solid #fff1;color:#7e93ab;font:10px ui-monospace,monospace}</style></head>
<body><header class="bar"><div class="brand">◇ IREN COMMAND</div><a href="/member">MY SPACE ↗</a></header><main class="center"><article class="box"><div class="eyebrow">ANEVUM / CONTINUANCE INSTITUTE / STAFF ACCESS</div><div class="orb" aria-hidden="true">◇</div><h1>${escape(title)}</h1><p>${escape(detail)}</p><nav class="links" aria-label="Available destinations">${actions}</nav><div class="note">Access requires a verified ANEVUM sign-in in this browser and a current staff grant. No permission is inferred from the displayed founder title.</div></article></main><footer>ANEVUM / IREN · CONTINUANCE OPERATIONS</footer></body></html>`;
 return new Response(page,{status,headers:{...HEAD,"content-type":"text/html; charset=utf-8","content-security-policy":CSP}});
}
function expiration(s){
 if(typeof s==="string")return Date.parse(s);
 if(typeof s==="number"&&Number.isFinite(s))return s>1e12?s:s*1000;
 return NaN;
}
export async function resolveAccess(request,env){
 const cookie=request.headers.get("cookie");
 if(!cookie||cookie.length>8192||!COOKIE_PATTERN.test(cookie))return {status:"signed_out",reason:"no_apex_session_cookie"};
 if(!env?.APEX_AUTH?.fetch||!env?.MEMBER_DB?.prepare)return {status:"unavailable",reason:"missing_service_binding"};
 let response;
 try{response=await env.APEX_AUTH.fetch(new Request(AUTH,{method:"GET",headers:{cookie,accept:"application/json"},redirect:"error",cache:"no-store"}));}
 catch{return {status:"unavailable",reason:"identity_request_failed"};}
 if(response.status===429||response.status>=500)return {status:"unavailable",reason:"identity_service_unavailable"};
 if(!response.ok||!response.headers.get("content-type")?.includes("application/json"))return {status:"invalid_session",reason:"identity_response_rejected"};
 let data;
 try{data=await response.json()}catch{return {status:"invalid_session",reason:"identity_response_invalid"};}
 const user=data?.user,session=data?.session;
 if(!session||typeof session.id!=="string"||!session.id||typeof user?.id!=="string"||!user.id||user.id.length>128||
 session.userId!==user.id||user.emailVerified!==true||!Number.isFinite(expiration(session.expiresAt))||expiration(session.expiresAt)<=Date.now())return {status:"invalid_session",reason:"identity_session_invalid",expiryType:typeof session?.expiresAt};
 try{
 const grant=await env.MEMBER_DB.prepare('SELECT g.role FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id WHERE g.member_id=? AND g.revoked_at IS NULL AND u.emailVerified=1 LIMIT 1').bind(user.id).first();
 if(!grant||!["owner","reviewer"].includes(grant.role))return {status:"not_staff",reason:"no_active_staff_grant"};
 return {status:"verified",role:grant.role,reason:"session_and_grant_valid"};
 }catch{return {status:"unavailable",reason:"staff_grant_query_failed"};}
}
export default {async fetch(request,env){
 let url;try{url=new URL(request.url)}catch{return new Response("Not found",{status:404});}
 if(url.origin!==SITE)return new Response("Not found",{status:404});
 if(url.pathname.startsWith("/staff/assets/")){
  if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405,headers:HEAD});
  if(!env?.COMMAND?.fetch)return new Response("Staff assets unavailable",{status:503,headers:HEAD});
  return env.COMMAND.fetch(request);
 }
 if(!["/staff","/staff/"].includes(url.pathname))return new Response("Not found",{status:404});
 if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405,headers:HEAD});
 const access=await resolveAccess(request,env);
 if(url.search==="?diagnose=1"){
  const body={access:access.status,reason:access.reason||access.status,role:access.status==="verified"?access.role:null,expiryType:access.expiryType||null,expectedCookiePresent:COOKIE_PATTERN.test(request.headers.get("cookie")||"")};
  const diag=new Response(JSON.stringify(body),{status:200,headers:{...HEAD,"content-type":"application/json; charset=utf-8"}});
  return request.method==="HEAD"?new Response(null,{status:diag.status,headers:diag.headers}):diag;
 }
 if(url.search&&url.search!=="?view=command")return new Response("Not found",{status:404,headers:HEAD});
 if(access.status==="verified"){
  if(url.search==="?view=command"){
    if(!env.COMMAND?.fetch)return html(503,"Command temporarily unavailable.","The staff command application could not be loaded. Use the Observatory to continue.");
    try {return await env.COMMAND.fetch(new Request(SITE+"/staff",{method:request.method,headers:request.headers,redirect:"manual"}));}
    catch{return html(503,"Command temporarily unavailable.","The staff command application could not be loaded. Use the Observatory to continue.");}
  }
  return new Response(null,{status:302,headers:{...HEAD,location:"/staff/observatory"}});
 }
 const p=access.status==="signed_out"?html(401,"Sign in to continue.","This browser is not signed in to the ANEVUM member account. Sign in, then use Founder Console from My Space."):
 access.status==="invalid_session"?html(401,"Sign in again to continue.","The browser did not provide a current verified ANEVUM session. Your owner role has not been changed."):
 access.status==="not_staff"?html(403,"Staff permission required.","The currently signed-in member does not have an active staff role. Use an authorized account.",false):
 html(503,"Staff identity temporarily unavailable.","The identity service could not complete this verification. Please retry; your account and permissions are unchanged.");
 return request.method==="HEAD"?new Response(null,{status:p.status,headers:p.headers}):p;
}};
