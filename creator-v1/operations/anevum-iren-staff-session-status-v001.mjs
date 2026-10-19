/* ANEVUM IREN — redacted browser session diagnostic v001.
   No credentials, user IDs, session tokens, or response bodies are returned. */
const ORIGIN="https://anevum.com", ROUTE="/__anevum_iren_staff_session_status_v001";
const H={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","vary":"Cookie","x-robots-tag":"noindex, nofollow, noarchive","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const respond=value=>new Response(JSON.stringify(value),{status:200,headers:H});
const canonicalCookie=/(?:^|;\s*)(?:__Secure-|__Host-)?anevum_can_apex\.session_token=/i;
const currentExpiry=value=>{const n=typeof value==="number"?(value>1e12?value:value*1000):typeof value==="string"?Date.parse(value):NaN;return Number.isFinite(n)&&n>Date.now()};
export default {async fetch(req,env) {
 let url;try{url=new URL(req.url)}catch{return new Response("Not found",{status:404})}
 if(url.origin!==ORIGIN||url.pathname!==ROUTE||url.search||req.method!=="GET")return new Response("Not found",{status:404});
 const cookie=req.headers.get("cookie")||"";
 const out={endpoint:"IREN STAFF SESSION STATUS",apexCookiePresent:cookie.length<=8192&&canonicalCookie.test(cookie),canonicalSession:"not_checked",staffGrant:"not_checked",staffApi:"not_checked"};
 if(!out.apexCookiePresent)return respond({...out,canonicalSession:"not_signed_in"});
 if(!env.AUTH?.fetch||!env.STAFF?.fetch||!env.DB?.prepare)return respond({...out,canonicalSession:"binding_unavailable"});
 let auth;
 try{auth=await env.AUTH.fetch(new Request(ORIGIN+"/api/v1/member/auth/get-session",{method:"GET",headers:{cookie,accept:"application/json"},redirect:"manual",cache:"no-store"}));}
 catch{return respond({...out,canonicalSession:"identity_service_error"})}
 out.identityHttp=auth.status;
 if(!auth.ok||!auth.headers.get("content-type")?.includes("application/json"))return respond({...out,canonicalSession:"identity_rejected"});
 let data;try{data=await auth.json()}catch{return respond({...out,canonicalSession:"identity_invalid_json"})}
 const user=data?.user,session=data?.session;
 out.sessionExpiryType=typeof session?.expiresAt;
 if(!user||!session||typeof user.id!=="string"||!user.id||user.id.length>128||session.userId!==user.id||user.emailVerified!==true||!currentExpiry(session.expiresAt))
   return respond({...out,canonicalSession:"no_valid_verified_session"});
 out.canonicalSession="verified";
 try{
   const grant=await env.DB.prepare('SELECT g.role FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id WHERE g.member_id=? AND g.revoked_at IS NULL AND u.emailVerified=1 LIMIT 1').bind(user.id).first();
   out.staffGrant=grant?.role==="owner"?"owner":grant?.role==="reviewer"?"reviewer":"no_active_grant";
 }catch {out.staffGrant="lookup_unavailable"}
 try{
   const response=await env.STAFF.fetch(new Request(ORIGIN+"/api/v1/member/staff-ops?room=operations",{method:"GET",headers:{cookie,accept:"application/json"},redirect:"manual",cache:"no-store"}));
   out.staffApi="http_"+response.status;
   await response.body?.cancel();
 }catch{out.staffApi="request_failed"}
 return respond(out);
}};
