/**
 * ANEVUM / verified public institutional designation, V092.
 *
 * Read-only and independent of member reputation/XP/staff authentication.
 * A verified display role comes only from an independently reviewed,
 * non-revoked member_role_grants row, NEVER from email, a profile label,
 * staff_access_grants, a cosmetic aura, or an HTTP request body.
 *
 * The caller MUST verify public visibility first and enable this projection
 * explicitly with CANONICAL_VERIFIED_ROLES_ENABLED=true after schema review.
 * Missing/unavailable tables fail closed; no schema metadata or XP scans.
 */
const PRIORITY=Object.freeze({curator:1,moderator:2,administrator:3,founder:4});
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128;

export async function memberVerifiedRoleMap(db,identities){
 const ids=[...new Set(Array.isArray(identities)?identities.filter(validId):[])].slice(0,25);
 if(!ids.length)return new Map();
 try{
  // A bounded, indexed read. Both the role and account identity are verified
  // against the grants ledger; never return account keys to public callers.
  const marks=ids.map(()=>'?').join(',');
  const issued=await db.prepare(
   'SELECT user_id,role FROM member_role_grants WHERE revoked_at IS NULL '+
   'AND user_id IN ('+marks+') LIMIT 100'
  ).bind(...ids).all();
  if(issued?.success===false||!Array.isArray(issued?.results))return new Map();
  const roles=new Map();
  const eligible=new Set(ids);
  for(const row of issued.results){
   if(!eligible.has(row.user_id)||!Object.hasOwn(PRIORITY,row.role))continue;
   if(PRIORITY[row.role]>(PRIORITY[roles.get(row.user_id)]||0))
    roles.set(row.user_id,row.role);
  }
  return roles;
 }catch{
  // Uninstalled/misconfigured ledger cannot create a Founder or Moderator.
  return new Map();
 }
}
