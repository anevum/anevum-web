// Verified owner/admin Studio operations read model.
// Called only AFTER Better Auth session, exact member binding and independently
// verified Cloudflare Staff Access. No broker credentials or user PII exposed.
import {socialConfigured,socialSchemaReady} from "./commons-social.mjs";

const VERSION="anevum.studio.overview.v1";
const COUNT_MAX=Number.MAX_SAFE_INTEGER;
function count(value){
  return Number.isSafeInteger(value)&&value>=0&&value<=COUNT_MAX?value:null;
}
function reply(value,status=200){
  return Response.json(value,{status,headers:{
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}
export async function studioOperationsOverview(request,env,user,origin){
  if(request.method!=="GET")return reply({message:"Studio operations is read-only."},405);
  const db=env?.MEMBER_DB;
  if(typeof db?.prepare!=="function"||typeof db?.batch!=="function")
    return reply({message:"Studio database unavailable."},503);
  try{
    // D1 batch keeps these three aggregate reads within one logical transaction.
    // No rows, names, emails, account identifiers or brokerage data are returned.
    const grouped=await db.batch([
      db.prepare('SELECT COUNT(*) AS total FROM "user"'),
      db.prepare("SELECT status,COUNT(*) AS total FROM studio_entries GROUP BY status"),
      db.prepare("SELECT COUNT(*) AS total FROM studio_entry_events")
    ]);
    if(!Array.isArray(grouped)||grouped.length!==3)return reply({message:"Studio metrics unavailable."},503);
    const users=grouped[0]?.results||[],states=grouped[1]?.results||[],
      audit=grouped[2]?.results||[];
    if(users.length!==1||audit.length!==1||!Array.isArray(states))
      return reply({message:"Studio metric response invalid."},503);
    const members=count(users[0]?.total),events=count(audit[0]?.total);
    if(members===null||events===null)
      return reply({message:"Studio metric counts invalid."},503);
    const totals={DRAFT:0,PUBLISHED:0,ARCHIVED:0},seen=new Set();
    for(const value of states){
      const status=value?.status,number=count(value?.total);
      if(!Object.hasOwn(totals,status)||seen.has(status)||number===null)
        return reply({message:"Studio publication totals invalid."},503);
      seen.add(status);
      totals[status]=number;
    }
    let moderation={state:"PILOT_DISABLED",pendingReports:null};
    if(socialConfigured(env,origin)){
      if(!await socialSchemaReady(db)){
        moderation={state:"STORAGE_UNAVAILABLE",pendingReports:null};
      }else{
        const pending=await db.prepare(
          "SELECT COUNT(*) AS total FROM commons_v5_reports WHERE status='PENDING'"
        ).first();
        const reports=count(pending?.total);
        if(reports===null)return reply({message:"Studio moderation count unavailable."},503);
        moderation={state:"PILOT_READY",pendingReports:reports};
      }
    }
    return reply({
      schemaVersion:VERSION,viewerMemberId:user.id,
      checkedAt:Math.floor(Date.now()/1000),
      members:{registered:members},
      publications:{drafts:totals.DRAFT,published:totals.PUBLISHED,archived:totals.ARCHIVED},
      audit:{events},
      moderation
    });
  }catch{
    // Avoid falsely reporting zeroes when a D1 query fails.
    return reply({message:"Studio operations unavailable. Counts not verified."},503);
  }
}
