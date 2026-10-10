// Moderator-only V5 Commons staging review service.
// Requires BOTH a verified Better Auth identity and an independently verified
// Cloudflare Access assertion for the same allowlisted staff email.
// Never trusts a role, member ID, moderator email, or post ID from JSON.
import { socialConfigured, socialSchemaReady } from "./commons-social.mjs";
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reply(value,status=200){
  return Response.json(value,{status,headers:{
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}

export function moderatorAllowed(env,user,origin,accessEmail){
  if(!socialConfigured(env,origin)||user?.emailVerified!==true ||
     typeof user?.email!=="string" || typeof accessEmail!=="string")return false;
  const memberEmail=user.email.trim().toLowerCase();
  const credentialEmail=accessEmail.trim().toLowerCase();
  if(!memberEmail||memberEmail!==credentialEmail)return false;
  const list=String(env?.COMMAND_ACCESS_EMAILS||"").split(",")
    .map(x=>x.trim().toLowerCase()).filter(Boolean);
  // An empty Access allowlist is a hard denial, never a wildcard.
  return list.length>0 && list.includes(memberEmail);
}

function validateDecision(value){
  if(!value || typeof value!=="object" || Array.isArray(value) ||
     Object.keys(value).sort().join(",")!=="decision,reason" ||
     !["HIDE","DISMISS"].includes(value.decision) ||
     typeof value.reason!=="string" ||
     value.reason.trim().length<8 || value.reason.trim().length>500 ||
     /[\u0000-\u001f\u007f]/.test(value.reason))return null;
  return {decision:value.decision,reason:value.reason.trim()};
}

export async function moderationEndpoint(request,env,user,origin,pathname,accessEmail){
  if(!moderatorAllowed(env,user,origin,accessEmail))
    return reply({message:"Moderator authorization required."},403);
  const db=env.MEMBER_DB;
  if(!await socialSchemaReady(db))return reply({message:"Moderator storage unavailable."},503);
  const url=new URL(request.url);
  if(url.origin!==origin || url.search)return reply({message:"Unrecognized moderator request."},400);

  if(pathname==="/api/member/commons/moderation/reports"){
    if(request.method!=="GET")return reply({message:"Method not allowed."},405);
    try{
      const data=await db.prepare(
        "SELECT r.id AS report_id,r.reason,r.created_at,p.id AS post_id,p.title,p.body,p.status "+
        "FROM commons_v5_reports r JOIN commons_v5_posts p ON p.id=r.post_id "+
        "WHERE r.status='PENDING' ORDER BY r.created_at ASC,r.id ASC LIMIT 30"
      ).all();
      return reply({pending:(data.results||[]).map(x=>({
        id:x.report_id,reason:x.reason,createdAt:x.created_at,
        post:{id:x.post_id,title:x.title,body:x.body,status:x.status}
      })),pageCap:30,olderPendingMayExist:(data.results||[]).length===30});
    }catch{return reply({message:"Moderator queue unavailable."},503);}
  }

  const match=pathname.match(
    /^\/api\/member\/commons\/moderation\/reports\/([0-9a-f-]{36})\/resolve$/i);
  if(!match||!ID.test(match[1]))return reply({message:"Moderator endpoint not found."},404);
  if(request.method!=="POST")return reply({message:"Method not allowed."},405);
  let choice;
  try{
    if(request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()!=="application/json")
      return reply({message:"JSON required."},400);
    const raw=await request.text();
    if(raw.length>1024)return reply({message:"Decision body too large."},400);
    choice=validateDecision(JSON.parse(raw));
  }catch{return reply({message:"Invalid moderation decision."},400);}
  if(!choice)return reply({message:"Invalid moderation decision."},400);

  const reportId=match[1],now=Math.floor(Date.now()/1000);
  const targetStatus=choice.decision==="HIDE"?"REVIEWED":"DISMISSED";
  const action=choice.decision==="HIDE"?"hide_post":"dismiss_report";
  try{
    // Atomic D1 batch: one pending report -> one terminal resolution ->
    // exactly one durable report-specific moderation audit event.
    const sql=[
      db.prepare(
        "UPDATE commons_v5_reports SET status=? "+
        "WHERE id=? AND status='PENDING'"
      ).bind(targetStatus,reportId),
      db.prepare(
        "UPDATE commons_v5_posts SET status='HIDDEN',updated_at=? "+
        "WHERE id=(SELECT post_id FROM commons_v5_reports WHERE id=?) "+
        "AND status='PUBLISHED' AND ?='HIDE'"
      ).bind(now,reportId,choice.decision),
      db.prepare(
        "INSERT INTO commons_v5_moderation_events "+
        "(id,actor_user_id,target_post_id,report_id,action,reason,occurred_at) "+
        "SELECT ?,?,r.post_id,r.id,?,?,? FROM commons_v5_reports r "+
        "WHERE r.id=? AND r.status=? "+
        "AND NOT EXISTS(SELECT 1 FROM commons_v5_moderation_events WHERE report_id=r.id)"
      ).bind(crypto.randomUUID(),user.id,action,choice.reason,now,reportId,targetStatus)
    ];
    const results=await db.batch(sql);
    if(!Array.isArray(results)||results.length!==3 ||
       results[0]?.meta?.changes!==1 || results[2]?.meta?.changes!==1)
      return reply({message:"Report already resolved or unavailable."},409);
    return reply({resolved:true,decision:choice.decision,reportId,
      moderationAuditRecorded:true,executionEnabled:false});
  }catch{
    return reply({message:"Moderator decision unavailable. No success reported."},503);
  }
}
