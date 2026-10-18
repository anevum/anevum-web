import {renderStaffOperations} from "./staff-project-ui-v080.mjs";
import {staffInventory,staffOwnerAction,staffReviewAction} from "./staff-project-control-v080.mjs";
const ROOT="https://anevum.com";
const SAFE={"cache-control":"private,no-store","x-content-type-options":"nosniff","x-frame-options":"DENY","referrer-policy":"no-referrer","x-robots-tag":"noindex,nofollow,noarchive","vary":"Cookie","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; frame-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...SAFE,"content-type":"application/json; charset=utf-8"}});
const error=(status,message)=>reply({error:message},status);
async function session(req,env){
 const cookie=req.headers.get("cookie");
 if(!cookie||cookie.length>8192||!env.AUTH)return null;
 const headers=new Headers({cookie,accept:"application/json"});
 const agent=req.headers.get("user-agent");if(agent)headers.set("user-agent",agent);
 const result=await env.AUTH.fetch(new Request(ROOT+"/api/v1/member/auth/get-session",{headers,method:"GET",redirect:"manual",cache:"no-store"}));
 if(!result.ok)return null;
 const x=await result.json().catch(()=>null);
 if(x?.user?.emailVerified!==true||typeof x?.user?.id!=="string"||x.session?.userId!==x.user.id||typeof x.session?.expiresAt!=="string"||Date.parse(x.session.expiresAt)<=Date.now())return null;
 return x.user.id;
}
async function grant(db,id){
 const result=await db.prepare("SELECT role FROM staff_access_grants WHERE member_id=? AND revoked_at IS NULL AND role IN ('owner','reviewer') LIMIT 1").bind(id).first();
 return result?.role||null;
}
function mutationAllowed(req){
 const url=new URL(req.url);
 const origin=req.headers.get("origin"),site=req.headers.get("sec-fetch-site");
 return url.protocol==="https:"&&url.hostname==="anevum.com"&&origin===ROOT&&
 req.headers.get("x-anevum-staff")==="1"&&site!=="cross-site"&&site!=="same-site"&&
 (req.headers.get("content-type")||"").toLowerCase().startsWith("application/json");
}
export default {
 async fetch(req,env){
  const url=new URL(req.url);
  if(url.hostname!=="anevum.com"||!["/staff/projects","/staff/projects/","/staff/projects/api/manage","/staff/projects/api/review"].includes(url.pathname))
   return error(404,"Not found");
  if(!env.DB||!env.AUTH)return error(503,"Staff workspace unavailable");
  if((url.pathname==="/staff/projects/api/manage"||url.pathname==="/staff/projects/api/review")&&req.method!=="POST")return error(405,"Method not allowed");
  if(!["/staff/projects/api/manage","/staff/projects/api/review"].includes(url.pathname)&&!["GET","HEAD"].includes(req.method))return error(405,"Method not allowed");
  // Cloudflare Access must be enforced by the Access application on /staff*.
  // The session and D1 grant are a second, independent authorization boundary.
  let id,role;
  try{id=await session(req,env);if(!id)return error(401,"Verified member sign-in required");role=await grant(env.DB,id);if(!role)return error(403,"Staff clearance required");}
  catch{return error(503,"Staff identity unavailable")}
  if(["/staff/projects/api/manage","/staff/projects/api/review"].includes(url.pathname)){
   if(!mutationAllowed(req))return error(403,"Same-origin staff action required");
   if(url.pathname.endsWith("/manage")&&role!=="owner")return error(403,"Owner clearance required");
   if(Number(req.headers.get("content-length")||0)>4096)return error(413,"Request too large");
   let body;try{const data=await req.text();if(data.length>4096)return error(413,"Request too large");body=JSON.parse(data);}
   catch{return error(400,"Invalid action request")}
   try{const result=url.pathname.endsWith("/review")?await staffReviewAction(env,id,role,body):await staffOwnerAction(env,id,role,body);return reply(result.body,result.status)}
   catch{return error(503,"Project action temporarily unavailable")}
  }
  try{
   const state=await staffInventory(env.DB,role);
   const html=renderStaffOperations({...state,role});
   return new Response(req.method==="HEAD"?null:html,{status:200,headers:{...SAFE,"content-type":"text/html; charset=utf-8"}});
  }catch{return error(503,"Staff project inventory unavailable")}
 }
};