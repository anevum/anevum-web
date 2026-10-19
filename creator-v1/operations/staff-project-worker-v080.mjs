import {renderStaffOperations} from "./staff-project-ui-v080.mjs";
import {staffInventory,staffOwnerAction,staffReviewAction} from "./staff-project-control-v080.mjs";
const ROOT="https://anevum.com";
const SAFE={"cache-control":"private,no-store","x-content-type-options":"nosniff","x-frame-options":"DENY","referrer-policy":"no-referrer","x-robots-tag":"noindex,nofollow,noarchive","vary":"Cookie","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; frame-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...SAFE,"content-type":"application/json; charset=utf-8"}});
const error=(status,message)=>reply({error:message},status);

const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function classifyFailure(err,source){
 const message=String(err?.message||err||"");
 if(/(?:\b7500\b|daily row read limit|daily row write limit|free tier.*row|quota.*d1)/i.test(message))
  return {code:"STAFF_D1_DAILY_LIMIT",title:"Staff database limit reached",description:"Cloudflare's daily D1 allowance has been reached. Project changes are disabled until database access recovers, normally after the midnight UTC reset."};
 if(source==="auth")
  return {code:"STAFF_AUTH_UPSTREAM_UNAVAILABLE",title:"Sign-in service temporarily unavailable",description:"ANEVUM cannot verify the current member session. Your account and permissions have not been changed."};
 return {code:"STAFF_DATABASE_UNAVAILABLE",title:"Staff database temporarily unavailable",description:"ANEVUM cannot safely verify staff permissions or read project records right now. No project changes were made."};
}
function showFailure(req,status,code,title,description){
 const isApi=new URL(req.url).pathname.includes("/api/");
 if(isApi)return reply({error:title,code},status);
 const retry=status===401?"/join":"/staff/projects",label=status===401?"Sign in to ANEVUM":"Retry staff workspace";
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+escapeHtml(title)+' · ANEVUM Staff</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:radial-gradient(ellipse at 75% 0%,#263149 0%,#080e19 55%);color:#f2f0f6;font:15px/1.6 system-ui,-apple-system,sans-serif}.wrap{max-width:560px;margin:24px;padding:30px;border-radius:18px;background:#101c2ddf;border:1px solid #394e65;box-shadow:0 20px 60px #0006}.mark{font:600 12px ui-monospace,monospace;letter-spacing:.15em;color:#e1bf92}h1{line-height:1.15;font-size:clamp(24px,6vw,36px);margin:20px 0 12px}p{color:#bdc8d5}a{display:inline-block;background:#dfbd8c;color:#101725;padding:11px 18px;border-radius:9px;font-weight:700;text-decoration:none;margin-top:12px}.code{font:12px ui-monospace,monospace;color:#a2adc0;margin-top:22px}</style></head><body><main class="wrap"><div class="mark">ANEVUM / CONTINUANCE INSTITUTE · STAFF</div><h1>'+escapeHtml(title)+'</h1><p>'+escapeHtml(description)+'</p><a href="'+retry+'">'+label+'</a><p class="code">'+escapeHtml(code)+'</p></main></body></html>';
 return new Response(req.method==="HEAD"?null:html,{status,headers:{...SAFE,"content-type":"text/html; charset=utf-8"}});
}
function reportFailure(source,err){const {code}=classifyFailure(err,source);console.warn("ANEVUM V080 staff upstream failure:",code);return {code,...classifyFailure(err,source)};}

async function session(req,env){
 const cookie=req.headers.get("cookie");
 if(!cookie||cookie.length>8192||!env.AUTH)return null;
 const headers=new Headers({cookie,accept:"application/json"});
 const agent=req.headers.get("user-agent");if(agent)headers.set("user-agent",agent);
 const result=await env.AUTH.fetch(new Request(ROOT+"/api/v1/member/auth/get-session",{headers,method:"GET",redirect:"manual",cache:"no-store"}));
 if(result.status===401||result.status===403)return null;
 if(!result.ok)throw new Error("AUTH_UPSTREAM_"+result.status);
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
  if(!env.DB||!env.AUTH)return showFailure(req,503,"STAFF_BINDINGS_UNAVAILABLE","Staff workspace temporarily unavailable","ANEVUM cannot verify the staff workspace service configuration. No project changes were made.");
  // Fail closed until an isolated worker has explicitly verified storage binding.
  // No project lifecycle or publication mutation is safe without this binding.
  if(url.pathname.startsWith("/staff/projects/api/")&&!env.MEDIA)return showFailure(req,503,"STAFF_MEDIA_UNAVAILABLE","Staff media temporarily unavailable","Project publication and deletion are disabled until private media storage can be verified.");
  if((url.pathname==="/staff/projects/api/manage"||url.pathname==="/staff/projects/api/review")&&req.method!=="POST")return error(405,"Method not allowed");
  if(!["/staff/projects/api/manage","/staff/projects/api/review"].includes(url.pathname)&&!["GET","HEAD"].includes(req.method))return error(405,"Method not allowed");
  // Cloudflare Access is enforced by the Access application on /staff*.
  // Deployment must additionally verify its audience and worker route are protected.
  // The session and D1 grant are a second, independent authorization boundary.
  let id,role;
  try{id=await session(req,env);}
  catch(err){const reason=reportFailure("auth",err);return showFailure(req,503,reason.code,reason.title,reason.description);}
  if(!id)return showFailure(req,401,"STAFF_SIGNIN_REQUIRED","Verified ANEVUM sign-in required","Sign in with an authorized member account to access the staff workspace.");
  try{role=await grant(env.DB,id);}
  catch(err){const reason=reportFailure("db",err);return showFailure(req,503,reason.code,reason.title,reason.description);}
  if(!role)return showFailure(req,403,"STAFF_CLEARANCE_REQUIRED","Staff clearance required","This account does not have an active Staff Operations grant.");
  if(["/staff/projects/api/manage","/staff/projects/api/review"].includes(url.pathname)){
   if(!mutationAllowed(req))return error(403,"Same-origin staff action required");
   if(url.pathname.endsWith("/manage")&&role!=="owner")return error(403,"Owner clearance required");
   if(Number(req.headers.get("content-length")||0)>4096)return error(413,"Request too large");
   let body;try{const data=await req.text();if(data.length>4096)return error(413,"Request too large");body=JSON.parse(data);}
   catch{return error(400,"Invalid action request")}
   try{const result=url.pathname.endsWith("/review")?await staffReviewAction(env,id,role,body):await staffOwnerAction(env,id,role,body);return reply(result.body,result.status)}
   catch(err){const reason=reportFailure("db",err);return showFailure(req,503,reason.code,reason.title,reason.description);}
  }
  try{
   const state=await staffInventory(env.DB,role);
   const html=renderStaffOperations({...state,role});
   return new Response(req.method==="HEAD"?null:html,{status:200,headers:{...SAFE,"content-type":"text/html; charset=utf-8"}});
  }catch(err){const reason=reportFailure("db",err);return showFailure(req,503,reason.code,reason.title,reason.description);}
 }
};