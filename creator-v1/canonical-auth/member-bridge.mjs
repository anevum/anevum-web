/**
 * V014 / canonical -> Creator V1 read-only identity bridge.
 *
 * This is a VIEW of an explicitly proven V012 one-to-one link, not a
 * linking ceremony, role grant, account merge, sign-in replacement,
 * or permission to read or mutate private creator projects.
 */
import {
  CANONICAL_ISSUER,withoutForeignCookies
} from "./policy.mjs";
import {IDENTITY_STAGE} from "../ops/identity-release-gate.mjs";

export const CREATOR_LINK_ROUTE="/api/v1/member/creator-link";
export const REQUIRED_BRIDGE_MIGRATIONS=Object.freeze([
  "0003_member_identity_staging",
  "0006_account_privacy",
  "0015_creator_canonical_identity_links"
]);
const SUBJECT=/^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/;
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;

/** A flag cannot authorize an incorrect or shared D1 binding. */
export function bridgeConfigured(env){
  return Boolean(
    env?.ANEVUM_CANONICAL_CREATOR_BRIDGE_READ_ENABLED==="true" &&
    env?.CREATOR_BRIDGE_SCHEMA_APPROVED==="true" &&
    env?.CREATOR_BRIDGE_D1_ID===IDENTITY_STAGE.creatorStageDb &&
    env?.CREATOR_BRIDGE_DB &&
    env.CREATOR_BRIDGE_DB!==env.MEMBER_DB &&
    typeof env.CREATOR_BRIDGE_DB.prepare==="function"
  );
}

async function results(db,sql,args=[]){
  const statement=db.prepare(sql);
  const query=args.length ? statement.bind(...args) : statement;
  const out=await query.all();
  if(out?.success===false||!Array.isArray(out?.results))
    throw Error("Creator bridge storage unavailable");
  return out.results;
}

/** Detect unapproved/missing migration without ever writing to legacy D1. */
export async function bridgeSchemaReady(env){
  if(!bridgeConfigured(env))return false;
  try{
    const rows=await results(env.CREATOR_BRIDGE_DB,
      "SELECT version FROM schema_migrations WHERE version IN (?,?,?)",
      [...REQUIRED_BRIDGE_MIGRATIONS]);
    const versions=new Set(rows.map(row=>row?.version));
    return REQUIRED_BRIDGE_MIGRATIONS.every(version=>versions.has(version));
  }catch{return false;}
}

/**
 * The only identity input is Better Auth's own verified session, using ONLY
 * V013 host-specific cookies. No member id/email/query/body accepted.
 */
export async function verifiedCanonicalSubject(auth,request,now=Date.now()){
  if(!auth?.api||typeof auth.api.getSession!=="function")return null;
  try{
    const cleaned=withoutForeignCookies(request);
    const session=await auth.api.getSession({headers:cleaned.headers});
    const id=session?.user?.id;
    const bound=session?.session?.userId;
    const expiration=session?.session?.expiresAt;
    if(typeof id!=="string"||!SUBJECT.test(id)||bound!==id||
       session?.user?.emailVerified!==true)return null;
    const expiresAt=expiration instanceof Date ? expiration.getTime()
      : typeof expiration==="string" || typeof expiration==="number"
        ? new Date(expiration).getTime() : NaN;
    if(!Number.isFinite(expiresAt)||expiresAt<=now)return null;
    return id;
  }catch{return null;}
}

/** Returns a minimal public creator identity only, never a legacy member ID. */
export async function findVerifiedCreator(env,canonicalSubject){
  if(!bridgeConfigured(env)||typeof canonicalSubject!=="string"||
     !SUBJECT.test(canonicalSubject))
    return {state:"unavailable",creator:null};
  try{
    const records=await results(env.CREATOR_BRIDGE_DB,
      "SELECT c.handle AS handle,c.display_name AS displayName,c.bio AS bio "+
      "FROM creator_canonical_identity_links l "+
      "JOIN member_accounts m ON m.id=l.legacy_member_id AND m.status='active' "+
      "JOIN creator_profiles c ON c.member_id=m.id AND c.status='active' AND c.is_staff=0 "+
      "WHERE l.canonical_subject=? AND l.canonical_issuer=? "+
      "AND l.status='verified' AND l.revoked_at IS NULL LIMIT 2",
      [canonicalSubject,CANONICAL_ISSUER]);
    if(records.length===0)return {state:"unlinked",creator:null};
    if(records.length!==1)return {state:"unavailable",creator:null};
    const row=records[0];
    if(typeof row?.handle!=="string"||!HANDLE.test(row.handle)||
       typeof row.displayName!=="string"||row.displayName.length<1||row.displayName.length>80||
       typeof row.bio!=="string"||row.bio.length>1200)
      return {state:"unavailable",creator:null};
    return {state:"linked",creator:{
      handle:row.handle,displayName:row.displayName,bio:row.bio
    }};
  }catch{
    // Includes: migration not applied, unavailable D1, malformed query result.
    return {state:"unavailable",creator:null};
  }
}

/**
 * Returns an HTTP status and safe JSON payload, but NEVER grants Creator V1
 * authorization. The frontend member client cannot use this as a /me session.
 */
export async function canonicalCreatorBridgeStatus(request,env,auth,now=Date.now()){
  if(!bridgeConfigured(env))return {
    status:503,body:{state:"unavailable",creator:null}
  };
  const subject=await verifiedCanonicalSubject(auth,request,now);
  if(!subject)return {status:401,body:{state:"signed-out",creator:null}};
  if(!await bridgeSchemaReady(env))return {
    status:503,body:{state:"unavailable",creator:null}
  };
  const resolved=await findVerifiedCreator(env,subject);
  if(resolved.state==="linked")return {
    status:200,body:{
      state:"linked",creator:resolved.creator,
      capabilities:{creatorReadOnly:true,privateMemberWrites:false,linkChanges:false}
    }
  };
  if(resolved.state==="unlinked")return {
    status:409,body:{state:"unlinked",creator:null}
  };
  return {status:503,body:{state:"unavailable",creator:null}};
}
